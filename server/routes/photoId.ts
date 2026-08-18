import type { Express, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { db } from "../db";
import { and, eq, isNull } from "drizzle-orm";
import { photoIdEntitlements, payments, groupMembers } from "@shared/schema";
import { requireAuth, payLimiter } from "./middleware";
import { isAdminRole } from "@shared/roles";
import { logger } from "../monitoring";
import { resolveLocale } from "../locale-resolver";
import { sendCardOrderReceipt, sendPhotoIdFulfilledAlert, sendPhotoIdMemberRequest } from "../email";
import { brand } from "@shared/config/brand";
import { SHIPPING_RATES } from "../constants";

/**
 * Chunk 2 of the wallet-card redesign (.hermes/fable-wallet-card-spec.md):
 * the fulfillment half of the checkout add-on. Money moved at course
 * checkout (Chunk 1 created photo_id_entitlements rows); these endpoints
 * let a member (or their group admin) attach a photo, consume one
 * entitlement, and create the real cert_card_orders row with a valid
 * certificationId. No second charge ever happens here.
 */

const photoUploadSchema = z.object({
  certificationId: z.number().int().positive(),
  // Same JPEG guard as POST /api/cert-cards (client downscales to <=480px).
  idPhoto: z.string().regex(/^data:image\/jpeg;base64,/, "Photo must be a JPEG").max(120_000),
});

type EntitlementRow = typeof photoIdEntitlements.$inferSelect;

/** True when the user may consume this entitlement for this certification. */
async function canConsumeEntitlement(
  ent: EntitlementRow,
  userId: number,
  certificationCourseId: number,
  certificationUserId: number
): Promise<boolean> {
  // Buyer always may (they paid). Individual entitlements are pre-linked.
  if (ent.purchasedByUserId === userId) return true;
  // The certified member may claim an unclaimed team entitlement from an
  // order whose course matches their certification.
  if (certificationUserId === userId && ent.enrollmentId === null) {
    const order = await storage.getOrder(ent.orderId);
    if (!order) return false;
    const orderEnrollments = await storage.getEnrollmentsByOrder(order.id);
    return orderEnrollments.some((e) => e.courseId === certificationCourseId);
  }
  return false;
}

export function registerPhotoIdRoutes(app: Express) {
  /**
   * GET /api/photo-id/entitlements?certificationId=N
   * Entitlements the current user can act on for a given certification:
   * rows they purchased plus unclaimed team rows matching the cert's course.
   * Used by OrderCertCard.tsx to branch into the prepaid (no-payment) flow.
   */
  app.get("/api/photo-id/entitlements", requireAuth, async (req: Request, res: Response) => {
    try {
      const certificationId = parseInt(String(req.query.certificationId || "0"));
      if (!certificationId) return res.status(400).json({ error: "certificationId required" });
      const cert = await storage.getCertification(certificationId);
      if (!cert) return res.status(404).json({ error: "Certification not found" });

      const userId = req.session.userId!;
      const purchased = await db
        .select()
        .from(photoIdEntitlements)
        .where(and(eq(photoIdEntitlements.purchasedByUserId, userId), eq(photoIdEntitlements.status, "awaiting_photo")));

      // Unclaimed team entitlements whose order covers this cert's course and
      // whose buyer enrolled this user (member-claim path, spec 1.5/5.2).
      const claimable: EntitlementRow[] = [];
      if (cert.userId === userId) {
        const unclaimed = await db
          .select()
          .from(photoIdEntitlements)
          .where(and(isNull(photoIdEntitlements.enrollmentId), eq(photoIdEntitlements.status, "awaiting_photo")));
        for (const ent of unclaimed) {
          if (await canConsumeEntitlement(ent, userId, cert.courseId, cert.userId)) claimable.push(ent);
        }
      }

      const seen = new Set<number>();
      const entitlements = [...purchased, ...claimable].filter((e) => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });

      return res.json({ entitlements });
    } catch (error) {
      logger.error("[PhotoId] List entitlements failed", { source: "server", metadata: { error: String(error) } });
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * POST /api/photo-id/request  (Flow 3, member-initiated)
   * A certified member with no active card order and no claimable entitlement
   * asks their crew admin to order a photo ID for them. Notifies the admin
   * with a link to the order flow. No charge happens here - it is a request.
   * Body: { certificationId }
   */
  app.post("/api/photo-id/request", requireAuth, async (req: Request, res: Response) => {
    try {
      const certificationId = parseInt(String(req.body?.certificationId || "0"));
      if (!certificationId) return res.status(400).json({ error: "certificationId required" });
      const cert = await storage.getCertification(certificationId);
      if (!cert) return res.status(404).json({ error: "Certification not found" });

      const userId = req.session.userId!;
      if (cert.userId !== userId) return res.status(403).json({ error: "You can only request a photo ID for your own certification" });

      // Already has an active card order? Nothing to request.
      const existing = await storage.getCertCardOrdersByCertification(certificationId);
      const active = existing.find((co) => !["canceled", "refunded"].includes(co.status));
      if (active) return res.status(409).json({ error: "A card order already exists for this certification" });

      // Already has a claimable entitlement? They should just upload a photo.
      const claimable = await db
        .select()
        .from(photoIdEntitlements)
        .where(and(isNull(photoIdEntitlements.enrollmentId), eq(photoIdEntitlements.status, "awaiting_photo")));
      for (const ent of claimable) {
        if (await canConsumeEntitlement(ent, userId, cert.courseId, cert.userId)) {
          return res.status(409).json({ error: "A photo ID is already available to you - just add your photo", entitlementId: ent.id });
        }
      }

      // Find the crew admin for this member.
      const memberUser = await storage.getUser(userId);
      const course = await storage.getCourse(cert.courseId);
      let adminUser: any = null;
      const allGroupMembers = await db.select().from(groupMembers).where(eq(groupMembers.userId, userId));
      for (const gm of allGroupMembers) {
        const group = await storage.getGroup(gm.groupId);
        if (group) {
          adminUser = await storage.getUser(group.adminUserId);
          if (adminUser) break;
        }
      }
      if (!adminUser?.email) {
        return res.status(404).json({ error: "No crew admin found for your account. Please contact support to order a photo ID." });
      }

      const baseUrl = process.env.SITE_URL || `https://${brand.domain}`;
      const orderUrl = `${baseUrl}/order-cert-card/${certificationId}`;
      const memberLocale = await resolveLocale({ userId });

      await sendPhotoIdMemberRequest({
        to: adminUser.email,
        memberName: memberUser?.name || "A crew member",
        courseName: course?.title || "",
        orderUrl,
        actorUserId: userId,
        locale: memberLocale,
      });

      await storage.createAuditLog({
        actorUserId: userId,
        action: "photo_id_requested",
        entity: "certifications",
        entityId: String(certificationId),
        metadata: { adminUserId: adminUser.id, adminEmail: adminUser.email },
      });

      return res.status(200).json({ success: true, adminNotified: true });
    } catch (error) {
      logger.error("[PhotoId] Member request failed", { source: "server", metadata: { error: String(error) } });
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * POST /api/photo-id/:entitlementId/photo
   * Consume one prepaid entitlement: attach the member's photo, create the
   * cert_card_orders row (status "paid", no new charge), flip the
   * entitlement to fulfilled. Money already moved at course checkout.
   */
  app.post("/api/photo-id/:entitlementId/photo", requireAuth, payLimiter, async (req: Request, res: Response) => {
    try {
      const entitlementId = parseInt(String(req.params.entitlementId));
      const parsed = photoUploadSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid photo upload" });
      }
      const { certificationId, idPhoto } = parsed.data;

      const [ent] = await db.select().from(photoIdEntitlements).where(eq(photoIdEntitlements.id, entitlementId));
      if (!ent) return res.status(404).json({ error: "Photo ID entitlement not found" });
      if (ent.status !== "awaiting_photo") {
        return res.status(409).json({ error: "This photo ID has already been fulfilled or refunded" });
      }

      const cert = await storage.getCertification(certificationId);
      if (!cert) return res.status(404).json({ error: "Certification not found" });

      const userId = req.session.userId!;
      const allowed = await canConsumeEntitlement(ent, userId, cert.courseId, cert.userId);
      // Group admins may also upload on behalf of their members (spec 2.3).
      let adminOverride = false;
      if (!allowed) {
        const currentUser = await storage.getUser(userId);
        if (currentUser && (isAdminRole(currentUser.role) || currentUser.role === "group_admin")) {
          const groups = await storage.getGroupsByAdmin(userId);
          for (const group of groups) {
            const members = await storage.listGroupMembers(group.id);
            if (members.some((m) => m.userId === cert.userId)) {
              adminOverride = true;
              break;
            }
          }
          if (isAdminRole(currentUser.role)) adminOverride = true;
        }
      }
      if (!allowed && !adminOverride) {
        return res.status(403).json({ error: "You cannot use this photo ID entitlement" });
      }

      // No duplicate active card order for this cert+user.
      const existing = await storage.getCertCardOrdersByCertification(certificationId);
      const active = existing.find((co) => co.userId === cert.userId && !["canceled", "refunded"].includes(co.status));
      if (active) {
        return res.status(409).json({ error: "An active card order already exists for this certification", existingOrderId: active.id });
      }

      const shippingAddress = ent.shippingAddress as {
        name: string; address: string; city: string; state: string; zip: string; country?: string;
      };
      const shippingCost = SHIPPING_RATES[ent.shippingMethod as keyof typeof SHIPPING_RATES] ?? 0;

      // Original transaction id from the course-order payment (bookkeeping
      // only; the card itself is a fulfillment of that charge, not a new one).
      const [originalPayment] = await db
        .select()
        .from(payments)
        .where(and(eq(payments.orderId, ent.orderId), eq(payments.status, "approved")));

      const cardOrder = await storage.createCertCardOrder({
        userId: cert.userId,
        certificationId,
        quantity: 1,
        shippingAddress,
        billingAddress: shippingAddress,
        idPhoto,
        shippingMethod: ent.shippingMethod,
        shippingCost: String(shippingCost),
        totalAmount: ent.amount,
        status: "paid",
        providerTransactionId: originalPayment?.providerTransactionId ?? `entitlement-${ent.id}`,
        chargeMetadata: {
          provider: "prepaid_entitlement",
          entitlementId: ent.id,
          orderId: ent.orderId,
          prepaid: true,
        },
        paidAt: new Date(),
      });

      await db
        .update(photoIdEntitlements)
        .set({
          status: "fulfilled",
          enrollmentId: cert.enrollmentId,
          certCardOrderId: cardOrder.id,
          updatedAt: new Date(),
        })
        .where(eq(photoIdEntitlements.id, ent.id));

      await storage.createAuditLog({
        actorUserId: userId,
        action: "photo_id_fulfilled",
        entity: "cert_card_orders",
        entityId: String(cardOrder.id),
        metadata: { entitlementId: ent.id, certificationId, onBehalf: adminOverride },
      });

      try {
        const cardUser = await storage.getUser(cert.userId);
        if (cardUser) {
          const cardLocale = await resolveLocale({ userId: cardUser.id });
          await sendCardOrderReceipt({
            to: cardUser.email,
            certNumber: cert.certificateNumber,
            shippingMethod: ent.shippingMethod,
            shippingCost,
            totalAmount: Number(ent.amount),
            actorUserId: userId,
            locale: cardLocale,
          });
        }
      } catch (emailErr) {
        console.error("[PhotoId] Receipt email error (non-fatal):", emailErr);
      }

      // Flow 2: notify the crew admin (the entitlement purchaser) and the
      // operator (Alberto) that the card is paid + photo is in -> ready to
      // print/mail. Non-fatal.
      try {
        const cardUser = await storage.getUser(cert.userId);
        const course = await storage.getCourse(cert.courseId);
        const recipients = new Set<string>();

        // The crew admin who purchased this entitlement.
        const purchaser = await storage.getUser(ent.purchasedByUserId);
        if (purchaser?.email) recipients.add(purchaser.email);
        // The operator (Alberto) — fulfills/prints/mails the card.
        recipients.add(process.env.ADMIN_EMAIL || `admin@${brand.domain}`);

        for (const to of recipients) {
          await sendPhotoIdFulfilledAlert({
            to,
            memberName: cardUser?.name || "A member",
            certNumber: cert.certificateNumber,
            courseName: course?.title || "",
            cardOrderId: cardOrder.id,
            actorUserId: userId,
            locale: "en",
          });
        }
      } catch (fulfillErr) {
        console.error("[PhotoId] Fulfilled-alert email error (non-fatal):", fulfillErr);
      }

      return res.status(201).json({ cardOrder });
    } catch (error) {
      console.error("[PhotoId] Photo upload error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * GET /api/groups/:id/photo-id-status
   * Group-admin per-member photo-ID status (spec 2.3). Mirrors the ownership
   * check used by the other /api/groups/:id routes.
   */
  app.get("/api/groups/:id/photo-id-status", requireAuth, async (req: Request, res: Response) => {
    try {
      const group = await storage.getGroup(parseInt(String(req.params.id)));
      if (!group || group.adminUserId !== req.session.userId) {
        const currentUser = await storage.getUser(req.session.userId!);
        if (!currentUser || !isAdminRole(currentUser.role)) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      if (!group) return res.status(404).json({ error: "Group not found" });

      const members = await storage.listGroupMembers(group.id);
      const rows: {
        userId: number;
        name: string;
        email: string;
        certifications: {
          certificationId: number;
          courseTitle: string;
          status: "not_ordered" | "photo_needed" | "ordered" | "shipped";
          entitlementId?: number;
          cardOrderId?: number;
          trackingNumber?: string | null;
          carrier?: string | null;
        }[];
      }[] = [];

      for (const member of members) {
        if (!member.userId) continue;
        const memberUser = await storage.getUser(member.userId);
        if (!memberUser) continue;
        const certs = await storage.getCertificationsByUser(member.userId);
        const certRows: (typeof rows)[number]["certifications"] = [];

        for (const cert of certs) {
          const course = await storage.getCourse(cert.courseId);
          const cardOrders = await storage.getCertCardOrdersByCertification(cert.id);
          const activeOrder = cardOrders.find((co) => !["canceled", "refunded"].includes(co.status));

          // Awaiting-photo entitlement claimable by/for this member.
          const entitlements = await db
            .select()
            .from(photoIdEntitlements)
            .where(eq(photoIdEntitlements.status, "awaiting_photo"));
          const claimable = entitlements.find(
            (e) => e.enrollmentId === cert.enrollmentId || (e.enrollmentId === null && e.purchasedByUserId === group.adminUserId)
          );

          if (activeOrder) {
            certRows.push({
              certificationId: cert.id,
              courseTitle: course?.title || "",
              status: activeOrder.status === "shipped" ? "shipped" : "ordered",
              cardOrderId: activeOrder.id,
              trackingNumber: activeOrder.trackingNumber,
              carrier: activeOrder.carrier,
            });
          } else if (claimable) {
            certRows.push({
              certificationId: cert.id,
              courseTitle: course?.title || "",
              status: "photo_needed",
              entitlementId: claimable.id,
            });
          } else {
            certRows.push({ certificationId: cert.id, courseTitle: course?.title || "", status: "not_ordered" });
          }
        }

        if (certRows.length > 0) {
          rows.push({ userId: memberUser.id, name: memberUser.name, email: memberUser.email, certifications: certRows });
        }
      }

      return res.json({ members: rows });
    } catch (error) {
      console.error("[PhotoId] Group status error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}
