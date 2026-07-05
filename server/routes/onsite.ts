import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { contactFormSchema, insertOnsiteTrainingRequestSchema, instructorAssignments, instructors, repAttribution } from "@shared/schema";
import { sendContactFormAdminAlert, sendOnsiteRequestAdminAlert, sendOnsiteRequestCustomerConfirmation } from "../email";
import { resolveLocale } from "../locale-resolver";
import { rateLimit } from "../rate-limit";
import { requireRole } from "./middleware";
import { ONSITE_STATUSES, VALID_TRANSITIONS, type OnsiteStatus } from "@shared/config/onsite-states";
import { isValidLocationSlug, isValidLocationType } from "@shared/config/locations";

const LEAD_SOURCES = ["organic", "referral", "direct", "paid", "rep_sourced", "unknown"] as const;
type LeadSource = typeof LEAD_SOURCES[number];

export function registerOnsiteRoutes(app: Express) {
app.post("/api/contact", async (req: Request, res: Response) => {
  try {
    const result = contactFormSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid form data", details: result.error.issues });
    }
    await storage.saveContactSubmission(result.data);

    try {
      await sendContactFormAdminAlert({
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone || undefined,
        trainingType: result.data.trainingType || "General Inquiry",
        message: result.data.message,
      });
    } catch (emailErr) {
      console.error("[Contact] Admin alert email error (non-fatal):", emailErr);
    }

    return res.status(200).json({ success: true, message: "Message received" });
  } catch (error) {
    console.error("[Contact] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const onsiteRequestLimiter = rateLimit({ name: "onsite_request", windowMs: 60_000, max: 5 });

const onsiteRequestCreateSchema = insertOnsiteTrainingRequestSchema.extend({
  contactName: z.string().min(2, "Contact name required"),
  email: z.string().email("Valid email required"),
  // Phone is optional on the slimmed quote form; empty string is the safe
  // default coalesced in before validation (DB column is NOT NULL).
  phone: z.union([z.literal(""), z.string().min(7, "Valid phone required")]),
  trainingAddress: z.string().min(5, "Training address required"),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  zip: z.string().min(5, "ZIP required"),
  traineeCount: z.coerce.number().int().min(1).max(1000),
  trainingType: z.enum(["Initial Certification", "Recertification", "Refresher", "Evaluation Only"]),
  equipmentTypes: z.array(z.string()).min(1, "At least one equipment type required"),
  leadSource: z.enum(LEAD_SOURCES).optional(),
  requestedLocationSlug: z.string().optional(),
  requestedLocationType: z.string().optional(),
});

app.post("/api/onsite-requests", onsiteRequestLimiter, async (req: Request, res: Response) => {
  try {
    // Phone and training type are optional on the client form, but the DB
    // columns are NOT NULL — coalesce to safe defaults before validation.
    const body = {
      ...(req.body ?? {}),
      phone: typeof req.body?.phone === "string" && req.body.phone.trim() !== "" ? req.body.phone : "",
      trainingType: req.body?.trainingType || "Initial Certification",
    };
    const result = onsiteRequestCreateSchema.safeParse(body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid form data", details: result.error.issues });
    }

    if (result.data.requestedLocationSlug && !isValidLocationSlug(result.data.requestedLocationSlug)) {
      return res.status(422).json({ error: "Invalid location slug" });
    }
    if (result.data.requestedLocationType && !isValidLocationType(result.data.requestedLocationType)) {
      return res.status(422).json({ error: "Invalid location type" });
    }
    if (result.data.requestedLocationSlug && result.data.requestedLocationType === "facility") {
      const { getLocation } = await import("@shared/config/locations");
      const loc = getLocation(result.data.requestedLocationSlug);
      if (loc && !loc.supportsInPerson) {
        return res.status(422).json({ error: "This location does not support in-person facility training" });
      }
    }

    const request = await storage.createOnsiteTrainingRequest(result.data);

    const onsiteLocale = await resolveLocale({ routeLocale: (req.body.locale as string) || undefined });
    sendOnsiteRequestCustomerConfirmation({
      to: request.email,
      contactName: request.contactName,
      companyName: request.companyName ?? undefined,
      trainingType: request.trainingType,
      traineeCount: request.traineeCount,
      city: request.city,
      state: request.state,
      preferredDate1: request.preferredDate1 ?? undefined,
      preferredDate2: request.preferredDate2 ?? undefined,
      preferredDate3: request.preferredDate3 ?? undefined,
      locale: onsiteLocale,
    }).catch((err) => console.error("[OnsiteRequest] Customer confirmation email failed:", err));

    sendOnsiteRequestAdminAlert({
      requestId: request.id,
      contactName: request.contactName,
      companyName: request.companyName ?? undefined,
      email: request.email,
      phone: request.phone,
      trainingAddress: request.trainingAddress,
      city: request.city,
      state: request.state,
      zip: request.zip,
      traineeCount: request.traineeCount,
      preferredDate1: request.preferredDate1 ?? undefined,
      preferredDate2: request.preferredDate2 ?? undefined,
      preferredDate3: request.preferredDate3 ?? undefined,
      equipmentTypes: request.equipmentTypes,
      trainingType: request.trainingType,
      notes: request.notes ?? undefined,
    }).catch((err) => console.error("[OnsiteRequest] Admin alert email failed:", err));

    const validatedSource: LeadSource = (LEAD_SOURCES as readonly string[]).includes(request.leadSource ?? "")
      ? (request.leadSource as LeadSource)
      : "unknown";
    await storage.createRepAttribution({
      entityType: "onsite_request",
      entityId: request.id,
      primaryRepId: request.assignedRepId ?? null,
      leadSource: validatedSource,
    });

    return res.status(201).json({ success: true, id: request.id });
  } catch (error) {
    console.error("[OnsiteRequest] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/onsite-requests", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const statusRaw = typeof req.query.status === "string" ? req.query.status : undefined;
    const onsiteStatusEnum = z.enum(ONSITE_STATUSES as unknown as [string, ...string[]]);
    const status = statusRaw ? (onsiteStatusEnum.safeParse(statusRaw).success ? statusRaw : undefined) : undefined;
    const requests = await storage.listOnsiteTrainingRequests(status);
    return res.json({ requests });
  } catch (error) {
    console.error("[OnsiteRequest] List error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/onsite-requests/assignment-summary", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const allAssignments = await db.select({
      id: instructorAssignments.id,
      requestId: instructorAssignments.requestId,
      instructorId: instructorAssignments.instructorId,
      status: instructorAssignments.status,
      instructorName: instructors.fullName,
    })
      .from(instructorAssignments)
      .innerJoin(instructors, eq(instructorAssignments.instructorId, instructors.id));

    const summary: Record<number, { id: number; requestId: number; instructorId: number; status: string; instructorName: string }[]> = {};
    for (const a of allAssignments) {
      if (!summary[a.requestId]) summary[a.requestId] = [];
      summary[a.requestId].push(a);
    }
    return res.json({ summary });
  } catch (error) {
    console.error("[Assignments] Summary error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/onsite-requests/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const request = await storage.getOnsiteTrainingRequest(id);
    if (!request) return res.status(404).json({ error: "Request not found" });
    return res.json({ request });
  } catch (error) {
    console.error("[OnsiteRequest] Get error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const assignRepSchema = z.object({
  repId: z.number().int().positive(),
  leadSource: z.enum(LEAD_SOURCES).optional(),
});

app.patch("/api/admin/onsite-requests/:id/assign-rep", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const parsed = assignRepSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error.issues });

    const existing = await storage.getOnsiteTrainingRequest(id);
    if (!existing) return res.status(404).json({ error: "Request not found" });

    const rep = await storage.getUser(parsed.data.repId);
    if (!rep) return res.status(404).json({ error: "Rep user not found" });

    const leadSrc: LeadSource = parsed.data.leadSource ?? (existing.leadSource as LeadSource) ?? "unknown";

    const previousRepId = existing.assignedRepId;
    const updated = await storage.updateOnsiteTrainingRequest(id, {
      assignedRepId: parsed.data.repId,
      leadSource: leadSrc,
    });

    if (req.session.userId) {
      await storage.createLeadActivity({
        leadId: id,
        companyId: existing.companyId,
        contactId: existing.contactId,
        actorUserId: req.session.userId,
        activityType: "rep_assigned",
        metadata: { previousRepId, newRepId: parsed.data.repId },
      });
    }

    const existingAttr = await storage.getRepAttribution("onsite_request", id);
    if (existingAttr) {
      const attrUpdate: Record<string, number | string> = { primaryRepId: parsed.data.repId };
      if (parsed.data.leadSource) attrUpdate.leadSource = leadSrc;
      await db.update(repAttribution)
        .set(attrUpdate)
        .where(eq(repAttribution.id, existingAttr.id));
    } else {
      await storage.createRepAttribution({
        entityType: "onsite_request",
        entityId: id,
        primaryRepId: parsed.data.repId,
        leadSource: leadSrc,
      });
    }

    return res.json({ request: updated });
  } catch (error) {
    console.error("[OnsiteRequest] Assign rep error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/leads", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const statusRaw = typeof req.query.status === "string" ? req.query.status : undefined;
    const onsiteStatusEnum = z.enum(ONSITE_STATUSES as unknown as [string, ...string[]]);
    const status = statusRaw ? (onsiteStatusEnum.safeParse(statusRaw).success ? statusRaw : undefined) : undefined;
    let requests = await storage.listOnsiteTrainingRequests(status);

    const validQueueModes = ["my_leads", "unassigned", "overdue", "new"] as const;
    const validSortModes = ["newest", "oldest_untouched", "overdue_first"] as const;
    const validLeadSources = ["organic", "referral", "direct", "paid", "rep_sourced", "unknown"] as const;

    const queueModeRaw = typeof req.query.queueMode === "string" ? req.query.queueMode : undefined;
    const queueMode = queueModeRaw && (validQueueModes as readonly string[]).includes(queueModeRaw) ? queueModeRaw : undefined;
    if (queueModeRaw && !queueMode) return res.status(400).json({ error: `Invalid queueMode. Valid values: ${validQueueModes.join(", ")}` });

    const currentUserId = req.session.userId;

    if (queueMode === "my_leads" && currentUserId) {
      requests = requests.filter(r => r.assignedRepId === currentUserId);
    } else if (queueMode === "unassigned") {
      requests = requests.filter(r => !r.assignedRepId);
    } else if (queueMode === "overdue") {
      const now = new Date();
      requests = requests.filter(r => r.nextActionDate && new Date(r.nextActionDate) < now);
    } else if (queueMode === "new") {
      requests = requests.filter(r => r.status === "new_lead");
    }

    const assignedRepIdFilter = req.query.assignedRepId ? parseInt(req.query.assignedRepId as string) : undefined;
    if (assignedRepIdFilter) {
      requests = requests.filter(r => r.assignedRepId === assignedRepIdFilter);
    }
    const locationFilter = typeof req.query.location === "string" ? req.query.location : undefined;
    if (locationFilter) {
      requests = requests.filter(r => r.requestedLocationSlug === locationFilter);
    }
    const leadSourceRaw = typeof req.query.leadSource === "string" ? req.query.leadSource : undefined;
    const leadSourceFilter = leadSourceRaw && (validLeadSources as readonly string[]).includes(leadSourceRaw) ? leadSourceRaw : undefined;
    if (leadSourceRaw && !leadSourceFilter) return res.status(400).json({ error: `Invalid leadSource. Valid values: ${validLeadSources.join(", ")}` });
    if (leadSourceFilter) {
      requests = requests.filter(r => r.leadSource === leadSourceFilter);
    }
    const pipelineStageRaw = typeof req.query.pipelineStage === "string" ? req.query.pipelineStage : undefined;
    const pipelineStage = pipelineStageRaw ? (onsiteStatusEnum.safeParse(pipelineStageRaw).success ? pipelineStageRaw : undefined) : undefined;
    if (pipelineStageRaw && !pipelineStage) return res.status(400).json({ error: `Invalid pipelineStage. Must be a valid status value.` });
    if (pipelineStage) {
      requests = requests.filter(r => r.status === pipelineStage);
    }
    const dateFrom = req.query.dateFrom as string | undefined;
    const dateTo = req.query.dateTo as string | undefined;
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      requests = requests.filter(r => new Date(r.createdAt).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 86400000;
      requests = requests.filter(r => new Date(r.createdAt).getTime() < to);
    }

    const sortByRaw = typeof req.query.sortBy === "string" ? req.query.sortBy : undefined;
    const sortBy = sortByRaw && (validSortModes as readonly string[]).includes(sortByRaw) ? sortByRaw : undefined;
    if (sortByRaw && !sortBy) return res.status(400).json({ error: `Invalid sortBy. Valid values: ${validSortModes.join(", ")}` });
    if (sortBy === "oldest_untouched") {
      requests.sort((a, b) => {
        const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : new Date(a.createdAt).getTime();
        const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : new Date(b.createdAt).getTime();
        return aTime - bTime;
      });
    } else if (sortBy === "newest") {
      requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "overdue_first") {
      const now = Date.now();
      requests.sort((a, b) => {
        const aOverdue = a.nextActionDate ? Math.max(0, now - new Date(a.nextActionDate).getTime()) : 0;
        const bOverdue = b.nextActionDate ? Math.max(0, now - new Date(b.nextActionDate).getTime()) : 0;
        return bOverdue - aOverdue;
      });
    }

    const allAssignments = await db.select({
      requestId: instructorAssignments.requestId,
      instructorId: instructorAssignments.instructorId,
      status: instructorAssignments.status,
      instructorName: instructors.fullName,
    })
      .from(instructorAssignments)
      .innerJoin(instructors, eq(instructorAssignments.instructorId, instructors.id));

    const assignmentMap: Record<number, { instructorName: string; status: string }[]> = {};
    for (const a of allAssignments) {
      if (!assignmentMap[a.requestId]) assignmentMap[a.requestId] = [];
      assignmentMap[a.requestId].push({ instructorName: a.instructorName, status: a.status });
    }

    const companyCache = new Map<number, { id: number; name: string }>();
    const userCache = new Map<number, { id: number; name: string }>();

    const now = new Date();
    const enriched = await Promise.all(requests.map(async (r) => {
      let repName: string | null = null;
      if (r.assignedRepId) {
        if (userCache.has(r.assignedRepId)) {
          repName = userCache.get(r.assignedRepId)!.name;
        } else {
          const user = await storage.getUser(r.assignedRepId);
          if (user) {
            userCache.set(r.assignedRepId, { id: user.id, name: user.name });
            repName = user.name;
          }
        }
      }

      let companyData: { id: number; name: string } | null = null;
      if (r.companyId) {
        if (companyCache.has(r.companyId)) {
          companyData = companyCache.get(r.companyId)!;
        } else {
          const company = await storage.getCompany(r.companyId);
          if (company) {
            companyData = { id: company.id, name: company.name };
            companyCache.set(r.companyId, companyData);
          }
        }
      }

      const lastActivityTime = r.lastActivityAt ? new Date(r.lastActivityAt).getTime() : new Date(r.updatedAt).getTime();
      const daysSinceActivity = Math.floor((Date.now() - lastActivityTime) / 86400000);
      const instructorAssignmentsList = assignmentMap[r.id] ?? [];
      const normalizedCompanyName = r.companyName || (companyData?.name ?? null);
      const isOverdue = r.nextActionDate ? new Date(r.nextActionDate) < now : false;

      return {
        ...r,
        companyName: normalizedCompanyName,
        repName,
        daysSinceActivity,
        isOverdue,
        companyData,
        instructorAssignments: instructorAssignmentsList,
      };
    }));

    return res.json({ leads: enriched });
  } catch (error) {
    console.error("[Leads] List error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/reps", requireRole("admin", "super_admin"), async (_req: Request, res: Response) => {
  try {
    const allUsers = await storage.listUsers();
    const reps = allUsers.filter(u => u.role === "admin" || u.role === "super_admin");
    return res.json({ reps: reps.map(u => ({ id: u.id, name: u.name, email: u.email })) });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

const onsiteRequestUpdateSchema = z.object({
  status: z.enum(ONSITE_STATUSES as unknown as [string, ...string[]]).optional(),
  adminNotes: z.string().optional(),
  customerClassification: z.enum(["new", "existing", "unverified"]).optional(),
});

app.patch("/api/admin/onsite-requests/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const parsed = onsiteRequestUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    }
    const { status, adminNotes, customerClassification } = parsed.data;

    if (status !== undefined) {
      const existing = await storage.getOnsiteTrainingRequest(id);
      if (!existing) return res.status(404).json({ error: "Request not found" });

      const currentStatus = existing.status as OnsiteStatus;
      const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
      if (status !== currentStatus && !allowed.includes(status as OnsiteStatus)) {
        return res.status(422).json({
          error: `Cannot transition from "${currentStatus}" to "${status}". Valid transitions: ${allowed.join(", ") || "none (terminal status)"}`,
        });
      }
    }

    const existing = status !== undefined ? await storage.getOnsiteTrainingRequest(id) : null;
    const previousStatus = existing?.status;

    const updated = await storage.updateOnsiteTrainingRequest(id, {
      ...(status !== undefined ? { status: status as OnsiteStatus } : {}),
      ...(adminNotes !== undefined ? { adminNotes } : {}),
      ...(customerClassification !== undefined ? { customerClassification } : {}),
    });
    if (!updated) return res.status(404).json({ error: "Request not found" });

    if (status !== undefined && status !== previousStatus && req.session.userId) {
      await storage.createLeadActivity({
        leadId: id,
        companyId: updated.companyId,
        contactId: updated.contactId,
        actorUserId: req.session.userId,
        activityType: "status_changed",
        metadata: { previousStatus, newStatus: status },
      });
    }

    return res.json({ request: updated });
  } catch (error) {
    console.error("[OnsiteRequest] Update error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/onsite-requests/:id/assignments", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const requestId = parseInt(req.params.id as string);
    if (isNaN(requestId)) return res.status(400).json({ error: "Invalid ID" });
    const assignments = await storage.listAssignmentsByRequest(requestId);
    const enriched = await Promise.all(assignments.map(async (a) => {
      const instructor = await storage.getInstructor(a.instructorId);
      const assignedBy = await storage.getUser(a.assignedByUserId);
      return {
        ...a,
        instructorName: instructor?.fullName ?? "Unknown",
        instructorEmail: instructor?.email ?? "",
        instructorCity: instructor?.city ?? "",
        instructorState: instructor?.state ?? "",
        assignedByName: assignedBy?.name ?? "Unknown",
      };
    }));
    return res.json({ assignments: enriched });
  } catch (error) {
    console.error("[Assignments] List error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/onsite-requests/:id/matching-instructors", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const requestId = parseInt(req.params.id as string);
    if (isNaN(requestId)) return res.status(400).json({ error: "Invalid ID" });
    const matched = await storage.getMatchingInstructors(requestId);
    return res.json({ instructors: matched });
  } catch (error) {
    console.error("[Assignments] Match error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const assignInstructorSchema = z.object({
  instructorId: z.number().int().positive(),
  notes: z.string().optional(),
});

app.post("/api/admin/onsite-requests/:id/assignments", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const requestId = parseInt(req.params.id as string);
    if (isNaN(requestId)) return res.status(400).json({ error: "Invalid ID" });
    const parsed = assignInstructorSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });

    const request = await storage.getOnsiteTrainingRequest(requestId);
    if (!request) return res.status(404).json({ error: "Request not found" });

    const assignableStatuses = ["contacted", "quoted", "quote_accepted", "scheduled", "confirmed"];
    if (!assignableStatuses.includes(request.status)) {
      return res.status(400).json({ error: `Cannot assign instructors to a request with status "${request.status}". Request must be in an active pipeline stage (contacted through confirmed).` });
    }

    const instructor = await storage.getInstructor(parsed.data.instructorId);
    if (!instructor) return res.status(404).json({ error: "Instructor not found" });

    if (!instructor.active) {
      return res.status(400).json({ error: "Cannot assign an inactive instructor" });
    }

    const existing = await storage.listAssignmentsByRequest(requestId);
    const activeAssignment = existing.find(a => a.status !== "cancelled");
    if (activeAssignment) {
      return res.status(409).json({ error: "This request already has an active instructor assignment. Cancel the existing assignment before assigning a new instructor." });
    }

    const assignment = await storage.createInstructorAssignment({
      requestId,
      instructorId: parsed.data.instructorId,
      status: "proposed",
      assignedByUserId: req.session.userId!,
      notes: parsed.data.notes || null,
    });

    await storage.createAssignmentStatusChange({
      assignmentId: assignment.id,
      changedByUserId: req.session.userId!,
      previousStatus: "unassigned",
      newStatus: "proposed",
      note: parsed.data.notes,
    });

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "instructor_assigned",
      entity: "instructor_assignments",
      entityId: String(assignment.id),
      metadata: { requestId, instructorId: parsed.data.instructorId, instructorName: instructor.fullName },
    });

    const { sendInstructorAssignmentNotification, sendAssignmentAdminAlert } = await import("../email");
    sendInstructorAssignmentNotification({
      instructorEmail: instructor.email,
      instructorName: instructor.fullName,
      requestId,
      companyName: request.companyName,
      city: request.city,
      state: request.state,
      trainingType: request.trainingType,
      preferredDates: [request.preferredDate1, request.preferredDate2, request.preferredDate3].filter(Boolean) as string[],
    }).catch(err => console.error("[Assignments] Instructor notification failed:", err));

    sendAssignmentAdminAlert({
      instructorName: instructor.fullName,
      requestId,
      companyName: request.companyName,
      city: request.city,
      state: request.state,
      action: "Instructor Assigned",
    }).catch(err => console.error("[Assignments] Admin alert failed:", err));

    return res.json({ assignment });
  } catch (error) {
    console.error("[Assignments] Create error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const updateAssignmentSchema = z.object({
  status: z.enum(["proposed", "assigned", "confirmed", "completed", "cancelled"]),
  notes: z.string().optional(),
});

app.patch("/api/admin/assignments/:assignmentId", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const assignmentId = parseInt(req.params.assignmentId as string);
    if (isNaN(assignmentId)) return res.status(400).json({ error: "Invalid ID" });
    const parsed = updateAssignmentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });

    const existing = await storage.getInstructorAssignment(assignmentId);
    if (!existing) return res.status(404).json({ error: "Assignment not found" });

    const validTransitions: Record<string, string[]> = {
      proposed: ["assigned", "cancelled"],
      assigned: ["confirmed", "cancelled"],
      confirmed: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };
    const allowed = validTransitions[existing.status] ?? [];
    if (parsed.data.status !== existing.status && !allowed.includes(parsed.data.status)) {
      return res.status(400).json({ error: `Cannot transition from "${existing.status}" to "${parsed.data.status}". Valid transitions: ${allowed.join(", ") || "none (terminal status)"}` });
    }

    if (parsed.data.status !== existing.status) {
      await storage.createAssignmentStatusChange({
        assignmentId,
        changedByUserId: req.session.userId!,
        previousStatus: existing.status,
        newStatus: parsed.data.status,
        note: parsed.data.notes,
      });
    }

    const updated = await storage.updateInstructorAssignment(assignmentId, {
      status: parsed.data.status,
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
    });

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "assignment_status_changed",
      entity: "instructor_assignments",
      entityId: String(assignmentId),
      metadata: { previousStatus: existing.status, newStatus: parsed.data.status },
    });

    if (parsed.data.status !== existing.status) {
      Promise.all([
        storage.getInstructor(existing.instructorId),
        storage.getOnsiteTrainingRequest(existing.requestId),
      ]).then(async ([instructor, request]) => {
        if (instructor && request) {
          const { sendAssignmentAdminAlert } = await import("../email");
          sendAssignmentAdminAlert({
            instructorName: instructor.fullName,
            requestId: existing.requestId,
            companyName: request.companyName,
            city: request.city,
            state: request.state,
            action: `Assignment Status Changed`,
            previousStatus: existing.status,
            newStatus: parsed.data.status,
          }).catch(err => console.error("[Assignments] Admin alert failed:", err));
        }
      }).catch(err => console.error("[Assignments] Status change notification failed:", err));
    }

    return res.json({ assignment: updated });
  } catch (error) {
    console.error("[Assignments] Update error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/assignments/:assignmentId/history", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const assignmentId = parseInt(req.params.assignmentId as string);
    if (isNaN(assignmentId)) return res.status(400).json({ error: "Invalid ID" });
    const changes = await storage.listAssignmentStatusChanges(assignmentId);
    const enriched = await Promise.all(changes.map(async (c) => {
      const user = await storage.getUser(c.changedByUserId);
      return { ...c, changedByName: user?.name ?? "Unknown" };
    }));
    return res.json({ history: enriched });
  } catch (error) {
    console.error("[Assignments] History error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/leads/:id/activities", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const leadId = parseInt(req.params.id as string);
    if (isNaN(leadId)) return res.status(400).json({ error: "Invalid ID" });
    const activities = await storage.getLeadActivitiesByLead(leadId);
    const enriched = await Promise.all(activities.map(async (a) => {
      let actorName: string | null = null;
      if (a.actorUserId) {
        const user = await storage.getUser(a.actorUserId);
        actorName = user?.name ?? "Unknown";
      }
      return { ...a, actorName };
    }));
    return res.json({ activities: enriched });
  } catch (error) {
    console.error("[LeadActivities] List error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const createLeadActivitySchema = z.object({
  activityType: z.enum(["note_added", "call_logged", "email_logged", "quote_requested"] as const),
  notes: z.string().min(1, "Notes required").optional(),
});

app.post("/api/admin/leads/:id/activities", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const leadId = parseInt(req.params.id as string);
    if (isNaN(leadId)) return res.status(400).json({ error: "Invalid ID" });
    const parsed = createLeadActivitySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });

    const lead = await storage.getOnsiteTrainingRequest(leadId);
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const activity = await storage.createLeadActivity({
      leadId,
      companyId: lead.companyId,
      contactId: lead.contactId,
      actorUserId: req.session.userId ?? null,
      activityType: parsed.data.activityType,
      notes: parsed.data.notes ?? null,
    });

    return res.status(201).json({ activity });
  } catch (error) {
    console.error("[LeadActivities] Create error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const nextActionSchema = z.object({
  nextActionType: z.enum(["call_back", "send_quote", "follow_up", "schedule_training", "send_info", "other"]).nullable(),
  nextActionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format").nullable(),
});

app.patch("/api/admin/leads/:id/next-action", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const leadId = parseInt(req.params.id as string);
    if (isNaN(leadId)) return res.status(400).json({ error: "Invalid ID" });
    const parsed = nextActionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });

    if (parsed.data.nextActionDate) {
      const testDate = new Date(parsed.data.nextActionDate);
      if (isNaN(testDate.getTime())) return res.status(400).json({ error: "Invalid date value" });
    }

    const lead = await storage.getOnsiteTrainingRequest(leadId);
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const nextActionDate = parsed.data.nextActionDate ? new Date(parsed.data.nextActionDate) : null;
    const updated = await storage.updateOnsiteTrainingRequest(leadId, {
      nextActionType: parsed.data.nextActionType,
      nextActionDate,
    });

    if (parsed.data.nextActionType && req.session.userId) {
      await storage.createLeadActivity({
        leadId,
        companyId: lead.companyId,
        contactId: lead.contactId,
        actorUserId: req.session.userId,
        activityType: "follow_up_scheduled",
        metadata: { nextActionType: parsed.data.nextActionType, nextActionDate: parsed.data.nextActionDate },
      });
    }

    return res.json({ request: updated });
  } catch (error) {
    console.error("[Leads] Next action error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const linkCompanySchema = z.object({ companyId: z.number().int().positive() });

app.patch("/api/admin/leads/:id/link-company", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const leadId = parseInt(req.params.id as string);
    if (isNaN(leadId)) return res.status(400).json({ error: "Invalid ID" });
    const parsed = linkCompanySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });

    const lead = await storage.getOnsiteTrainingRequest(leadId);
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    const company = await storage.getCompany(parsed.data.companyId);
    if (!company) return res.status(404).json({ error: "Company not found" });

    const updated = await storage.updateOnsiteTrainingRequest(leadId, { companyId: parsed.data.companyId });

    if (req.session.userId) {
      await storage.createLeadActivity({
        leadId,
        companyId: parsed.data.companyId,
        actorUserId: req.session.userId,
        activityType: "company_linked",
        metadata: { companyName: company.name },
      });
    }

    return res.json({ request: updated });
  } catch (error) {
    console.error("[Leads] Link company error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const linkContactSchema = z.object({ contactId: z.number().int().positive() });

app.patch("/api/admin/leads/:id/link-contact", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const leadId = parseInt(req.params.id as string);
    if (isNaN(leadId)) return res.status(400).json({ error: "Invalid ID" });
    const parsed = linkContactSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });

    const lead = await storage.getOnsiteTrainingRequest(leadId);
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    const contact = await storage.getContact(parsed.data.contactId);
    if (!contact) return res.status(404).json({ error: "Contact not found" });

    const updated = await storage.updateOnsiteTrainingRequest(leadId, { contactId: parsed.data.contactId });

    if (req.session.userId) {
      await storage.createLeadActivity({
        leadId,
        companyId: lead.companyId,
        contactId: parsed.data.contactId,
        actorUserId: req.session.userId,
        activityType: "contact_linked",
        metadata: { contactName: `${contact.firstName} ${contact.lastName}` },
      });
    }

    return res.json({ request: updated });
  } catch (error) {
    console.error("[Leads] Link contact error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/leads/:id/create-company", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const leadId = parseInt(req.params.id as string);
    if (isNaN(leadId)) return res.status(400).json({ error: "Invalid ID" });

    const lead = await storage.getOnsiteTrainingRequest(leadId);
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    if (lead.companyId) return res.status(422).json({ error: "Lead is already linked to a company" });
    if (!lead.companyName) return res.status(422).json({ error: "Lead has no company name to create from" });

    const company = await storage.createCompany({
      name: lead.companyName,
      phone: lead.phone,
      email: lead.email,
      billingCity: lead.city,
      billingState: lead.state,
      billingZip: lead.zip,
      billingStreet: lead.trainingAddress,
      assignedRepId: lead.assignedRepId,
    });

    await storage.updateOnsiteTrainingRequest(leadId, { companyId: company.id });

    if (req.session.userId) {
      await storage.createLeadActivity({
        leadId,
        companyId: company.id,
        actorUserId: req.session.userId,
        activityType: "company_linked",
        notes: "Company created from lead",
        metadata: { companyName: company.name, created: true },
      });
    }

    return res.status(201).json({ company });
  } catch (error) {
    console.error("[Leads] Create company error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/leads/:id/create-contact", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const leadId = parseInt(req.params.id as string);
    if (isNaN(leadId)) return res.status(400).json({ error: "Invalid ID" });

    const lead = await storage.getOnsiteTrainingRequest(leadId);
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    if (lead.contactId) return res.status(422).json({ error: "Lead is already linked to a contact" });

    const nameParts = lead.contactName.trim().split(/\s+/);
    const firstName = nameParts[0] || lead.contactName;
    const lastName = nameParts.slice(1).join(" ") || "";

    const contact = await storage.createContact({
      companyId: lead.companyId,
      firstName,
      lastName: lastName || firstName,
      email: lead.email,
      phone: lead.phone,
      role: "decision_maker",
      isPrimary: true,
    });

    await storage.updateOnsiteTrainingRequest(leadId, { contactId: contact.id });

    if (req.session.userId) {
      await storage.createLeadActivity({
        leadId,
        companyId: lead.companyId,
        contactId: contact.id,
        actorUserId: req.session.userId,
        activityType: "contact_linked",
        notes: "Contact created from lead",
        metadata: { contactName: `${contact.firstName} ${contact.lastName}`, created: true },
      });
    }

    return res.status(201).json({ contact });
  } catch (error) {
    console.error("[Leads] Create contact error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

}
