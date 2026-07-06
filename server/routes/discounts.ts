import type { Express, Request, Response } from "express";
import { z } from "zod";
import { eq, sql, desc } from "drizzle-orm";
import { db } from "../db";
import { discountCodes, discountRedemptions, type DiscountCode } from "@shared/schema";
import { requireRole } from "./middleware";
import { rateLimit } from "../rate-limit";

const validateLimiter = rateLimit({ name: "discount_validate", windowMs: 60_000, max: 20 });

// ---------------------------------------------------------------------------
// Reusable helpers (designed so the booking flow can import these later)
// ---------------------------------------------------------------------------

export type DiscountValidationResult =
  | { valid: true; code: DiscountCode }
  | { valid: false; reason: string };

/**
 * Validate a discount code string against active/window/max-redemption rules.
 * Returns the full code row on success so callers can compute the discount.
 */
export async function validateDiscountCode(rawCode: string): Promise<DiscountValidationResult> {
  const normalized = String(rawCode || "").trim().toUpperCase();
  if (!normalized) return { valid: false, reason: "No code provided" };

  const rows = await db.select().from(discountCodes).where(eq(discountCodes.code, normalized));
  const code = rows[0];
  if (!code) return { valid: false, reason: "Code not found" };
  if (!code.active) return { valid: false, reason: "This code is no longer active" };

  const now = new Date();
  if (code.startsAt && now < code.startsAt) return { valid: false, reason: "This code is not active yet" };
  if (code.endsAt && now > code.endsAt) return { valid: false, reason: "This code has expired" };

  if (code.maxRedemptions != null) {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(discountRedemptions)
      .where(eq(discountRedemptions.codeId, code.id));
    if (count >= code.maxRedemptions) {
      return { valid: false, reason: "This code has reached its redemption limit" };
    }
  }

  return { valid: true, code };
}

/**
 * Compute the dollar amount a code takes off a subtotal.
 * Percent is capped at 100%; fixed discounts never take the total below $0.
 */
export function computeDiscountAmount(code: Pick<DiscountCode, "discountType" | "amount">, subtotal: number): number {
  if (subtotal <= 0) return 0;
  const amt = Number(code.amount);
  let discount = 0;
  if (code.discountType === "percent") {
    const pct = Math.min(Math.max(amt, 0), 100);
    discount = subtotal * (pct / 100);
  } else {
    discount = Math.max(amt, 0);
  }
  // Never below $0
  discount = Math.min(discount, subtotal);
  return Number(discount.toFixed(2));
}

/**
 * Record a redemption after a successful charge/booking payment.
 * Exactly one of orderId / bookingId should be set (bookingId is for the
 * future booking-flow integration).
 */
export async function recordDiscountRedemption(params: {
  codeId: number;
  orderId?: number;
  bookingId?: number;
  amountDiscounted: number;
}): Promise<void> {
  await db.insert(discountRedemptions).values({
    codeId: params.codeId,
    orderId: params.orderId ?? null,
    bookingId: params.bookingId ?? null,
    amountDiscounted: params.amountDiscounted.toFixed(2),
  });
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

const upsertSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Code must be at least 2 characters")
    .max(32, "Code must be 32 characters or fewer")
    .regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, dashes and underscores only")
    .transform((v) => v.toUpperCase()),
  description: z.string().trim().max(500).optional().nullable(),
  discountType: z.enum(["percent", "fixed"]),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  active: z.boolean().optional(),
  maxRedemptions: z.coerce.number().int().positive().optional().nullable(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.discountType === "percent" && data.amount > 100) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["amount"], message: "Percent discount cannot exceed 100" });
  }
  if (data.startsAt && data.endsAt && data.endsAt < data.startsAt) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endsAt"], message: "End date must be after start date" });
  }
});

