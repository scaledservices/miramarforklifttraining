import type { Express, Request, Response } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db";
import {
  companyCredit,
  invoices,
  companies,
  orders,
  users,
} from "@shared/schema";
import { storage } from "../storage";
import { requireAuth, requireRole } from "./middleware";
import { generateInvoicePdf } from "../invoice-pdf";
import { pdfStore } from "../pdf-store";
import { sendInvoiceEmail } from "../email";
import { brand } from "@shared/config/brand";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolve the companyId for the current user.
 * - group_admin: finds via group members' certifications (same pattern as roster.ts).
 * - admin / super_admin: returns companyId from request body/query.
 * Returns null if not resolvable.
 */
async function resolveCompanyIdForUser(
  userId: number,
  role: string,
  requestCompanyId?: number,
): Promise<number | null> {
  if (role === "admin" || role === "super_admin") {
    return requestCompanyId ?? null;
  }
  // group_admin: find a company they manage
  const groups = await storage.getGroupsByAdmin(userId);
  for (const group of groups) {
    const members = await storage.listGroupMembers(group.id);
    for (const member of members) {
      if (member.userId) {
        const certs = await storage.getCertificationsByUser(member.userId);
        const companyCerts = certs.filter((c) => c.companyId !== null);
        if (companyCerts.length > 0) {
          return companyCerts[0].companyId!;
        }
      }
    }
  }
  // fallback: check own certs
  const ownCerts = await storage.getCertificationsByUser(userId);
  const ownCompanyCerts = ownCerts.filter((c) => c.companyId !== null);
  if (ownCompanyCerts.length > 0) {
    return ownCompanyCerts[0].companyId!;
  }
  return null;
}

