import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { z } from "zod";
import { eq, and, ne, isNotNull } from "drizzle-orm";
import { platformSettings, enrollments as enrollmentsTable, emailOutbox } from "@shared/schema";
import { isAdminRole } from "@shared/roles";
import { refundTransaction } from "../payments";
import { regenerateCertificatePdf } from "../certificate-pdf";
import { pdfStore } from "../pdf-store";
import { sendRefundNotification, sendCertificateRevokedNotification, sendShippingNotification } from "../email";
import { requireRole, sanitizeUser } from "./middleware";
import { verifyCache } from "./certs";
import { resolveLocale } from "../locale-resolver";

export function registerAdminRoutes(app: Express) {
app.get("/api/admin/dashboard", requireRole("admin", "super_admin"), async (_req: Request, res: Response) => {
  try {
    const [userList, orderList, enrollmentList, certList] = await Promise.all([
      storage.listUsers(),
      storage.listOrders(),
      storage.getEnrollmentsByCourse(0).catch(() => []),
      storage.getCertificationsByUser(0).catch(() => []),
    ]);

    const allOrders = await storage.listOrders();
    const totalRevenue = allOrders.filter(o => o.status === "paid").reduce((sum, o) => sum + parseFloat(o.total), 0);

    return res.json({
      metrics: {
        totalUsers: userList.length,
        totalOrders: allOrders.length,
        totalRevenue,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/settings", requireRole("admin", "super_admin"), async (_req: Request, res: Response) => {
  try {
    const settings = await db.select().from(platformSettings);
    const result: Record<string, any> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    if (!result.profit_split) {
      result.profit_split = { platformPercent: 70, partnerPercent: 30 };
    }
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/api/admin/settings", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const { key, value } = req.body;
    if (!key || value === undefined) return res.status(400).json({ error: "key and value required" });

    if (key === "profit_split") {
      const { platformPercent, partnerPercent } = value;
      if (typeof platformPercent !== "number" || typeof partnerPercent !== "number") {
        return res.status(400).json({ error: "platformPercent and partnerPercent must be numbers" });
      }
      if (platformPercent + partnerPercent !== 100) {
        return res.status(400).json({ error: "Split must total 100%" });
      }
      if (platformPercent < 0 || partnerPercent < 0) {
        return res.status(400).json({ error: "Percentages must be non-negative" });
      }
    }

    await db.insert(platformSettings).values({
      key,
      value,
      updatedByUserId: req.session.userId!,
    }).onConflictDoUpdate({
      target: platformSettings.key,
      set: { value, updatedByUserId: req.session.userId!, updatedAt: new Date() },
    });

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "settings_updated",
      entity: "platform_settings",
      entityId: key,
      metadata: { key, value },
    });

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/profitability", requireRole("admin", "super_admin"), async (_req: Request, res: Response) => {
  try {
    const { payments: paymentsTable, orders: ordersTable, users: usersTable } = await import("@shared/schema");
    const { desc: descOp } = await import("drizzle-orm");

    const splitSetting = await db.select().from(platformSettings).where(eq(platformSettings.key, "profit_split"));
    const currentSplit = (splitSetting[0]?.value as any) || { platformPercent: 70, partnerPercent: 30 };

    const allPayments = await db.select({
      id: paymentsTable.id,
      orderId: paymentsTable.orderId,
      amount: paymentsTable.amount,
      status: paymentsTable.status,
      platformEarnings: paymentsTable.platformEarnings,
      partnerEarnings: paymentsTable.partnerEarnings,
      createdAt: paymentsTable.createdAt,
      orderNumber: ordersTable.orderNumber,
      customerName: usersTable.name,
      customerEmail: usersTable.email,
    })
    .from(paymentsTable)
    .innerJoin(ordersTable, eq(paymentsTable.orderId, ordersTable.id))
    .innerJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .where(eq(paymentsTable.status, "approved"))
    .orderBy(descOp(paymentsTable.createdAt))
    .limit(100);

    const totalRevenue = allPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalPlatformEarnings = allPayments.reduce((sum, p) => sum + Number(p.platformEarnings || 0), 0);
    const totalPartnerEarnings = allPayments.reduce((sum, p) => sum + Number(p.partnerEarnings || 0), 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const mtdPayments = allPayments.filter(p => new Date(p.createdAt) >= startOfMonth);
    const mtdRevenue = mtdPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const mtdPlatformEarnings = mtdPayments.reduce((sum, p) => sum + Number(p.platformEarnings || 0), 0);
    const mtdPartnerEarnings = mtdPayments.reduce((sum, p) => sum + Number(p.partnerEarnings || 0), 0);

    const dailyRevenue: Record<string, number> = {};
    for (const p of allPayments) {
      const day = new Date(p.createdAt).toISOString().slice(0, 10);
      dailyRevenue[day] = (dailyRevenue[day] || 0) + Number(p.amount || 0);
    }
    const revenueTrend = Object.entries(dailyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, revenue]) => ({ date, revenue }));

    return res.json({
      currentSplit,
      totals: { revenue: totalRevenue, platformEarnings: totalPlatformEarnings, partnerEarnings: totalPartnerEarnings },
      mtd: { revenue: mtdRevenue, platformEarnings: mtdPlatformEarnings, partnerEarnings: mtdPartnerEarnings },
      recentTransactions: allPayments.slice(0, 25).map(p => ({
        id: p.id,
        date: p.createdAt,
        orderNumber: p.orderNumber,
        customerName: p.customerName,
        amount: Number(p.amount),
        platformEarnings: Number(p.platformEarnings || 0),
        partnerEarnings: Number(p.partnerEarnings || 0),
      })),
      revenueTrend,
    });
  } catch (error) {
    console.error("[Admin] Profitability error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/users", requireRole("admin", "super_admin"), async (_req: Request, res: Response) => {
  try {
    const userList = await storage.listUsers();
    const enriched = await Promise.all(userList.map(async (user) => {
      const safe = sanitizeUser(user);
      if (user.role === "group_admin") {
        const groups = await storage.getGroupsByAdmin(user.id);
        return { ...safe, groupName: groups.length > 0 ? groups[0].name : null, groupId: groups.length > 0 ? groups[0].id : null };
      }
      return { ...safe, groupName: null, groupId: null };
    }));
    return res.json({ users: enriched });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/admin/users/:id/role", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    const ALL_VALID_ROLES = ["individual", "certified_student", "instructor_applicant", "instructor", "group_admin", "admin", "super_admin"];
    if (!ALL_VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const actorUser = await storage.getUser(req.session.userId!);
    if (!actorUser) return res.status(401).json({ error: "Authentication required" });

    const targetUser = await storage.getUser(parseInt(req.params.id as string));
    if (!targetUser) return res.status(404).json({ error: "User not found" });

    if (actorUser.role !== "super_admin") {
      if (role === "super_admin" || role === "admin") {
        return res.status(403).json({ error: "Only super admins can assign admin or super_admin roles" });
      }
      if (targetUser.role === "super_admin" || targetUser.role === "admin") {
        return res.status(403).json({ error: "Only super admins can modify admin or super_admin accounts" });
      }
    }

    if (actorUser.id === targetUser.id && actorUser.role === "super_admin" && role !== "super_admin") {
      return res.status(403).json({ error: "Cannot demote your own super_admin account" });
    }

    const user = await storage.updateUserRole(targetUser.id, role);
    if (!user) return res.status(404).json({ error: "User not found" });

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "role_changed",
      entity: "users",
      entityId: req.params.id as string,
      metadata: { newRole: role },
    });

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/admin/users/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const user = await storage.updateUser(parseInt(req.params.id as string), { name });
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/orders", requireRole("admin", "super_admin"), async (_req: Request, res: Response) => {
  try {
    const orderList = await storage.listOrders();
    const companyCache = new Map<number, string>();
    const enriched = await Promise.all(orderList.map(async (order) => {
      const user = await storage.getUser(order.userId);
      let companyName: string | null = null;
      if (order.companyId) {
        if (companyCache.has(order.companyId)) {
          companyName = companyCache.get(order.companyId)!;
        } else {
          const company = await storage.getCompany(order.companyId);
          companyName = company?.name || null;
          if (companyName) companyCache.set(order.companyId, companyName);
        }
      }
      return { ...order, userName: user?.name || "Unknown", userEmail: user?.email || "", companyName, companyId: order.companyId || null };
    }));
    return res.json({ orders: enriched });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/orders/:id/refund", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const order = await storage.getOrder(parseInt(req.params.id as string));
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.status !== "paid") return res.status(400).json({ error: "Order is not paid" });

    const orderPayments = await storage.getPaymentsByOrder(order.id);
    const approvedPayment = orderPayments.find((p: any) => p.status === "approved");

    if (approvedPayment && approvedPayment.providerTransactionId) {
      const refundResult = await refundTransaction(
        approvedPayment.providerTransactionId,
        Number(order.total),
        "XXXX",
        order.id
      );
      if (!refundResult.success) {
        return res.status(400).json({ error: refundResult.errorMessage || "Refund failed" });
      }
    } else {
      await storage.updateOrderStatus(order.id, "refunded");
    }

    const certs = await storage.getCertificationsByOrder(order.id);
    for (const cert of certs) {
      await storage.revokeCertification(cert.id);
      verifyCache.delete(cert.certificateNumber);
    }

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "order_refunded",
      entity: "orders",
      entityId: String(order.id),
      metadata: { orderNumber: order.orderNumber, revokedCerts: certs.length },
    });

    try {
      const orderUser = await storage.getUser(order.userId);
      if (orderUser) {
        const refundLocale = await resolveLocale({ userId: order.userId });
        await sendRefundNotification({
          to: orderUser.email,
          orderNumber: order.orderNumber,
          refundAmount: Number(order.total),
          actorUserId: req.session.userId!,
          locale: refundLocale,
        });
      }
    } catch (emailErr) {
      console.error("[Refund] Email error (non-fatal):", emailErr);
    }

    return res.json({ success: true, revokedCertifications: certs.length });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/courses", requireRole("admin", "super_admin"), async (_req: Request, res: Response) => {
  try {
    const courseList = await storage.listCourses();
    return res.json({ courses: courseList });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/courses", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const course = await storage.createCourse(req.body);
    return res.status(201).json({ course });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/admin/courses/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const course = await storage.updateCourse(parseInt(req.params.id as string), req.body);
    if (!course) return res.status(404).json({ error: "Course not found" });
    return res.json({ course });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/admin/courses/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    await storage.deleteCourse(parseInt(req.params.id as string));
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/courses/:id/steps", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const steps = await storage.getCourseSteps(parseInt(req.params.id as string));
    return res.json({ steps });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/courses/:id/steps", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const step = await storage.createCourseStep({ ...req.body, courseId: parseInt(req.params.id as string) });
    return res.status(201).json({ step });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/admin/steps/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const step = await storage.updateCourseStep(parseInt(req.params.id as string), req.body);
    if (!step) return res.status(404).json({ error: "Step not found" });
    return res.json({ step });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/admin/steps/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    await storage.deleteCourseStep(parseInt(req.params.id as string));
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/steps/:id/questions", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const questions = await storage.getExamQuestions(parseInt(req.params.id as string));
    return res.json({ questions });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/steps/:id/questions", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const question = await storage.createExamQuestion({ ...req.body, stepId: parseInt(req.params.id as string) });
    return res.status(201).json({ question });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/admin/questions/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const question = await storage.updateExamQuestion(parseInt(req.params.id as string), req.body);
    if (!question) return res.status(404).json({ error: "Question not found" });
    return res.json({ question });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/api/admin/questions/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    await storage.deleteExamQuestion(parseInt(req.params.id as string));
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/enrollments", requireRole("admin", "super_admin"), async (_req: Request, res: Response) => {
  try {
    const enrollmentList = await storage.listAllEnrollments();
    const companyCache = new Map<number, string>();
    const enriched = await Promise.all(enrollmentList.map(async (e) => {
      const user = e.userId ? await storage.getUser(e.userId) : null;
      const course = await storage.getCourse(e.courseId);
      let companyName: string | null = null;
      if (e.companyId) {
        if (companyCache.has(e.companyId)) {
          companyName = companyCache.get(e.companyId)!;
        } else {
          const company = await storage.getCompany(e.companyId);
          companyName = company?.name || null;
          if (companyName) companyCache.set(e.companyId, companyName);
        }
      }
      return { ...e, userName: user?.name || null, userEmail: user?.email || null, courseName: course?.title || "Unknown", companyName, companyId: e.companyId || null };
    }));
    return res.json({ enrollments: enriched });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/certifications", requireRole("admin", "super_admin"), async (_req: Request, res: Response) => {
  try {
    const userList = await storage.listUsers();
    const companyCache = new Map<number, string>();
    const allCerts = [];
    for (const u of userList) {
      const certs = await storage.getCertificationsByUser(u.id);
      for (const cert of certs) {
        const course = await storage.getCourse(cert.courseId);
        let companyName: string | null = null;
        if (cert.companyId) {
          if (companyCache.has(cert.companyId)) {
            companyName = companyCache.get(cert.companyId)!;
          } else {
            const company = await storage.getCompany(cert.companyId);
            companyName = company?.name || null;
            if (companyName) companyCache.set(cert.companyId, companyName);
          }
        }
        allCerts.push({ ...cert, userName: u.name, userEmail: u.email, courseName: course?.title || "Unknown", companyName, companyId: cert.companyId || null });
      }
    }
    return res.json({ certifications: allCerts });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/certifications/:id/revoke", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const cert = await storage.revokeCertification(parseInt(req.params.id as string));
    if (!cert) return res.status(404).json({ error: "Certification not found" });

    verifyCache.delete(cert.certificateNumber);

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "certificate_revoked",
      entity: "certifications",
      entityId: String(cert.id),
      metadata: { certificateNumber: cert.certificateNumber },
    });

    try {
      const certUser = await storage.getUser(cert.userId);
      if (certUser) {
        const course = await storage.getCourse(cert.courseId);
        const revokeLocale = await resolveLocale({ userId: cert.userId, courseLanguage: course?.language });
        await sendCertificateRevokedNotification({
          to: certUser.email,
          certificateNumber: cert.certificateNumber,
          courseName: course?.title || "Forklift Certification",
          actorUserId: req.session.userId!,
          locale: revokeLocale,
        });
      }
    } catch (emailErr) {
      console.error("[Cert] Revoke email error (non-fatal):", emailErr);
    }

    return res.json({ certification: cert });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/certifications/:id/reissue", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const cert = await storage.reissueCertification(parseInt(req.params.id as string));
    if (!cert) return res.status(404).json({ error: "Certification not found" });

    await regenerateCertificatePdf(cert.id);
    verifyCache.delete(cert.certificateNumber);

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "certificate_reissued",
      entity: "certifications",
      entityId: String(cert.id),
      metadata: { certificateNumber: cert.certificateNumber },
    });

    return res.json({ certification: cert });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/card-orders", requireRole("admin", "super_admin"), async (_req: Request, res: Response) => {
  try {
    const cardOrders = await storage.listCertCardOrders();
    return res.json({ cardOrders });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/admin/card-orders/:id/status", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const order = await storage.updateCertCardOrderStatus(parseInt(req.params.id as string), status);
    if (!order) return res.status(404).json({ error: "Card order not found" });

    if (status === "shipped" && order.trackingNumber) {
      try {
        const cardUser = await storage.getUser(order.userId);
        if (cardUser) {
          const shipLocale = await resolveLocale({ userId: order.userId });
          await sendShippingNotification({
            to: cardUser.email,
            trackingNumber: order.trackingNumber,
            carrier: order.carrier || "USPS",
            actorUserId: req.session.userId!,
            locale: shipLocale,
          });
        }
      } catch (emailErr) {
        console.error("[CertCards] Shipping email error (non-fatal):", emailErr);
      }
    }

    return res.json({ cardOrder: order });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/admin/card-orders/:id/tracking", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const { trackingNumber, carrier } = req.body;
    const order = await storage.updateCertCardOrderTracking(parseInt(req.params.id as string), trackingNumber, carrier);
    if (!order) return res.status(404).json({ error: "Card order not found" });
    return res.json({ cardOrder: order });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/audit-logs", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const logs = await storage.listRecentAuditLogs(limit);
    const userCache = new Map<number, string>();
    const enriched = await Promise.all(logs.map(async (log) => {
      let actorName: string | null = null;
      if (log.actorUserId) {
        if (userCache.has(log.actorUserId)) {
          actorName = userCache.get(log.actorUserId)!;
        } else {
          const user = await storage.getUser(log.actorUserId);
          actorName = user?.name || `User ${log.actorUserId}`;
          userCache.set(log.actorUserId, actorName);
        }
      }
      return { ...log, actorName };
    }));
    return res.json({ logs: enriched });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/contact-submissions", requireRole("admin", "super_admin"), async (_req: Request, res: Response) => {
  try {
    const submissions = await storage.listContactSubmissions();
    return res.json({ submissions });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/email-outbox", requireRole("admin", "super_admin"), async (_req: Request, res: Response) => {
  try {
    const { emailOutbox } = await import("@shared/schema");
    const { desc } = await import("drizzle-orm");
    const { db } = await import("../db");
    const entries = await db.select().from(emailOutbox).orderBy(desc(emailOutbox.createdAt)).limit(100);
    return res.json({ emails: entries });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/companies", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const filters: Record<string, string | number> = {};
    if (req.query.search) filters.search = req.query.search as string;
    if (req.query.assignedRepId) filters.assignedRepId = parseInt(req.query.assignedRepId as string);
    if (req.query.industry) filters.industry = req.query.industry as string;
    if (req.query.state) filters.billingState = req.query.state as string;
    const companyList = await storage.getCompanies(filters);

    const { onsiteTrainingRequests, contacts: contactsTable } = await import("@shared/schema");
    const { sql: sqlFn } = await import("drizzle-orm");

    const requestCounts = await db.select({
      companyId: onsiteTrainingRequests.companyId,
      count: sqlFn<number>`count(*)::int`,
    }).from(onsiteTrainingRequests)
      .where(isNotNull(onsiteTrainingRequests.companyId))
      .groupBy(onsiteTrainingRequests.companyId);

    const requestCountMap = new Map<number, number>();
    for (const rc of requestCounts) {
      if (rc.companyId) requestCountMap.set(rc.companyId, rc.count);
    }

    const primaryContacts = await db.select().from(contactsTable)
      .where(eq(contactsTable.isPrimary, true));

    const primaryContactMap = new Map<number, { firstName: string; lastName: string; email: string | null }>();
    for (const c of primaryContacts) {
      if (c.companyId) primaryContactMap.set(c.companyId, { firstName: c.firstName, lastName: c.lastName, email: c.email });
    }

    const userCache = new Map<number, string>();
    const enriched = await Promise.all(companyList.map(async (company) => {
      let repName: string | null = null;
      if (company.assignedRepId) {
        if (userCache.has(company.assignedRepId)) {
          repName = userCache.get(company.assignedRepId)!;
        } else {
          const user = await storage.getUser(company.assignedRepId);
          if (user) {
            userCache.set(company.assignedRepId, user.name);
            repName = user.name;
          }
        }
      }
      return {
        ...company,
        repName,
        requestCount: requestCountMap.get(company.id) ?? 0,
        primaryContact: primaryContactMap.get(company.id) ?? null,
      };
    }));

    return res.json({ companies: enriched });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/companies/:id/summary", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const company = await storage.getCompany(id);
    if (!company) return res.status(404).json({ error: "Company not found" });
    const stats = await storage.getCompanySummaryStats(id);
    return res.json(stats);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/companies/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const company = await storage.getCompany(id);
    if (!company) return res.status(404).json({ error: "Company not found" });
    const { onsiteTrainingRequests, orders: ordersTable, trainingEvents } = await import("@shared/schema");
    const { desc: descOrder } = await import("drizzle-orm");
    const companyContacts = await storage.getContacts({ companyId: id });
    const companyRequests = await db.select().from(onsiteTrainingRequests)
      .where(eq(onsiteTrainingRequests.companyId, id))
      .orderBy(descOrder(onsiteTrainingRequests.createdAt));
    const companyOrders = await db.select().from(ordersTable)
      .where(eq(ordersTable.companyId, id))
      .orderBy(descOrder(ordersTable.createdAt));
    const companyTrainingEvents = await db.select().from(trainingEvents)
      .where(eq(trainingEvents.companyId, id))
      .orderBy(descOrder(trainingEvents.createdAt));
    const rawCerts = await storage.getCertificationsByCompany(id);

    const certUserIds = [...new Set(rawCerts.map(c => c.userId))];
    const certCourseIds = [...new Set(rawCerts.map(c => c.courseId))];
    const [certUsers, certCourses] = await Promise.all([
      certUserIds.length > 0 ? Promise.all(certUserIds.map(uid => storage.getUser(uid))) : Promise.resolve([]),
      certCourseIds.length > 0 ? Promise.all(certCourseIds.map(cid => storage.getCourse(cid))) : Promise.resolve([]),
    ]);
    const userMap = new Map(certUsers.filter(Boolean).map(u => [u!.id, u!.name || u!.email]));
    const courseMap = new Map(certCourses.filter(Boolean).map(c => [c!.id, c!.title]));
    const companyCertifications = rawCerts.map(cert => ({
      ...cert,
      learnerName: userMap.get(cert.userId) || "Unknown",
      courseName: courseMap.get(cert.courseId) || "Unknown",
    }));

    const orderTotal = companyOrders.reduce((sum, o) => sum + parseFloat(String(o.total ?? "0")), 0);

    const summary = {
      requestCount: companyRequests.length,
      latestRequest: companyRequests[0]?.createdAt ?? null,
      orderCount: companyOrders.length,
      orderTotalValue: orderTotal,
      trainingEventCount: companyTrainingEvents.length,
    };

    return res.json({ company, contacts: companyContacts, requests: companyRequests, orders: companyOrders, trainingEvents: companyTrainingEvents, certifications: companyCertifications, summary });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/companies", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const { insertCompanySchema } = await import("@shared/schema");
    const parsed = insertCompanySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.issues });
    const company = await storage.createCompany(parsed.data);
    return res.status(201).json({ company });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

const companyUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  website: z.string().nullable().optional(),
  billingStreet: z.string().nullable().optional(),
  billingCity: z.string().nullable().optional(),
  billingState: z.string().nullable().optional(),
  billingZip: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  employeeCount: z.number().int().positive().nullable().optional(),
  assignedRepId: z.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
});

app.patch("/api/admin/companies/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const parsed = companyUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.issues });
    const company = await storage.updateCompany(id, parsed.data);
    if (!company) return res.status(404).json({ error: "Company not found" });
    return res.json({ company });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/companies/:id/contacts", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const companyId = parseInt(req.params.id as string);
    if (isNaN(companyId)) return res.status(400).json({ error: "Invalid company ID" });
    const company = await storage.getCompany(companyId);
    if (!company) return res.status(404).json({ error: "Company not found" });
    const { insertContactSchema } = await import("@shared/schema");
    const parsed = insertContactSchema.safeParse({ ...req.body, companyId });
    if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.issues });
    const contact = await storage.createContact(parsed.data);
    return res.status(201).json({ contact });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/contacts", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const filters: { companyId?: number; search?: string; role?: string } = {};
    if (req.query.companyId) filters.companyId = parseInt(req.query.companyId as string);
    if (req.query.search) filters.search = req.query.search as string;
    if (req.query.role) filters.role = req.query.role as string;
    const contactList = await storage.getContacts(filters);
    return res.json({ contacts: contactList });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/contacts", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const { insertContactSchema } = await import("@shared/schema");
    const parsed = insertContactSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.issues });
    const contact = await storage.createContact(parsed.data);
    return res.status(201).json({ contact });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

const contactUpdateSchema = z.object({
  companyId: z.number().int().positive().nullable().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  role: z.enum(["decision_maker", "training_manager", "employee", "other"]).nullable().optional(),
  isPrimary: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.enum(["business_contact", "learner", "platform_user", "decision_maker", "safety_manager", "billing"])).optional(),
});

