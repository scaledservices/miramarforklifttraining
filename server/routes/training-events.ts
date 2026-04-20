/**
 * Training Events API routes — Fulfillment execution layer
 *
 * STATE MODEL SEPARATION:
 * - CRM pipeline state: onsite_training_requests.status (new_lead → contacted → quoted → … → invoiced)
 * - Fulfillment state: training_events.status (unscheduled → scheduling_in_progress → scheduled → … → completed/canceled)
 * These are separate domains. Creating a training event does NOT automatically move the lead to "scheduled".
 * Lead pipeline transitions are managed explicitly through the CRM routes.
 *
 * "Lead needing scheduling" = a CRM lead that has no linked training event yet.
 * "Unscheduled training event" = a fulfillment record that exists but has not been scheduled.
 * These are not the same concept.
 *
 * ACTIVITY LOGGING:
 * When a training event is linked to a lead (originatingLeadId), lifecycle actions are recorded
 * as lead_activities so they appear in the lead's activity timeline:
 * - training_event_created: when event is first created from a lead
 * - training_event_status_changed: when event fulfillment status transitions
 * - training_event_updated: when material fields change (date/time, location, company, contact)
 */
import type { Express, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireRole } from "./middleware";
import { TRAINING_EVENT_STATUSES, VALID_EVENT_TRANSITIONS, TERMINAL_EVENT_STATUSES, EVENT_STATUS_LABELS, type TrainingEventStatus } from "@shared/config/training-events";
import { LOCATION_SLUGS, LOCATION_TYPES } from "@shared/config/locations";

const MATERIAL_FIELDS = [
  "scheduledStart", "scheduledEnd", "timezone", "locationType", "locationSlug",
  "onsiteStreet", "onsiteCity", "onsiteState", "onsiteZip",
  "companyId", "primaryContactId", "instructorId", "traineeCount",
] as const;

function detectMaterialChanges(existing: Record<string, unknown>, updateData: Record<string, unknown>): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const field of MATERIAL_FIELDS) {
    if (field in updateData) {
      const oldVal = existing[field] ?? null;
      let newVal = updateData[field] ?? null;
      if (oldVal instanceof Date) {
        const newDate = newVal instanceof Date ? newVal : newVal ? new Date(String(newVal)) : null;
        if (oldVal.toISOString() !== (newDate ? newDate.toISOString() : null)) {
          changes[field] = { from: oldVal.toISOString(), to: newDate ? newDate.toISOString() : null };
        }
      } else if (String(oldVal) !== String(newVal)) {
        changes[field] = { from: oldVal, to: newVal };
      }
    }
  }
  return changes;
}

