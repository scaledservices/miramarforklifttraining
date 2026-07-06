import { db } from "../db";
import { certifications, courses, emailOutbox, users } from "@shared/schema";
import { and, eq, isNotNull, lte, gte, sql } from "drizzle-orm";
import { sendRecertReminderEmail } from "../email";
import { resolveLocale } from "../locale-resolver";

// Days before cert expiry at which a recert reminder email goes out.
// Each threshold is sent at most once per cert (deduped via email_outbox).
export const RECERT_REMINDER_DAYS = [90, 60, 30] as const;

// Max candidate certifications examined per run.
const RECERT_REMINDER_BATCH_SIZE = 200;

// Template key written to email_outbox by sendRecertReminderEmail — the
// outbox is the dedupe source of truth (no schema change needed).
const RECERT_REMINDER_TEMPLATE = "recert_reminder";

const DAY_MS = 24 * 60 * 60 * 1000;

/** True if a reminder for this cert + threshold is already in the outbox. */
async function reminderAlreadySent(certId: number, reminderDay: number): Promise<boolean> {
  const [existing] = await db
    .select({ id: emailOutbox.id })
    .from(emailOutbox)
    .where(
      and(
        eq(emailOutbox.template, RECERT_REMINDER_TEMPLATE),
        sql`${emailOutbox.payload} ->> 'certId' = ${String(certId)}`,
        sql`${emailOutbox.payload} ->> 'reminderDay' = ${String(reminderDay)}`
      )
    )
    .limit(1);
  return !!existing;
}

export async function runRecertRemindersJob(): Promise<void> {
  const now = Date.now();
  const ninetyDaysFromNow = new Date(now + 90 * DAY_MS);

  // Query certifications where status='issued' AND expiresAt IS NOT NULL
  // AND expiresAt is within 90 days (and not already expired).
  const candidates = await db
    .select({
      id: certifications.id,
      certificateNumber: certifications.certificateNumber,
      userId: certifications.userId,
      courseId: certifications.courseId,
      expiresAt: certifications.expiresAt,
    })
    .from(certifications)
    .where(
      and(
        eq(certifications.status, "issued"),
        isNotNull(certifications.expiresAt),
        lte(certifications.expiresAt, ninetyDaysFromNow),
        gte(certifications.expiresAt, new Date(now))
      )
    )
    .limit(RECERT_REMINDER_BATCH_SIZE);

  let sent = 0;
  for (const cert of candidates) {
    try {
      const daysUntilExpiry = Math.ceil(
        (new Date(cert.expiresAt!).getTime() - now) / DAY_MS
      );

      // Find all thresholds that are due (daysUntilExpiry <= threshold).
      // Only the most recent due threshold is considered — if the scheduler
      // was down and earlier thresholds were missed, they are skipped rather
      // than delivered late in a burst.
      const dueThresholds = RECERT_REMINDER_DAYS.filter((d) => d >= daysUntilExpiry);
      if (dueThresholds.length === 0) continue;

      const reminderDay = Math.min(...dueThresholds);

      if (await reminderAlreadySent(cert.id, reminderDay)) continue;

      // Fetch user info for the cert holder.
      const [user] = await db
        .select({
          email: users.email,
          name: users.name,
          locale: users.locale,
        })
        .from(users)
        .where(eq(users.id, cert.userId))
        .limit(1);
      if (!user) continue;

      // Fetch course title.
      const [course] = await db
        .select({ title: courses.title })
        .from(courses)
        .where(eq(courses.id, cert.courseId))
        .limit(1);

      const locale = await resolveLocale({ userId: cert.userId });
      await sendRecertReminderEmail({
        to: user.email,
        certHolderName: user.name,
        certificateNumber: cert.certificateNumber,
        courseName: course?.title || "",
        expiresAt: cert.expiresAt!,
        certId: cert.id,
        reminderDay,
        locale,
      });
      sent++;
    } catch (err) {
      console.error(`[RECERT REMINDER] Failed for cert ${cert.certificateNumber}:`, err);
    }
  }

  if (sent > 0) {
    console.log(`[RECERT REMINDER] Sent ${sent} recert reminder(s)`);
  }
}
