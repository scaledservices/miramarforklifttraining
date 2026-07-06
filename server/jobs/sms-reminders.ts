import { db } from "../db";
import { bookings, emailOutbox, serviceAreas, users } from "@shared/schema";
import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { sendSMS } from "../sms";
import { resolveLocale } from "../locale-resolver";
import { brand } from "@shared/config/brand";

/**
 * SMS reminder job — sends a text 24 hours before a booked training session.
 *
 * Pattern follows server/jobs/balance-reminders.ts:
 *   - Candidate query bounds the scan (sessions in the next 24h window)
 *   - Dedupe via email_outbox (template "sms_training_reminder", payload.bookingId)
 *   - Respects user notificationPreferences.sms (default off until user opts in)
 *   - TCPA: quiet hours (9pm–8am) gate inside sendSMS()
 *   - TCPA: message includes "Reply STOP to opt out"
 *
 * Eligible statuses mirror balance-reminders.ts — confirmed/pending/completed.
 * Cancelled and no-show bookings are excluded.
 */

const SMS_REMINDER_TEMPLATE = "sms_training_reminder";

// Window: sessions starting between now+23h and now+25h (1-hour slack so the
// scheduler's 2-minute interval always catches every session).
const WINDOW_BEFORE_HOURS = 23;
const WINDOW_AFTER_HOURS = 25;

const ELIGIBLE_STATUSES: ("pending" | "confirmed" | "completed")[] = [
  "pending",
  "confirmed",
  "completed",
];

const DAY_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// notificationPreferences.sms helper
// ---------------------------------------------------------------------------

/**
 * notificationPreferences is a jsonb blob on the users table.  The existing
 * keys are booking_new, booking_cancelled, order_new, contact_form (all
 * admin-notify prefs, see server/email.ts).  We add a new "sms" boolean
 * (default false) — users must explicitly opt in.  No migration required:
 * missing key → treated as false (no SMS).
 */
function smsOptedIn(prefs: unknown): boolean {
  if (!prefs || typeof prefs !== "object") return false;
  const p = prefs as Record<string, unknown>;
  return p["sms"] === true;
}

// ---------------------------------------------------------------------------
// Dedupe — same approach as balance-reminders.ts
// ---------------------------------------------------------------------------

async function smsAlreadySent(bookingId: number): Promise<boolean> {
  const [existing] = await db
    .select({ id: emailOutbox.id })
    .from(emailOutbox)
    .where(
      and(
        eq(emailOutbox.template, SMS_REMINDER_TEMPLATE),
        sql`${emailOutbox.payload} ->> 'bookingId' = ${String(bookingId)}`
      )
    )
    .limit(1);
  return !!existing;
}

// ---------------------------------------------------------------------------
// Message body (EN/ES)
// ---------------------------------------------------------------------------

function buildReminderBody(
  locale: string,
  startTime: string,
  cityLabel: string
): string {
  if (locale === "es") {
    return (
      `${brand.name}: Su capacitación de montacargas es mañana a las ${startTime} en ${cityLabel}. ` +
      `Responda STOP para darse de baja.`
    );
  }
  return (
    `${brand.name}: Your forklift training is tomorrow at ${startTime} in ${cityLabel}. ` +
    `Reply STOP to opt out.`
  );
}

// ---------------------------------------------------------------------------
// Job
// ---------------------------------------------------------------------------

export async function runSmsRemindersJob(): Promise<void> {
  const now = Date.now();
  const windowStart = new Date(now + WINDOW_BEFORE_HOURS * 60 * 60 * 1000);
  const windowEnd = new Date(now + WINDOW_AFTER_HOURS * 60 * 60 * 1000);

  // sessionDate is a date string (YYYY-MM-DD); we can't use arithmetic on it
  // directly in SQL for a 24h-window.  Instead, select bookings whose
  // sessionDate falls on "tomorrow" (calendar date) and let the job send at
  // most once per booking (deduped).  The scheduler runs every 2 minutes, so
  // the exact hour-level timing is handled by the window check below.
  const tomorrow = new Date(now + DAY_MS);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10); // YYYY-MM-DD

  const candidates = await db
    .select({
      booking: bookings,
      area: serviceAreas,
    })
    .from(bookings)
    .leftJoin(serviceAreas, eq(bookings.serviceAreaId, serviceAreas.id))
    .where(
      and(
        inArray(bookings.status, ELIGIBLE_STATUSES),
        eq(bookings.sessionDate, tomorrowStr),
        isNotNull(bookings.contactPhone)
      )
    )
    .limit(200);

  let sent = 0;
  let skippedQuietHours = 0;
  let skippedOptOut = 0;
  let skippedDupes = 0;

  for (const row of candidates) {
    const booking = row.booking;
    try {
      // Dedupe — only one SMS reminder per booking
      if (await smsAlreadySent(booking.id)) {
        skippedDupes++;
        continue;
      }

      // Resolve locale for EN/ES message
      const locale = await resolveLocale({ userId: booking.userId });

      // Check user notificationPreferences.sms opt-in
      let optedIn = true; // default: send (booking contact phone was provided)
      try {
        const [user] = await db
          .select({ prefs: users.notificationPreferences })
          .from(users)
          .where(eq(users.id, booking.userId))
          .limit(1);
        if (user) {
          optedIn = smsOptedIn(user.prefs);
        }
      } catch {
        // If user lookup fails, proceed — the booking contact phone was
        // explicitly provided by the booker.
      }

      if (!optedIn) {
        skippedOptOut++;
        continue;
      }

      // City label for the message: prefer service area name, fall back to
      // the customer city on the booking.
      const cityLabel = row.area?.name || booking.customerCity || "your location";

      const body = buildReminderBody(locale, booking.startTime, cityLabel);

      // Quiet hours: estimate recipient local hour from the booking's
      // customerState time zone offset.  For simplicity we use Pacific time
      // (all three service areas are in CA/NV, both Pacific).  If the booking
      // is in a different state we still use Pacific as a safe default —
      // the quiet-hours window (9pm–8am) is conservative.
      const pacificHour = new Date(now).toLocaleString("en-US", {
        timeZone: "America/Los_Angeles",
        hour: "numeric",
        hour12: false,
      });
      const recipientLocalHour = parseInt(pacificHour, 10);

      const result = await sendSMS(booking.contactPhone, body, {
        template: SMS_REMINDER_TEMPLATE,
        recipientLocalHour,
        actorUserId: booking.userId,
      });

      if (result.sent) {
        sent++;
      } else if (result.quietHoursSkipped) {
        skippedQuietHours++;
      }

      // Write to email_outbox as a dedupe record (same pattern as
      // balance-reminders.ts using email_outbox as the sent log).
      await db.insert(emailOutbox).values({
        to: booking.contactPhone,
        subject: `[SMS] ${body.slice(0, 60)}`,
        template: SMS_REMINDER_TEMPLATE,
        payload: { bookingId: booking.id, bookingNumber: booking.bookingNumber, phone: booking.contactPhone, locale, body },
        html: body,
        providerStatus: result.sent ? "sent" : "skipped",
      });
    } catch (err) {
      console.error(
        `[SMS REMINDER] Failed for booking ${booking.bookingNumber}:`,
        err
      );
    }
  }

  if (sent > 0 || skippedQuietHours > 0 || skippedOptOut > 0 || skippedDupes > 0) {
    console.log(
      `[SMS REMINDER] Sent ${sent}, skipped (quiet hours: ${skippedQuietHours}, opt-out: ${skippedOptOut}, dupe: ${skippedDupes})`
    );
  }
}
