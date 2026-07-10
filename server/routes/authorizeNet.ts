import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { platformSettings, orders as ordersTable, type DiscountCode } from "@shared/schema";
import { isAdminRole } from "@shared/roles";
import { validateDiscountCode, computeDiscountAmount, recordDiscountRedemption } from "./discounts";
import {
  isAuthorizeNetConfigured,
  getAuthorizeNetClientKey,
  getAuthorizeNetApiLoginID,
  getAuthorizeNetEnvironment,
  createTransactionFromNonce,
  refundTransaction,
  calculateCardSurcharge,
} from "../authorizeNetClient";
import { sendOrderReceipt, sendNewOrderAdminAlert } from "../email";
import { resolveLocale } from "../locale-resolver";
import { logger, logPaymentError } from "../monitoring";
import { requireAuth, payLimiter } from "./middleware";

export function registerAuthorizeNetRoutes(app: Express) {
  /**
   * GET /api/payment/config
   * Replaces /api/stripe/config. Returns Authorize.net configuration
   * for the client to initialize Accept UI.
   */
  app.get("/api/payment/config", async (_req: Request, res: Response) => {
    try {
      if (!isAuthorizeNetConfigured()) {
        return res.json({
          configured: false,
          provider: "authorize_net",
          demoMode: process.env.DEMO_MODE === "true",
        });
      }
      return res.json({
        configured: true,
        provider: "authorize_net",
        clientKey: getAuthorizeNetClientKey(),
        apiLoginID: getAuthorizeNetApiLoginID(),
        environment: getAuthorizeNetEnvironment(),
      });
    } catch (err) {
      return res.json({
        configured: false,
        provider: "authorize_net",
        demoMode: process.env.DEMO_MODE === "true",
      });
    }
  });

  /**
   * POST /api/authorize-net/charge
   * Replaces /api/create-payment-intent + /api/orders/:id/pay.
   * Creates the order, charges the card via Authorize.net, and handles
   * all post-payment work (earnings split, emails, audit log).
   */
  app.post("/api/authorize-net/charge", requireAuth, payLimiter, async (req: Request, res: Response) => {
    try {
      const { items, refundPolicyAccepted, isTeamPurchase, locale, paymentNonce, isCardPayment, discountCode } = req.body;
      const userId = req.session.userId!;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Items required" });
      }

      if (!refundPolicyAccepted) {
        return res.status(400).json({ error: "You must accept the refund policy" });
      }

      // Re-validate any discount code server-side (never trust the client).
      let discount: DiscountCode | null = null;
      if (discountCode) {
        const validation = await validateDiscountCode(String(discountCode));
        if (!validation.valid) {
          return res.status(400).json({ error: `Discount code ${String(discountCode).toUpperCase()} is not valid: ${validation.reason}` });
        }
        discount = validation.code;
      }

      // Demo mode fallback (dev/staging only)
      if (!isAuthorizeNetConfigured()) {
        if (process.env.DEMO_MODE === "true" && process.env.NODE_ENV !== "production") {
          // Create order in demo mode
          const orderRes = await buildOrder(items, req.session.userId!, isTeamPurchase, locale);
          const order = orderRes.order;

          // Apply discount (server-computed) to the demo order
          const demoDiscount = await applyDiscountToOrder(discount, order.id, orderRes.total);
          const demoTotal = demoDiscount.discountedTotal;

          // Record a demo payment
          const { payments: paymentsTable } = await import("@shared/schema");
          await db.insert(paymentsTable).values({
            orderId: order.id,
            provider: "authorize_net",
            providerTransactionId: `demo-${Date.now()}`,
            amount: String(demoTotal),
            status: "approved",
          });

          await storage.updateOrderStatus(order.id, "paid");

          if (discount && demoDiscount.discountAmount > 0) {
            await recordDiscountRedemption({ codeId: discount.id, orderId: order.id, amountDiscounted: demoDiscount.discountAmount });
          }

          await postPaymentProcessing(order.id, req.session.userId!, `demo-${Date.now()}`, demoTotal, isTeamPurchase);

          return res.json({
            success: true,
            orderId: order.id,
            orderNumber: order.orderNumber,
            transactionId: `demo-${Date.now()}`,
            demoMode: true,
          });
        }

        return res.status(400).json({
          error: "Payment is not configured. Please call us to enroll.",
        });
      }

      if (!paymentNonce) {
        return res.status(400).json({ error: "Payment nonce required" });
      }

      // Build the order
      const orderRes = await buildOrder(items, req.session.userId!, isTeamPurchase, locale);
      const order = orderRes.order;

      // Apply discount (server-computed) before surcharge
      const discountResult = await applyDiscountToOrder(discount, order.id, orderRes.total);
      let total = discountResult.discountedTotal;

      // Add 3% card surcharge if card payment
      let surcharge = 0;
      if (isCardPayment !== false) {
        surcharge = calculateCardSurcharge(total);
        total = Number((total + surcharge).toFixed(2));
      }

      // Charge the card via Authorize.net
      const result = await createTransactionFromNonce(
        paymentNonce,
        total,
        order.id,
        order.orderNumber,
        isCardPayment !== false
      );

      if (!result.success) {
        // Leave order as pending on failure (no "failed" status in schema)
        logger.warn(`Payment declined: order ${order.orderNumber}`, {
          source: "payment",
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            amount: total,
            declineReason: result.errorMessage,
          },
        });
        return res.status(400).json({
          error: result.errorMessage || "Payment was declined",
          orderId: order.id,
        });
      }

      // Record the payment
      const { payments: paymentsTable } = await import("@shared/schema");
      await db.insert(paymentsTable).values({
        orderId: order.id,
        provider: "authorize_net",
        providerTransactionId: result.transactionId,
        amount: String(total),
        status: "approved",
      });

      await storage.updateOrderStatus(order.id, "paid");

      // Record the discount redemption now that the charge succeeded
      if (discount && discountResult.discountAmount > 0) {
        await recordDiscountRedemption({ codeId: discount.id, orderId: order.id, amountDiscounted: discountResult.discountAmount });
      }

      // Post-payment processing (earnings split, emails, audit log)
      await postPaymentProcessing(order.id, req.session.userId!, result.transactionId!, total, isTeamPurchase);

      return res.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        transactionId: result.transactionId,
        surcharge: surcharge > 0 ? surcharge : undefined,
        discountAmount: discountResult.discountAmount > 0 ? discountResult.discountAmount : undefined,
      });
    } catch (error: any) {
      logPaymentError("Charge failed", error, { endpoint: "charge" });
      return res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  /**
   * POST /api/orders/:id/refund
   * Admin-only refund endpoint.
   */
  app.post("/api/orders/:id/refund", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !isAdminRole(user.role)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const orderId = parseInt(String(req.params.id));
      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ error: "Order not found" });

      const { payments: paymentsTable } = await import("@shared/schema");
      const { and: andOp } = await import("drizzle-orm");
      const existingPayments = await db.select().from(paymentsTable)
        .where(andOp(eq(paymentsTable.orderId, order.id), eq(paymentsTable.status, "approved")));

      if (existingPayments.length === 0) {
        return res.status(400).json({ error: "No approved payment found for this order" });
      }

      const payment = existingPayments[0];
      if (!payment.providerTransactionId) {
        return res.status(400).json({ error: "No transaction ID found for refund" });
      }
      const refundResult = await refundTransaction(
        payment.providerTransactionId!,
        Number(order.total),
        order.id
      );

      if (!refundResult.success) {
        return res.status(400).json({ error: refundResult.errorMessage || "Refund failed" });
      }

      await db.insert(paymentsTable).values({
        orderId: order.id,
        provider: "authorize_net",
        providerTransactionId: refundResult.transactionId,
        amount: String(order.total),
        status: "refunded",
      });

      await storage.updateOrderStatus(order.id, "refunded");

      await storage.createAuditLog({
        actorUserId: req.session.userId!,
        action: "refund_processed",
        entity: "orders",
        entityId: String(orderId),
        metadata: {
          orderNumber: order.orderNumber,
          amount: order.total,
          transactionId: refundResult.transactionId,
        },
      });

      return res.json({ success: true, transactionId: refundResult.transactionId });
    } catch (error: any) {
      logPaymentError("Refund failed", error, { endpoint: "refund", orderId: req.params.id });
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}

