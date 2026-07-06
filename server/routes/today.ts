import type { Express, Request, Response } from "express";
import { db } from "../db";
import { asc, eq, gte, inArray } from "drizzle-orm";
import {
  bookings,
  serviceAreas,
  payments as paymentsTable,
  onsiteTrainingRequests,
  contacts,
  companies,
} from "@shared/schema";
import { requireRole } from "./middleware";

// All training happens in CA/NV — "today" means the Pacific-time calendar day.
function pacificDateString(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

// Paid-toward-training math mirrors getBookingFinance in server/routes/services.ts:
// card surcharges are processing fees, not payment toward the training price,
// so only the principal counts; refunds reduce the paid total.
function computePaidByOrder(rows: (typeof paymentsTable.$inferSelect)[]): Map<number, number> {
  const paidByOrder = new Map<number, number>();
  for (const p of rows) {
    let delta = 0;
    if (p.status === "approved") {
      const surcharge = Number((p.rawResponse as any)?.surcharge) || 0;
      delta = Number(p.amount) - surcharge;
    } else if (p.status === "refunded") {
      delta = -Number(p.amount);
    } else {
      continue;
    }
    paidByOrder.set(p.orderId, (paidByOrder.get(p.orderId) || 0) + delta);
  }
  return paidByOrder;
}

export function registerTodayRoutes(app: Express) {
  app.get("/api/admin/today", requireRole("admin", "super_admin"), async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const today = pacificDateString(now);
      const weekEnd = pacificDateString(new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000));
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // One pass over every booking that can matter to the operator today:
      // pending (needs confirming), confirmed (running/upcoming), completed
      // (may still owe money). Cancelled and no-show are out of scope.
      const bookingRows = await db
        .select({
          booking: bookings,
          areaName: serviceAreas.name,
        })
        .from(bookings)
        .leftJoin(serviceAreas, eq(bookings.serviceAreaId, serviceAreas.id))
        .where(inArray(bookings.status, ["pending", "confirmed", "completed"]));

      const orderIds = Array.from(
        new Set(bookingRows.map((r) => r.booking.orderId).filter((id): id is number => id != null)),
      );
      const paymentRows = orderIds.length
        ? await db.select().from(paymentsTable).where(inArray(paymentsTable.orderId, orderIds))
        : [];
      const paidByOrder = computePaidByOrder(paymentRows);

      const withFinance = bookingRows.map(({ booking, areaName }) => {
        const total = Number(booking.totalPrice);
        const paid = booking.orderId != null ? Math.round((paidByOrder.get(booking.orderId) || 0) * 100) / 100 : 0;
        const balanceDue = Math.max(0, Math.round((total - paid) * 100) / 100);
        return {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          status: booking.status,
          contactName: booking.contactName,
          contactPhone: booking.contactPhone,
          areaName: areaName || "Unknown area",
          productSlug: booking.productSlug,
          sessionDate: booking.sessionDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
          participantCount: booking.participantCount,
          address: `${booking.customerAddress}, ${booking.customerCity}`,
          total,
          paid,
          balanceDue,
          createdAt: booking.createdAt,
        };
      });

      const todaySessions = withFinance
        .filter((b) => b.sessionDate === today && (b.status === "confirmed" || b.status === "pending"))
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      const awaitingConfirmation = withFinance
        .filter((b) => b.status === "pending")
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      const unpaidBalances = withFinance
        .filter((b) => (b.status === "confirmed" || b.status === "completed") && b.balanceDue > 0.01)
        .sort((a, b) => (a.sessionDate || "").localeCompare(b.sessionDate || ""));

      // Week route view: today through six days out, grouped by date then area.
      const weekDays: {
        date: string;
        groups: { areaName: string; participants: number; revenue: number; bookingCount: number }[];
      }[] = [];
      const inWeek = withFinance.filter(
        (b) =>
          b.sessionDate >= today &&
          b.sessionDate <= weekEnd &&
          (b.status === "confirmed" || b.status === "pending"),
      );
      const byDate = new Map<string, typeof inWeek>();
      for (const b of inWeek) {
        const list = byDate.get(b.sessionDate) || [];
        list.push(b);
        byDate.set(b.sessionDate, list);
      }
      for (const date of Array.from(byDate.keys()).sort()) {
        const dayBookings = byDate.get(date)!;
        const byArea = new Map<string, { participants: number; revenue: number; bookingCount: number }>();
        for (const b of dayBookings) {
          const g = byArea.get(b.areaName) || { participants: 0, revenue: 0, bookingCount: 0 };
          g.participants += b.participantCount;
          g.revenue = Math.round((g.revenue + b.total) * 100) / 100;
          g.bookingCount += 1;
          byArea.set(b.areaName, g);
        }
        weekDays.push({
          date,
          groups: Array.from(byArea.entries()).map(([areaName, g]) => ({ areaName, ...g })),
        });
      }

      // New leads: onsite training requests plus CRM contacts from the last 7 days.
      const [requestRows, contactRows] = await Promise.all([
        db
          .select()
          .from(onsiteTrainingRequests)
          .where(gte(onsiteTrainingRequests.createdAt, sevenDaysAgo))
          .orderBy(asc(onsiteTrainingRequests.createdAt)),
        db
          .select({ contact: contacts, companyName: companies.name })
          .from(contacts)
          .leftJoin(companies, eq(contacts.companyId, companies.id))
          .where(gte(contacts.createdAt, sevenDaysAgo))
          .orderBy(asc(contacts.createdAt)),
      ]);

      const newLeads = [
        ...requestRows.map((r) => ({
          type: "onsite_request" as const,
          id: r.id,
          name: r.contactName,
          phone: r.phone,
          company: r.companyName || null,
          detail: `${r.traineeCount} trainees · ${r.city}, ${r.state}`,
          status: r.status,
          createdAt: r.createdAt,
        })),
        ...contactRows.map(({ contact, companyName }) => ({
          type: "contact" as const,
          id: contact.id,
          name: `${contact.firstName} ${contact.lastName}`.trim(),
          phone: contact.phone,
          company: companyName || null,
          detail: contact.title || null,
          status: null,
          createdAt: contact.createdAt,
        })),
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return res.json({
        date: today,
        todaySessions,
        awaitingConfirmation,
        unpaidBalances,
        week: weekDays,
        newLeads,
      });
    } catch (error) {
      console.error("[Today] Dashboard error:", error);
      return res.status(500).json({ error: "Failed to load today dashboard" });
    }
  });
}
