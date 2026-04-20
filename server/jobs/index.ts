import { JOB_SCHEDULER_INTERVAL_MS } from "../constants";
import { runAbandonedCheckoutJob } from "./abandoned-checkout";
import { runWebhookRetryJob } from "./webhook-retry";
import { db } from "../db";
import { sql } from "drizzle-orm";
import crypto from "crypto";

function jobLockKey(jobName: string): string {
  const hash = crypto.createHash("sha256").update(jobName).digest();
  const bigint = hash.readBigInt64BE(0);
  return bigint.toString();
}

async function tryAdvisoryLock(key: string): Promise<boolean> {
  const result = await db.execute(sql`SELECT pg_try_advisory_lock(${sql.raw(key)}) AS locked`);
  return (result as any)[0]?.locked === true;
}

async function releaseAdvisoryLock(key: string): Promise<void> {
  await db.execute(sql`SELECT pg_advisory_unlock(${sql.raw(key)})`);
}

async function runWithLock(jobName: string, fn: () => Promise<void>): Promise<void> {
  const key = jobLockKey(jobName);
  const acquired = await tryAdvisoryLock(key);
  if (!acquired) {
    return;
  }
  try {
    await fn();
  } catch (err) {
    console.error(`[JOB] ${jobName} failed:`, err);
  } finally {
    await releaseAdvisoryLock(key);
  }
}

async function runAllJobs() {
  await runWithLock("abandoned_checkout", runAbandonedCheckoutJob);
  await runWithLock("webhook_retry", runWebhookRetryJob);
}

export function startJobScheduler() {
  const enabled = process.env.JOB_SCHEDULER_ENABLED;
  if (enabled !== "true") {
    console.log("[JOB SCHEDULER] Disabled (set JOB_SCHEDULER_ENABLED=true to enable)");
    return;
  }

  console.log("[JOB SCHEDULER] Starting with interval:", JOB_SCHEDULER_INTERVAL_MS, "ms");
  setInterval(runAllJobs, JOB_SCHEDULER_INTERVAL_MS);
  setTimeout(runAllJobs, 5000);
}
