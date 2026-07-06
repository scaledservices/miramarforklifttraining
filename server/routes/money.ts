import type { Express, Request, Response } from "express";
import { db } from "../db";
import { storage } from "../storage";
import { eq, and, gte, lt, inArray } from "drizzle-orm";
import {
  payments as paymentsTable,
  orders as ordersTable,
  users as usersTable,
  bookings as bookingsTable,
  platformSettings,
} from "@shared/schema";
import { requireRole } from "./middleware";

// ---------------------------------------------------------------------------
// Revenue split configuration
//
// Three-party split of training revenue:
// - Alberto Rawlins (training operator)
// - Scaled Services LLC (tech/marketing partner)
// - Miramar owners (the remainder)
//
// Rules (all percentages configurable, stored in platform_settings under
// "revenue_split_config"):
// - Returning-customer revenue: Alberto earns `albertoCommissionPercent`
//   (default 30%). Scaled Services earns nothing. Miramar keeps the rest.
// - New-customer revenue: a commission pool of `newCustomerCommissionPercent`
//   (default 50%) is shared between Alberto and Scaled Services. Alberto's
//   share of that pool is `newCustomerAlbertoSharePercent` (default 50%,
//   i.e. 25% / 25% of the revenue); Scaled Services gets the remainder of
//   the pool. Miramar keeps everything outside the pool.
//
// New-customer rule: a payment counts as new-customer revenue when it belongs
// to the customer's FIRST order that ever received an approved payment
// (earliest approved payment across all time, per user). All payments on that
// first order (deposit + balance) are new-customer; payments on any later
// order are returning-customer.
// ---------------------------------------------------------------------------

export interface RevenueSplitConfig {
  /** Alberto's commission % on returning-customer revenue (default 30). */
  albertoCommissionPercent: number;
  /** Total commission pool % on new-customer revenue, shared between Alberto and Scaled Services (default 50). */
  newCustomerCommissionPercent: number;
  /** Alberto's share % of the new-customer commission pool; Scaled Services gets the rest (default 50). */
  newCustomerAlbertoSharePercent: number;
}

const SPLIT_CONFIG_KEY = "revenue_split_config";

const DEFAULT_SPLIT_CONFIG: RevenueSplitConfig = {
  albertoCommissionPercent: 30,
  newCustomerCommissionPercent: 50,
  newCustomerAlbertoSharePercent: 50,
};

function roundCents(n: number): number {
  return Math.round(n * 100) / 100;
}

function isValidPercent(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 100;
}

async function loadSplitConfig(): Promise<RevenueSplitConfig> {
  const rows = await db.select().from(platformSettings).where(eq(platformSettings.key, SPLIT_CONFIG_KEY));
  const stored = (rows[0]?.value as Partial<RevenueSplitConfig> | undefined) || {};
  return {
    albertoCommissionPercent: isValidPercent(stored.albertoCommissionPercent)
      ? stored.albertoCommissionPercent
      : DEFAULT_SPLIT_CONFIG.albertoCommissionPercent,
    newCustomerCommissionPercent: isValidPercent(stored.newCustomerCommissionPercent)
      ? stored.newCustomerCommissionPercent
      : DEFAULT_SPLIT_CONFIG.newCustomerCommissionPercent,
    newCustomerAlbertoSharePercent: isValidPercent(stored.newCustomerAlbertoSharePercent)
      ? stored.newCustomerAlbertoSharePercent
      : DEFAULT_SPLIT_CONFIG.newCustomerAlbertoSharePercent,
  };
}

export interface PartySplit {
  alberto: number;
  scaled: number;
  miramar: number;
}

export function computeSplit(principal: number, isNewCustomer: boolean, config: RevenueSplitConfig): PartySplit {
  let alberto: number;
  let scaled: number;
  if (isNewCustomer) {
    const pool = principal * (config.newCustomerCommissionPercent / 100);
    alberto = roundCents(pool * (config.newCustomerAlbertoSharePercent / 100));
    scaled = roundCents(pool - alberto);
  } else {
    alberto = roundCents(principal * (config.albertoCommissionPercent / 100));
    scaled = 0;
  }
  const miramar = roundCents(principal - alberto - scaled);
  return { alberto, scaled, miramar };
}

