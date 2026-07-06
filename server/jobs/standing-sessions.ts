import { db } from "../db";
import { standingSessions } from "@shared/schema";
import { eq } from "drizzle-orm";
import { generateSlotsFromStandingSession } from "../routes/standing-sessions";

// Auto-generate slots 1 week ahead for active standing sessions.
// Runs daily via the job scheduler. Generates just 1 week so that
// slots are created incrementally (not all at once) and can be
// reviewed/edited before the booking window opens.
const AUTO_GENERATE_WEEKS = 1;
const BATCH_LIMIT = 100;

export async function runStandingSessionsJob(): Promise<void> {
  // Only process active standing sessions
  const sessions = await db
    .select()
    .from(standingSessions)
    .where(eq(standingSessions.status, "active"))
    .limit(BATCH_LIMIT);

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const ss of sessions) {
    try {
      const result = await generateSlotsFromStandingSession(ss.id, AUTO_GENERATE_WEEKS);
      totalCreated += result.created;
      totalSkipped += result.skipped;
    } catch (err) {
      console.error(`[STANDING SESSIONS] Failed to generate for session #${ss.id}:`, err);
    }
  }

  if (totalCreated > 0 || totalSkipped > 0) {
    console.log(
      `[STANDING SESSIONS] Processed ${sessions.length} session(s): ` +
      `${totalCreated} booking(s) created, ${totalSkipped} skipped`
    );
  }
}
