import type { Express, Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import { and, desc, eq, gte, inArray, isNull, lt, lte, notInArray, or } from "drizzle-orm";
import { db } from "../db";
import {
  trainingExpenses,
  TRAINING_EXPENSE_CATEGORIES,
  bookings as bookingsTable,
  orders as ordersTable,
  users as usersTable,
  trainingEvents as trainingEventsTable,
  companies as companiesTable,
} from "@shared/schema";
import { requireRole } from "./middleware";

// ---------------------------------------------------------------------------
// Training expenses (2026-11-14).
//
// Admin routes (session auth):
//   GET    /api/admin/expenses?month=YYYY-MM     list expenses incurred in a month
//   GET    /api/admin/expenses/trainings?days=N   recent trainings + expense status
//   POST   /api/admin/expenses                   add one expense
//   DELETE /api/admin/expenses/:id               remove one expense
//
// Assistant routes (Bearer AGENT_API_TOKEN; disabled when the env var is unset):
//   GET    /api/agent/expenses/pending?days=N    trainings with no expense check-in
//   POST   /api/agent/expenses                   save items, or { none: true }
//
// A "none" row (amount 0) records "no expenses for this training" so the
// assistant stops asking. Expenses are reference for the split and for
// reimbursing Alberto; they never move money by themselves.
// ---------------------------------------------------------------------------

const PAYABLE_BOOKING_STATUSES = ["confirmed", "completed"] as const;
const CLOSED_EVENT_STATUSES = ["canceled", "cancelled"];

function localDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const itemSchema = z.object({
  category: z.enum(TRAINING_EXPENSE_CATEGORIES),
  amount: z.coerce.number().min(0).max(100000),
  description: z.string().trim().max(500).optional().nullable(),
  incurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const linkSchema = z.object({
  bookingId: z.coerce.number().int().positive().optional(),
  trainingEventId: z.coerce.number().int().positive().optional(),
  orderId: z.coerce.number().int().positive().optional(),
}).refine((v) => v.bookingId || v.trainingEventId || v.orderId, { message: "bookingId, trainingEventId or orderId is required" });

/** Resolve the training a submission points at, and its order and date. */
async function resolveLink(link: { bookingId?: number; trainingEventId?: number; orderId?: number }) {
  let orderId: number | null = link.orderId ?? null;
  let bookingId: number | null = link.bookingId ?? null;
  let trainingEventId: number | null = link.trainingEventId ?? null;
  let trainingDate: string | null = null;

  if (bookingId) {
    const [b] = await db.select({ id: bookingsTable.id, orderId: bookingsTable.orderId, sessionDate: bookingsTable.sessionDate })
      .from(bookingsTable).where(eq(bookingsTable.id, bookingId));
    if (!b) return { error: "Booking not found" as const };
    orderId = orderId ?? b.orderId ?? null;
    trainingDate = String(b.sessionDate);
  }
  if (trainingEventId) {
    const [e] = await db.select({ id: trainingEventsTable.id, scheduledStart: trainingEventsTable.scheduledStart })
      .from(trainingEventsTable).where(eq(trainingEventsTable.id, trainingEventId));
    if (!e) return { error: "Training event not found" as const };
    if (!orderId) {
      const [o] = await db.select({ id: ordersTable.id }).from(ordersTable).where(eq(ordersTable.trainingEventId, trainingEventId)).limit(1);
      orderId = o?.id ?? null;
    }
    if (!trainingDate && e.scheduledStart) trainingDate = localDate(new Date(e.scheduledStart));
  }
  if (orderId && !bookingId && !trainingEventId) {
    const [o] = await db.select({ id: ordersTable.id }).from(ordersTable).where(eq(ordersTable.id, orderId));
    if (!o) return { error: "Order not found" as const };
  }
  return { orderId, bookingId, trainingEventId, trainingDate };
}

async function insertItems(
  link: { orderId: number | null; bookingId: number | null; trainingEventId: number | null; trainingDate: string | null },
  items: z.infer<typeof itemSchema>[],
  source: "admin" | "assistant",
  userId: number | null,
) {
  const today = localDate(new Date());
  const rows = items.map((it) => ({
    orderId: link.orderId,
    bookingId: link.bookingId,
    trainingEventId: link.trainingEventId,
    category: it.category,
    amount: (it.category === "none" ? 0 : it.amount).toFixed(2),
    description: it.description ?? null,
    incurredOn: it.incurredOn ?? link.trainingDate ?? today,
    source,
    createdByUserId: userId,
  }));
  if (rows.length === 0) return [];
  return db.insert(trainingExpenses).values(rows).returning();
}

/** Recent trainings (bookings + training events) with their expense status. */
export async function listRecentTrainings(days: number, onlyPending: boolean) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days);
  const fromStr = localDate(from);
  const todayStr = localDate(now);

  const bookingRows = await db
    .select({
      id: bookingsTable.id,
      bookingNumber: bookingsTable.bookingNumber,
      sessionDate: bookingsTable.sessionDate,
      productSlug: bookingsTable.productSlug,
      participantCount: bookingsTable.participantCount,
      contactName: bookingsTable.contactName,
      city: bookingsTable.customerCity,
      orderId: bookingsTable.orderId,
      status: bookingsTable.status,
    })
    .from(bookingsTable)
    .where(and(
      gte(bookingsTable.sessionDate, fromStr),
      lte(bookingsTable.sessionDate, todayStr),
      inArray(bookingsTable.status, [...PAYABLE_BOOKING_STATUSES]),
    ))
    .orderBy(desc(bookingsTable.sessionDate));

  const eventRows = await db
    .select({
      id: trainingEventsTable.id,
      title: trainingEventsTable.title,
      scheduledStart: trainingEventsTable.scheduledStart,
      traineeCount: trainingEventsTable.traineeCount,
      city: trainingEventsTable.onsiteCity,
      locationType: trainingEventsTable.locationType,
      status: trainingEventsTable.status,
      companyName: companiesTable.name,
    })
    .from(trainingEventsTable)
    .leftJoin(companiesTable, eq(companiesTable.id, trainingEventsTable.companyId))
    .where(and(
      isNull(trainingEventsTable.importBatchId),
      gte(trainingEventsTable.scheduledStart, from),
      lt(trainingEventsTable.scheduledStart, new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)),
      notInArray(trainingEventsTable.status, CLOSED_EVENT_STATUSES as any),
    ))
    .orderBy(desc(trainingEventsTable.scheduledStart));

  const bookingIds = bookingRows.map((b) => b.id);
  const eventIds = eventRows.map((e) => e.id);
  const linkConds = [
    ...(bookingIds.length ? [inArray(trainingExpenses.bookingId, bookingIds)] : []),
    ...(eventIds.length ? [inArray(trainingExpenses.trainingEventId, eventIds)] : []),
  ];
  const expenseRows = linkConds.length
    ? await db.select().from(trainingExpenses).where(linkConds.length === 1 ? linkConds[0] : or(...linkConds))
    : [];

  const summarize = (rows: typeof expenseRows) => ({
    checkedIn: rows.length > 0,
    noExpenses: rows.length > 0 && rows.every((r) => r.category === "none"),
    total: Math.round(rows.reduce((s, r) => s + Number(r.amount), 0) * 100) / 100,
    count: rows.filter((r) => r.category !== "none").length,
  });

  const out = [
    ...bookingRows.map((b) => ({
      kind: "booking" as const,
      bookingId: b.id,
      trainingEventId: null as number | null,
      orderId: b.orderId,
      reference: b.bookingNumber,
      date: String(b.sessionDate),
      title: b.productSlug,
      customer: b.contactName,
      city: b.city,
      participants: b.participantCount,
      expenses: summarize(expenseRows.filter((r) => r.bookingId === b.id)),
    })),
    ...eventRows.map((e) => ({
      kind: "training_event" as const,
      bookingId: null as number | null,
      trainingEventId: e.id,
      orderId: null as number | null,
      reference: `EV-${e.id}`,
      date: e.scheduledStart ? localDate(new Date(e.scheduledStart)) : "",
      title: e.title,
      customer: e.companyName,
      city: e.city,
      participants: e.traineeCount,
      expenses: summarize(expenseRows.filter((r) => r.trainingEventId === e.id)),
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return onlyPending ? out.filter((t) => !t.expenses.checkedIn) : out;
}

/** Expenses incurred in [from, to), joined with the order's customer email. */
export async function loadExpensesForRange(from: Date, to: Date) {
  return db
    .select({
      id: trainingExpenses.id,
      orderId: trainingExpenses.orderId,
      bookingId: trainingExpenses.bookingId,
      trainingEventId: trainingExpenses.trainingEventId,
      category: trainingExpenses.category,
      description: trainingExpenses.description,
      amount: trainingExpenses.amount,
      incurredOn: trainingExpenses.incurredOn,
      source: trainingExpenses.source,
      orderNumber: ordersTable.orderNumber,
      customerEmail: usersTable.email,
      customerName: usersTable.name,
    })
    .from(trainingExpenses)
    .leftJoin(ordersTable, eq(ordersTable.id, trainingExpenses.orderId))
    .leftJoin(usersTable, eq(usersTable.id, ordersTable.userId))
    .where(and(
      gte(trainingExpenses.incurredOn, localDate(from)),
      lt(trainingExpenses.incurredOn, localDate(to)),
    ))
    .orderBy(trainingExpenses.incurredOn, trainingExpenses.id);
}

// ---- Assistant auth --------------------------------------------------------

export function requireAgentToken(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.AGENT_API_TOKEN?.trim();
  if (!expected) return res.status(503).json({ error: "Assistant API is not enabled" });
  const header = req.headers["authorization"] || "";
  const got = typeof header === "string" && header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// ---- Routes ----------------------------------------------------------------

export function registerExpenseRoutes(app: Express) {
  app.get("/api/admin/expenses", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const month = typeof req.query.month === "string" && /^\d{4}-\d{2}$/.test(req.query.month)
        ? req.query.month
        : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const [y, m] = month.split("-").map(Number);
      const rows = await loadExpensesForRange(new Date(y, m - 1, 1), new Date(y, m, 1));
      return res.json({ month, expenses: rows });
    } catch (error) {
      console.error("[Expenses] list error:", error);
      return res.status(500).json({ error: "Failed to load expenses" });
    }
  });

  app.get("/api/admin/expenses/trainings", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 120);
      return res.json({ days, trainings: await listRecentTrainings(days, false) });
    } catch (error) {
      console.error("[Expenses] trainings error:", error);
      return res.status(500).json({ error: "Failed to load trainings" });
    }
  });

  app.post("/api/admin/expenses", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    const parsed = linkSchema.and(itemSchema).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid expense" });
    try {
      const link = await resolveLink(parsed.data);
      if ("error" in link) return res.status(404).json({ error: link.error });
      const [row] = await insertItems(link, [parsed.data], "admin", req.session.userId ?? null);
      return res.status(201).json({ expense: row });
    } catch (error) {
      console.error("[Expenses] create error:", error);
      return res.status(500).json({ error: "Failed to save expense" });
    }
  });

  app.delete("/api/admin/expenses/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });
    try {
      const deleted = await db.delete(trainingExpenses).where(eq(trainingExpenses.id, id)).returning({ id: trainingExpenses.id });
      if (deleted.length === 0) return res.status(404).json({ error: "Expense not found" });
      return res.json({ deleted: id });
    } catch (error) {
      console.error("[Expenses] delete error:", error);
      return res.status(500).json({ error: "Failed to delete expense" });
    }
  });

  // ---- Assistant ----
  app.get("/api/agent/expenses/pending", requireAgentToken, async (req: Request, res: Response) => {
    try {
      const days = Math.min(Math.max(Number(req.query.days) || 14, 1), 60);
      return res.json({ days, trainings: await listRecentTrainings(days, true) });
    } catch (error) {
      console.error("[Expenses] agent pending error:", error);
      return res.status(500).json({ error: "Failed to load pending trainings" });
    }
  });

  const agentSubmitSchema = linkSchema.and(z.object({
    none: z.boolean().optional(),
    items: z.array(itemSchema).max(20).optional(),
  })).refine((v) => v.none || (v.items && v.items.length > 0), { message: "Send items, or none: true" });

  app.post("/api/agent/expenses", requireAgentToken, async (req: Request, res: Response) => {
    const parsed = agentSubmitSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid submission" });
    try {
      const link = await resolveLink(parsed.data);
      if ("error" in link) return res.status(404).json({ error: link.error });
      const items = parsed.data.none
        ? [{ category: "none" as const, amount: 0, description: "No expenses (confirmed by Alberto)" }]
        : parsed.data.items!;
      const rows = await insertItems(link, items, "assistant", null);
      const total = rows.reduce((s, r) => s + Number(r.amount), 0);
      return res.status(201).json({ saved: rows.length, total: Math.round(total * 100) / 100, orderId: link.orderId });
    } catch (error) {
      console.error("[Expenses] agent submit error:", error);
      return res.status(500).json({ error: "Failed to save expenses" });
    }
  });
}
