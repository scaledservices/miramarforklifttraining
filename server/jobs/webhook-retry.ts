import { db } from "../db";
import { webhookEvents } from "@shared/schema";
import { eq, and, lt, sql, or, isNull } from "drizzle-orm";
import { WEBHOOK_BACKOFF_MINUTES, WEBHOOK_MAX_RETRIES } from "../constants";
import { processWebhookEvent } from "../payments";

export async function runWebhookRetryJob(): Promise<void> {
  const now = new Date();

  const failedEvents = await db.select().from(webhookEvents)
    .where(
      and(
        eq(webhookEvents.status, "failed"),
        lt(webhookEvents.retryCount, WEBHOOK_MAX_RETRIES)
      )
    )
    .limit(20);

  for (const event of failedEvents) {
    const backoffMinutes = WEBHOOK_BACKOFF_MINUTES[Math.min(event.retryCount, WEBHOOK_BACKOFF_MINUTES.length - 1)];
    const lastAttempt = event.lastAttemptedAt || event.createdAt;
    if (!lastAttempt) continue;

    const eligibleAfter = new Date(new Date(lastAttempt).getTime() + backoffMinutes * 60 * 1000);
    if (now < eligibleAfter) continue;

    try {
      await db.update(webhookEvents).set({
        retryCount: event.retryCount + 1,
        lastAttemptedAt: now,
        updatedAt: now,
      }).where(eq(webhookEvents.id, event.id));

      await processWebhookEvent(event.eventId, event.payload);
    } catch (err: any) {
      await db.update(webhookEvents).set({
        lastError: err.message,
        updatedAt: now,
      }).where(eq(webhookEvents.id, event.id));

      console.error(`[WEBHOOK RETRY] Failed for event ${event.eventId}:`, err);
    }
  }
}
