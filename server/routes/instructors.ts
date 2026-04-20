import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertInstructorApplicationSchema } from "@shared/schema";
import type { InstructorApplication } from "@shared/schema";
import { isAdminRole } from "@shared/roles";
import { sendInstructorApplicationConfirmation, sendInstructorApplicationAdminAlert } from "../email";
import { resolveLocale } from "../locale-resolver";
import { rateLimit } from "../rate-limit";
import { requireAuth, requireRole } from "./middleware";
import type { InstructorAppFilters, InstructorFilters } from "../storage";

export function registerInstructorRoutes(app: Express) {
const instructorAppLimiter = rateLimit({ name: "instructor_app", windowMs: 60_000, max: 3 });

const instructorAppCreateSchema = insertInstructorApplicationSchema.extend({
  fullName: z.string().min(2, "Full name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(7, "Phone number required"),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  zip: z.string().min(5, "ZIP code required"),
  yearsExperience: z.number().int().min(0, "Years experience required"),
  availability: z.string().min(2, "Availability required"),
  whyInstructor: z.string().min(20, "Please tell us why you want to become an instructor"),
  certificationId: z.number().int().positive().nullable().optional(),
});

app.post("/api/instructor-applications", requireAuth, instructorAppLimiter, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ error: "User not found" });

    const existingApp = await storage.getInstructorApplicationByUser(userId);
    if (existingApp && (existingApp.status === "applied" || existingApp.status === "reviewing")) {
      return res.status(409).json({ error: "You already have a pending instructor application" });
    }

    const result = instructorAppCreateSchema.safeParse({ ...req.body, userId });
    if (!result.success) {
      return res.status(400).json({ error: "Invalid form data", details: result.error.issues });
    }

    const isSuperAdmin = isAdminRole(user.role);

    const userCerts = await storage.getCertificationsByUser(userId);
    const issuedCerts = userCerts.filter((c: { status: string }) => c.status === "issued");

    if (!isSuperAdmin && issuedCerts.length === 0) {
      return res.status(403).json({ error: "Valid certification required to apply" });
    }

    let eligibilityVerifiedAt: Date | null = null;
    let resolvedCertId = result.data.certificationId;

    if (resolvedCertId) {
      const cert = await storage.getCertification(resolvedCertId);
      if (!cert || cert.userId !== userId || cert.status !== "issued") {
        return res.status(403).json({ error: "The selected certification is not valid" });
      }
      eligibilityVerifiedAt = new Date();
    } else if (issuedCerts.length > 0) {
      resolvedCertId = issuedCerts[0].id;
      eligibilityVerifiedAt = new Date();
    }

    result.data.certificationId = resolvedCertId;

    const application = await storage.createInstructorApplication({
      ...result.data,
      eligibilityVerifiedAt,
    });

    const instrLocale = await resolveLocale({ userId });
    sendInstructorApplicationConfirmation({
      to: result.data.email,
      applicantName: result.data.fullName,
      actorUserId: userId,
      locale: instrLocale,
    }).catch(err => console.error("[InstructorApp] Confirmation email error:", err));

    sendInstructorApplicationAdminAlert({
      applicantName: result.data.fullName,
      applicantEmail: result.data.email,
      city: result.data.city,
      state: result.data.state,
      yearsExperience: result.data.yearsExperience,
      applicationId: application.id,
      actorUserId: userId,
    }).catch(err => console.error("[InstructorApp] Admin alert error:", err));

    return res.status(201).json({ application });
  } catch (error) {
    console.error("[InstructorApp] Create error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/instructor-applications/mine", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    const application = await storage.getInstructorApplicationByUser(userId);
    if (application) {
      const {
        adminNotes,
        complianceRating,
        professionalismRating,
        fieldExperienceRating,
        interviewRecommended,
        followUpNeeded,
        reviewChecklist,
        decisionSummary,
        ...safeApp
      } = application;
      return res.json({ application: safeApp });
    }
    return res.json({ application: null });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/instructor-applications", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const q = req.query;
    const validStatuses = ["applied", "reviewing", "approved", "rejected", "archived"];
    const statusRaw = typeof q.status === "string" ? q.status : undefined;
    const status = statusRaw && validStatuses.includes(statusRaw) ? statusRaw : undefined;

    const hasAdvancedFilters = q.state || q.city || q.equipment || q.min_years || q.willing_to_travel || q.search || q.sort_by;
    if (hasAdvancedFilters) {
      const filters: import("./storage").InstructorAppFilters = {
        status,
        state: typeof q.state === "string" ? q.state : undefined,
        city: typeof q.city === "string" ? q.city : undefined,
        equipment: typeof q.equipment === "string" ? q.equipment : undefined,
        minYears: typeof q.min_years === "string" ? parseInt(q.min_years) || undefined : undefined,
        willingToTravel: q.willing_to_travel === "true" ? true : q.willing_to_travel === "false" ? false : undefined,
        search: typeof q.search === "string" ? q.search : undefined,
        sortBy: (q.sort_by === "date" || q.sort_by === "status" || q.sort_by === "experience") ? q.sort_by : undefined,
        sortOrder: q.sort_order === "asc" ? "asc" : "desc",
      };
      const applications = await storage.listInstructorApplicationsAdvanced(filters);
      return res.json({ applications });
    }

    const applications = await storage.listInstructorApplications(status);
    return res.json({ applications });
  } catch (error) {
    console.error("[InstructorApp] List error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const bulkActionSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, "At least one application ID required"),
  action: z.enum(["reviewing", "approved", "rejected", "archived"]),
  note: z.string().optional(),
});

app.post("/api/admin/instructor-applications/bulk-action", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const actorId = req.session.userId!;
    const parsed = bulkActionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    }
    const { ids, action, note } = parsed.data;
    const results: { id: number; success: boolean; error?: string }[] = [];

    for (const appId of ids) {
      const existing = await storage.getInstructorApplication(appId);
      if (!existing) {
        results.push({ id: appId, success: false, error: "Not found" });
        continue;
      }
      if (existing.status === action) {
        results.push({ id: appId, success: true });
        continue;
      }

      const previousStatus = existing.status;
      const updated = await storage.updateInstructorApplication(appId, { status: action });
      if (!updated) {
        results.push({ id: appId, success: false, error: "Update failed" });
        continue;
      }

      await storage.createInstructorAppStatusChange({
        applicationId: appId,
        changedByUserId: actorId,
        previousStatus,
        newStatus: action,
        note: note || `Bulk action: set to ${action}`,
      });

      await storage.createAuditLog({
        actorUserId: actorId,
        action: "instructor_app_status_changed",
        entity: "instructor_applications",
        entityId: String(appId),
        metadata: { previousStatus, newStatus: action, bulk: true },
      });

      if (action === "approved") {
        await autoCreateInstructor(updated, actorId);
      }

      results.push({ id: appId, success: true });
    }

    return res.json({ results });
  } catch (error) {
    console.error("[InstructorApp] Bulk action error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/instructor-applications/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const application = await storage.getInstructorApplication(id);
    if (!application) return res.status(404).json({ error: "Application not found" });
    const statusChanges = await storage.listInstructorAppStatusChanges(id);
    const actorIds = [...new Set(statusChanges.map(c => c.changedByUserId))];
    const actorMap: Record<number, string> = {};
    for (const uid of actorIds) {
      const u = await storage.getUser(uid);
      if (u) actorMap[uid] = u.displayName || u.email;
    }
    const enrichedChanges = statusChanges.map(c => ({
      ...c,
      actorName: actorMap[c.changedByUserId] || `User #${c.changedByUserId}`,
    }));
    return res.json({ application, statusChanges: enrichedChanges });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

const reviewChecklistSchema = z.object({
  qualificationsMet: z.boolean().optional(),
  experienceVerified: z.boolean().optional(),
  communicationAssessed: z.boolean().optional(),
  safetyKnowledgeConfirmed: z.boolean().optional(),
  referencesChecked: z.boolean().optional(),
});

const instructorAppUpdateSchema = z.object({
  status: z.enum(["applied", "reviewing", "approved", "rejected", "archived"]).optional(),
  adminNotes: z.string().optional(),
  complianceRating: z.number().int().min(1).max(5).nullable().optional(),
  professionalismRating: z.number().int().min(1).max(5).nullable().optional(),
  fieldExperienceRating: z.number().int().min(1).max(5).nullable().optional(),
  interviewRecommended: z.boolean().optional(),
  followUpNeeded: z.boolean().optional(),
  reviewChecklist: reviewChecklistSchema.optional(),
  decisionSummary: z.string().optional(),
  statusChangeNote: z.string().optional(),
});

async function autoCreateInstructor(application: import("@shared/schema").InstructorApplication, actorId: number) {
  const existing = await storage.getInstructorByUser(application.userId);
  if (existing) {
    const updated = await storage.updateInstructor(existing.id, {
      applicationId: application.id,
      fullName: application.fullName,
      email: application.email,
      phone: application.phone,
      city: application.city,
      state: application.state,
      zip: application.zip,
      travelRadius: application.travelRadius,
      equipmentClasses: application.equipmentTypes,
      active: true,
    });
    await storage.createAuditLog({
      actorUserId: actorId,
      action: "instructor_record_updated",
      entity: "instructors",
      entityId: String(existing.id),
      metadata: { applicationId: application.id },
    });
  } else {
    const created = await storage.createInstructor({
      applicationId: application.id,
      userId: application.userId,
      fullName: application.fullName,
      email: application.email,
      phone: application.phone,
      city: application.city,
      state: application.state,
      zip: application.zip,
      travelRadius: application.travelRadius,
      equipmentClasses: application.equipmentTypes,
      languages: [],
      active: true,
      internalNotes: null,
      onboardingChecklist: {
        identityVerified: false,
        experienceReviewed: false,
        interviewCompleted: false,
        insuranceCollected: false,
        agreementSigned: false,
        taxInfoCollected: false,
        backgroundCheckComplete: false,
        readyForAssignment: false,
      },
    });
    await storage.createAuditLog({
      actorUserId: actorId,
      action: "instructor_record_created",
      entity: "instructors",
      entityId: String(created.id),
      metadata: { applicationId: application.id },
    });
  }
}

app.patch("/api/admin/instructor-applications/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const actorId = req.session.userId!;

    const parsed = instructorAppUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    }

    const { statusChangeNote, ...updateFields } = parsed.data;
    const existing = await storage.getInstructorApplication(id);
    if (!existing) return res.status(404).json({ error: "Application not found" });

    const updateData: Record<string, unknown> = {};
    if (updateFields.status !== undefined) updateData.status = updateFields.status;
    if (updateFields.adminNotes !== undefined) updateData.adminNotes = updateFields.adminNotes;
    if (updateFields.complianceRating !== undefined) updateData.complianceRating = updateFields.complianceRating;
    if (updateFields.professionalismRating !== undefined) updateData.professionalismRating = updateFields.professionalismRating;
    if (updateFields.fieldExperienceRating !== undefined) updateData.fieldExperienceRating = updateFields.fieldExperienceRating;
    if (updateFields.interviewRecommended !== undefined) updateData.interviewRecommended = updateFields.interviewRecommended;
    if (updateFields.followUpNeeded !== undefined) updateData.followUpNeeded = updateFields.followUpNeeded;
    if (updateFields.reviewChecklist !== undefined) updateData.reviewChecklist = updateFields.reviewChecklist;
    if (updateFields.decisionSummary !== undefined) updateData.decisionSummary = updateFields.decisionSummary;

    const updated = await storage.updateInstructorApplication(id, updateData as Partial<import("@shared/schema").InstructorApplication>);
    if (!updated) return res.status(404).json({ error: "Application not found" });

    if (updateFields.status && updateFields.status !== existing.status) {
      await storage.createInstructorAppStatusChange({
        applicationId: id,
        changedByUserId: actorId,
        previousStatus: existing.status,
        newStatus: updateFields.status,
        note: statusChangeNote,
      });

      await storage.createAuditLog({
        actorUserId: actorId,
        action: "instructor_app_status_changed",
        entity: "instructor_applications",
        entityId: String(id),
        metadata: { previousStatus: existing.status, newStatus: updateFields.status },
      });

      if (updateFields.status === "approved") {
        await autoCreateInstructor(updated, actorId);
      }
    }

    const statusChanges = await storage.listInstructorAppStatusChanges(id);
    const actorIds2 = [...new Set(statusChanges.map(c => c.changedByUserId))];
    const actorMap2: Record<number, string> = {};
    for (const uid of actorIds2) {
      const u = await storage.getUser(uid);
      if (u) actorMap2[uid] = u.displayName || u.email;
    }
    const enrichedChanges2 = statusChanges.map(c => ({
      ...c,
      actorName: actorMap2[c.changedByUserId] || `User #${c.changedByUserId}`,
    }));
    return res.json({ application: updated, statusChanges: enrichedChanges2 });
  } catch (error) {
    console.error("[InstructorApp] Update error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const instructorUpdateSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(7).optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  zip: z.string().min(5).optional(),
  travelRadius: z.number().int().min(0).nullable().optional(),
  equipmentClasses: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  active: z.boolean().optional(),
  internalNotes: z.string().nullable().optional(),
  onboardingChecklist: z.object({
    identityVerified: z.boolean(),
    experienceReviewed: z.boolean(),
    interviewCompleted: z.boolean(),
    insuranceCollected: z.boolean(),
    agreementSigned: z.boolean(),
    taxInfoCollected: z.boolean(),
    backgroundCheckComplete: z.boolean(),
    readyForAssignment: z.boolean(),
  }).optional(),
});

app.get("/api/admin/instructors", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const q = req.query;
    const filters: import("./storage").InstructorFilters = {
      active: q.active === "true" ? true : q.active === "false" ? false : undefined,
      search: typeof q.search === "string" ? q.search : undefined,
      state: typeof q.state === "string" ? q.state : undefined,
      sortBy: (q.sort_by === "name" || q.sort_by === "date" || q.sort_by === "state") ? q.sort_by : undefined,
      sortOrder: q.sort_order === "asc" ? "asc" : "desc",
    };
    const instructorsList = await storage.listInstructors(filters);
    return res.json({ instructors: instructorsList });
  } catch (error) {
    console.error("[Instructors] List error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/instructors/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const instructor = await storage.getInstructor(id);
    if (!instructor) return res.status(404).json({ error: "Instructor not found" });
    return res.json({ instructor });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/admin/instructors/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const parsed = instructorUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    }
    const updated = await storage.updateInstructor(id, parsed.data as Partial<import("@shared/schema").Instructor>);
    if (!updated) return res.status(404).json({ error: "Instructor not found" });

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "instructor_updated",
      entity: "instructors",
      entityId: String(id),
      metadata: { fields: Object.keys(parsed.data) },
    });

    return res.json({ instructor: updated });
  } catch (error) {
    console.error("[Instructors] Update error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
}
