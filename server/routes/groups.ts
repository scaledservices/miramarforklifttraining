import type { Express, Request, Response } from "express";
import { and, eq, ne, isNull } from "drizzle-orm";
import { db } from "../db";
import { enrollments as enrollmentsTable, photoIdEntitlements, platformSettings, groupMembers } from "@shared/schema";
import { brand } from "@shared/config/brand";
import { storage } from "../storage";
import { isInviteExpired } from "../auth";
import { sendGroupInvite, sendTrainingReminder, sendSeatAssignedNotification, sendPhotoIdUploadRequest } from "../email";
import { resolveLocale } from "../locale-resolver";
import { requireAuth, payLimiter } from "./middleware";
import { SHIPPING_RATES } from "../constants";
import { isAuthorizeNetConfigured, createTransactionFromNonce, calculateCardSurcharge } from "../authorizeNetClient";
import { logger } from "../monitoring";

// Photo ID wallet card pricing (matches certs.ts / authorizeNet.ts).
const PHOTO_ID_PRICE = 9.99;

export function registerGroupRoutes(app: Express) {
app.get("/api/groups", requireAuth, async (req: Request, res: Response) => {
  try {
    const groupList = await storage.getGroupsByAdmin(req.session.userId!);
    return res.json({ groups: groupList });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/groups", requireAuth, async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Group name is required" });

    const group = await storage.createGroup({ name, adminUserId: req.session.userId! });
    await storage.updateUserRole(req.session.userId!, "group_admin");

    return res.status(201).json({ group });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/groups/:id/members", requireAuth, async (req: Request, res: Response) => {
  try {
    const group = await storage.getGroup(parseInt(req.params.id));
    if (!group || group.adminUserId !== req.session.userId) return res.status(403).json({ error: "Access denied" });
    const members = await storage.listGroupMembers(group.id);

    const orders = await storage.getOrdersByUser(group.adminUserId);
    const groupOrders = orders.filter((o: any) => o.groupId === group.id);
    let allEnrollments: any[] = [];
    for (const order of groupOrders) {
      const enrollments = await storage.getEnrollmentsByOrder(order.id);
      for (const e of enrollments) {
        const course = await storage.getCourse(e.courseId);
        const progress = await storage.getStepProgress(e.id);
        const steps = await storage.getCourseSteps(e.courseId);
        const completedSteps = progress.filter((p: any) => p.status === "completed").length;
        const totalSteps = steps.length;
        const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
        allEnrollments.push({
          ...e,
          courseName: course?.title || "Unknown",
          progressPct,
        });
      }
    }

    const enrichedMembers = members.map((m: any) => {
      const memberEnrollment = m.userId
        ? allEnrollments.find((e: any) => e.userId === m.userId)
        : m.pendingEnrollmentId
          ? allEnrollments.find((e: any) => e.id === m.pendingEnrollmentId)
          : null;

      let trainingStatus = "invited";
      if (m.acceptedAt) trainingStatus = "active";
      if (memberEnrollment) {
        if (memberEnrollment.status === "revoked") {
          trainingStatus = "revoked";
        } else if (memberEnrollment.status === "completed") {
          trainingStatus = "completed";
        } else if (memberEnrollment.progressPct > 0) {
          trainingStatus = "in_progress";
        }
      }

      return {
        ...m,
        trainingStatus,
        courseName: memberEnrollment?.courseName || null,
        progressPct: memberEnrollment?.progressPct || 0,
        enrollmentId: memberEnrollment?.id || null,
      };
    });

    return res.json({ members: enrichedMembers });
  } catch (error) {
    console.error("[Groups] List members error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/groups/:id/invite", requireAuth, async (req: Request, res: Response) => {
  try {
    const group = await storage.getGroup(parseInt(req.params.id));
    if (!group || group.adminUserId !== req.session.userId) return res.status(403).json({ error: "Access denied" });

    const { email, name, enrollmentId } = req.body;
    if (!email || !name) return res.status(400).json({ error: "Email and name are required" });

    const existing = await storage.getGroupMemberByGroupAndEmail(group.id, email.trim());
    if (existing) {
      if (existing.acceptedAt) {
        return res.status(400).json({ error: "This person is already a member of this group." });
      }
      return res.status(400).json({ error: "This person has already been invited. Use Resend to send the invitation again." });
    }

    if (enrollmentId) {
      const allMembers = await storage.listGroupMembers(group.id);
      const seatAlreadyPending = allMembers.find(m => m.pendingEnrollmentId === enrollmentId && !m.acceptedAt);
      if (seatAlreadyPending) {
        return res.status(400).json({ error: "This seat is already pending assignment to another invited member." });
      }

      const targetEnrollment = await storage.getEnrollment(enrollmentId);
      if (!targetEnrollment) return res.status(400).json({ error: "Enrollment seat not found." });
      const enrollOrder = targetEnrollment.orderId ? await storage.getOrder(targetEnrollment.orderId) : null;
      if (!enrollOrder || enrollOrder.groupId !== group.id) {
        return res.status(403).json({ error: "This seat does not belong to your group." });
      }
      const existingUser = await storage.getUserByEmail(email.trim().toLowerCase());
      if (existingUser) {
        const conflicting = await db.select({ id: enrollmentsTable.id })
          .from(enrollmentsTable)
          .where(and(
            eq(enrollmentsTable.userId, existingUser.id),
            eq(enrollmentsTable.courseId, targetEnrollment.courseId),
            ne(enrollmentsTable.status, "revoked")
          ))
          .limit(1);
        if (conflicting.length > 0) {
          return res.status(400).json({ error: "This person already has an active enrollment for this course." });
        }
      }
    }

    const member = await storage.addGroupMember({
      groupId: group.id,
      email: email.trim().toLowerCase(),
      name,
      invitedByUserId: req.session.userId!,
      pendingEnrollmentId: enrollmentId || null,
    });

    const inviter = await storage.getUser(req.session.userId!);
    const inviteLocale = await resolveLocale({ userId: req.session.userId! });
    const siteUrl = process.env.SITE_URL || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : `https://${brand.domain}`);
    const inviteUrl = `${siteUrl}/accept-invite?token=${member.inviteToken}`;

    let emailDeliveryStatus = "error";
    try {
      const delivered = await sendGroupInvite({
        to: email,
        inviterName: inviter?.name || "Your team admin",
        groupName: group.name,
        inviteToken: member.inviteToken,
        actorUserId: req.session.userId!,
        locale: inviteLocale,
      });
      emailDeliveryStatus = delivered ? "sent" : "error";
      console.info("[Groups][Outbox] invite_sent", { recipient: email, inviteUrl, providerStatus: emailDeliveryStatus, groupId: group.id, memberId: member.id });
    } catch (emailErr) {
      console.error("[Groups][Outbox] invite_sent delivery error (non-fatal):", { recipient: email, inviteUrl, error: (emailErr as Error).message });
      emailDeliveryStatus = "error";
    }

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "invite_sent",
      entity: "group_members",
      entityId: String(member.id),
      metadata: {
        email,
        groupId: group.id,
        pendingEnrollmentId: enrollmentId || null,
        inviteUrl,
        emailDeliveryStatus,
      },
    });

    return res.status(201).json({ member, inviteUrl, emailDeliveryStatus });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/groups/:id/members/:memberId/resend", requireAuth, async (req: Request, res: Response) => {
  try {
    const group = await storage.getGroup(parseInt(req.params.id));
    if (!group || group.adminUserId !== req.session.userId) return res.status(403).json({ error: "Access denied" });

    const member = await storage.resendInvite(parseInt(req.params.memberId));
    if (!member) return res.status(404).json({ error: "Member not found" });

    const siteUrlResend = process.env.SITE_URL || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : `https://${brand.domain}`);
    const inviteUrlResend = `${siteUrlResend}/accept-invite?token=${member.inviteToken}`;

    const resendLocale = await resolveLocale({ userId: req.session.userId! });
    let resendDeliveryStatus = "error";
    try {
      const inviterResend = await storage.getUser(req.session.userId!);
      const resendDelivered = await sendGroupInvite({
        to: member.email,
        inviterName: inviterResend?.name || "Your team admin",
        groupName: group.name,
        inviteToken: member.inviteToken,
        actorUserId: req.session.userId!,
        locale: resendLocale,
      });
      resendDeliveryStatus = resendDelivered ? "sent" : "error";
      console.info("[Groups][Outbox] invite_resent", { recipient: member.email, inviteUrl: inviteUrlResend, providerStatus: resendDeliveryStatus, groupId: group.id, memberId: member.id });
    } catch (emailErr) {
      console.error("[Groups][Outbox] invite_resent delivery error (non-fatal):", { recipient: member.email, inviteUrl: inviteUrlResend, error: (emailErr as Error).message });
      resendDeliveryStatus = "error";
    }

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "invite_resent",
      entity: "group_members",
      entityId: String(req.params.memberId),
      metadata: { groupId: group.id, email: member.email, inviteUrl: inviteUrlResend, emailDeliveryStatus: resendDeliveryStatus },
    });

    return res.json({ member, inviteUrl: inviteUrlResend, emailDeliveryStatus: resendDeliveryStatus });
  } catch (error: any) {
    if (error.message?.includes("already accepted")) return res.status(400).json({ error: error.message });
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/groups/:id/members/:memberId/reissue", requireAuth, async (req: Request, res: Response) => {
  try {
    const group = await storage.getGroup(parseInt(req.params.id));
    if (!group || group.adminUserId !== req.session.userId) return res.status(403).json({ error: "Access denied" });

    const member = await storage.reissueInvite(parseInt(req.params.memberId));
    if (!member) return res.status(404).json({ error: "Member not found" });

    const siteUrlReissue = process.env.SITE_URL || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : `https://${brand.domain}`);
    const inviteUrlReissue = `${siteUrlReissue}/accept-invite?token=${member.inviteToken}`;

    const reissueLocale = await resolveLocale({ userId: req.session.userId! });
    let reissueDeliveryStatus = "error";
    try {
      const inviterReissue = await storage.getUser(req.session.userId!);
      const reissueDelivered = await sendGroupInvite({
        to: member.email,
        inviterName: inviterReissue?.name || "Your team admin",
        groupName: group.name,
        inviteToken: member.inviteToken,
        actorUserId: req.session.userId!,
        locale: reissueLocale,
      });
      reissueDeliveryStatus = reissueDelivered ? "sent" : "error";
      console.info("[Groups][Outbox] invite_reissued", { recipient: member.email, inviteUrl: inviteUrlReissue, providerStatus: reissueDeliveryStatus, groupId: group.id, memberId: member.id });
    } catch (emailErr) {
      console.error("[Groups][Outbox] invite_reissued delivery error (non-fatal):", { recipient: member.email, inviteUrl: inviteUrlReissue, error: (emailErr as Error).message });
      reissueDeliveryStatus = "error";
    }

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "invite_reissued",
      entity: "group_members",
      entityId: String(req.params.memberId),
      metadata: { groupId: group.id, email: member.email, inviteUrl: inviteUrlReissue, emailDeliveryStatus: reissueDeliveryStatus },
    });

    return res.json({ member, inviteUrl: inviteUrlReissue, emailDeliveryStatus: reissueDeliveryStatus });
  } catch (error: any) {
    if (error.message?.includes("already accepted")) return res.status(400).json({ error: error.message });
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/groups/:id/members/:memberId/remind", requireAuth, async (req: Request, res: Response) => {
  try {
    const group = await storage.getGroup(parseInt(req.params.id));
    if (!group || group.adminUserId !== req.session.userId) return res.status(403).json({ error: "Access denied" });

    const members = await storage.listGroupMembers(group.id);
    const member = members.find((m: any) => m.id === parseInt(req.params.memberId));
    if (!member) return res.status(404).json({ error: "Member not found" });
    if (!member.userId) return res.status(400).json({ error: "Member has not accepted their invite yet" });

    if (member.lastReminderSentAt) {
      const hoursSince = (Date.now() - new Date(member.lastReminderSentAt).getTime()) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        return res.status(429).json({ error: "A reminder was already sent within the last 24 hours" });
      }
    }

    const memberUser = await storage.getUser(member.userId);
    if (!memberUser) return res.status(404).json({ error: "Member user not found" });

    const { courseName, progressPct } = req.body;
    const reminderLocale = await resolveLocale({ userId: member.userId });

    await sendTrainingReminder({
      to: memberUser.email,
      memberName: memberUser.name,
      courseName: courseName || "Forklift Certification",
      progressPct: progressPct || 0,
      groupName: group.name,
      actorUserId: req.session.userId!,
      locale: reminderLocale,
    });

    await storage.updateGroupMemberReminderSent(member.id);

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "training_reminder_sent",
      entity: "group_members",
      entityId: String(member.id),
      metadata: { groupId: group.id, memberEmail: memberUser.email },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("[Groups] Send reminder error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/groups/:id/assign-seat", requireAuth, async (req: Request, res: Response) => {
  try {
    const group = await storage.getGroup(parseInt(req.params.id));
    if (!group || group.adminUserId !== req.session.userId) return res.status(403).json({ error: "Access denied" });

    const { enrollmentId, userId } = req.body;
    if (!enrollmentId || !userId) return res.status(400).json({ error: "enrollmentId and userId are required" });

    const existingEnrollment = await storage.getEnrollment(enrollmentId);
    if (!existingEnrollment) return res.status(400).json({ error: "Enrollment not found" });
    const enrollOrder = existingEnrollment.orderId ? await storage.getOrder(existingEnrollment.orderId) : null;
    if (!enrollOrder || enrollOrder.groupId !== group.id) {
      return res.status(403).json({ error: "Enrollment does not belong to this group" });
    }

    const enrollment = await storage.assignEnrollmentUser(enrollmentId, userId, req.session.userId!);

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "seat_assigned",
      entity: "enrollments",
      entityId: String(enrollmentId),
      metadata: { userId, groupId: group.id },
    });

    try {
      const assignedUser = await storage.getUser(userId);
      if (assignedUser && enrollment) {
        const course = await storage.getCourse(enrollment.courseId);
        const seatLocale = await resolveLocale({ userId, courseLanguage: course?.language });
        await sendSeatAssignedNotification({
          to: assignedUser.email,
          memberName: assignedUser.name,
          courseName: course?.title || "Forklift Certification",
          groupName: group.name,
          actorUserId: req.session.userId!,
          locale: seatLocale,
        });
      }
    } catch (emailErr) {
      console.error("[Groups] Seat assigned email error (non-fatal):", emailErr);
    }

    return res.json({ enrollment });
  } catch (error: any) {
    const msg = error.message || "";
    if (msg.includes("Cannot") || msg.includes("not found") || msg.includes("Not found")) {
      return res.status(400).json({ error: msg });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/groups/:id/unassign-seat", requireAuth, async (req: Request, res: Response) => {
  try {
    const group = await storage.getGroup(parseInt(req.params.id));
    if (!group || group.adminUserId !== req.session.userId) return res.status(403).json({ error: "Access denied" });

    const { enrollmentId } = req.body;
    if (!enrollmentId) return res.status(400).json({ error: "Enrollment ID is required" });

    const existingEnrollment = await storage.getEnrollment(enrollmentId);
    if (!existingEnrollment) return res.status(404).json({ error: "Enrollment not found" });

    const order = existingEnrollment.orderId ? await storage.getOrder(existingEnrollment.orderId) : null;
    if (!order || order.groupId !== group.id) return res.status(403).json({ error: "Enrollment does not belong to this group" });

    const enrollment = await storage.unassignEnrollmentUser(enrollmentId);

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "seat_unassigned",
      entity: "enrollments",
      entityId: String(enrollmentId),
      metadata: { groupId: group.id },
    });

    return res.json({ enrollment });
  } catch (error: any) {
    if (error.message?.includes("Cannot") || error.message?.includes("not found")) return res.status(400).json({ error: error.message });
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/groups/:id/members/:memberId", requireAuth, async (req: Request, res: Response) => {
  try {
    const group = await storage.getGroup(parseInt(req.params.id));
    if (!group || group.adminUserId !== req.session.userId) return res.status(403).json({ error: "Access denied" });

    await storage.removeGroupMember(parseInt(req.params.memberId));
    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "member_removed",
      entity: "group_members",
      entityId: String(req.params.memberId),
      metadata: { groupId: group.id },
    });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/groups/:id/enrollments", requireAuth, async (req: Request, res: Response) => {
  try {
    const group = await storage.getGroup(parseInt(req.params.id));
    if (!group || group.adminUserId !== req.session.userId) return res.status(403).json({ error: "Access denied" });

    const groupOrders = await storage.getOrdersByGroup(group.id);
    // Pending invites holding a seat (pendingEnrollmentId, not yet accepted):
    // surface the reservée on the seat row so the UI can show "reserved for
    // X (invite pending)" instead of looking unassigned (Peter 2026-08-31).
    const allMembers = await storage.listGroupMembers(group.id);
    const pendingByEnrollment = new Map<number, { name: string; email: string }>();
    for (const m of allMembers) {
      if (!m.acceptedAt && m.pendingEnrollmentId) {
        pendingByEnrollment.set(m.pendingEnrollmentId, { name: m.name, email: m.email });
      }
    }
    const allEnrollments: any[] = [];
    for (const order of groupOrders) {
      const orderEnrollmentList = await storage.getEnrollmentsByOrder(order.id);
      const uniqueEnrollments = orderEnrollmentList;
      for (const enrollment of uniqueEnrollments) {
        const course = await storage.getCourse(enrollment.courseId);
        let userName = null;
        if (enrollment.userId) {
          const user = await storage.getUser(enrollment.userId);
          userName = user?.name || null;
        }
        const progress = await storage.getStepProgress(enrollment.id);
        const steps = await storage.getCourseSteps(enrollment.courseId);
        const completedSteps = progress.filter(p => p.status === "completed").length;
        const totalSteps = steps.length;
        const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
        const lastActivity = progress.length > 0
          ? progress.reduce((latest, p) => {
              const pDate = p.completedAt ? new Date(p.completedAt) : new Date(0);
              return pDate > latest ? pDate : latest;
            }, new Date(0))
          : null;

        allEnrollments.push({
          ...enrollment,
          courseName: course?.title || "Unknown",
          userName,
          pendingInvite: pendingByEnrollment.get(enrollment.id) || null,
          progressPct,
          completedSteps,
          totalSteps,
          lastActivity: lastActivity && lastActivity.getTime() > 0 ? lastActivity : null,
        });
      }
    }
    return res.json({ enrollments: allEnrollments });
  } catch (error) {
    console.error("[Groups] Enrollments error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/groups/:id/certifications", requireAuth, async (req: Request, res: Response) => {
  try {
    const group = await storage.getGroup(parseInt(req.params.id));
    if (!group || group.adminUserId !== req.session.userId) return res.status(403).json({ error: "Access denied" });

    const members = await storage.listGroupMembers(group.id);
    const allCerts: any[] = [];
    for (const member of members) {
      if (member.userId) {
        const certs = await storage.getCertificationsByUser(member.userId);
        for (const cert of certs) {
          const course = await storage.getCourse(cert.courseId);
          const user = await storage.getUser(cert.userId);
          allCerts.push({
            ...cert,
            courseName: course?.title || "Unknown",
            userName: user?.name || member.name,
          });
        }
      }
    }
    return res.json({ certifications: allCerts });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/groups/:id/photo-id-orders  (Flow 1, crew admin pays for a member)
 * The crew admin purchases a photo ID for a specific member of their group.
 * Charges the ADMIN's card, creates a CLAIMED entitlement (enrollmentId set,
 * status awaiting_photo), and emails the member a photo upload/camera link.
 * When the member uploads, the standard fulfillment route consumes it.
 * Body: { memberId, certificationId, shippingMethod, shippingAddress, paymentNonce }
 */
app.post("/api/groups/:id/photo-id-orders", requireAuth, payLimiter, async (req: Request, res: Response) => {
  try {
    const group = await storage.getGroup(parseInt(String(req.params.id)));
    if (!group || group.adminUserId !== req.session.userId) return res.status(403).json({ error: "Access denied" });

    const { memberId, certificationId, shippingMethod, shippingAddress, paymentNonce } = req.body || {};
    if (!memberId || !certificationId) return res.status(400).json({ error: "memberId and certificationId are required" });

    // Gate: the add-on must be enabled (same flag as checkout).
    const flagRows = await db.select().from(platformSettings).where(eq(platformSettings.key, "photo_id_addon_enabled"));
    const flagVal = (flagRows[0]?.value as any);
    if (!(flagVal === true || flagVal === "true" || flagVal?.enabled === true)) {
      return res.status(400).json({ error: "Photo ID add-on is not available" });
    }

    // Validate member belongs to this group and the certification is theirs.
    const gmRows = await db.select().from(groupMembers).where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, memberId)));
    if (gmRows.length === 0 || !gmRows[0].acceptedAt) {
      return res.status(400).json({ error: "That member is not in your crew" });
    }

    const cert = await storage.getCertification(certificationId);
    if (!cert || cert.userId !== memberId) return res.status(400).json({ error: "Invalid certification for this member" });
    const memberUser = await storage.getUser(memberId);
    const course = await storage.getCourse(cert.courseId);

    // Validate shipping fields (mirror addressSchema).
    const ship = shippingAddress as any;
    if (shippingMethod !== "standard" && shippingMethod !== "expedited") return res.status(400).json({ error: "Invalid shipping method" });
    if (!ship || !ship.name?.trim() || !ship.address?.trim() || !ship.city?.trim() || !ship.state?.trim() || !ship.zip?.trim()) {
      return res.status(400).json({ error: "A complete shipping address is required" });
    }

    // Prevention-first 409s: an active card order OR a claimable entitlement
    // already exists for this member -> stop before charging anything.
    const existingOrders = await storage.getCertCardOrdersByCertification(certificationId);
    const activeOrder = existingOrders.find((co) => !["canceled", "refunded"].includes(co.status));
    if (activeOrder) {
      return res.status(409).json({ error: "This member already has an active card order for this certification" });
    }
    const claimableEnts = await db.select().from(photoIdEntitlements)
      .where(and(isNull(photoIdEntitlements.enrollmentId), eq(photoIdEntitlements.status, "awaiting_photo")));
    for (const ent of claimableEnts) {
      const order = await storage.getOrder(ent.orderId);
      if (!order) continue;
      const orderEnrollments = await storage.getEnrollmentsByOrder(order.id);
      if (orderEnrollments.some((e) => e.courseId === cert.courseId)) {
        return res.status(409).json({ error: "A photo ID is already available to this member - they just need to add a photo", entitlementId: ent.id });
      }
    }

    // Price it (server-side; matches certs.ts / checkout add-on math).
    const shipCost = SHIPPING_RATES[shippingMethod as "standard" | "expedited"];
    const subtotal = Number((PHOTO_ID_PRICE + shipCost).toFixed(2));
    const surcharge = calculateCardSurcharge(subtotal);
    const totalAmount = Number((subtotal + surcharge).toFixed(2));

    // CHARGE FIRST (same invariant as certs.ts: money moves before any row).
    const buyer = await storage.getUser(req.session.userId!);
    const isDemoMode = process.env.DEMO_MODE === "true" && !isAuthorizeNetConfigured();
    let transactionId: string;
    if (isDemoMode) {
      transactionId = `demo-${Date.now()}`;
    } else {
      if (!isAuthorizeNetConfigured()) return res.status(503).json({ error: "Payment is not configured. Please call us to order." });
      if (!paymentNonce) return res.status(400).json({ error: "Payment nonce required" });
      const nameParts = (ship.name as string).trim().split(/\s+/);
      const charge = await createTransactionFromNonce(
        paymentNonce,
        totalAmount,
        certificationId,
        `CARD-${cert.certificateNumber}`,
        true,
        {
          firstName: nameParts.slice(0, -1).join(" ") || nameParts[0],
          lastName: nameParts.length > 1 ? nameParts[nameParts.length - 1] : "-",
          address: ship.address,
          city: ship.city,
          state: ship.state,
          zip: ship.zip,
          country: ship.country || "US",
        }
      );
      if (!charge.success) {
        logger.warn("[Groups] Photo ID charge declined", { source: "payment", metadata: { groupId: group.id, memberId, certificationId, amount: totalAmount, declineReason: charge.errorMessage } });
        return res.status(400).json({ error: charge.errorMessage || "Payment was declined" });
      }
      transactionId = charge.transactionId!;
    }

    // Create a CLAIMED entitlement for this member (enrollmentId links them).
    // photo_id_entitlements.orderId is a NOT NULL FK to orders, so we create a
    // backing order row for this member-scoped purchase (same shape as the
    // course-checkout path's order, marked paid since the charge succeeded).
    const backingOrder = await storage.createOrder({
      userId: req.session.userId!,
      groupId: group.id,
      total: String(totalAmount),
      status: "paid",
      refundPolicyAccepted: true,
      abandonedEmailSent: true,
    } as any);

    const [entitlement] = await db.insert(photoIdEntitlements).values({
      orderId: backingOrder.id,
      enrollmentId: cert.enrollmentId,
      purchasedByUserId: req.session.userId!,
      shippingMethod,
      shippingAddress: ship,
      amount: String(totalAmount),
      status: "awaiting_photo",
    } as any).returning();

    // Email the member the upload/camera link (Flow 1). Then tell the admin.
    const baseUrl = process.env.SITE_URL || `https://${brand.domain}`;
    const uploadUrl = `${baseUrl}/order-cert-card/${certificationId}?entitlement=${entitlement?.id ?? ""}`;
    const memberLocale = await resolveLocale({ userId: memberId });

    let emailed = false;
    try {
      emailed = !!(await sendPhotoIdUploadRequest({
        to: memberUser?.email || "",
        memberName: memberUser?.name || "crew member",
        purchaserName: buyer?.name || "Your crew admin",
        uploadUrl,
        actorUserId: req.session.userId!,
        locale: memberLocale,
      }));
    } catch (emailErr) {
      logger.error("[Groups] Photo ID upload-request email failed", { source: "server", metadata: { error: String(emailErr), memberId } });
    }

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "photo_id_ordered_for_member",
      entity: "cert_card_orders",
      entityId: String(certificationId),
      metadata: { groupId: group.id, memberId, entitlementId: entitlement?.id, amount: totalAmount, transactionId, demoMode: isDemoMode, emailed },
    });

    return res.status(201).json({ success: true, entitlementId: entitlement?.id, uploadUrl, emailed, totalAmount });
  } catch (error) {
    logger.error("[Groups] Photo ID order for member failed", { source: "server", metadata: { error: String(error) } });
    return res.status(500).json({ error: "Internal server error" });
  }
});
}
