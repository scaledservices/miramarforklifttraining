/**
 * Quote Pipeline API routes — Admin-only quote lifecycle (Phase 10A)
 *
 * STATE MODEL SEPARATION:
 * - Quote lifecycle (quotes.status) is independent of CRM lead status and training event fulfillment status.
 * - Creating, sending, approving, or declining a quote does NOT change the originating lead's pipeline status.
 * - Converting an approved quote creates a new training_event and stamps linkedTrainingEventId on the quote;
 *   it does not advance the lead.
 *
 * ACTIVITY LOGGING:
 * When originatingLeadId is set, lifecycle actions emit lead_activities so they appear in the lead timeline:
 * - quote_created on POST create
 * - quote_sent / quote_approved / quote_declined on status transitions (via updateQuoteStatus)
 * - quote_converted on POST /:id/convert
 *
 * ADMIN-ONLY: No customer-facing approve/decline UI in this wave; status transitions are admin actions.
 *
 * VALIDATION:
 * All bodies, path params, and query params are validated with Zod and return 400 with details on failure.
 */
import type { Express, Request, Response } from "express";
import { z } from "zod";
import { storage, type QuoteUpdateInput, type QuoteFilters } from "../storage";
import { db } from "../db";
import { eq, and, isNull } from "drizzle-orm";
import { quotes as quotesTable, trainingEvents as trainingEventsTable } from "@shared/schema";
import { requireRole } from "./middleware";
import {
  QUOTE_STATUSES,
  VALID_QUOTE_TRANSITIONS,
  TERMINAL_QUOTE_STATUSES,
  QUOTE_STATUS_LABELS,
  type QuoteStatus,
} from "@shared/config/quote-states";
import { LOCATION_SLUGS, LOCATION_TYPES } from "@shared/config/locations";
import type { Quote, InsertQuote } from "@shared/schema";

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const positiveIntQuery = z.coerce.number().int().positive().optional();

const listQuerySchema = z.object({
  status: z.enum(QUOTE_STATUSES as unknown as [QuoteStatus, ...QuoteStatus[]]).optional(),
  companyId: positiveIntQuery,
  contactId: positiveIntQuery,
  originatingLeadId: positiveIntQuery,
  linkedTrainingEventId: positiveIntQuery,
  locationSlug: z.enum(LOCATION_SLUGS as unknown as [string, ...string[]]).optional(),
  createdByUserId: positiveIntQuery,
});

const quoteBaseShape = {
  companyId: z.number().int().positive().optional().nullable(),
  contactId: z.number().int().positive().optional().nullable(),
  originatingLeadId: z.number().int().positive().optional().nullable(),
  title: z.string().min(1, "Title is required"),
  participantCount: z.number().int().positive().optional().nullable(),
  locationType: z.enum(LOCATION_TYPES).optional().nullable(),
  locationSlug: z.string().optional().nullable(),
  onsiteStreet: z.string().optional().nullable(),
  onsiteCity: z.string().optional().nullable(),
  onsiteState: z.string().optional().nullable(),
  onsiteZip: z.string().optional().nullable(),
  equipmentTypes: z.array(z.string()).optional(),
  subtotal: z.number().int().nonnegative().optional(),
  total: z.number().int().nonnegative().optional(),
  pricingNotes: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
} as const;

const quoteRefines = <T extends z.ZodTypeAny>(schema: T) => schema
  .refine((d: Record<string, unknown>) => {
    if (d.locationType === "facility" && !d.locationSlug) return false;
    return true;
  }, { message: "locationSlug is required for facility quotes", path: ["locationSlug"] })
  .refine((d: Record<string, unknown>) => {
    if (d.locationSlug && !LOCATION_SLUGS.includes(d.locationSlug as typeof LOCATION_SLUGS[number])) return false;
    return true;
  }, { message: `locationSlug must be one of: ${LOCATION_SLUGS.join(", ")}`, path: ["locationSlug"] })
  .refine((d: Record<string, unknown>) => {
    if (d.validUntil && isNaN(Date.parse(String(d.validUntil)))) return false;
    return true;
  }, { message: "validUntil must be a valid ISO date", path: ["validUntil"] });

const createQuoteSchema = quoteRefines(z.object(quoteBaseShape));

// Update schema intentionally omits `originatingLeadId`: re-linking a quote to a
// different lead after creation is out of scope for Phase 10A (would require
// re-emitting/cleaning up activity log entries on the prior lead's timeline).
const { originatingLeadId: _omitOriginatingLeadId, ...updateBaseShape } = quoteBaseShape;
const updateQuoteSchema = quoteRefines(
  z.object({ ...updateBaseShape, title: z.string().min(1).optional() }).partial()
);

