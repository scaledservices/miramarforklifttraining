import { db } from "../db";
import { bookings, emailOutbox } from "@shared/schema";
import { and, eq, gt, inArray, isNotNull, lt, sql } from "drizzle-orm";
import { storage } from "../storage";
import { sendBalanceReminderEmail } from "../email";
import { resolveLocale } from "../locale-resolver";

// Days after booking creation at which a balance reminder email goes out.
// Each threshold is sent at most once per booking (deduped via email_outbox).
export const BALANCE_REMINDER_DAYS = [3, 7, 14] as const;

// Stop reminding once a booking is older than this — bounds the candidate
// query so ancient bookings age out instead of being re-scanned forever.
export const BALANCE_REMINDER_MAX_AGE_DAYS = 30;

// Max candidate bookings examined per run.
const BALANCE_REMINDER_BATCH_SIZE = 200;

// Template key written to email_outbox by sendBalanceReminderEmail — the
// outbox is the dedupe source of truth (no schema change needed).
const BALANCE_REMINDER_TEMPLATE = "balance_reminder";

// Bookings that can still owe money. Completed bookings with an unpaid
// balance still owe it, so "completed" is included. Cancelled and no-show
// bookings are excluded.
const ELIGIBLE_STATUSES: ("pending" | "confirmed" | "completed")[] = ["pending", "confirmed", "completed"];

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Compute the outstanding balance for a booking.
 *
 * Replicates getBookingFinance in server/routes/services.ts (not exported
 * from there, and routes must not be edited): approved payments count only
 * their principal — the card surcharge stored in rawResponse.surcharge is a
 * processing fee, not payment toward the training price — and refunded
 * payments reduce the paid total.
 */
async function computeBalanceDue(orderId: number, totalPrice: string | number): Promise<number> {
  const payments = await storage.getPaymentsByOrder(orderId);
  let paid = payments
    .filter((p) => p.status === "approved")
    .reduce((sum, p) => {
      const surcharge = Number((p.rawResponse as any)?.surcharge) || 0;
      return sum + Number(p.amount) - surcharge;
    }, 0);
  paid -= payments
    .filter((p) => p.status === "refunded")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  return Math.max(0, Math.round((Number(totalPrice) - paid) * 100) / 100);
}

/** True if a reminder for this booking + threshold is already in the outbox. */
async function reminderAlreadySent(bookingId: number, reminderDay: number): Promise<boolean> {
  const [existing] = await db
    .select({ id: emailOutbox.id })
    .from(emailOutbox)
    .where(
      and(
        eq(emailOutbox.template, BALANCE_REMINDER_TEMPLATE),
        sql`${emailOutbox.payload} ->> 'bookingId' = ${String(bookingId)}`,
        sql`${emailOutbox.payload} ->> 'reminderDay' = ${String(reminderDay)}`
      )
    )
    .limit(1);
  return !!existing;
}

export async function runBalanceRemindersJob(): Promise<void> {
  const now = Date.now();
  const minDays = Math.min(...BALANCE_REMINDER_DAYS);
  const newestCutoff = new Date(now - minDays * DAY_MS);
  const oldestCutoff = new Date(now - BALANCE_REMINDER_MAX_AGE_DAYS * DAY_MS);

  const candidates = await db
    .select()
    .from(bookings)
    .where(
      and(
        inArray(bookings.status, ELIGIBLE_STATUSES),
        isNotNull(bookings.orderId),
        lt(bookings.createdAt, newestCutoff),
        gt(bookings.createdAt, oldestCutoff)
      )
    )
    .limit(BALANCE_REMINDER_BATCH_SIZE);

  let sent = 0;
  for (const booking of candidates) {
    try {
      const ageDays = Math.floor((now - new Date(booking.createdAt).getTime()) / DAY_MS);
      const dueThresholds = BALANCE_REMINDER_DAYS.filter((d) => d <= ageDays);
      if (dueThresholds.length === 0) continue;

      // Only the most recent due threshold is considered — if the scheduler
      // was down and earlier thresholds were missed, they are skipped rather
      // than delivered late in a burst.
      const reminderDay = Math.max(...dueThresholds);

      if (await reminderAlreadySent(booking.id, reminderDay)) continue;

      const balanceDue = await computeBalanceDue(booking.orderId!, booking.totalPrice);
      // Skip fully paid (or over-paid) bookings; 1 cent tolerance matches the
      // "no balance due" check used by the admin balance routes.
      if (balanceDue <= 0.01) continue;

      const locale = await resolveLocale({ userId: booking.userId });
      await sendBalanceReminderEmail({
        to: booking.contactEmail,
        contactName: booking.contactName,
        bookingNumber: booking.bookingNumber,
        bookingId: booking.id,
        balanceDue,
        sessionDate: booking.sessionDate,
        reminderDay,
        locale,
      });
      sent++;
    } catch (err) {
      console.error(`[BALANCE REMINDER] Failed for booking ${booking.bookingNumber}:`, err);
    }
  }

  if (sent > 0) {
    console.log(`[BALANCE REMINDER] Sent ${sent} balance reminder(s)`);
  }
}