/**
 * Apply a validated discount code to a freshly built order: computes the
 * server-side discount amount (fixed discounts never take the total below $0,
 * percent is capped at 100), and updates the stored order total so receipts
 * and reporting reflect what was actually charged.
 */
async function applyDiscountToOrder(
  discount: DiscountCode | null,
  orderId: number,
  subtotal: number
): Promise<{ discountedTotal: number; discountAmount: number }> {
  if (!discount) return { discountedTotal: subtotal, discountAmount: 0 };
  const discountAmount = computeDiscountAmount(discount, subtotal);
  const discountedTotal = Number(Math.max(0, subtotal - discountAmount).toFixed(2));
  if (discountAmount > 0) {
    await db.update(ordersTable).set({ total: String(discountedTotal) }).where(eq(ordersTable.id, orderId));
  }
  return { discountedTotal, discountAmount };
}

/**
 * Build an order from cart items (shared between charge and demo paths).
 */
async function buildOrder(
  items: Array<{ courseSlug: string; quantity: number }>,
  userId: number,
  isTeamPurchase: boolean,
  locale?: string
): Promise<{ order: any; total: number }> {
  const ES_SLUG_MAP: Record<string, string> = {
    "online-forklift-operator-certification": "certificacion-operador-montacargas-en-linea",
    "online-forklift-operator-training": "certificacion-operador-montacargas-en-linea",
  };

  const orderItems = [];
  let total = 0;

  for (const item of items) {
    let slug = item.courseSlug;
    if (locale === "es" && ES_SLUG_MAP[slug]) {
      slug = ES_SLUG_MAP[slug];
    }
    const course = await storage.getCourseBySlug(slug);
    if (!course) throw new Error(`Course not found: ${item.courseSlug}`);
    // Flat per-seat pricing for any quantity (July 2026 decision: no automated
    // volume discounts — group pricing is handled manually through quotes).
    const unitPrice = Number(course.price);
    const qty = item.quantity || 1;
    orderItems.push({ courseId: course.id, quantity: qty, unitPrice });
    total += unitPrice * qty;
  }

  const order = await storage.createOrder({
    userId,
    total: String(total),
    status: "pending",
    refundPolicyAccepted: true,
  });

  for (const item of orderItems) {
    await storage.createOrderItem({ orderId: order.id, ...item, unitPrice: String(item.unitPrice) });
    const qty = item.quantity;
    if (isTeamPurchase && qty > 1) {
      await storage.createEnrollment({ userId, courseId: item.courseId, orderId: order.id, status: "active" });
      for (let i = 1; i < qty; i++) {
        await storage.createEnrollment({ userId: undefined, courseId: item.courseId, orderId: order.id, status: "active" });
      }
    } else {
      for (let i = 0; i < qty; i++) {
        await storage.createEnrollment({ userId, courseId: item.courseId, orderId: order.id, status: "active" });
      }
    }
  }

  return { order, total };
}

