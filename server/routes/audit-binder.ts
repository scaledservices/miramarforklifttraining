import type { Express, Request, Response } from "express";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { db } from "../db";
import { storage } from "../storage";
import { requireAuth } from "./middleware";
import { hasAnyRole } from "@shared/roles";
import { certifications, users, courses, trainingEvents, bookings } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { brand } from "@shared/config/brand";
import { theme } from "@shared/config/theme";
import { industry } from "@shared/config/industry";

const EXPIRING_SOON_DAYS = 60;

function getLogoPath(): string | null {
  const candidates = [
    path.join(process.cwd(), "client/public/images", brand.logo.serverFile),
    path.join(process.cwd(), "dist/public/images", brand.logo.serverFile),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function formatDate(date: Date | string | null, locale = "en-US"): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
}

function computeStatus(cert: { status: string; expiresAt: Date | string | null }): "active" | "expiring_soon" | "expired" | "revoked" {
  if (cert.status === "revoked") return "revoked";
  if (!cert.expiresAt) return "active";
  const now = new Date();
  const expiry = new Date(cert.expiresAt);
  if (expiry < now) return "expired";
  const soonThreshold = new Date();
  soonThreshold.setDate(soonThreshold.getDate() + EXPIRING_SOON_DAYS);
  if (expiry < soonThreshold) return "expiring_soon";
  return "active";
}

async function gatherAuditData(companyId: number) {
  const company = await storage.getCompany(companyId);
  if (!company) return null;

  const rawCerts = await storage.getCertificationsByCompany(companyId);

  // Resolve user names and course titles
  const userIds = Array.from(new Set(rawCerts.map(c => c.userId)));
  const courseIds = Array.from(new Set(rawCerts.map(c => c.courseId)));
  const [userResults, courseResults] = await Promise.all([
    userIds.length > 0 ? Promise.all(userIds.map(uid => storage.getUser(uid))) : Promise.resolve([]),
    courseIds.length > 0 ? Promise.all(courseIds.map(cid => storage.getCourse(cid))) : Promise.resolve([]),
  ]);
  const userMap = new Map(userResults.filter(Boolean).map(u => [u!.id, u!]));
  const courseMap = new Map(courseResults.filter(Boolean).map(c => [c!.id, c!]));

  const certsWithDetails = rawCerts.map(cert => {
    const user = userMap.get(cert.userId);
    const course = courseMap.get(cert.courseId);
    return {
      id: cert.id,
      certificateNumber: cert.certificateNumber,
      userId: cert.userId,
      employeeName: user?.name || "Unknown",
      employeeEmail: user?.email || "",
      courseId: cert.courseId,
      courseName: course?.title || "Unknown",
      status: cert.status,
      complianceStatus: computeStatus(cert),
      issuedAt: cert.issuedAt,
      expiresAt: cert.expiresAt,
    };
  });

  // Training events for the company
  const companyTrainingEvents = await db.select().from(trainingEvents)
    .where(eq(trainingEvents.companyId, companyId))
    .orderBy(desc(trainingEvents.createdAt));

  // Bookings that have a matching companyId (bookings don't have companyId, skip)
  // We could look at orders with companyId → bookings via orderId, but bookings table itself doesn't have companyId.
  // For now, we'll include training events as the booking/training history.

  const summary = {
    total: certsWithDetails.length,
    active: certsWithDetails.filter(c => c.complianceStatus === "active").length,
    expiringSoon: certsWithDetails.filter(c => c.complianceStatus === "expiring_soon").length,
    expired: certsWithDetails.filter(c => c.complianceStatus === "expired").length,
    revoked: certsWithDetails.filter(c => c.complianceStatus === "revoked").length,
  };

  return {
    company,
    certifications: certsWithDetails,
    trainingEvents: companyTrainingEvents,
    summary,
    generatedAt: new Date().toISOString(),
  };
}

async function generateAuditBinderPdf(companyId: number): Promise<Buffer> {
  const data = await gatherAuditData(companyId);
  if (!data) throw new Error("Company not found");

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      layout: "portrait",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = 612;
    const contentWidth = pageWidth - 100; // margins

    // === Header band (brown) ===
    doc.rect(0, 0, pageWidth, 100).fill(theme.colors.dark.hex);

    const logoPath = getLogoPath();
    if (logoPath) {
      try {
        doc.image(logoPath, 50, 20, { height: 30 });
      } catch {
        doc.fontSize(12).fillColor(theme.pdf.fallbackBrandColor).text(brand.name.toUpperCase(), 50, 30);
      }
    } else {
      doc.fontSize(12).fillColor(theme.pdf.fallbackBrandColor).text(brand.name.toUpperCase(), 50, 30);
    }

    doc.fontSize(22).fillColor("#ffffff").font("Helvetica-Bold")
      .text("OSHA Compliance Audit Binder", 50, 55, { width: contentWidth });

    // === Company info ===
    let y = 120;
    doc.font("Helvetica-Bold").fontSize(14).fillColor(theme.pdf.titleColor)
      .text(data.company.name, 50, y);
    y += 20;
    doc.font("Helvetica").fontSize(10).fillColor(theme.colors.text.medium)
      .text(`Generated: ${formatDate(new Date(), "en-US")} at ${new Date().toLocaleTimeString("en-US")}`, 50, y);
    y += 15;

    if (data.company.billingCity || data.company.billingState) {
      const addrParts = [data.company.billingStreet, data.company.billingCity, data.company.billingState, data.company.billingZip].filter(Boolean);
      doc.text(`Address: ${addrParts.join(", ")}`, 50, y);
      y += 15;
    }
    if (data.company.phone) {
      doc.text(`Phone: ${data.company.phone}`, 50, y);
      y += 15;
    }
    if (data.company.email) {
      doc.text(`Email: ${data.company.email}`, 50, y);
      y += 15;
    }

    // === Summary section ===
    y += 10;
    doc.font("Helvetica-Bold").fontSize(13).fillColor(theme.pdf.titleColor)
      .text("Compliance Summary", 50, y);
    y += 22;

    const summaryBoxWidth = (contentWidth - 30) / 4;
    const summaries = [
      { label: "Total", value: data.summary.total, color: theme.colors.dark.hex },
      { label: "Active", value: data.summary.active, color: theme.colors.green.hex },
      { label: "Expiring Soon", value: data.summary.expiringSoon, color: theme.colors.orange.hex },
      { label: "Expired", value: data.summary.expired, color: "#cc0000" },
    ];

    summaries.forEach((s, i) => {
      const x = 50 + i * (summaryBoxWidth + 10);
      doc.roundedRect(x, y, summaryBoxWidth, 50, 5).fillColor(s.color).fill();
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(20)
        .text(String(s.value), x, y + 6, { width: summaryBoxWidth, align: "center" });
      doc.font("Helvetica").fontSize(9)
        .text(s.label, x, y + 32, { width: summaryBoxWidth, align: "center" });
    });
    y += 70;

    // === Certifications table ===
    y += 15;
    doc.font("Helvetica-Bold").fontSize(13).fillColor(theme.pdf.titleColor)
      .text("Certification Records", 50, y);
    y += 20;

    // Table header
    const tableY = y;
    const cols = [
      { header: "Employee", width: 140 },
      { header: "Cert #", width: 90 },
      { header: "Course", width: 140 },
      { header: "Issued", width: 70 },
      { header: "Expires", width: 70 },
      { header: "Status", width: 52 },
    ];

    doc.rect(50, tableY, contentWidth, 20).fill(theme.pdf.tableHeaderBg);
    doc.fillColor(theme.pdf.tableHeaderText).font("Helvetica-Bold").fontSize(9);
    let colX = 50;
    for (const col of cols) {
      doc.text(col.header, colX + 4, tableY + 5, { width: col.width - 8 });
      colX += col.width;
    }
    y += 20;

    // Table rows
    doc.font("Helvetica").fontSize(8);
    let rowIdx = 0;
    const rowHeight = 18;

    for (const cert of data.certifications) {
      if (y > 720) {
        // Add new page
        doc.addPage();
        y = 50;
        // Re-render header
        doc.rect(50, y, contentWidth, 20).fill(theme.pdf.tableHeaderBg);
        doc.fillColor(theme.pdf.tableHeaderText).font("Helvetica-Bold").fontSize(9);
        colX = 50;
        for (const col of cols) {
          doc.text(col.header, colX + 4, y + 5, { width: col.width - 8 });
          colX += col.width;
        }
        y += 20;
        doc.font("Helvetica").fontSize(8);
      }

      // Alternating row background
      if (rowIdx % 2 === 1) {
        doc.rect(50, y, contentWidth, rowHeight).fill(theme.colors.background.row).fill();
      }

      colX = 50;
      const rowData = [
        cert.employeeName,
        cert.certificateNumber,
        cert.courseName,
        formatDate(cert.issuedAt, "en-US"),
        formatDate(cert.expiresAt, "en-US"),
        cert.complianceStatus,
      ];

      for (let i = 0; i < cols.length; i++) {
        const text = rowData[i];
        // Color-code status
        if (i === cols.length - 1) {
          switch (text) {
            case "active": doc.fillColor(theme.colors.green.hex); break;
            case "expiring_soon": doc.fillColor(theme.colors.orange.hex); break;
            case "expired": doc.fillColor("#cc0000"); break;
            case "revoked": doc.fillColor("#cc0000"); break;
            default: doc.fillColor(theme.colors.text.dark);
          }
          doc.font("Helvetica-Bold");
        } else {
          doc.fillColor(theme.colors.text.dark);
          doc.font("Helvetica");
        }
        // Truncate long text
        const maxChars = Math.floor((cols[i].width - 8) / 4.5);
        const displayText = text.length > maxChars ? text.substring(0, maxChars - 1) + "…" : text;
        doc.text(displayText, colX + 4, y + 4, { width: cols[i].width - 8 });
        colX += cols[i].width;
      }

      y += rowHeight;
      rowIdx++;
    }

    // === Training events history ===
    if (data.trainingEvents.length > 0) {
      y += 20;
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      doc.font("Helvetica-Bold").fontSize(13).fillColor(theme.pdf.titleColor)
        .text("Training History", 50, y);
      y += 20;

      for (const event of data.trainingEvents) {
        if (y > 730) {
          doc.addPage();
          y = 50;
        }
        doc.font("Helvetica-Bold").fontSize(9).fillColor(theme.colors.text.dark)
          .text(`${event.title || "Training Event"} — ${event.status}`, 50, y);
        y += 13;
        doc.font("Helvetica").fontSize(8).fillColor(theme.colors.text.medium);
        if (event.scheduledStart) {
          doc.text(`  Scheduled: ${formatDate(event.scheduledStart, "en-US")}`, 50, y);
          y += 12;
        }
        if (event.location) {
          doc.text(`  Location: ${event.location}`, 50, y);
          y += 12;
        }
        y += 5;
      }
    }

    // === Footer ===
    const totalPages = doc.bufferedPageRange().start + doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor(theme.pdf.footerText).font("Helvetica")
        .text(
          `${brand.name} | ${industry.regulatory.body} Compliance Audit Binder | Generated ${formatDate(new Date(), "en-US")}`,
          50,
          750,
          { width: contentWidth, align: "center" }
        );
    }

    doc.end();
  });
}