app.patch("/api/admin/contacts/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const parsed = contactUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.issues });
    const contact = await storage.updateContact(id, parsed.data);
    if (!contact) return res.status(404).json({ error: "Contact not found" });
    return res.json({ contact });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/admin/orders/:id/company", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const parsed = z.object({ companyId: z.number().int().positive().nullable() }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid data" });
    const order = await storage.getOrder(id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (parsed.data.companyId) {
      const company = await storage.getCompany(parsed.data.companyId);
      if (!company) return res.status(404).json({ error: "Company not found" });
    }
    const updated = await storage.updateOrderCompany(id, parsed.data.companyId);
    return res.json({ order: updated });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/admin/certifications/:id/company", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const parsed = z.object({ companyId: z.number().int().positive().nullable() }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid data" });
    if (parsed.data.companyId) {
      const company = await storage.getCompany(parsed.data.companyId);
      if (!company) return res.status(404).json({ error: "Company not found" });
    }
    const updated = await storage.updateCertificationCompany(id, parsed.data.companyId);
    if (!updated) return res.status(404).json({ error: "Certification not found" });
    return res.json({ certification: updated });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/admin/enrollments/:id/company", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const parsed = z.object({ companyId: z.number().int().positive().nullable() }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid data" });
    if (parsed.data.companyId) {
      const company = await storage.getCompany(parsed.data.companyId);
      if (!company) return res.status(404).json({ error: "Company not found" });
    }
    const updated = await storage.updateEnrollmentCompany(id, parsed.data.companyId);
    if (!updated) return res.status(404).json({ error: "Enrollment not found" });
    return res.json({ enrollment: updated });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/users/search", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;
    if (!email || email.length < 3) return res.json({ users: [] });
    const userList = await storage.listUsers();
    const matches = userList.filter(u => u.email.toLowerCase().includes(email.toLowerCase())).slice(0, 10);
    return res.json({ users: matches.map(u => ({ id: u.id, name: u.name, email: u.email })) });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/admin/contacts/:id/link-user", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const parsed = z.object({ userId: z.number().int().positive().nullable() }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid data" });
    if (parsed.data.userId) {
      const user = await storage.getUser(parsed.data.userId);
      if (!user) return res.status(404).json({ error: "User not found" });
    }
    const contact = await storage.updateContactUserId(id, parsed.data.userId);
    if (!contact) return res.status(404).json({ error: "Contact not found" });
    return res.json({ contact });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/admin/reports", requireRole("admin", "super_admin"), async (_req: Request, res: Response) => {
  try {
    const { certifications: certsTable, orders: ordersTable, onsiteTrainingRequests: leadsTable,
      trainingEvents: eventsTable, companies: companiesTable, users: usersTable,
      repAttribution: repAttrTable } = await import("@shared/schema");
    const { sql: sqlFn, eq: eqOp, and: andOp, gte: gteOp, lte: lteOp, isNotNull: isNotNullOp } = await import("drizzle-orm");

    const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const [
      certsByCompanyRows,
      expiringCertsRows,
      revenueByCompanyRows,
      volumeRows,
      allLeads,
      allEvents,
      repRows,
    ] = await Promise.all([
      db.select({
        companyId: certsTable.companyId,
        companyName: companiesTable.name,
        count: sqlFn<number>`COUNT(*)::int`,
      }).from(certsTable)
        .innerJoin(companiesTable, eqOp(certsTable.companyId, companiesTable.id))
        .where(eqOp(certsTable.status, "issued"))
        .groupBy(certsTable.companyId, companiesTable.name)
        .orderBy(sqlFn`COUNT(*) DESC`)
        .limit(25),

      db.select({
        id: certsTable.id,
        certificateNumber: certsTable.certificateNumber,
        userId: certsTable.userId,
        courseId: certsTable.courseId,
        expiresAt: certsTable.expiresAt,
        companyId: certsTable.companyId,
        companyName: companiesTable.name,
      }).from(certsTable)
        .leftJoin(companiesTable, eqOp(certsTable.companyId, companiesTable.id))
        .where(andOp(
          eqOp(certsTable.status, "issued"),
          isNotNullOp(certsTable.expiresAt),
          lteOp(certsTable.expiresAt, ninetyDaysFromNow),
          gteOp(certsTable.expiresAt, new Date()),
        ))
        .orderBy(certsTable.expiresAt)
        .limit(50),

      db.select({
        companyId: ordersTable.companyId,
        companyName: companiesTable.name,
        revenue: sqlFn<string>`COALESCE(SUM(${ordersTable.total}::numeric), 0)`,
        orderCount: sqlFn<number>`COUNT(*)::int`,
      }).from(ordersTable)
        .innerJoin(companiesTable, eqOp(ordersTable.companyId, companiesTable.id))
        .where(eqOp(ordersTable.status, "paid"))
        .groupBy(ordersTable.companyId, companiesTable.name)
        .orderBy(sqlFn`SUM(${ordersTable.total}::numeric) DESC`)
        .limit(25),

      db.select({
        locationType: eventsTable.locationType,
        count: sqlFn<number>`COUNT(*)::int`,
      }).from(eventsTable)
        .groupBy(eventsTable.locationType),

      db.select().from(leadsTable),
      db.select().from(eventsTable),

      db.select({
        repId: repAttrTable.primaryRepId,
        repName: usersTable.name,
        leadCount: sqlFn<number>`COUNT(*)::int`,
      }).from(repAttrTable)
        .innerJoin(usersTable, eqOp(repAttrTable.primaryRepId, usersTable.id))
        .where(eqOp(repAttrTable.entityType, "onsite_request"))
        .groupBy(repAttrTable.primaryRepId, usersTable.name)
        .orderBy(sqlFn`COUNT(*) DESC`)
        .limit(20),
    ]);

    const ownedLeadsByRep: Record<number, number> = {};
    for (const lead of allLeads) {
      if (lead.assignedRepId) {
        ownedLeadsByRep[lead.assignedRepId] = (ownedLeadsByRep[lead.assignedRepId] || 0) + 1;
      }
    }

    const revenueByMarket: Record<string, { revenue: number; orderCount: number }> = {};
    for (const event of allEvents) {
      if (!revenueByMarket[event.locationType]) {
        revenueByMarket[event.locationType] = { revenue: 0, orderCount: 0 };
      }
    }
    const eventIds = allEvents.map(e => e.id);
    if (eventIds.length > 0) {
      const ordersWithEvents = await db.select({
        trainingEventId: ordersTable.trainingEventId,
        total: ordersTable.total,
      }).from(ordersTable)
        .where(andOp(
          isNotNullOp(ordersTable.trainingEventId),
          eqOp(ordersTable.status, "paid"),
        ));
      for (const order of ordersWithEvents) {
        const event = allEvents.find(e => e.id === order.trainingEventId);
        if (event && revenueByMarket[event.locationType]) {
          revenueByMarket[event.locationType].revenue += parseFloat(String(order.total || 0));
          revenueByMarket[event.locationType].orderCount += 1;
        }
      }
    }

    const enrichedExpiring = await Promise.all(expiringCertsRows.map(async (cert) => {
      const user = await storage.getUser(cert.userId);
      const course = await storage.getCourse(cert.courseId);
      return {
        ...cert,
        learnerName: user?.name || "Unknown",
        courseName: course?.title || "Unknown",
      };
    }));

    const onsiteVolume = volumeRows.find(v => v.locationType === "customer_onsite")?.count ?? 0;
    const facilityVolume = volumeRows.find(v => v.locationType === "facility")?.count ?? 0;

    const scheduledStatuses = ["scheduled", "awaiting_confirmation", "completed"];
    const leadsScheduled = allLeads.filter(l => {
      return allEvents.some(e => e.originatingLeadId === l.id && scheduledStatuses.includes(e.status));
    });
    const eventsCompleted = allEvents.filter(e => e.status === "completed");
    const eventsScheduledOrDone = allEvents.filter(e => scheduledStatuses.includes(e.status));

    const leadToScheduledRate = allLeads.length > 0 ? (leadsScheduled.length / allLeads.length * 100).toFixed(1) : "0";
    const scheduledToCompletedRate = eventsScheduledOrDone.length > 0
      ? (eventsCompleted.length / eventsScheduledOrDone.length * 100).toFixed(1) : "0";

    return res.json({
      certsByCompany: certsByCompanyRows,
      expiringCertifications: enrichedExpiring,
      revenueByCompany: revenueByCompanyRows.map(r => ({ ...r, revenue: parseFloat(r.revenue) })),
      volume: { onsite: onsiteVolume, facility: facilityVolume },
      conversionRates: {
        leadToScheduled: parseFloat(leadToScheduledRate),
        scheduledToCompleted: parseFloat(scheduledToCompletedRate),
        totalLeads: allLeads.length,
        scheduledFromLeads: leadsScheduled.length,
        totalScheduledOrDone: eventsScheduledOrDone.length,
        totalCompleted: eventsCompleted.length,
      },
      repPerformance: repRows.map(r => ({
        ...r,
        ownedLeads: ownedLeadsByRep[r.repId!] ?? 0,
      })),
      revenueByMarket: Object.entries(revenueByMarket).map(([market, data]) => ({
        market,
        revenue: data.revenue,
        orderCount: data.orderCount,
      })),
    });
  } catch (error) {
    console.error("[Admin] Reports error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/backfill/leads-to-companies", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const { onsiteTrainingRequests: leadsTable } = await import("@shared/schema");
    const { isNull: isNullOp } = await import("drizzle-orm");

    const orphanedLeads = await db.select().from(leadsTable)
      .where(isNullOp(leadsTable.companyId));

    const allCompanies = await storage.getCompanies();
    const companyNameCounts: Record<string, number[]> = {};
    for (const c of allCompanies) {
      const key = c.name.toLowerCase().trim();
      if (!companyNameCounts[key]) companyNameCounts[key] = [];
      companyNameCounts[key].push(c.id);
    }

    let linked = 0;
    let skipped = 0;
    for (const lead of orphanedLeads) {
      if (!lead.companyName) continue;
      const normalizedName = lead.companyName.toLowerCase().trim();
      const matches = companyNameCounts[normalizedName];
      if (!matches || matches.length === 0) continue;
      if (matches.length > 1) {
        skipped++;
        continue;
      }
      await storage.updateOnsiteTrainingRequest(lead.id, { companyId: matches[0] });
      linked++;
    }

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "backfill_leads_to_companies",
      entity: "system",
      entityId: "backfill",
      metadata: { orphanedLeadsCount: orphanedLeads.length, linkedCount: linked, skippedAmbiguous: skipped },
    });

    return res.json({ success: true, orphanedLeads: orphanedLeads.length, linked, skipped });
  } catch (error) {
    console.error("[Admin] Backfill leads error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/backfill/orders-to-companies", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const { orders: ordersTable, contacts: contactsTable } = await import("@shared/schema");
    const { isNull: isNullOp, isNotNull: isNotNullOp, and: andOp2 } = await import("drizzle-orm");

    const orphanedOrders = await db.select().from(ordersTable)
      .where(isNullOp(ordersTable.companyId));

    const contactsWithCompany = await db.select().from(contactsTable)
      .where(andOp2(isNotNullOp(contactsTable.userId), isNotNullOp(contactsTable.companyId)));

    const userToCompanies: Record<number, Set<number>> = {};
    for (const c of contactsWithCompany) {
      if (!userToCompanies[c.userId!]) userToCompanies[c.userId!] = new Set();
      userToCompanies[c.userId!].add(c.companyId!);
    }

    let linked = 0;
    let skipped = 0;
    for (const order of orphanedOrders) {
      const companies = userToCompanies[order.userId];
      if (!companies || companies.size === 0) continue;
      if (companies.size > 1) {
        skipped++;
        continue;
      }
      const [companyId] = companies;
      await storage.updateOrderCompany(order.id, companyId);
      linked++;
    }

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "backfill_orders_to_companies",
      entity: "system",
      entityId: "backfill",
      metadata: { orphanedOrdersCount: orphanedOrders.length, linkedCount: linked, skippedAmbiguous: skipped },
    });

    return res.json({ success: true, orphanedOrders: orphanedOrders.length, linked, skipped });
  } catch (error) {
    console.error("[Admin] Backfill orders error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/backfill/certs-to-companies", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const { certifications: certsTable } = await import("@shared/schema");
    const { isNull: isNullOp } = await import("drizzle-orm");

    const orphanedCerts = await db.select().from(certsTable)
      .where(isNullOp(certsTable.companyId));

    let linked = 0;
    for (const cert of orphanedCerts) {
      const enrollment = await storage.getEnrollment(cert.enrollmentId);
      if (enrollment?.companyId) {
        await storage.updateCertificationCompany(cert.id, enrollment.companyId);
        linked++;
        continue;
      }

      if (enrollment?.orderId) {
        const order = await storage.getOrder(enrollment.orderId);
        if (order?.companyId) {
          await storage.updateCertificationCompany(cert.id, order.companyId);
          linked++;
        }
      }
    }

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "backfill_certs_to_companies",
      entity: "system",
      entityId: "backfill",
      metadata: { orphanedCertsCount: orphanedCerts.length, linkedCount: linked },
    });

    return res.json({ success: true, orphanedCerts: orphanedCerts.length, linked });
  } catch (error) {
    console.error("[Admin] Backfill certs error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/admin/demo/reset", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  if (process.env.DEMO_MODE !== "true") {
    return res.status(403).json({ error: "Demo mode is not enabled" });
  }
  try {
    const { wipeDemoData, seedDemoData } = await import("../../scripts/demo-seed");
    await wipeDemoData();
    const result = await seedDemoData();
    req.session.destroy(() => {});
    return res.json({ success: true, message: "Demo data reset and reseeded", certNumber: result.certNumber });
  } catch (error) {
    console.error("[Demo] Reset error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
}