export function registerTrainingEventRoutes(app: Express) {

const createEventSchema = z.object({
  originatingLeadId: z.number().int().positive().optional().nullable(),
  companyId: z.number().int().positive().optional().nullable(),
  primaryContactId: z.number().int().positive().optional().nullable(),
  title: z.string().min(1, "Title is required"),
  locationType: z.enum(LOCATION_TYPES),
  locationSlug: z.string().optional().nullable(),
  onsiteStreet: z.string().optional().nullable(),
  onsiteCity: z.string().optional().nullable(),
  onsiteState: z.string().optional().nullable(),
  onsiteZip: z.string().optional().nullable(),
  scheduledStart: z.string().optional().nullable(),
  scheduledEnd: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
  traineeCount: z.number().int().positive().optional().nullable(),
  equipmentTypes: z.array(z.string()).optional(),
  instructorId: z.number().int().positive().optional().nullable(),
  adminNotes: z.string().optional().nullable(),
}).refine((data) => {
  if ((data.scheduledStart || data.scheduledEnd) && !data.timezone) {
    return false;
  }
  return true;
}, { message: "timezone is required when scheduledStart or scheduledEnd is provided", path: ["timezone"] })
.refine((data) => {
  if (data.scheduledStart && data.scheduledEnd) {
    return new Date(data.scheduledEnd) >= new Date(data.scheduledStart);
  }
  return true;
}, { message: "scheduledEnd must not be earlier than scheduledStart", path: ["scheduledEnd"] })
.refine((data) => {
  if (data.scheduledStart && isNaN(new Date(data.scheduledStart).getTime())) return false;
  if (data.scheduledEnd && isNaN(new Date(data.scheduledEnd).getTime())) return false;
  return true;
}, { message: "scheduledStart/scheduledEnd must be valid ISO date strings", path: ["scheduledStart"] })
.refine((data) => {
  if (data.locationType === "facility" && !data.locationSlug) return false;
  return true;
}, { message: "locationSlug is required for facility events", path: ["locationSlug"] })
.refine((data) => {
  if (data.locationSlug && !LOCATION_SLUGS.includes(data.locationSlug as any)) return false;
  return true;
}, { message: `locationSlug must be one of: ${LOCATION_SLUGS.join(", ")}`, path: ["locationSlug"] });

const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  locationType: z.enum(LOCATION_TYPES).optional(),
  locationSlug: z.string().optional().nullable(),
  onsiteStreet: z.string().optional().nullable(),
  onsiteCity: z.string().optional().nullable(),
  onsiteState: z.string().optional().nullable(),
  onsiteZip: z.string().optional().nullable(),
  scheduledStart: z.string().optional().nullable(),
  scheduledEnd: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
  traineeCount: z.number().int().positive().optional().nullable(),
  equipmentTypes: z.array(z.string()).optional(),
  instructorId: z.number().int().positive().optional().nullable(),
  adminNotes: z.string().optional().nullable(),
  companyId: z.number().int().positive().optional().nullable(),
  primaryContactId: z.number().int().positive().optional().nullable(),
}).refine((data) => {
  if ((data.scheduledStart || data.scheduledEnd) && !data.timezone) {
    return false;
  }
  return true;
}, { message: "timezone is required when scheduledStart or scheduledEnd is provided", path: ["timezone"] })
.refine((data) => {
  if (data.scheduledStart && data.scheduledEnd) {
    return new Date(data.scheduledEnd) >= new Date(data.scheduledStart);
  }
  return true;
}, { message: "scheduledEnd must not be earlier than scheduledStart", path: ["scheduledEnd"] })
.refine((data) => {
  if (data.scheduledStart && isNaN(new Date(data.scheduledStart).getTime())) return false;
  if (data.scheduledEnd && isNaN(new Date(data.scheduledEnd).getTime())) return false;
  return true;
}, { message: "scheduledStart/scheduledEnd must be valid ISO date strings", path: ["scheduledStart"] })
.refine((data) => {
  if (data.locationSlug && !LOCATION_SLUGS.includes(data.locationSlug as any)) return false;
  return true;
}, { message: `locationSlug must be one of: ${LOCATION_SLUGS.join(", ")}`, path: ["locationSlug"] });

const statusUpdateSchema = z.object({
  status: z.enum(TRAINING_EVENT_STATUSES as unknown as [string, ...string[]]),
});