export function registerAuditBinderRoutes(app: Express) {
  // GET /api/audit-binder/:companyId — JSON data
  app.get("/api/audit-binder/:companyId", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) return res.status(401).json({ error: "Authentication required" });

      const allowedRoles = ["group_admin", "admin", "super_admin"];
      if (!hasAnyRole(currentUser.role, allowedRoles)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      // group_admin: verify they have access to this company
      if (currentUser.role === "group_admin") {
        const hasAccess = await verifyGroupAdminCompanyAccess(req.session.userId!, parseInt(String(req.params.companyId)));
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied for this company" });
        }
      }

      const companyId = parseInt(String(req.params.companyId));
      if (isNaN(companyId)) return res.status(400).json({ error: "Invalid company ID" });

      const data = await gatherAuditData(companyId);
      if (!data) return res.status(404).json({ error: "Company not found" });

      return res.json(data);
    } catch (error) {
      console.error("[AuditBinder] Error gathering data:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/audit-binder/:companyId/pdf — branded PDF
  app.get("/api/audit-binder/:companyId/pdf", requireAuth, async (req: Request, res: Response) => {
    try {
      const currentUser = await storage.getUser(req.session.userId!);
      if (!currentUser) return res.status(401).json({ error: "Authentication required" });

      const allowedRoles = ["group_admin", "admin", "super_admin"];
      if (!hasAnyRole(currentUser.role, allowedRoles)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      if (currentUser.role === "group_admin") {
        const hasAccess = await verifyGroupAdminCompanyAccess(req.session.userId!, parseInt(String(req.params.companyId)));
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied for this company" });
        }
      }

      const companyId = parseInt(String(req.params.companyId));
      if (isNaN(companyId)) return res.status(400).json({ error: "Invalid company ID" });

      const pdfBuffer = await generateAuditBinderPdf(companyId);

      const safeName = (await storage.getCompany(companyId))?.name?.replace(/[^a-zA-Z0-9]/g, "_") || "company";
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="audit-binder-${safeName}.pdf"`);
      return res.send(pdfBuffer);
    } catch (error) {
      console.error("[AuditBinder] PDF generation error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}

/**
 * Verify that a group_admin has access to a given company.
 * Checks if any of their group members' certifications have the companyId.
 */
async function verifyGroupAdminCompanyAccess(userId: number, companyId: number): Promise<boolean> {
  try {
    const groups = await storage.getGroupsByAdmin(userId);
    for (const group of groups) {
      const members = await storage.listGroupMembers(group.id);
      for (const member of members) {
        if (member.userId) {
          const certs = await storage.getCertificationsByUser(member.userId);
          if (certs.some(c => c.companyId === companyId)) {
            return true;
          }
        }
      }
    }
    // Also check if the group_admin themselves have certs with this companyId
    const ownCerts = await storage.getCertificationsByUser(userId);
    return ownCerts.some(c => c.companyId === companyId);
  } catch {
    return false;
  }
}