/** Generate a unique invoice number for the invoices table (INV-YYYY-NNNNNN). */
async function generateInvoiceRecordNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${brand.prefixes.invoiceNumber}-${year}`;
  // Find the highest existing invoice number with this prefix to compute the next sequence
  const existing = await db
    .select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .orderBy(desc(invoices.invoiceNumber));

  let seq = 1;
  for (const row of existing) {
    if (row.invoiceNumber && row.invoiceNumber.startsWith(prefix + "-")) {
      const num = parseInt(row.invoiceNumber.slice(prefix.length + 1), 10);
      if (!isNaN(num) && num >= seq) seq = num + 1;
    }
  }
  return `${prefix}-${String(seq).padStart(6, "0")}`;
}

// ── Routes ───────────────────────────────────────────────────────────────────

export function registerInvoicingRoutes(app: Express) {
  // ── Credit application & management ──────────────────────────────────────────

  // POST /api/admin/credit/apply — group_admin submits a credit application for their company
  app.post("/api/admin/credit/apply", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ error: "Authentication required" });

      // group_admin can apply for their company; admin/super_admin can also apply on behalf
      const companyId = await resolveCompanyIdForUser(
        req.session.userId!,
        user.role,
        req.body.companyId,
      );
      if (!companyId) return res.status(400).json({ error: "Could not determine company. Specify companyId." });

      // Check if a credit record already exists
      const [existing] = await db
        .select()
        .from(companyCredit)
        .where(eq(companyCredit.companyId, companyId));

      if (existing) {
        if (existing.creditStatus === "approved") {
          return res.status(409).json({ error: "Company already has approved credit" });
        }
        // Re-apply: update status to pending
        const [updated] = await db
          .update(companyCredit)
          .set({ creditStatus: "pending" })
          .where(eq(companyCredit.companyId, companyId))
          .returning();
        return res.json(updated);
      }

      const [credit] = await db
        .insert(companyCredit)
        .values({
          companyId,
          creditStatus: "pending",
        })
        .returning();

      return res.json(credit);
    } catch (error) {
      console.error("[INVOICING] Credit apply error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/admin/credit — admin/super_admin: list all credit applications
  app.get("/api/admin/credit", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const rows = await db
        .select({
          credit: companyCredit,
          companyName: companies.name,
          companyEmail: companies.email,
          approvedByName: users.name,
        })
        .from(companyCredit)
        .innerJoin(companies, eq(companyCredit.companyId, companies.id))
        .leftJoin(users, eq(companyCredit.approvedById, users.id))
        .orderBy(desc(companyCredit.createdAt));

      return res.json(rows);
    } catch (error) {
      console.error("[INVOICING] Credit list error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // PATCH /api/admin/credit/:companyId/approve — admin approves with terms + limit
  app.patch("/api/admin/credit/:companyId/approve", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(String(req.params.companyId), 10);
      if (isNaN(companyId)) return res.status(400).json({ error: "Invalid company ID" });

      const { creditLimitCents, terms } = req.body;
      if (!creditLimitCents || typeof creditLimitCents !== "number" || creditLimitCents <= 0) {
        return res.status(400).json({ error: "creditLimitCents must be a positive number" });
      }
      if (!terms || !["net15", "net30", "net60"].includes(terms)) {
        return res.status(400).json({ error: "terms must be one of: net15, net30, net60" });
      }

      const [existing] = await db
        .select()
        .from(companyCredit)
        .where(eq(companyCredit.companyId, companyId));
      if (!existing) return res.status(404).json({ error: "No credit application found for this company" });

      const [updated] = await db
        .update(companyCredit)
        .set({
          creditStatus: "approved",
          creditLimitCents,
          terms,
          approvedById: req.session.userId!,
          approvedAt: new Date(),
        })
        .where(eq(companyCredit.companyId, companyId))
        .returning();

      return res.json(updated);
    } catch (error) {
      console.error("[INVOICING] Credit approve error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // PATCH /api/admin/credit/:companyId/deny — admin denies credit
  app.patch("/api/admin/credit/:companyId/deny", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(String(req.params.companyId), 10);
      if (isNaN(companyId)) return res.status(400).json({ error: "Invalid company ID" });

      const [existing] = await db
        .select()
        .from(companyCredit)
        .where(eq(companyCredit.companyId, companyId));
      if (!existing) return res.status(404).json({ error: "No credit application found for this company" });

      const [updated] = await db
        .update(companyCredit)
        .set({
          creditStatus: "denied",
          approvedById: req.session.userId!,
          approvedAt: new Date(),
        })
        .where(eq(companyCredit.companyId, companyId))
        .returning();

      return res.json(updated);
    } catch (error) {
      console.error("[INVOICING] Credit deny error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/credit/status/:companyId — check credit status for a company
  app.get("/api/credit/status/:companyId", requireAuth, async (req: Request, res: Response) => {
    try {
      const companyId = parseInt(String(req.params.companyId), 10);
      if (isNaN(companyId)) return res.status(400).json({ error: "Invalid company ID" });

      const [credit] = await db
        .select()
        .from(companyCredit)
        .where(eq(companyCredit.companyId, companyId));

      if (!credit) return res.json({ creditStatus: "none" });
      return res.json(credit);
    } catch (error) {
      console.error("[INVOICING] Credit status error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ── Invoice generation & management ──────────────────────────────────────────

  // POST /api/admin/invoices/:orderId/send — generate branded invoice PDF + email to company contact
  app.post("/api/admin/invoices/:orderId/send", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(String(req.params.orderId), 10);
      if (isNaN(orderId)) return res.status(400).json({ error: "Invalid order ID" });

      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      if (!order) return res.status(404).json({ error: "Order not found" });
      if (!order.companyId) return res.status(400).json({ error: "Order has no associated company" });

      // Verify company has approved credit
      const [credit] = await db
        .select()
        .from(companyCredit)
        .where(eq(companyCredit.companyId, order.companyId));
      if (!credit || credit.creditStatus !== "approved") {
        return res.status(400).json({ error: "Company does not have approved credit" });
      }

      const [company] = await db.select().from(companies).where(eq(companies.id, order.companyId));
      if (!company) return res.status(404).json({ error: "Company not found" });

      // Use company email or order user's email as recipient
      const recipient = company.email || (await storage.getUser(order.userId))?.email;
      if (!recipient) return res.status(400).json({ error: "No email address found for company or order user" });

      // Generate the branded invoice PDF (reuses existing invoice-pdf.ts)
      const relativePath = await generateInvoicePdf(orderId);
      const pdfBuffer = await pdfStore.read(relativePath);

      // Generate a unique invoice number for the invoices record
      const invoiceNumber = await generateInvoiceRecordNumber();

      // Create the invoice record
      const amountCents = Math.round(Number(order.total) * 100);
      const [invoice] = await db
        .insert(invoices)
        .values({
          invoiceNumber,
          orderId,
          companyId: order.companyId,
          amountCents,
          status: "sent",
          terms: credit.terms || "net30",
          sentTo: recipient,
          createdBy: req.session.userId!,
        })
        .returning();

      // Mark order status as paid (invoice issued = payment deferred but order confirmed)
      await db
        .update(orders)
        .set({ status: "paid", updatedAt: new Date() })
        .where(eq(orders.id, orderId));

      // Send the invoice email with PDF attachment
      await sendInvoiceEmail({
        to: recipient,
        contactName: company.name,
        invoiceNumber,
        companyName: company.name,
        amount: Number(order.total),
        terms: credit.terms || "net30",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US"),
        attachments: pdfBuffer ? [{ filename: `${invoiceNumber}.pdf`, content: pdfBuffer }] : undefined,
      });

      return res.json(invoice);
    } catch (error) {
      console.error("[INVOICING] Invoice send error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/admin/invoices — list all invoices
  app.get("/api/admin/invoices", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const rows = await db
        .select({
          invoice: invoices,
          companyName: companies.name,
          companyEmail: companies.email,
          orderNumber: orders.orderNumber,
        })
        .from(invoices)
        .innerJoin(companies, eq(invoices.companyId, companies.id))
        .innerJoin(orders, eq(invoices.orderId, orders.id))
        .orderBy(desc(invoices.createdAt));

      return res.json(rows);
    } catch (error) {
      console.error("[INVOICING] Invoice list error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // PATCH /api/admin/invoices/:id/mark-paid — mark invoice as paid (manual payment recording)
  app.patch("/api/admin/invoices/:id/mark-paid", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
    try {
      const invoiceId = parseInt(String(req.params.id), 10);
      if (isNaN(invoiceId)) return res.status(400).json({ error: "Invalid invoice ID" });

      const { paymentMethod, paymentNote } = req.body;
      if (!paymentMethod || !["cash", "check", "transfer", "other"].includes(paymentMethod)) {
        return res.status(400).json({ error: "paymentMethod must be one of: cash, check, transfer, other" });
      }

      const [existing] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
      if (!existing) return res.status(404).json({ error: "Invoice not found" });
      if (existing.status === "paid") return res.status(409).json({ error: "Invoice already marked as paid" });

      const [updated] = await db
        .update(invoices)
        .set({
          status: "paid",
          paidAt: new Date(),
          paymentMethod,
          paymentNote: paymentNote || null,
        })
        .where(eq(invoices.id, invoiceId))
        .returning();

      return res.json(updated);
    } catch (error) {
      console.error("[INVOICING] Mark paid error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}
