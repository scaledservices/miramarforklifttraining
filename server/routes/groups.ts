import type { Express, Request, Response } from "express";
import { and, eq, ne } from "drizzle-orm";
import { db } from "../db";
import { enrollments as enrollmentsTable } from "@shared/schema";
import { brand } from "@shared/config/brand";
import { storage } from "../storage";
import { isInviteExpired } from "../auth";
import { sendGroupInvite, sendTrainingReminder, sendSeatAssignedNotification } from "../email";
import { resolveLocale } from "../locale-resolver";
import { requireAuth } from "./middleware";

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
}
