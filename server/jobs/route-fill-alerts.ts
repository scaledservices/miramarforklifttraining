import { db } from "../db";
import { bookings, emailOutbox, serviceAreas, users } from "@shared/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { storage } from "../storage";
import { sendRouteFillAlertEmail } from "../email";

// Look-ahead window: bookings with sessions in the next N days.
const ROUTE_FILL_LOOKAHEAD_DAYS = 7;

// Only alert when a session has at least this many open seats.
const ROUTE_FILL_MIN_OPEN_SEATS = 2;

// Max candidate bookings examined per run.
const ROUTE_FILL_BATCH_SIZE = 200;

// Template key written to email_outbox — the outbox is the dedupe source of
// truth (one alert per booking per day, no schema change needed).
const ROUTE_FILL_TEMPLATE = "route_fill_alert";

// Admin roles that should receive route-fill alerts.
const ADMIN_ROLES = ["admin", "super_admin"];

/** True if an alert for this booking was already sent today. */
async function alertAlreadySentToday(bookingId: number, sessionDate: string): Promise<boolean> {
  // One alert per booking per day — check outbox for rows created today.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [existing] = await db
    .select({ id: emailOutbox.id })
    .from(emailOutbox)
    .where(
      and(
        eq(emailOutbox.template, ROUTE_FILL_TEMPLATE),
        sql`${emailOutbox.payload} ->> 'bookingId' = ${String(bookingId)}`,
        sql`${emailOutbox.payload} ->> 'sessionDate' = ${sessionDate}`,
        gte(emailOutbox.createdAt, todayStart)
      )
    )
    .limit(1);
  return !!existing;
}

/** Fetch admin/super_admin users who should receive route-fill alerts. */
async function getAdminEmails(): Promise<string[]> {
  const admins = await db
    .select({ email: users.email })
    .from(users)
    .where(sql`${users.role} = ANY(${ADMIN_ROLES})`);
  return admins.map((a) => a.email).filter(Boolean);
}

export async function runRouteFillAlertsJob(): Promise<void> {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const horizon = new Date(now.getTime() + ROUTE_FILL_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000);
  const horizonStr = horizon.toISOString().split("T")[0];

  // Find confirmed/completed bookings with sessions in the next 7 days.
  const candidates = await db
    .select({
      booking: bookings,
      serviceArea: serviceAreas,
    })
    .from(bookings)
    .innerJoin(serviceAreas, eq(bookings.serviceAreaId, serviceAreas.id))
    .where(
      and(
        sql`${bookings.status} IN ('confirmed', 'completed')`,
        gte(bookings.sessionDate, todayStr),
        lte(bookings.sessionDate, horizonStr)
      )
    )
    .limit(ROUTE_FILL_BATCH_SIZE);

  if (candidates.length === 0) return;

  // Only fetch admin emails once per run.
  const adminEmails = await getAdminEmails();
  if (adminEmails.length === 0) {
    console.log("[ROUTE FILL] No admin/super_admin users found — skipping");
    return;
  }

  let sent = 0;
  for (const { booking, serviceArea } of candidates) {
    try {
      // Dedupe: one alert per booking per day.
      if (await alertAlreadySentToday(booking.id, booking.sessionDate)) continue;

      // Compute open seats: maxParticipants from the service area availability
      // rules vs the total booked participants for this slot.
      const rules = (serviceArea.availabilityRules as any) || {};
      const maxParticipants: number = Number(rules.maxParticipants) || 0;
      if (maxParticipants <= 0) continue;

      const booked = await storage.getBookedParticipants(
        booking.serviceAreaId,
        booking.sessionDate,
        booking.startTime
      );
      const openSeats = maxParticipants - booked;
      if (openSeats < ROUTE_FILL_MIN_OPEN_SEATS) continue;

      // Send alert to each admin.
      for (const adminEmail of adminEmails) {
        await sendRouteFillAlertEmail({
          to: adminEmail,
          bookingNumber: booking.bookingNumber,
          bookingId: booking.id,
          sessionDate: booking.sessionDate,
          startTime: booking.startTime,
          areaName: serviceArea.name,
          openSeats,
          bookedSeats: booked,
          maxParticipants,
        });
      }
      sent++;
    } catch (err) {
      console.error(`[ROUTE FILL] Failed for booking ${booking.bookingNumber}:`, err);
    }
  }

  if (sent > 0) {
    console.log(`[ROUTE FILL] Sent ${sent} route fill alert(s)`);
  }
}