class QuoteConvertRaceError extends Error {}

const statusUpdateSchema = z.object({
  status: z.enum(QUOTE_STATUSES as unknown as [QuoteStatus, ...QuoteStatus[]]),
});

const convertSchema = z.object({
  scheduledStart: z.string().optional().nullable(),
  scheduledEnd: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
  instructorId: z.number().int().positive().optional().nullable(),
  adminNotes: z.string().optional().nullable(),
}).refine((d) => {
  if ((d.scheduledStart || d.scheduledEnd) && !d.timezone) return false;
  return true;
}, { message: "timezone is required when scheduledStart or scheduledEnd is provided", path: ["timezone"] })
.refine((d) => {
  if (d.scheduledStart && isNaN(Date.parse(d.scheduledStart))) return false;
  if (d.scheduledEnd && isNaN(Date.parse(d.scheduledEnd))) return false;
  return true;
}, { message: "scheduledStart/scheduledEnd must be valid ISO dates", path: ["scheduledStart"] })
.refine((d) => {
  if (d.scheduledStart && d.scheduledEnd) {
    return new Date(d.scheduledEnd) >= new Date(d.scheduledStart);
  }
  return true;
}, { message: "scheduledEnd must not be earlier than scheduledStart", path: ["scheduledEnd"] });

type QuoteActivityType = "quote_created" | "quote_sent" | "quote_approved" | "quote_declined" | "quote_converted";

async function logQuoteActivity(
  leadId: number | null | undefined,
  quote: Pick<Quote, "id" | "companyId" | "contactId" | "title">,
  actorUserId: number | undefined,
  activityType: QuoteActivityType,
  extraMetadata: Record<string, unknown> = {},
): Promise<void> {
  if (!leadId || !actorUserId) return;
  try {
    const lead = await storage.getOnsiteTrainingRequest(leadId);
    await storage.createLeadActivity({
      leadId,
      companyId: lead?.companyId ?? quote.companyId ?? null,
      contactId: lead?.contactId ?? quote.contactId ?? null,
      actorUserId,
      activityType,
      metadata: {
        quoteId: quote.id,
        title: quote.title,
        ...extraMetadata,
      },
    });
  } catch (err) {
    console.error("[Quotes] Activity log error (non-fatal):", err);
  }
}

function parseId(req: Request, res: Response): number | null {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID", details: parsed.error.issues });
    return null;
  }
  return parsed.data.id;
}

