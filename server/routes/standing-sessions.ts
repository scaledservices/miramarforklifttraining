import type { Express, Request, Response } from "express";
import { db } from "../db";
import { standingSessions, bookings, companies, serviceAreas } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole } from "./middleware";
import { isAdminRole } from "@shared/roles";
import { storage } from "../storage";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Compute the next `weeks` occurrences (inclusive of today) of a given
 * day-of-week as YYYY-MM-DD strings, starting from `fromDate`.
 */
function nextOccurrences(dayOfWeek: number, weeks: number, fromDate: Date = new Date()): string[] {
  const dates: string[] = [];
  const base = new Date(fromDate);
  base.setHours(12, 0, 0, 0);
  let current = new Date(base);
  // Advance to the first matching day-of-week
  const diff = (dayOfWeek - current.getDay() + 7) % 7;
  current.setDate(current.getDate() + diff);
  for (let i = 0; i < weeks; i++) {
    const d = new Date(current);
    d.setDate(d.getDate() + i * 7);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

/**
 * Generate bookable bookings from a standing session template.
 * Returns the number of bookings created (skips dates that already
 * have a booking for this standing session's area/time slot).
 */
export async function generateSlotsFromStandingSession(
  standingSessionId: number,
  weeks: number,
  actorUserId?: number,
): Promise<{ created: number; skipped: number; errors: string[] }> {
  const [ss] = await db.select().from(standingSessions).where(eq(standingSessions.id, standingSessionId));
  if (!ss) throw new Error("Standing session not found");
  if (ss.status !== "active") throw new Error("Standing session is paused");

  const [company] = await db.select().from(companies).where(eq(companies.id, ss.companyId));
  if (!company) throw new Error("Company not found");

  const dates = nextOccurrences(ss.dayOfWeek, weeks);

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const dateStr of dates) {
    try {
      // Skip if a booking already exists for this area/date/time (from the
      // standing session or otherwise — avoids double-booking the slot).
      const existing = await db.select().from(bookings).where(
        and(
          eq(bookings.serviceAreaId, ss.serviceAreaId),
          eq(bookings.sessionDate, dateStr),
          eq(bookings.startTime, ss.startTime),
        ),
      );
      if (existing.length > 0) {
        skipped++;
        continue;
      }

      // Check trainer availability
      const trainerBusy = await storage.isTrainerBookedOnDate(dateStr, ss.serviceAreaId);
      if (trainerBusy) {
        skipped++;
        continue;
      }

      const productSlug = ss.productSlugs.join(",") || "onsite-training";
      const bookingNumber = `BK-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      await db.insert(bookings).values({
        bookingNumber,
        userId: actorUserId ?? company.assignedRepId ?? 1,
        serviceAreaId: ss.serviceAreaId,
        productSlug,
        sessionDate: dateStr,
        startTime: ss.startTime,
        endTime: ss.endTime,
        participantCount: ss.defaultParticipantCount,
        customerAddress: company.billingStreet || "TBD",
        customerCity: company.billingCity || "TBD",
        customerState: company.billingState || "CA",
        customerZip: company.billingZip || "00000",
        contactName: company.name,
        contactPhone: company.phone || "",
        contactEmail: company.email || "",
        specialRequests: `Auto-generated from standing session #${ss.id}`,
        totalPrice: "0",
        status: "pending",
      });
      created++;
    } catch (err) {
      errors.push(`Date ${dateStr}: ${(err as Error).message}`);
    }
  }

  return { created, skipped, errors };
}