/**
 * Post-payment processing: earnings split, emails, audit log, group creation.
 */
async function postPaymentProcessing(
  orderId: number,
  userId: number,
  transactionId: string,
  total: number,
  isTeamPurchase: boolean
): Promise<void> {
  const { payments: paymentsTable } = await import("@shared/schema");
  const { and: andOp } = await import("drizzle-orm");

  // Earnings split
  const splitSetting = await db.select().from(platformSettings).where(eq(platformSettings.key, "profit_split"));
  const split = splitSetting[0]?.value as any || { platformPercent: 70, partnerPercent: 30 };
  const platformCut = Number((total * split.platformPercent / 100).toFixed(2));
  const partnerCut = Number((total - platformCut).toFixed(2));

  await db.update(paymentsTable).set({
    platformEarnings: String(platformCut),
    partnerEarnings: String(partnerCut),
  }).where(andOp(eq(paymentsTable.orderId, orderId), eq(paymentsTable.status, "approved")));

  // Audit log
  await storage.createAuditLog({
    actorUserId: userId,
    action: "payment_completed",
    entity: "orders",
    entityId: String(orderId),
    metadata: { transactionId, amount: String(total), platformEarnings: platformCut, partnerEarnings: partnerCut },
  });

  // Group creation for team purchases
  const orderEnrollments = await storage.getEnrollmentsByOrder(orderId);
  const isTeamOrder = orderEnrollments.some(e => e.userId === null);
  const user = await storage.getUser(userId);
  if (isTeamOrder && isTeamPurchase && !user?.role?.includes("group_admin")) {
    const groupName = `${user?.name || "Team"}'s Training Crew`;
    const group = await storage.createGroup({ name: groupName, adminUserId: userId });
    await storage.updateUserRole(userId, "group_admin");
    await storage.updateOrderGroupId(orderId, group.id);
  }

  // Emails
  if (user) {
    const items = await storage.getOrderItems(orderId);
    let courseLanguage: string | undefined;
    const courseLookup = await Promise.all(items.map(async (item: any) => {
      const course = await storage.getCourse(item.courseId);
      if (course?.language === "es") courseLanguage = "es";
      return { title: course?.title || "Course", quantity: item.quantity, unitPrice: Number(item.unitPrice) };
    }));
    const orderLocale = await resolveLocale({ userId, courseLanguage });
    await sendOrderReceipt({
      to: user.email,
      orderNumber: (await storage.getOrder(orderId))?.orderNumber || "",
      items: courseLookup,
      total,
      actorUserId: userId,
      locale: orderLocale,
    });

    try {
      await sendNewOrderAdminAlert({
        orderNumber: (await storage.getOrder(orderId))?.orderNumber || "",
        customerName: user.name,
        customerEmail: user.email,
        items: courseLookup,
        total,
      });
    } catch (emailErr) {
      console.error("[AuthorizeNet] Admin alert email error (non-fatal):", emailErr);
    }
  }
}
