import type { Express, Request, Response } from "express";
import { eq, sql, desc, count, sum } from "drizzle-orm";
import { db } from "../db";
import {
  referralCodes,
  referralRedemptions,
  discountCodes,
  users,
} from "@shared/schema";
import { requireAuth, requireRole } from "./middleware";
import { storage } from "../storage";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const REFERRAL_DISCOUNT_PERCENT = 10; // referred user gets 10% off
const REFERRER_CREDIT_DOLLARS = 50; // referrer gets $50 credit after first booking
const MAX_REFERRAL_REDEMPTIONS = 100; // per referral code

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomSuffix(len = 3): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function slugifyName(name: string): string {
  const cleaned = name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .trim()
    .replace(/\s+/g, "");
  return cleaned.slice(0, 10) || "USER";
}

function buildReferralCode(name: string): string {
  return `MIR-${slugifyName(name)}-${randomSuffix(3)}`;
}

async function generateUniqueReferralCode(name: string): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = buildReferralCode(name);
    const existing = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.code, code));
    if (existing.length === 0) return code;
  }
  // Fallback with longer suffix
  return `MIR-${slugifyName(name)}-${randomSuffix(5)}`;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export function registerReferralRoutes(app: Express) {
  /**
   * POST /api/referrals/generate
   * Auth required. Generates a unique referral code for the current user and
   * links it to an auto-created 10%-off discount code.
   */
  app.post(
    "/api/referrals/generate",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session.userId!;
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        // Check if user already has a referral code
        const existing = await db
          .select()
          .from(referralCodes)
          .where(eq(referralCodes.userId, userId));

        if (existing.length > 0) {
          // Return the existing one — idempotent
          return res.json({ referralCode: existing[0] });
        }

        const referralCodeStr = await generateUniqueReferralCode(user.name);
        const discountCodeStr = `REF-${referralCodeStr}`;

        // Create the linked discount code (10% off, active, max redemptions)
        const [discountCode] = await db
          .insert(discountCodes)
          .values({
            code: discountCodeStr,
            description: `Referral discount for ${referralCodeStr}`,
            discountType: "percent",
            amount: String(REFERRAL_DISCOUNT_PERCENT),
            active: true,
            maxRedemptions: MAX_REFERRAL_REDEMPTIONS,
          })
          .returning();

        // Check if this user was referred by someone (referredBy link)
        // For now, null — the referredBy link is set when a redemption occurs
        // and the referred user later generates their own code.
        const [referralCode] = await db
          .insert(referralCodes)
          .values({
            userId,
            code: referralCodeStr,
            discountCodeId: discountCode.id,
            referredBy: null,
          })
          .returning();

        return res.status(201).json({ referralCode });
      } catch (error) {
        console.error("[Referrals] Generate error:", error);
        return res.status(500).json({ error: "Failed to generate referral code" });
      }
    }
  );

  /**
   * GET /api/referrals/mine
   * Auth required. Returns the current user's referral code + redemption
   * count + total savings credited.
   */
  app.get(
    "/api/referrals/mine",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session.userId!;
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        const rows = await db
          .select()
          .from(referralCodes)
          .where(eq(referralCodes.userId, userId));

        const referralCode = rows[0];
        if (!referralCode) {
          return res.json({
            referralCode: null,
            redemptionCount: 0,
            totalSavings: 0,
            referrerCreditDollars: REFERRER_CREDIT_DOLLARS,
            referredDiscountPercent: REFERRAL_DISCOUNT_PERCENT,
          });
        }

        // Count redemptions for this referral code
        const [stats] = await db
          .select({
            redemptionCount: count(),
          })
          .from(referralRedemptions)
          .where(eq(referralRedemptions.referralCodeId, referralCode.id));

        // Sum total discount amounts across all redemptions (savings given to referred users)
        const discountRows = await db
          .select({
            totalDiscounted: sql<string>`coalesce(sum(${referralRedemptions.discountCodeId}), 0)`,
          })
          .from(referralRedemptions)
          .where(eq(referralRedemptions.referralCodeId, referralCode.id));

        // Get actual discount amounts via the linked discount code redemptions
        // Simpler approach: sum amountDiscounted from discountRedemptions for the linked discount code
        const savingsRows = await db.execute(sql`
          SELECT coalesce(sum(dr.amount_discounted), 0)::text as total_savings
          FROM discount_redemptions dr
          WHERE dr.code_id = ${referralCode.discountCodeId}
        `) as unknown as { rows: { total_savings: string }[] };

        const totalSavings = Number(savingsRows.rows[0]?.total_savings ?? 0);

        return res.json({
          referralCode,
          redemptionCount: Number(stats?.redemptionCount ?? 0),
          totalSavings,
          referrerCreditDollars: REFERRER_CREDIT_DOLLARS,
          referredDiscountPercent: REFERRAL_DISCOUNT_PERCENT,
        });
      } catch (error) {
        console.error("[Referrals] Mine error:", error);
        return res.status(500).json({ error: "Failed to load referral data" });
      }
    }
  );

  /**
   * GET /api/referrals/stats
   * Admin/super_admin only. Returns all referral codes with redemption
   * counts, total savings, and the linked user info.
   */
  app.get(
    "/api/referrals/stats",
    requireRole("admin", "super_admin"),
    async (_req: Request, res: Response) => {
      try {
        const rows = await db
          .select({
            referralCode: referralCodes,
            user: {
              id: users.id,
              name: users.name,
              email: users.email,
            },
            redemptionCount: sql<number>`count(${referralRedemptions.id})::int`,
          })
          .from(referralCodes)
          .leftJoin(users, eq(users.id, referralCodes.userId))
          .leftJoin(
            referralRedemptions,
            eq(referralRedemptions.referralCodeId, referralCodes.id)
          )
          .groupBy(referralCodes.id, users.id, users.name, users.email)
          .orderBy(desc(referralCodes.createdAt));

        return res.json({
          referrals: rows.map((r) => ({
            ...r.referralCode,
            user: r.user,
            redemptionCount: Number(r.redemptionCount ?? 0),
          })),
        });
      } catch (error) {
        console.error("[Referrals] Stats error:", error);
        return res.status(500).json({ error: "Failed to load referral stats" });
      }
    }
  );
}