app.post("/api/admin/training-events", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const parsed = createEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    }

    const data = parsed.data;

    let lead: any = null;
    if (data.originatingLeadId) {
      lead = await storage.getOnsiteTrainingRequest(data.originatingLeadId);
      if (!lead) return res.status(404).json({ error: "Originating lead not found" });
    }
    if (data.companyId) {
      const company = await storage.getCompany(data.companyId);
      if (!company) return res.status(404).json({ error: "Company not found" });
    }
    if (data.primaryContactId) {
      const contact = await storage.getContact(data.primaryContactId);
      if (!contact) return res.status(404).json({ error: "Contact not found" });
    }
    if (data.instructorId) {
      const instructor = await storage.getInstructor(data.instructorId);
      if (!instructor) return res.status(404).json({ error: "Instructor not found" });
    }

    const eventData: Record<string, unknown> = {
      title: data.title,
      locationType: data.locationType,
      createdByUserId: req.session.userId,
    };

    if (data.originatingLeadId) eventData.originatingLeadId = data.originatingLeadId;
    if (data.companyId) eventData.companyId = data.companyId;
    if (data.primaryContactId) eventData.primaryContactId = data.primaryContactId;
    if (data.locationSlug) eventData.locationSlug = data.locationSlug;
    if (data.onsiteStreet) eventData.onsiteStreet = data.onsiteStreet;
    if (data.onsiteCity) eventData.onsiteCity = data.onsiteCity;
    if (data.onsiteState) eventData.onsiteState = data.onsiteState;
    if (data.onsiteZip) eventData.onsiteZip = data.onsiteZip;
    if (data.scheduledStart) eventData.scheduledStart = new Date(data.scheduledStart);
    if (data.scheduledEnd) eventData.scheduledEnd = new Date(data.scheduledEnd);
    if (data.timezone) eventData.timezone = data.timezone;
    if (data.traineeCount) eventData.traineeCount = data.traineeCount;
    if (data.equipmentTypes) eventData.equipmentTypes = data.equipmentTypes;
    if (data.instructorId) eventData.instructorId = data.instructorId;
    if (data.adminNotes) eventData.adminNotes = data.adminNotes;

    const event = await storage.createTrainingEvent(eventData as any);

    if (data.originatingLeadId && lead && req.session.userId) {
      try {
        await storage.createLeadActivity({
          leadId: data.originatingLeadId,
          companyId: lead.companyId ?? data.companyId ?? null,
          contactId: lead.contactId ?? data.primaryContactId ?? null,
          actorUserId: req.session.userId,
          activityType: "training_event_created",
          metadata: {
            trainingEventId: event.id,
            title: event.title,
            locationType: event.locationType,
            locationSlug: event.locationSlug,
            status: event.status,
          },
        });
      } catch (actErr) {
        console.error("[TrainingEvents] Activity log error (non-fatal):", actErr);
      }
    }

    return res.status(201).json({ event });
  } catch (error) {
    console.error("[TrainingEvents] Create error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/training-events", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const { status, locationSlug, companyId, dateFrom, dateTo, originatingLeadId } = req.query;

    if (status && !TRAINING_EVENT_STATUSES.includes(status as any)) {
      return res.status(400).json({ error: `Invalid status. Valid values: ${TRAINING_EVENT_STATUSES.join(", ")}` });
    }
    if (locationSlug && !LOCATION_SLUGS.includes(locationSlug as any)) {
      return res.status(400).json({ error: `Invalid locationSlug. Valid values: ${LOCATION_SLUGS.join(", ")}` });
    }
    if (companyId && isNaN(parseInt(companyId as string))) {
      return res.status(400).json({ error: "companyId must be a number" });
    }
    if (originatingLeadId && isNaN(parseInt(originatingLeadId as string))) {
      return res.status(400).json({ error: "originatingLeadId must be a number" });
    }
    if (dateFrom && isNaN(Date.parse(dateFrom as string))) {
      return res.status(400).json({ error: "dateFrom must be a valid date" });
    }
    if (dateTo && isNaN(Date.parse(dateTo as string))) {
      return res.status(400).json({ error: "dateTo must be a valid date" });
    }

    const filters: Record<string, unknown> = {};
    if (status) filters.status = status as string;
    if (locationSlug) filters.locationSlug = locationSlug as string;
    if (companyId) filters.companyId = parseInt(companyId as string);
    if (dateFrom) filters.dateFrom = dateFrom as string;
    if (dateTo) filters.dateTo = dateTo as string;
    if (originatingLeadId) filters.originatingLeadId = parseInt(originatingLeadId as string);

    const events = await storage.listTrainingEvents(filters as any);

    const companyIds = [...new Set(events.map(e => e.companyId).filter(Boolean))] as number[];
    const contactIds = [...new Set(events.map(e => e.primaryContactId).filter(Boolean))] as number[];
    const instructorIds = [...new Set(events.map(e => e.instructorId).filter(Boolean))] as number[];

    const companyMap = new Map<number, string>();
    const contactMap = new Map<number, string>();
    const instructorMap = new Map<number, string>();

    await Promise.all([
      ...companyIds.map(async (cid) => {
        try {
          const c = await storage.getCompany(cid);
          if (c) companyMap.set(cid, c.name);
        } catch {}
      }),
      ...contactIds.map(async (cid) => {
        try {
          const c = await storage.getContact(cid);
          if (c) contactMap.set(cid, `${c.firstName} ${c.lastName}`);
        } catch {}
      }),
      ...instructorIds.map(async (iid) => {
        try {
          const i = await storage.getInstructor(iid);
          if (i) instructorMap.set(iid, (i as any).fullName);
        } catch {}
      }),
    ]);

    const enriched = events.map(event => ({
      ...event,
      companyName: event.companyId ? companyMap.get(event.companyId) ?? null : null,
      contactName: event.primaryContactId ? contactMap.get(event.primaryContactId) ?? null : null,
      instructorName: event.instructorId ? instructorMap.get(event.instructorId) ?? null : null,
    }));

    return res.json({ events: enriched });
  } catch (error) {
    console.error("[TrainingEvents] List error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/training-events/leads-needing-scheduling", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const allLeads = await storage.listOnsiteTrainingRequests();
    const terminalCrmStatuses = ["completed", "invoiced", "cancelled", "unresponsive"];
    const activeLeads = allLeads.filter(l => !terminalCrmStatuses.includes(l.status));

    const allEvents = await storage.listTrainingEvents({} as any);
    const leadIdsWithEvents = new Set(
      allEvents.filter(e => e.originatingLeadId).map(e => e.originatingLeadId)
    );

    const leadsNeedingScheduling = activeLeads
      .filter(l => !leadIdsWithEvents.has(l.id))
      .map(l => ({
        id: l.id,
        contactName: l.contactName,
        companyName: l.companyName,
        status: l.status,
        traineeCount: l.traineeCount,
        requestedLocationSlug: l.requestedLocationSlug,
        requestedLocationType: l.requestedLocationType,
        preferredDate1: l.preferredDate1,
        createdAt: l.createdAt,
      }));

    return res.json({ leads: leadsNeedingScheduling });
  } catch (error) {
    console.error("[TrainingEvents] Leads needing scheduling error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/training-events/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const event = await storage.getTrainingEvent(id);
    if (!event) return res.status(404).json({ error: "Training event not found" });

    let company = null;
    let contact = null;
    let lead = null;
    let instructor = null;

    if (event.companyId) company = await storage.getCompany(event.companyId);
    if (event.primaryContactId) contact = await storage.getContact(event.primaryContactId);
    if (event.originatingLeadId) lead = await storage.getOnsiteTrainingRequest(event.originatingLeadId);
    if (event.instructorId) instructor = await storage.getInstructor(event.instructorId);

    const enrichedEvent = {
      ...event,
      companyName: company?.name ?? null,
      contactName: contact ? `${contact.firstName} ${contact.lastName}` : null,
      instructorName: (instructor as any)?.fullName ?? null,
    };

    return res.json({ event: enrichedEvent, company, contact, lead, instructor });
  } catch (error) {
    console.error("[TrainingEvents] Get error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/admin/training-events/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const existing = await storage.getTrainingEvent(id);
    if (!existing) return res.status(404).json({ error: "Training event not found" });

    if (TERMINAL_EVENT_STATUSES.includes(existing.status as TrainingEventStatus)) {
      return res.status(422).json({ error: `Cannot update a ${existing.status} training event` });
    }

    const parsed = updateEventSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    }

    const data = parsed.data;

    if (data.companyId) {
      const company = await storage.getCompany(data.companyId);
      if (!company) return res.status(404).json({ error: "Company not found" });
    }
    if (data.primaryContactId) {
      const contact = await storage.getContact(data.primaryContactId);
      if (!contact) return res.status(404).json({ error: "Contact not found" });
    }
    if (data.instructorId) {
      const instructor = await storage.getInstructor(data.instructorId);
      if (!instructor) return res.status(404).json({ error: "Instructor not found" });
    }

    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.locationType !== undefined) updateData.locationType = data.locationType;
    if (data.locationSlug !== undefined) updateData.locationSlug = data.locationSlug;
    if (data.onsiteStreet !== undefined) updateData.onsiteStreet = data.onsiteStreet;
    if (data.onsiteCity !== undefined) updateData.onsiteCity = data.onsiteCity;
    if (data.onsiteState !== undefined) updateData.onsiteState = data.onsiteState;
    if (data.onsiteZip !== undefined) updateData.onsiteZip = data.onsiteZip;
    if (data.scheduledStart !== undefined) updateData.scheduledStart = data.scheduledStart ? new Date(data.scheduledStart) : null;
    if (data.scheduledEnd !== undefined) updateData.scheduledEnd = data.scheduledEnd ? new Date(data.scheduledEnd) : null;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.traineeCount !== undefined) updateData.traineeCount = data.traineeCount;
    if (data.equipmentTypes !== undefined) updateData.equipmentTypes = data.equipmentTypes;
    if (data.instructorId !== undefined) updateData.instructorId = data.instructorId;
    if (data.adminNotes !== undefined) updateData.adminNotes = data.adminNotes;
    if (data.companyId !== undefined) updateData.companyId = data.companyId;
    if (data.primaryContactId !== undefined) updateData.primaryContactId = data.primaryContactId;

    const materialChanges = detectMaterialChanges(existing as any, updateData);

    const updated = await storage.updateTrainingEvent(id, updateData as any);

    if (existing.originatingLeadId && req.session.userId && Object.keys(materialChanges).length > 0) {
      try {
        const lead = await storage.getOnsiteTrainingRequest(existing.originatingLeadId);
        await storage.createLeadActivity({
          leadId: existing.originatingLeadId,
          companyId: lead?.companyId ?? existing.companyId ?? null,
          contactId: lead?.contactId ?? existing.primaryContactId ?? null,
          actorUserId: req.session.userId,
          activityType: "training_event_updated",
          metadata: {
            trainingEventId: id,
            title: updated.title,
            changes: materialChanges,
          },
        });
      } catch (actErr) {
        console.error("[TrainingEvents] Activity log error (non-fatal):", actErr);
      }
    }

    return res.json({ event: updated });
  } catch (error) {
    console.error("[TrainingEvents] Update error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/admin/training-events/:id/status", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

    const existing = await storage.getTrainingEvent(id);
    if (!existing) return res.status(404).json({ error: "Training event not found" });

    const parsed = statusUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    }

    const { status: newStatus } = parsed.data;
    const currentStatus = existing.status as TrainingEventStatus;

    if (newStatus === currentStatus) {
      return res.json({ event: existing });
    }

    const allowed = VALID_EVENT_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(newStatus as TrainingEventStatus)) {
      return res.status(422).json({
        error: `Cannot transition from "${currentStatus}" to "${newStatus}". Valid transitions: ${allowed.join(", ") || "none (terminal status)"}`,
      });
    }

    const updated = await storage.updateTrainingEvent(id, { status: newStatus as any });

    if (existing.originatingLeadId && req.session.userId) {
      try {
        const lead = await storage.getOnsiteTrainingRequest(existing.originatingLeadId);
        await storage.createLeadActivity({
          leadId: existing.originatingLeadId,
          companyId: lead?.companyId ?? existing.companyId ?? null,
          contactId: lead?.contactId ?? existing.primaryContactId ?? null,
          actorUserId: req.session.userId,
          activityType: "training_event_status_changed",
          metadata: {
            trainingEventId: id,
            title: existing.title,
            previousStatus: currentStatus,
            newStatus,
            previousStatusLabel: EVENT_STATUS_LABELS[currentStatus],
            newStatusLabel: EVENT_STATUS_LABELS[newStatus as TrainingEventStatus],
          },
        });
      } catch (actErr) {
        console.error("[TrainingEvents] Activity log error (non-fatal):", actErr);
      }
    }

    return res.json({ event: updated });
  } catch (error) {
    console.error("[TrainingEvents] Status update error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

}
