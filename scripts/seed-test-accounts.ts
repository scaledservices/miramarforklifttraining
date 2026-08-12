import bcrypt from "bcryptjs";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

/**
 * Safe test-account seeder for QA (Alberto 2026-08-11 demo fallout).
 *
 * Unlike scripts/demo-seed.ts, this NEVER wipes data. It upserts a fixed set
 * of test users by email (idempotent - safe to re-run) so the on-screen
 * account switcher and direct logins work on staging and local. All accounts
 * share one demo password. These exist so Alberto/Peter can click through
 * every role without creating real accounts.
 *
 * Run:  npx tsx scripts/seed-test-accounts.ts
 * (DATABASE_URL decides the target - local .env locally, or the staging
 *  public URL when run via the staging connection.)
 */

const DEMO_PASSWORD = process.env.TEST_ACCOUNT_PASSWORD || "DemoPass!234";

interface TestAccount {
  email: string;
  name: string;
  role: "individual" | "certified_student" | "instructor" | "group_admin" | "admin" | "super_admin";
  phone?: string;
}

const ACCOUNTS: TestAccount[] = [
  // Alberto's real admin login (requested: training@miramarforklift.com, super_admin)
  { email: "training@miramarforklift.com", name: "Alberto Rawlins", role: "super_admin", phone: "(858) 901-0149" },
  // Generic super-admin for QA
  { email: "admin@miramarforklift.com", name: "Alex Admin", role: "super_admin" },
  // Crew / company admin buying multi-seat training
  { email: "group@miramarforklift.com", name: "Grace GroupAdmin", role: "group_admin" },
  // Individual first-time student
  { email: "user@miramarforklift.com", name: "Ulysses User", role: "individual" },
  // Crew member (no purchases yet)
  { email: "member1@miramarforklift.com", name: "Mike Member", role: "individual" },
  // Already-certified student (renewal / dashboard-cert flows)
  { email: "certified@miramarforklift.com", name: "Clara Certified", role: "certified_student" },
];

export async function seedTestAccounts() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  console.log(`[Seed Test Accounts] Upserting ${ACCOUNTS.length} accounts (password: ${DEMO_PASSWORD === "DemoPass!234" ? "DemoPass!234" : "custom"})...`);

  for (const acct of ACCOUNTS) {
    const existing = await db.select().from(users).where(eq(users.email, acct.email)).limit(1);
    if (existing.length > 0) {
      await db.update(users)
        .set({ passwordHash, name: acct.name, role: acct.role, phone: acct.phone ?? existing[0].phone })
        .where(eq(users.email, acct.email));
      console.log(`  Updated: ${acct.email} (${acct.role})`);
    } else {
      await db.insert(users).values({
        email: acct.email,
        passwordHash,
        name: acct.name,
        role: acct.role,
        phone: acct.phone ?? null,
      });
      console.log(`  Created: ${acct.email} (${acct.role})`);
    }
  }
  console.log("[Seed Test Accounts] Done.");
}

// Run directly
seedTestAccounts()
  .then(() => process.exit(0))
  .catch((err) => { console.error("[Seed Test Accounts] FAILED:", err); process.exit(1); });
