import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { platformSettings } from "@shared/schema";
import { isAdminRole } from "@shared/roles";
import { sendOrderReceipt, sendNewOrderAdminAlert } from "../email";
import { generateInvoicePdf } from "../invoice-pdf";
import { pdfStore } from "../pdf-store";
import { resolveLocale } from "../locale-resolver";
import { requireAuth } from "./middleware";

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