export function registerQuoteRoutes(app: Express) {

  app.post("/api/admin/quotes", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const parsed = createQuoteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      }
      const data = parsed.data as z.infer<typeof createQuoteSchema>;

      if (data.companyId) {
        const company = await storage.getCompany(data.companyId);
        if (!company) return res.status(404).json({ error: "Company not found" });
      }
      if (data.contactId) {
        const contact = await storage.getContact(data.contactId);
        if (!contact) return res.status(404).json({ error: "Contact not found" });
      }
      if (data.originatingLeadId) {
        const lead = await storage.getOnsiteTrainingRequest(data.originatingLeadId);
        if (!lead) return res.status(404).json({ error: "Originating lead not found" });
      }

      const insertData: InsertQuote = {
        title: data.title,
        createdByUserId: req.session.userId ?? null,
        equipmentTypes: data.equipmentTypes ?? [],
        subtotal: data.subtotal ?? 0,
        total: data.total ?? 0,
        companyId: data.companyId ?? null,
        contactId: data.contactId ?? null,
        originatingLeadId: data.originatingLeadId ?? null,
        participantCount: data.participantCount ?? null,
        locationType: data.locationType ?? null,
        locationSlug: data.locationSlug ?? null,
        onsiteStreet: data.onsiteStreet ?? null,
        onsiteCity: data.onsiteCity ?? null,
        onsiteState: data.onsiteState ?? null,
        onsiteZip: data.onsiteZip ?? null,
        pricingNotes: data.pricingNotes ?? null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        internalNotes: data.internalNotes ?? null,
      };

      const quote = await storage.createQuote(insertData);

      await logQuoteActivity(quote.originatingLeadId, quote, req.session.userId, "quote_created", {
        total: quote.total,
        validUntil: quote.validUntil,
      });

      return res.status(201).json({ quote });
    } catch (error) {
      console.error("[Quotes] Create error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/quotes", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const parsed = listQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid query parameters", details: parsed.error.issues });
      }
      const filters: QuoteFilters = parsed.data;

      const list = await storage.listQuotes(filters);

      const companyIds = [...new Set(list.map(q => q.companyId).filter((v): v is number => v !== null))];
      const contactIds = [...new Set(list.map(q => q.contactId).filter((v): v is number => v !== null))];
      const companyMap = new Map<number, string>();
      const contactMap = new Map<number, string>();

      await Promise.all([
        ...companyIds.map(async (cid) => {
          try { const c = await storage.getCompany(cid); if (c) companyMap.set(cid, c.name); } catch {}
        }),
        ...contactIds.map(async (cid) => {
          try { const c = await storage.getContact(cid); if (c) contactMap.set(cid, `${c.firstName} ${c.lastName}`); } catch {}
        }),
      ]);

      const enriched = list.map(q => ({
        ...q,
        companyName: q.companyId ? companyMap.get(q.companyId) ?? null : null,
        contactName: q.contactId ? contactMap.get(q.contactId) ?? null : null,
      }));

      return res.json({ quotes: enriched });
    } catch (error) {
      console.error("[Quotes] List error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/admin/quotes/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const id = parseId(req, res);
      if (id === null) return;

      const quote = await storage.getQuote(id);
      if (!quote) return res.status(404).json({ error: "Quote not found" });

      const company = quote.companyId ? await storage.getCompany(quote.companyId) : null;
      const contact = quote.contactId ? await storage.getContact(quote.contactId) : null;
      const lead = quote.originatingLeadId ? await storage.getOnsiteTrainingRequest(quote.originatingLeadId) : null;
      const trainingEvent = quote.linkedTrainingEventId ? await storage.getTrainingEvent(quote.linkedTrainingEventId) : null;

      return res.json({ quote, company, contact, lead, trainingEvent });
    } catch (error) {
      console.error("[Quotes] Get error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/admin/quotes/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const id = parseId(req, res);
      if (id === null) return;

      const existing = await storage.getQuote(id);
      if (!existing) return res.status(404).json({ error: "Quote not found" });

      if (TERMINAL_QUOTE_STATUSES.includes(existing.status as QuoteStatus)) {
        return res.status(422).json({ error: `Cannot update a ${existing.status} quote` });
      }

      const parsed = updateQuoteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      }
      const data = parsed.data as z.infer<typeof updateQuoteSchema>;

      if (data.companyId) {
        const company = await storage.getCompany(data.companyId);
        if (!company) return res.status(404).json({ error: "Company not found" });
      }
      if (data.contactId) {
        const contact = await storage.getContact(data.contactId);
        if (!contact) return res.status(404).json({ error: "Contact not found" });
      }

      const updateData: QuoteUpdateInput = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.companyId !== undefined) updateData.companyId = data.companyId ?? null;
      if (data.contactId !== undefined) updateData.contactId = data.contactId ?? null;
      if (data.participantCount !== undefined) updateData.participantCount = data.participantCount ?? null;
      if (data.locationType !== undefined) updateData.locationType = data.locationType ?? null;
      if (data.locationSlug !== undefined) updateData.locationSlug = data.locationSlug ?? null;
      if (data.onsiteStreet !== undefined) updateData.onsiteStreet = data.onsiteStreet ?? null;
      if (data.onsiteCity !== undefined) updateData.onsiteCity = data.onsiteCity ?? null;
      if (data.onsiteState !== undefined) updateData.onsiteState = data.onsiteState ?? null;
      if (data.onsiteZip !== undefined) updateData.onsiteZip = data.onsiteZip ?? null;
      if (data.equipmentTypes !== undefined) updateData.equipmentTypes = data.equipmentTypes;
      if (data.subtotal !== undefined) updateData.subtotal = data.subtotal;
      if (data.total !== undefined) updateData.total = data.total;
      if (data.pricingNotes !== undefined) updateData.pricingNotes = data.pricingNotes ?? null;
      if (data.internalNotes !== undefined) updateData.internalNotes = data.internalNotes ?? null;
      if (data.validUntil !== undefined) updateData.validUntil = data.validUntil ? new Date(data.validUntil) : null;

      const updated = await storage.updateQuote(id, updateData);
      return res.json({ quote: updated });
    } catch (error) {
      console.error("[Quotes] Update error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.patch("/api/admin/quotes/:id/status", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const id = parseId(req, res);
      if (id === null) return;

      const existing = await storage.getQuote(id);
      if (!existing) return res.status(404).json({ error: "Quote not found" });

      const parsed = statusUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      }
      const newStatus: QuoteStatus = parsed.data.status;
      const currentStatus = existing.status as QuoteStatus;

      if (newStatus === currentStatus) {
        return res.json({ quote: existing });
      }

      // /convert is the only path that may set status to "converted"
      if (newStatus === "converted") {
        return res.status(422).json({ error: "Use POST /api/admin/quotes/:id/convert to convert an approved quote" });
      }

      const allowed = VALID_QUOTE_TRANSITIONS[currentStatus] ?? [];
      if (!allowed.includes(newStatus)) {
        return res.status(422).json({
          error: `Cannot transition from "${currentStatus}" to "${newStatus}". Valid transitions: ${allowed.join(", ") || "none (terminal status)"}`,
        });
      }

      const now = new Date();
      const timestamps: { sentAt?: Date; approvedAt?: Date; declinedAt?: Date; respondedAt?: Date } = {};
      if (newStatus === "sent") timestamps.sentAt = now;
      if (newStatus === "approved") {
        timestamps.approvedAt = now;
        if (!existing.respondedAt) timestamps.respondedAt = now;
      }
      if (newStatus === "declined") {
        timestamps.declinedAt = now;
        if (!existing.respondedAt) timestamps.respondedAt = now;
      }

      const updated = await storage.updateQuoteStatus(id, newStatus, timestamps);

      const activityMap: Partial<Record<QuoteStatus, QuoteActivityType>> = {
        sent: "quote_sent",
        approved: "quote_approved",
        declined: "quote_declined",
      };
      const activityType = activityMap[newStatus];
      if (activityType && updated) {
        await logQuoteActivity(updated.originatingLeadId, updated, req.session.userId, activityType, {
          previousStatus: currentStatus,
          newStatus,
          previousStatusLabel: QUOTE_STATUS_LABELS[currentStatus],
          newStatusLabel: QUOTE_STATUS_LABELS[newStatus],
        });
      }

      return res.json({ quote: updated });
    } catch (error) {
      console.error("[Quotes] Status update error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/quotes/:id/convert", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const id = parseId(req, res);
      if (id === null) return;

      const quote = await storage.getQuote(id);
      if (!quote) return res.status(404).json({ error: "Quote not found" });

      if (quote.status !== "approved") {
        return res.status(422).json({ error: `Only approved quotes can be converted. Current status: ${quote.status}` });
      }
      if (quote.linkedTrainingEventId) {
        return res.status(422).json({ error: "Quote is already linked to a training event" });
      }
      if (!quote.locationType) {
        return res.status(422).json({ error: "Quote is missing locationType; cannot create training event" });
      }

      const parsed = convertSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
      }
      const data = parsed.data;

      if (data.instructorId) {
        const instructor = await storage.getInstructor(data.instructorId);
        if (!instructor) return res.status(404).json({ error: "Instructor not found" });
      }

      const eventInsert = {
        title: quote.title,
        locationType: quote.locationType,
        createdByUserId: req.session.userId ?? null,
        equipmentTypes: quote.equipmentTypes ?? [],
        originatingLeadId: quote.originatingLeadId ?? null,
        companyId: quote.companyId ?? null,
        primaryContactId: quote.contactId ?? null,
        locationSlug: quote.locationSlug ?? null,
        onsiteStreet: quote.onsiteStreet ?? null,
        onsiteCity: quote.onsiteCity ?? null,
        onsiteState: quote.onsiteState ?? null,
        onsiteZip: quote.onsiteZip ?? null,
        traineeCount: quote.participantCount ?? null,
        scheduledStart: data.scheduledStart ? new Date(data.scheduledStart) : null,
        scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : null,
        timezone: data.timezone ?? null,
        instructorId: data.instructorId ?? null,
        adminNotes: data.adminNotes ?? null,
      };

      const txResult = await db.transaction(async (tx) => {
        // Atomic conditional update guards against concurrent /convert calls
        // racing past the pre-check above and producing duplicate events.
        const [createdEvent] = await tx.insert(trainingEventsTable).values(eventInsert).returning();
        const [updatedQuoteRow] = await tx.update(quotesTable)
          .set({
            status: "converted",
            linkedTrainingEventId: createdEvent.id,
            updatedAt: new Date(),
          })
          .where(and(
            eq(quotesTable.id, id),
            eq(quotesTable.status, "approved"),
            isNull(quotesTable.linkedTrainingEventId),
          ))
          .returning();
        if (!updatedQuoteRow) {
          // Roll back the event we just inserted; another request won the race.
          throw new QuoteConvertRaceError();
        }
        return { event: createdEvent, updatedQuote: updatedQuoteRow };
      }).catch((err: unknown) => {
        if (err instanceof QuoteConvertRaceError) return null;
        throw err;
      });

      if (!txResult) {
        return res.status(409).json({
          error: "Quote was already converted by another request",
        });
      }
      const { event, updatedQuote } = txResult;

      await logQuoteActivity(quote.originatingLeadId, quote, req.session.userId, "quote_converted", {
        trainingEventId: event.id,
        previousStatus: "approved",
        newStatus: "converted",
      });

      return res.status(201).json({ quote: updatedQuote, trainingEvent: event });
    } catch (error) {
      console.error("[Quotes] Convert error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}
