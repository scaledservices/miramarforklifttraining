import { db } from "../db";
import { bookings, emailOutbox } from "@shared/schema";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { sendReviewRequestEmail } from "../email";
import { resolveLocale } from "../locale-resolver";

// Only send review requests for bookings completed within the last N days.
// This bounds the candidate query so ancient bookings age out.
export const REVIEW_REQUEST_MAX_AGE_DAYS = 7;

// Max candidate bookings examined per run.
const REVIEW_REQUEST_BATCH_SIZE = 200;

const DAY_MS = 24 * 60 * 60 * 1000;

// Template key written to email_outbox by sendReviewRequestEmail — the
// outbox is the dedupe source of truth (no schema change needed).
const REVIEW_REQUEST_TEMPLATE = "review_request";

/** True if a review request for this booking is already in the outbox. */
async function reviewRequestAlreadySent(bookingId: number): Promise<boolean> {
  const [existing] = await db
    .select({ id: emailOutbox.id })
    .from(emailOutbox)
    .where(
      and(
        eq(emailOutbox.template, REVIEW_REQUEST_TEMPLATE),
        sql`${emailOutbox.payload} ->> 'bookingId' = ${String(bookingId)}`
      )
    )
    .limit(1);
  return !!existing;
}

export async function runReviewRequestsJob(): Promise<void> {
  const now = Date.now();
  const oldestCutoff = new Date(now - REVIEW_REQUEST_MAX_AGE_DAYS * DAY_MS);

  // Query bookings where status='completed' AND createdAt is within last 7 days.
  // We use createdAt as a proxy for completion recency — the balance-reminders
  // job uses the same field. Bookings completed long ago are excluded.
  const candidates = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.status, "completed"),
        gt(bookings.createdAt, oldestCutoff),
        // Only send to bookings with a contact email (all have it per schema,
        // but this is a safety net for any null-level edge cases).
        sql`${bookings.contactEmail} IS NOT NULL AND ${bookings.contactEmail} != ''`
      )
    )
    .limit(REVIEW_REQUEST_BATCH_SIZE);

  let sent = 0;
  for (const booking of candidates) {
    try {
      if (await reviewRequestAlreadySent(booking.id)) continue;

      const locale = await resolveLocale({ userId: booking.userId });
      await sendReviewRequestEmail({
        to: booking.contactEmail,
        contactName: booking.contactName,
        bookingNumber: booking.bookingNumber,
        bookingId: booking.id,
        sessionDate: booking.sessionDate,
        locale,
      });
      sent++;
    } catch (err) {
      console.error(`[REVIEW REQUEST] Failed for booking ${booking.bookingNumber}:`, err);
    }
  }

  if (sent > 0) {
    console.log(`[REVIEW REQUEST] Sent ${sent} review request(s)`);
  }
}
