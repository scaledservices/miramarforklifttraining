import { lt } from "drizzle-orm";
import { db } from "../db";
import { systemLogs } from "@shared/schema";
import { logger } from "../monitoring";

const RETENTION_DAYS = 30;

/** Deletes system_logs rows older than 30 days. Cheap: indexed on created_at. */
export async function runLogCleanupJob(): Promise<void> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const deleted = await db.delete(systemLogs).where(lt(systemLogs.createdAt, cutoff)).returning({ id: systemLogs.id });
  if (deleted.length > 0) {
    logger.info(`Log cleanup removed ${deleted.length} entries older than ${RETENTION_DAYS} days`, {
      source: "job",
      consoleOnly: true,
    });
  }
}
