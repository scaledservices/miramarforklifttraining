import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { platformSettings } from "@shared/schema";
import { isAdminRole } from "@shared/roles";
import { createPaymentIntent, confirmPaymentCompleted } from "../payments";
import { getStripePublishableKey, isStripeConfigured } from "../stripeClient";
import { sendOrderReceipt, sendNewOrderAdminAlert } from "../email";
import { generateInvoicePdf } from "../invoice-pdf";
import { pdfStore } from "../pdf-store";
import { resolveLocale } from "../locale-resolver";
import { requireAuth, payLimiter } from "./middleware";

export function registerOrderRoutes(app: Express) {
app.post("/api/orders", requireAuth, async (req: Request, res: Response) => {
  try {
    const { items, groupId, isTeamPurchase, refundPolicyAccepted } = req.body;
    if (!refundPolicyAccepted) return res.status(400).json({ error: "You must accept the refund policy" });
    if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "Cart is empty" });

    let total = 0;
    const validatedItems: { courseId: number; quantity: number; unitPrice: string }[] = [];

    for (const item of items) {
      const course = item.courseSlug
        ? await storage.getCourseBySlug(item.courseSlug)
        : await storage.getCourse(item.courseId);
      if (!course || !course.isActive) return res.status(400).json({ error: `Course ${item.courseSlug || item.courseId} not found or inactive` });
      let qty = Math.max(1, parseInt(item.quantity) || 1);
      if (!isTeamPurchase && qty > 1) {
        qty = 1;
      }
      total += parseFloat(course.price) * qty;
      validatedItems.push({ courseId: course.id, quantity: qty, unitPrice: course.price });
    }

    let effectiveGroupId = groupId || null;

    if (isTeamPurchase && !effectiveGroupId) {
      const existingGroups = await storage.getGroupsByAdmin(req.session.userId!);
      if (existingGroups.length > 0) {
        effectiveGroupId = existingGroups[existingGroups.length - 1].id;
      }
    }

    const order = await storage.createOrder({
      userId: req.session.userId!,
      groupId: effectiveGroupId,
      total: String(total),
      status: "pending",
      refundPolicyAccepted: true,
      abandonedEmailSent: false,
    });

    for (const item of validatedItems) {
      await storage.createOrderItem({
        orderId: order.id,
        courseId: item.courseId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });

      if (isTeamPurchase) {
        for (let i = 0; i < item.quantity; i++) {
          await storage.createEnrollment({
            userId: null,
            courseId: item.courseId,
            orderId: order.id,
            status: "active",
          });
        }
      } else {
        const existingEnrollments = await storage.getEnrollmentsByUser(req.session.userId!);
        const alreadyEnrolled = existingEnrollments.some(
          (e) => e.courseId === item.courseId && e.status !== "revoked"
        );
        if (alreadyEnrolled) {
          console.warn(`[Orders] User ${req.session.userId} already enrolled in course ${item.courseId}, skipping duplicate enrollment`);
        } else {
          await storage.createEnrollment({
            userId: req.session.userId!,
            courseId: item.courseId,
            orderId: order.id,
            status: "active",
          });
        }
      }
    }

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "order_created",
      entity: "orders",
      entityId: String(order.id),
      metadata: { orderNumber: order.orderNumber, total, itemCount: validatedItems.length, isTeamPurchase: !!isTeamPurchase },
    });

    return res.status(201).json({ order });
  } catch (error) {
    console.error("[Orders] Create error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/orders", requireAuth, async (req: Request, res: Response) => {
  try {
    const orderList = await storage.getOrdersByUser(req.session.userId!);
    return res.json({ orders: orderList });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/orders/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const order = await storage.getOrder(parseInt(req.params.id));
    if (!order || order.userId !== req.session.userId) return res.status(404).json({ error: "Order not found" });
    const items = await storage.getOrderItems(order.id);
    const orderEnrollments = await storage.getEnrollmentsByOrder(order.id);
    return res.json({ order, items, enrollments: orderEnrollments });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/stripe/config", async (_req: Request, res: Response) => {
  try {
    if (!isStripeConfigured()) {
      return res.json({ configured: false, demoMode: process.env.DEMO_MODE === "true" });
    }
    const publishableKey = await getStripePublishableKey();
    return res.json({ configured: true, publishableKey });
  } catch (err) {
    return res.json({ configured: false, demoMode: process.env.DEMO_MODE === "true" });
  }
});

app.post("/api/create-payment-intent", requireAuth, payLimiter, async (req: Request, res: Response) => {
  try {
    const { items, refundPolicyAccepted, isTeamPurchase, locale } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items required" });
    }

    const ES_SLUG_MAP: Record<string, string> = {
      "online-forklift-operator-certification": "certificacion-operador-montacargas-en-linea",
      "online-forklift-operator-training": "certificacion-operador-montacargas-en-linea",
    };

    const orderRes = await (async () => {
      const orderItems = [];
      let total = 0;
      for (const item of items) {
        let slug = item.courseSlug;
        if (locale === "es" && ES_SLUG_MAP[slug]) {
          slug = ES_SLUG_MAP[slug];
        }
        const course = await storage.getCourseBySlug(slug);
        if (!course) throw new Error(`Course not found: ${item.courseSlug}`);
        const unitPrice = Number(course.price);
        const qty = item.quantity || 1;
        const BULK_TIERS = [
          { min: 25, price: 44.99 },
          { min: 10, price: 49.99 },
          { min: 5, price: 54.99 },
        ];
        let finalPrice = unitPrice;
        if (course.slug === "online-forklift-operator-training" || course.slug === "certificacion-operador-montacargas-en-linea") {
          for (const tier of BULK_TIERS) {
            if (qty >= tier.min) { finalPrice = tier.price; break; }
          }
        }
        orderItems.push({ courseId: course.id, quantity: qty, unitPrice: finalPrice });
        total += finalPrice * qty;
      }
      return { orderItems, total };
    })();

    const order = await storage.createOrder({
      userId: req.session.userId!,
      total: String(orderRes.total),
      status: "pending",
      refundPolicyAccepted: refundPolicyAccepted || false,
    });

    for (const item of orderRes.orderItems) {
      await storage.createOrderItem({ orderId: order.id, ...item, unitPrice: String(item.unitPrice) });
      const qty = item.quantity;
      if (isTeamPurchase && qty > 1) {
        await storage.createEnrollment({ userId: req.session.userId!, courseId: item.courseId, orderId: order.id, status: "active" });
        for (let i = 1; i < qty; i++) {
          await storage.createEnrollment({ userId: undefined, courseId: item.courseId, orderId: order.id, status: "active" });
        }
      } else {
        for (let i = 0; i < qty; i++) {
          await storage.createEnrollment({ userId: req.session.userId!, courseId: item.courseId, orderId: order.id, status: "active" });
        }
      }
    }

    const result = await createPaymentIntent(orderRes.total, order.id, order.orderNumber);
    if (!result.success) {
      return res.status(400).json({ error: result.errorMessage || "Failed to create payment" });
    }

    return res.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      clientSecret: result.clientSecret,
      transactionId: result.transactionId,
      demoMode: !isStripeConfigured(),
    });
  } catch (error: any) {
    console.error("[Payment] Create payment intent error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

app.post("/api/orders/:id/pay", payLimiter, requireAuth, async (req: Request, res: Response) => {
  try {
    const order = await storage.getOrder(parseInt(req.params.id));
    if (!order || order.userId !== req.session.userId) return res.status(404).json({ error: "Order not found" });
    if (order.status === "paid") {
      const existingPayments = await storage.getPaymentsByOrder(order.id);
      const approved = existingPayments.find((p: any) => p.status === "approved");
      return res.json({ success: true, transactionId: approved?.providerTransactionId || "already_paid", alreadyPaid: true });
    }
    if (order.status !== "pending") return res.status(400).json({ error: "Order cannot be paid" });

    const { paymentIntentId } = req.body;

    let result;
    if (paymentIntentId && isStripeConfigured()) {
      result = await confirmPaymentCompleted(paymentIntentId, order.id);
    } else if (!isStripeConfigured()) {
      result = await createPaymentIntent(Number(order.total), order.id, order.orderNumber);
    } else {
      return res.status(400).json({ error: "Payment intent ID required for Stripe payments" });
    }

    if (!result || !result.success) {
      return res.status(400).json({ error: result?.errorMessage || "Payment failed" });
    }

    const { payments: paymentsTable } = await import("@shared/schema");
    const { and: andOp } = await import("drizzle-orm");
    const splitSetting = await db.select().from(platformSettings).where(eq(platformSettings.key, "profit_split"));
    const split = splitSetting[0]?.value as any || { platformPercent: 70, partnerPercent: 30 };
    const amount = Number(order.total);
    const platformCut = Number((amount * split.platformPercent / 100).toFixed(2));
    const partnerCut = Number((amount - platformCut).toFixed(2));

    await db.update(paymentsTable).set({
      platformEarnings: String(platformCut),
      partnerEarnings: String(partnerCut),
    }).where(andOp(eq(paymentsTable.orderId, order.id), eq(paymentsTable.status, "approved")));

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "payment_completed",
      entity: "orders",
      entityId: String(order.id),
      metadata: { orderNumber: order.orderNumber, amount: order.total, transactionId: result.transactionId, platformEarnings: platformCut, partnerEarnings: partnerCut },
    });

    const user = await storage.getUser(req.session.userId!);

    const orderEnrollments = await storage.getEnrollmentsByOrder(order.id);
    const isTeamOrder = orderEnrollments.some(e => e.userId === null);
    if (isTeamOrder && !order.groupId && user && user.role !== "group_admin") {
      const groupName = `${user.name || "Team"}'s Training Crew`;
      const group = await storage.createGroup({ name: groupName, adminUserId: req.session.userId! });
      await storage.updateUserRole(req.session.userId!, "group_admin");
      await storage.updateOrderGroupId(order.id, group.id);

      await storage.createAuditLog({
        actorUserId: req.session.userId!,
        action: "group_created",
        entity: "groups",
        entityId: String(group.id),
        metadata: { name: groupName, reason: "team_purchase", orderId: order.id },
      });
    }

    if (user) {
      const items = await storage.getOrderItems(order.id);
      let courseLanguage: string | undefined;
      const courseLookup = await Promise.all(items.map(async (item: any) => {
        const course = await storage.getCourse(item.courseId);
        if (course?.language === "es") courseLanguage = "es";
        return { title: course?.title || "Course", quantity: item.quantity, unitPrice: Number(item.unitPrice) };
      }));
      const orderLocale = await resolveLocale({ userId: user.id, courseLanguage });
      await sendOrderReceipt({ to: user.email, orderNumber: order.orderNumber, items: courseLookup, total: Number(order.total), actorUserId: user.id, locale: orderLocale });

      try {
        await sendNewOrderAdminAlert({
          orderNumber: order.orderNumber,
          customerName: user.name,
          customerEmail: user.email,
          items: courseLookup,
          total: Number(order.total),
        });
      } catch (emailErr) {
        console.error("[Orders] Admin alert email error (non-fatal):", emailErr);
      }
    }

    return res.json({ success: true, transactionId: result.transactionId });
  } catch (error) {
    console.error("[Orders] Pay error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/orders/:id/invoice", requireAuth, async (req: Request, res: Response) => {
  try {
    const order = await storage.getOrder(parseInt(req.params.id));
    if (!order) return res.status(404).json({ error: "Order not found" });

    const user = await storage.getUser(req.session.userId!);
    const isOwner = order.userId === req.session.userId;
    const isAdmin = user ? isAdminRole(user.role) : false;
    let isGroupAdmin = false;
    if (order.groupId) {
      const group = await storage.getGroup(order.groupId);
      isGroupAdmin = group?.adminUserId === req.session.userId;
    }
    if (!isOwner && !isAdmin && !isGroupAdmin) return res.status(403).json({ error: "Access denied" });

    const relativePath = await generateInvoicePdf(order.id);
    const pdfBuffer = await pdfStore.read(relativePath);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="invoice-${order.orderNumber}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});
}