export function registerStandingSessionRoutes(app: Express) {
  // ──── LIST ───────────────────────────────────────────────────────

  app.get("/api/standing-sessions", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ error: "User not found" });

      if (isAdminRole(user.role)) {
        const all = await db.select().from(standingSessions).orderBy(standingSessions.createdAt);
        return res.json(all);
      }

      // group_admin: only own company's standing sessions
      if (user.role === "group_admin") {
        // Find company via groups → companies (group_admin is admin of a group)
        const userGroups = await storage.getGroupsByAdmin(user.id);
        if (userGroups.length === 0) return res.json([]);
        // The companies are linked via orders, but for standing sessions
        // we match by the group admin's company association
        const group = userGroups[0];
        const userCompanies = await db.select().from(companies).where(eq(companies.assignedRepId, user.id));
        if (userCompanies.length === 0) return res.json([]);
        const companyIds = userCompanies.map((c) => c.id);
        const sessions = await db.select().from(standingSessions);
        const filtered = sessions.filter((s) => companyIds.includes(s.companyId));
        return res.json(filtered);
      }

      return res.status(403).json({ error: "Insufficient permissions" });
    } catch (error) {
      console.error("[StandingSessions] List error:", error);
      return res.status(500).json({ error: "Failed to fetch standing sessions" });
    }
  });

  // ──── CREATE ─────────────────────────────────────────────────────

  app.post("/api/standing-sessions", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const { companyId, serviceAreaId, dayOfWeek, startTime, endTime, defaultParticipantCount, productSlugs } = req.body;

      if (!companyId || typeof companyId !== "number") return res.status(400).json({ error: "companyId is required" });
      if (!serviceAreaId || typeof serviceAreaId !== "number") return res.status(400).json({ error: "serviceAreaId is required" });
      if (typeof dayOfWeek !== "number" || dayOfWeek < 0 || dayOfWeek > 6) return res.status(400).json({ error: "dayOfWeek must be 0-6" });
      if (!startTime || typeof startTime !== "string") return res.status(400).json({ error: "startTime is required (HH:MM)" });
      if (!endTime || typeof endTime !== "string") return res.status(400).json({ error: "endTime is required (HH:MM)" });
      if (!defaultParticipantCount || typeof defaultParticipantCount !== "number" || defaultParticipantCount < 1) {
        return res.status(400).json({ error: "defaultParticipantCount must be a positive number" });
      }
      if (!Array.isArray(productSlugs) || productSlugs.length === 0) {
        return res.status(400).json({ error: "productSlugs must be a non-empty array" });
      }

      // Verify company and service area exist
      const [company] = await db.select().from(companies).where(eq(companies.id, companyId));
      if (!company) return res.status(404).json({ error: "Company not found" });

      const [area] = await db.select().from(serviceAreas).where(eq(serviceAreas.id, serviceAreaId));
      if (!area) return res.status(404).json({ error: "Service area not found" });

      const [created] = await db.insert(standingSessions).values({
        companyId,
        serviceAreaId,
        dayOfWeek,
        startTime,
        endTime,
        defaultParticipantCount,
        productSlugs,
        status: "active",
      }).returning();

      await storage.createAuditLog({
        actorUserId: req.session.userId!,
        action: "standing_session_created",
        entity: "standing_session",
        entityId: String(created.id),
        metadata: { companyId, serviceAreaId, dayOfWeek, startTime, endTime },
      });

      return res.status(201).json(created);
    } catch (error) {
      console.error("[StandingSessions] Create error:", error);
      return res.status(500).json({ error: "Failed to create standing session" });
    }
  });

  // ──── UPDATE ─────────────────────────────────────────────────────

  app.patch("/api/standing-sessions/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const [existing] = await db.select().from(standingSessions).where(eq(standingSessions.id, id));
      if (!existing) return res.status(404).json({ error: "Standing session not found" });

      const updates: Record<string, any> = { updatedAt: new Date() };
      const { dayOfWeek, startTime, endTime, defaultParticipantCount, productSlugs, status, companyId, serviceAreaId } = req.body;

      if (dayOfWeek !== undefined) {
        if (typeof dayOfWeek !== "number" || dayOfWeek < 0 || dayOfWeek > 6) return res.status(400).json({ error: "dayOfWeek must be 0-6" });
        updates.dayOfWeek = dayOfWeek;
      }
      if (startTime !== undefined) updates.startTime = String(startTime);
      if (endTime !== undefined) updates.endTime = String(endTime);
      if (defaultParticipantCount !== undefined) {
        if (typeof defaultParticipantCount !== "number" || defaultParticipantCount < 1) {
          return res.status(400).json({ error: "defaultParticipantCount must be positive" });
        }
        updates.defaultParticipantCount = defaultParticipantCount;
      }
      if (productSlugs !== undefined) {
        if (!Array.isArray(productSlugs) || productSlugs.length === 0) {
          return res.status(400).json({ error: "productSlugs must be a non-empty array" });
        }
        updates.productSlugs = productSlugs;
      }
      if (status !== undefined) {
        if (status !== "active" && status !== "paused") return res.status(400).json({ error: "status must be active or paused" });
        updates.status = status;
      }
      if (companyId !== undefined) updates.companyId = Number(companyId);
      if (serviceAreaId !== undefined) updates.serviceAreaId = Number(serviceAreaId);

      const [updated] = await db.update(standingSessions).set(updates).where(eq(standingSessions.id, id)).returning();

      await storage.createAuditLog({
        actorUserId: req.session.userId!,
        action: "standing_session_updated",
        entity: "standing_session",
        entityId: String(id),
        metadata: updates,
      });

      return res.json(updated);
    } catch (error) {
      console.error("[StandingSessions] Update error:", error);
      return res.status(500).json({ error: "Failed to update standing session" });
    }
  });

  // ──── DELETE ─────────────────────────────────────────────────────

  app.delete("/api/standing-sessions/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const [existing] = await db.select().from(standingSessions).where(eq(standingSessions.id, id));
      if (!existing) return res.status(404).json({ error: "Standing session not found" });

      await db.delete(standingSessions).where(eq(standingSessions.id, id));

      await storage.createAuditLog({
        actorUserId: req.session.userId!,
        action: "standing_session_deleted",
        entity: "standing_session",
        entityId: String(id),
        metadata: { companyId: existing.companyId },
      });

      return res.json({ success: true });
    } catch (error) {
      console.error("[StandingSessions] Delete error:", error);
      return res.status(500).json({ error: "Failed to delete standing session" });
    }
  });

  // ──── GENERATE SLOTS ─────────────────────────────────────────────

  app.post("/api/standing-sessions/:id/generate", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const weeks = typeof req.body.weeks === "number" && req.body.weeks > 0 && req.body.weeks <= 12
        ? req.body.weeks
        : 4;

      const result = await generateSlotsFromStandingSession(id, weeks, req.session.userId);

      await storage.createAuditLog({
        actorUserId: req.session.userId!,
        action: "standing_session_generated",
        entity: "standing_session",
        entityId: String(id),
        metadata: { weeks, created: result.created, skipped: result.skipped },
      });

      return res.json(result);
    } catch (error) {
      console.error("[StandingSessions] Generate error:", error);
      const message = (error as Error).message || "Failed to generate slots";
      return res.status(500).json({ error: message });
    }
  });

  // ──── HELPER: list companies + service areas for the form ─────────

  app.get("/api/standing-sessions/options", requireRole("admin", "super_admin"), async (_req: Request, res: Response) => {
    try {
      const allCompanies = await db.select().from(companies).orderBy(companies.name);
      const allAreas = await db.select().from(serviceAreas).where(eq(serviceAreas.isActive, true)).orderBy(serviceAreas.name);
      return res.json({ companies: allCompanies, serviceAreas: allAreas, dayNames: DAY_NAMES });
    } catch (error) {
      console.error("[StandingSessions] Options error:", error);
      return res.status(500).json({ error: "Failed to fetch options" });
    }
  });
}