export function registerDiscountRoutes(app: Express) {
  /**
   * GET /api/admin/discount-codes
   * List all codes with per-code redemption stats.
   */
  app.get("/api/admin/discount-codes", requireRole("admin", "super_admin"), async (_req: Request, res: Response) => {
    try {
      const rows = await db
        .select({
          code: discountCodes,
          redemptionCount: sql<number>`count(${discountRedemptions.id})::int`,
          totalDiscounted: sql<string>`coalesce(sum(${discountRedemptions.amountDiscounted}), 0)::text`,
        })
        .from(discountCodes)
        .leftJoin(discountRedemptions, eq(discountRedemptions.codeId, discountCodes.id))
        .groupBy(discountCodes.id)
        .orderBy(desc(discountCodes.createdAt));

      return res.json({
        codes: rows.map((r) => ({
          ...r.code,
          redemptionCount: r.redemptionCount,
          totalDiscounted: Number(r.totalDiscounted),
        })),
      });
    } catch (error) {
      console.error("[Discounts] List error:", error);
      return res.status(500).json({ error: "Failed to load discount codes" });
    }
  });

  /**
   * POST /api/admin/discount-codes
   * Create a new code.
   */
  app.post("/api/admin/discount-codes", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const parsed = upsertSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
      }
      const data = parsed.data;

      const existing = await db.select().from(discountCodes).where(eq(discountCodes.code, data.code));
      if (existing.length > 0) {
        return res.status(409).json({ error: `Code ${data.code} already exists` });
      }

      const [created] = await db.insert(discountCodes).values({
        code: data.code,
        description: data.description ?? null,
        discountType: data.discountType,
        amount: String(data.amount),
        active: data.active ?? true,
        maxRedemptions: data.maxRedemptions ?? null,
        startsAt: data.startsAt ?? null,
        endsAt: data.endsAt ?? null,
      }).returning();

      return res.status(201).json({ code: created });
    } catch (error) {
      console.error("[Discounts] Create error:", error);
      return res.status(500).json({ error: "Failed to create discount code" });
    }
  });

  /**
   * PATCH /api/admin/discount-codes/:id
   * Update an existing code (all fields optional).
   */
  app.patch("/api/admin/discount-codes/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

      const rows = await db.select().from(discountCodes).where(eq(discountCodes.id, id));
      const current = rows[0];
      if (!current) return res.status(404).json({ error: "Discount code not found" });

      // Merge with current values so partial updates still pass full validation
      const merged = {
        code: req.body.code ?? current.code,
        description: req.body.description !== undefined ? req.body.description : current.description,
        discountType: req.body.discountType ?? current.discountType,
        amount: req.body.amount ?? current.amount,
        active: req.body.active !== undefined ? req.body.active : current.active,
        maxRedemptions: req.body.maxRedemptions !== undefined ? req.body.maxRedemptions : current.maxRedemptions,
        startsAt: req.body.startsAt !== undefined ? req.body.startsAt : current.startsAt,
        endsAt: req.body.endsAt !== undefined ? req.body.endsAt : current.endsAt,
      };
      const parsed = upsertSchema.safeParse(merged);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid input" });
      }
      const data = parsed.data;

      if (data.code !== current.code) {
        const dupe = await db.select().from(discountCodes).where(eq(discountCodes.code, data.code));
        if (dupe.length > 0 && dupe[0].id !== id) {
          return res.status(409).json({ error: `Code ${data.code} already exists` });
        }
      }

      const [updated] = await db.update(discountCodes).set({
        code: data.code,
        description: data.description ?? null,
        discountType: data.discountType,
        amount: String(data.amount),
        active: data.active ?? true,
        maxRedemptions: data.maxRedemptions ?? null,
        startsAt: data.startsAt ?? null,
        endsAt: data.endsAt ?? null,
      }).where(eq(discountCodes.id, id)).returning();

      return res.json({ code: updated });
    } catch (error) {
      console.error("[Discounts] Update error:", error);
      return res.status(500).json({ error: "Failed to update discount code" });
    }
  });

  /**
   * POST /api/discount-codes/validate
   * Public endpoint used by checkout (and later the booking flow) to check a
   * code before payment. Returns { valid, discountType?, amount?, reason? }.
   */
  app.post("/api/discount-codes/validate", validateLimiter, async (req: Request, res: Response) => {
    try {
      const result = await validateDiscountCode(req.body?.code);
      if (!result.valid) {
        return res.json({ valid: false, reason: result.reason });
      }
      return res.json({
        valid: true,
        code: result.code.code,
        discountType: result.code.discountType,
        amount: Number(result.code.amount),
      });
    } catch (error) {
      console.error("[Discounts] Validate error:", error);
      return res.status(500).json({ error: "Failed to validate code" });
    }
  });
}