// Card surcharges are processing fees, not training revenue. Payments store
// the surcharge inside rawResponse.surcharge; the principal is what counts.
function principalOf(payment: { amount: unknown; rawResponse: unknown }): number {
  const surcharge = Number((payment.rawResponse as any)?.surcharge) || 0;
  return Number(payment.amount) - surcharge;
}

function startOfWeek(now: Date): Date {
  // Week starts Monday, local time.
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

function localDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Sum of unpaid balances (booking totalPrice minus approved principal paid,
 * plus refunds added back), grouped so we can slice by session date.
 * Mirrors the balance logic in server/routes/services.ts (getBookingFinance):
 * card surcharge is excluded from balance math.
 */
async function computeOutstanding() {
  const activeBookings = await db
    .select({
      id: bookingsTable.id,
      orderId: bookingsTable.orderId,
      sessionDate: bookingsTable.sessionDate,
      totalPrice: bookingsTable.totalPrice,
    })
    .from(bookingsTable)
    .where(inArray(bookingsTable.status, ["pending", "confirmed", "completed"]));

  const orderIds = activeBookings.map(b => b.orderId).filter((id): id is number => id != null);
  const paymentRows = orderIds.length > 0
    ? await db
        .select({
          orderId: paymentsTable.orderId,
          status: paymentsTable.status,
          amount: paymentsTable.amount,
          rawResponse: paymentsTable.rawResponse,
        })
        .from(paymentsTable)
        .where(inArray(paymentsTable.orderId, orderIds))
    : [];

  const paidByOrder = new Map<number, number>();
  for (const p of paymentRows) {
    let delta = 0;
    if (p.status === "approved") delta = principalOf(p);
    else if (p.status === "refunded") delta = -Number(p.amount);
    else continue;
    paidByOrder.set(p.orderId, (paidByOrder.get(p.orderId) || 0) + delta);
  }

  return activeBookings.map(b => {
    const paid = b.orderId != null ? paidByOrder.get(b.orderId) || 0 : 0;
    const balanceDue = Math.max(0, roundCents(Number(b.totalPrice) - paid));
    return { sessionDate: b.sessionDate, balanceDue };
  });
}

async function sumCollected(from: Date, to: Date): Promise<{ collected: number; refunded: number }> {
  const rows = await db
    .select({
      status: paymentsTable.status,
      amount: paymentsTable.amount,
      rawResponse: paymentsTable.rawResponse,
    })
    .from(paymentsTable)
    .where(and(
      inArray(paymentsTable.status, ["approved", "refunded"]),
      gte(paymentsTable.createdAt, from),
      lt(paymentsTable.createdAt, to),
    ));

  let collected = 0;
  let refunded = 0;
  for (const p of rows) {
    if (p.status === "approved") collected += principalOf(p);
    else refunded += Number(p.amount);
  }
  return { collected: roundCents(collected), refunded: roundCents(refunded) };
}

export function registerMoneyRoutes(app: Express) {

  // -------------------------------------------------------------------------
  // GET /api/admin/money/summary
  // Collected vs outstanding for this week (Mon-Sun) and this month.
  // -------------------------------------------------------------------------
  app.get("/api/admin/money/summary", requireRole("admin", "super_admin"), async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const weekStart = startOfWeek(now);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const [week, month, balances] = await Promise.all([
        sumCollected(weekStart, weekEnd),
        sumCollected(monthStart, monthEnd),
        computeOutstanding(),
      ]);

      const weekStartStr = localDateString(weekStart);
      const weekEndStr = localDateString(new Date(weekEnd.getTime() - 1));
      const monthStartStr = localDateString(monthStart);
      const monthEndStr = localDateString(new Date(monthEnd.getTime() - 1));

      // Outstanding is sliced by booking session date: balances due on
      // sessions happening in the period, plus an overall total.
      let weekOutstanding = 0;
      let monthOutstanding = 0;
      let totalOutstanding = 0;
      for (const b of balances) {
        if (b.balanceDue <= 0) continue;
        totalOutstanding += b.balanceDue;
        if (b.sessionDate >= weekStartStr && b.sessionDate <= weekEndStr) weekOutstanding += b.balanceDue;
        if (b.sessionDate >= monthStartStr && b.sessionDate <= monthEndStr) monthOutstanding += b.balanceDue;
      }

      return res.json({
        week: {
          start: weekStartStr,
          end: weekEndStr,
          collected: week.collected,
          refunded: week.refunded,
          outstanding: roundCents(weekOutstanding),
        },
        month: {
          start: monthStartStr,
          end: monthEndStr,
          collected: month.collected,
          refunded: month.refunded,
          outstanding: roundCents(monthOutstanding),
        },
        totalOutstanding: roundCents(totalOutstanding),
      });
    } catch (error) {
      console.error("[Money] Summary error:", error);
      return res.status(500).json({ error: "Failed to load money summary" });
    }
  });

  // -------------------------------------------------------------------------
  // GET /api/admin/money/split-config
  // -------------------------------------------------------------------------
  app.get("/api/admin/money/split-config", requireRole("admin", "super_admin"), async (_req: Request, res: Response) => {
    try {
      const config = await loadSplitConfig();
      return res.json({ config, defaults: DEFAULT_SPLIT_CONFIG });
    } catch (error) {
      console.error("[Money] Split config load error:", error);
      return res.status(500).json({ error: "Failed to load split config" });
    }
  });

  // -------------------------------------------------------------------------
  // PUT /api/admin/money/split-config  (super_admin only)
  // -------------------------------------------------------------------------
  app.put("/api/admin/money/split-config", requireRole("super_admin"), async (req: Request, res: Response) => {
    try {
      const { albertoCommissionPercent, newCustomerCommissionPercent, newCustomerAlbertoSharePercent } = req.body || {};
      if (!isValidPercent(albertoCommissionPercent) || !isValidPercent(newCustomerCommissionPercent) || !isValidPercent(newCustomerAlbertoSharePercent)) {
        return res.status(400).json({ error: "All three values must be numbers between 0 and 100" });
      }
      const config: RevenueSplitConfig = {
        albertoCommissionPercent,
        newCustomerCommissionPercent,
        newCustomerAlbertoSharePercent,
      };

      await db.insert(platformSettings).values({
        key: SPLIT_CONFIG_KEY,
        value: config,
        updatedByUserId: req.session.userId!,
      }).onConflictDoUpdate({
        target: platformSettings.key,
        set: { value: config, updatedByUserId: req.session.userId!, updatedAt: new Date() },
      });

      await storage.createAuditLog({
        actorUserId: req.session.userId!,
        action: "settings_updated",
        entity: "platform_settings",
        entityId: SPLIT_CONFIG_KEY,
        metadata: { key: SPLIT_CONFIG_KEY, value: config },
      });

      return res.json({ success: true, config });
    } catch (error) {
      console.error("[Money] Split config save error:", error);
      return res.status(500).json({ error: "Failed to save split config" });
    }
  });

  // -------------------------------------------------------------------------
  // GET /api/admin/money/statement?month=YYYY-MM
  // Monthly statement: every approved/refunded payment in the month with its
  // three-party split, plus totals per party. Returns all three parties.
  // -------------------------------------------------------------------------
  app.get("/api/admin/money/statement", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const month = typeof req.query.month === "string" && /^\d{4}-\d{2}$/.test(req.query.month)
        ? req.query.month
        : defaultMonth;
      const [yearStr, monthStr] = month.split("-");
      const year = Number(yearStr);
      const monthNum = Number(monthStr);
      if (monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ error: "Invalid month; expected YYYY-MM" });
      }
      const from = new Date(year, monthNum - 1, 1);
      const to = new Date(year, monthNum, 1);

      const config = await loadSplitConfig();

      // Payments in the month, joined with order + customer.
      const monthPayments = await db
        .select({
          paymentId: paymentsTable.id,
          orderId: paymentsTable.orderId,
          status: paymentsTable.status,
          amount: paymentsTable.amount,
          rawResponse: paymentsTable.rawResponse,
          provider: paymentsTable.provider,
          createdAt: paymentsTable.createdAt,
          orderNumber: ordersTable.orderNumber,
          userId: ordersTable.userId,
          customerName: usersTable.name,
          customerEmail: usersTable.email,
        })
        .from(paymentsTable)
        .innerJoin(ordersTable, eq(paymentsTable.orderId, ordersTable.id))
        .innerJoin(usersTable, eq(ordersTable.userId, usersTable.id))
        .where(and(
          inArray(paymentsTable.status, ["approved", "refunded"]),
          gte(paymentsTable.createdAt, from),
          lt(paymentsTable.createdAt, to),
        ))
        .orderBy(paymentsTable.createdAt);

      // New-customer detection: find each relevant user's first order that
      // ever received an approved payment. Payments on that order count as
      // new-customer revenue.
      const userIds = Array.from(new Set(monthPayments.map(p => p.userId)));
      const firstPaidOrderByUser = new Map<number, number>();
      if (userIds.length > 0) {
        const history = await db
          .select({
            orderId: paymentsTable.orderId,
            createdAt: paymentsTable.createdAt,
            paymentId: paymentsTable.id,
            userId: ordersTable.userId,
          })
          .from(paymentsTable)
          .innerJoin(ordersTable, eq(paymentsTable.orderId, ordersTable.id))
          .where(and(
            eq(paymentsTable.status, "approved"),
            inArray(ordersTable.userId, userIds),
          ))
          .orderBy(paymentsTable.createdAt, paymentsTable.id);
        for (const h of history) {
          if (!firstPaidOrderByUser.has(h.userId)) {
            firstPaidOrderByUser.set(h.userId, h.orderId);
          }
        }
      }

      const totals = { revenue: 0, alberto: 0, scaled: 0, miramar: 0, newCustomerRevenue: 0, returningRevenue: 0 };
      const lineItems = monthPayments.map(p => {
        const isRefund = p.status === "refunded";
        // Refunds appear as negative line items so they claw back commissions.
        const principal = isRefund ? -Number(p.amount) : roundCents(principalOf(p));
        const isNewCustomer = firstPaidOrderByUser.get(p.userId) === p.orderId;
        const split = computeSplit(principal, isNewCustomer, config);

        totals.revenue = roundCents(totals.revenue + principal);
        totals.alberto = roundCents(totals.alberto + split.alberto);
        totals.scaled = roundCents(totals.scaled + split.scaled);
        totals.miramar = roundCents(totals.miramar + split.miramar);
        if (isNewCustomer) totals.newCustomerRevenue = roundCents(totals.newCustomerRevenue + principal);
        else totals.returningRevenue = roundCents(totals.returningRevenue + principal);

        return {
          paymentId: p.paymentId,
          date: p.createdAt,
          orderId: p.orderId,
          orderNumber: p.orderNumber,
          customerName: p.customerName,
          customerEmail: p.customerEmail,
          provider: p.provider,
          amount: principal,
          isRefund,
          isNewCustomer,
          split,
        };
      });

      return res.json({
        month,
        config,
        newCustomerRule: "A payment is new-customer revenue when it belongs to the customer's first order that ever received an approved payment.",
        lineItems,
        totals,
        parties: {
          alberto: { name: "Alberto Rawlins", total: totals.alberto },
          scaled: { name: "Scaled Services LLC", total: totals.scaled },
          miramar: { name: "Miramar Owners", total: totals.miramar },
        },
      });
    } catch (error) {
      console.error("[Money] Statement error:", error);
      return res.status(500).json({ error: "Failed to load monthly statement" });
    }
  });
}
