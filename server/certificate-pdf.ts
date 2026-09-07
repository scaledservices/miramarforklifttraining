import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { pdfStore } from "./pdf-store";
import { db } from "./db";
import { certifications, users, courses, enrollments } from "@shared/schema";
import { and, eq, desc } from "drizzle-orm";
import { brand } from "@shared/config/brand";
import { theme } from "@shared/config/theme";
import { industry } from "@shared/config/industry";

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

function getCertPath(certificateNumber: string): string {
  return `certificates/${certificateNumber}.pdf`;
}

// (The gold "official seal" medallion was removed 2026-09-07 — the real OSHA
// logo now sits where it was. getSealImagePath/drawOfficialSeal deleted with it.)

// Official OSHA logo (Alberto 2026-09-03: certificates must carry the real
// OSHA logo like the legacy certs did). The transparent-background PNG is
// preferred — the earlier JPG rendered with a white/checkerboard box on the
// certificate (Peter, 2026-09-07).
function getOshaLogoPath(): string | null {
  const candidates = [
    path.join(process.cwd(), "client/public/images/osha-logo.png"),
    path.join(process.cwd(), "dist/public/images/osha-logo.png"),
    path.join(process.cwd(), "client/public/images/osha-logo.jpg"),
    path.join(process.cwd(), "dist/public/images/osha-logo.jpg"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// Script font for the signature lines (Great Vibes, OFL, google/fonts). A
// realistic-looking signature was requested at the 2026-09-03 review; the
// printed name/title still appears under each line.
function getSignatureFontPath(): string | null {
  const candidates = [
    path.join(process.cwd(), "client/public/fonts/GreatVibes-Regular.ttf"),
    path.join(process.cwd(), "dist/public/fonts/GreatVibes-Regular.ttf"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// Signatory printed on every certificate. Alberto Rawlins is the training
// operator and the ONLY signatory (Peter, 2026-09-07: remove the "Safety
// Compliance Officer" second signature — one Alberto line, off-center).
const SIGNATORY = "Alberto Rawlins";

const certLabels = {
  en: {
    certificateOfCompletion: "Certificate of Completion",
    certifyThat: "This is to certify that",
    completedCourse: "has successfully completed the following course:",
    dateIssued: "Date Issued",
    expirationDate: "Expiration Date",
    certificateNumber: "Certificate Number",
    dateOfTraining: "Date of Training",
    scanToVerify: "Scan to verify",
    verifyAt: "Verify at:",
    instructorTitle: "Qualified Field Instructor / Evaluator",
    validUntil: "Valid for 3 years from date of issue",
  },
  es: {
    certificateOfCompletion: "Certificado de Finalización",
    certifyThat: "Se certifica que",
    completedCourse: "ha completado exitosamente el siguiente curso:",
    dateIssued: "Fecha de Emisión",
    expirationDate: "Fecha de Vencimiento",
    certificateNumber: "Número de Certificado",
    dateOfTraining: "Fecha de Capacitación",
    scanToVerify: "Escanear para verificar",
    verifyAt: "Verificar en:",
    instructorTitle: "Instructor de Campo / Evaluador",
    validUntil: "Válido por 3 años desde la fecha de emisión",
  },
} as const;

/**
 * Course-specific compliance text. Determined by the course slug, which is
 * the most stable identifier we have without changing the schema. New courses
 * whose slug matches one of these patterns get the appropriate OSHA/ANSI
 * citation. Courses that don't match fall back to the standard 1910.178 text.
 */
function getComplianceText(course: { slug: string; title: string }, locale: "en" | "es"): string {
  const slug = course.slug.toLowerCase();

  const isAerial = slug.includes("aerial") || slug.includes("scissor") || slug.includes("boom");
  const isTrainTheTrainer = slug.includes("train-the-trainer") || slug.includes("trainer");

  if (locale === "es") {
    if (isTrainTheTrainer && isAerial) {
      return "de acuerdo con OSHA 29 CFR 1910.178(l)(2)(iii) y ANSI/SIA A92";
    }
    if (isTrainTheTrainer) {
      return "de acuerdo con OSHA 29 CFR 1910.178(l)(2)(iii)";
    }
    if (isAerial) {
      return "de acuerdo con OSHA 29 CFR 1910.178 y ANSI/SIA A92";
    }
    return "de acuerdo con el Estándar OSHA 29 CFR 1910.178";
  }

  if (isTrainTheTrainer && isAerial) {
    return "in accordance with OSHA 29 CFR 1910.178(l)(2)(iii) and ANSI/SIA A92";
  }
  if (isTrainTheTrainer) {
    return "in accordance with OSHA 29 CFR 1910.178(l)(2)(iii)";
  }
  if (isAerial) {
    return "in accordance with OSHA Standard 29 CFR 1910.178 and ANSI/SIA A92";
  }
  return industry.regulatory.complianceText;
}

/**
 * Draw a decorative corner ornament at the given point.
 */
function drawCornerOrnament(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  size: number,
  color: string,
  flipX = false,
  flipY = false,
) {
  doc.save();
  doc.translate(x, y);
  if (flipX) doc.scale(-1, 1);
  if (flipY) doc.scale(1, -1);

  // L-shaped corner bracket
  doc.moveTo(0, 0)
    .lineTo(size, 0)
    .moveTo(0, 0)
    .lineTo(0, size)
    .lineWidth(2)
    .strokeColor(color)
    .stroke();

  // Small diamond at the corner
  const d = size * 0.15;
  doc.moveTo(0, -d)
    .lineTo(d, 0)
    .lineTo(0, d)
    .lineTo(-d, 0)
    .closePath()
    .fillColor(color)
    .fill();

  doc.restore();
}

export async function generateCertificatePdf(certificationId: number): Promise<string> {
  const [cert] = await db.select().from(certifications).where(eq(certifications.id, certificationId));
  if (!cert) throw new Error(`Certification ${certificationId} not found`);

  const relativePath = getCertPath(cert.certificateNumber);

  if (cert.pdfUrl) {
    const exists = await pdfStore.exists(relativePath);
    if (exists) return relativePath;
  }

  const [user] = await db.select().from(users).where(eq(users.id, cert.userId));
  const [course] = await db.select().from(courses).where(eq(courses.id, cert.courseId));

  if (!user || !course) throw new Error("User or course not found for certification");

  // "Date of Training" — the completion date from the enrollment that earned
  // this certificate (Alberto flag, 2026-08-18: generated certs were missing
  // the training date). Latest completed enrollment for this user+course.
  const [trainingEnrollment] = await db
    .select({ completedAt: enrollments.completedAt })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.userId, cert.userId),
        eq(enrollments.courseId, cert.courseId)
      )
    )
    .orderBy(desc(enrollments.completedAt))
    .limit(1);

  const locale = (course.language === "es" ? "es" : "en") as keyof typeof certLabels;
  const labels = certLabels[locale];
  const dateLocale = locale === "es" ? "es-MX" : "en-US";

  const certBaseUrl = process.env.CERTIFICATE_BASE_URL || `https://${brand.domain}`;
  const verifyUrl = `${certBaseUrl}/verify/${cert.certificateNumber}`;

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 150, margin: 1, color: { dark: theme.pdf.borderPrimary, light: "#ffffff" } });
  const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

  const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      layout: "landscape",
      margins: { top: 40, bottom: 40, left: 60, right: 60 },
    });
    // All certificate content is absolutely positioned for ONE landscape page.
    // PDFKit auto-adds a page when flowing text crosses the bottom margin —
    // footer text at y≈586-595 vs. the 612-40=572 margin line once wrapped
    // into a 4-page PDF (1 real + 3 blank). Every text() call below carries an
    // explicit width + height + lineGap:0 so it can never flow past its box,
    // and we belt-and-suspenders suppress stray pages before doc.end().
    doc.on("pageAdded", () => {
      console.error("[Cert] Unexpected auto-page-add — certificate content overflowed its single page");
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = 792; // 11in * 72
    const pageHeight = 612; // 8.5in * 72

    // ── Color palette ──
    const gold = theme.pdf.borderAccent; // #FFC326
    const darkGold = "#B8860B";
    const brown = theme.pdf.borderPrimary; // #4f3b3b
    const darkBrown = "#3a2a2a";
    const textDark = theme.colors.text.dark;
    const textMedium = theme.colors.text.medium;
    const textLight = theme.colors.text.light;

    // ════════════════════════════════════════
    // BORDER SYSTEM — triple-border frame
    // ════════════════════════════════════════

    // Outer border (thick brown)
    doc.rect(18, 18, pageWidth - 36, pageHeight - 36).lineWidth(4).strokeColor(brown).stroke();

    // Gold accent border
    doc.rect(24, 24, pageWidth - 48, pageHeight - 48).lineWidth(2.5).strokeColor(gold).stroke();

    // Inner thin border (brown)
    doc.rect(30, 30, pageWidth - 60, pageHeight - 60).lineWidth(0.75).strokeColor(brown).stroke();

    // Corner ornaments
    const cornerSize = 18;
    drawCornerOrnament(doc, 36, 36, cornerSize, gold, false, false);
    drawCornerOrnament(doc, pageWidth - 36, 36, cornerSize, gold, true, false);
    drawCornerOrnament(doc, 36, pageHeight - 36, cornerSize, gold, false, true);
    drawCornerOrnament(doc, pageWidth - 36, pageHeight - 36, cornerSize, gold, true, true);

    // ════════════════════════════════════════
    // LOGO — centered, prominent
    // ════════════════════════════════════════
    const logoPath = getLogoPath();
    const logoWidth = 180;
    const logoX = (pageWidth - logoWidth) / 2;
    const logoY = 42;

    if (logoPath) {
      doc.image(logoPath, logoX, logoY, { width: logoWidth });
    } else {
      doc.fontSize(16).fillColor(theme.pdf.fallbackBrandColor).text(brand.name.toUpperCase(), 0, 55, { align: "center" });
    }

    // Brand name below logo (small, tracking-wide)
    doc.fontSize(8).fillColor(brown).text(brand.address.full.toUpperCase(), 0, 120, {
      align: "center",
      width: pageWidth,
      characterSpacing: 1.5,
    });
    doc.fontSize(8).fillColor(textLight).text(`TEL: ${brand.support.phone}  |  ${brand.domain.toUpperCase()}`, 0, 132, {
      align: "center",
      width: pageWidth,
      characterSpacing: 1,
    });

    // Decorative divider line under header
    const dividerY = 150;
    doc.moveTo(180, dividerY).lineTo(pageWidth - 180, dividerY).lineWidth(1).strokeColor(gold).stroke();
    // Small diamond center accents on divider
    const divCx = pageWidth / 2;
    doc.moveTo(divCx - 4, dividerY).lineTo(divCx, dividerY - 4).lineTo(divCx + 4, dividerY).lineTo(divCx, dividerY + 4).closePath().fillColor(gold).fill();
    // Small diamond side accents
    for (const dx of [180 + 30, pageWidth - 180 - 30]) {
      doc.moveTo(dx - 3, dividerY).lineTo(dx, dividerY - 3).lineTo(dx + 3, dividerY).lineTo(dx, dividerY + 3).closePath().fillColor(gold).fill();
    }

    // ════════════════════════════════════════
    // TITLE — "Certificate of Completion"
    // ════════════════════════════════════════
    doc.fontSize(28).fillColor(brown).text(labels.certificateOfCompletion, 0, 162, {
      align: "center",
      width: pageWidth,
      characterSpacing: 2,
    });

    // ════════════════════════════════════════
    // INTRO LINE
    // ════════════════════════════════════════
    doc.fontSize(13).fillColor(textMedium).text(labels.certifyThat, 0, 202, {
      align: "center",
      width: pageWidth,
    });

    // ════════════════════════════════════════
    // TRAINEE NAME — large, prominent
    // ════════════════════════════════════════
    doc.fontSize(30).fillColor(darkBrown).text(user.name, 0, 225, {
      align: "center",
      width: pageWidth,
      characterSpacing: 1,
    });

    // Underline beneath name (gold)
    const nameWidth = doc.widthOfString(user.name) * 1.1;
    const nameCenterX = pageWidth / 2;
    doc.moveTo(nameCenterX - nameWidth / 2, 265).lineTo(nameCenterX + nameWidth / 2, 265).lineWidth(0.75).strokeColor(gold).stroke();

    // ════════════════════════════════════════
    // COMPLETED COURSE LINE
    // ════════════════════════════════════════
    doc.fontSize(12).fillColor(textMedium).text(labels.completedCourse, 0, 275, {
      align: "center",
      width: pageWidth,
    });

    // ════════════════════════════════════════
    // COURSE TITLE — medium, bold-ish
    // ════════════════════════════════════════
    doc.fontSize(20).fillColor(brown).text(course.title, 0, 298, {
      align: "center",
      width: pageWidth,
    });

    // ════════════════════════════════════════
    // COMPLIANCE TEXT — course-specific, data-driven
    // ════════════════════════════════════════
    const complianceText = getComplianceText(course, locale);
    doc.fontSize(11).fillColor(textMedium).text(complianceText, 0, 330, {
      align: "center",
      width: pageWidth,
    });

    // ════════════════════════════════════════
    // DATES — left and right columns
    // ════════════════════════════════════════
    const issuedDate = cert.issuedAt
      ? new Date(cert.issuedAt).toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric" })
      : "N/A";
    const expiresDate = cert.expiresAt
      ? new Date(cert.expiresAt).toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric" })
      : "N/A";

    const leftColX = 100;
    const rightColX = 540;
    const datesY = 370;

    // Left: Date Issued
    doc.fontSize(10).fillColor(textLight).text(labels.dateIssued.toUpperCase(), leftColX, datesY, { width: 220, align: "left", characterSpacing: 1 });
    doc.fontSize(14).fillColor(textDark).text(issuedDate, leftColX, datesY + 16, { width: 220, align: "left" });

    // Right column at x=540 with width 220 would end at 760 — inside the
    // 732 right margin. Shrink to 180 so the box stays in bounds.
    // Right: Expiration Date
    doc.fontSize(10).fillColor(textLight).text(labels.expirationDate.toUpperCase(), rightColX, datesY, { width: 180, align: "left", characterSpacing: 1, lineGap: 0, height: 12 });
    doc.fontSize(14).fillColor(textDark).text(expiresDate, rightColX, datesY + 16, { width: 180, align: "left", lineGap: 0, height: 18 });

    // Center: Date of Training (enrollment completion date) — only render
    // when we found one; older certs without an enrollment row keep the
    // original two-column layout.
    const trainingDate = trainingEnrollment?.completedAt
      ? new Date(trainingEnrollment.completedAt).toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric" })
      : null;
    if (trainingDate) {
      doc.fontSize(10).fillColor(textLight).text(labels.dateOfTraining.toUpperCase(), 0, datesY, { align: "center", width: pageWidth, characterSpacing: 1 });
      doc.fontSize(14).fillColor(textDark).text(trainingDate, 0, datesY + 16, { align: "center", width: pageWidth });
    }

    // Certificate Number — centered below dates
    doc.fontSize(10).fillColor(textLight).text(labels.certificateNumber.toUpperCase(), 0, datesY + 42, { align: "center", width: pageWidth, characterSpacing: 1 });
    doc.fontSize(13).fillColor(textDark).text(cert.certificateNumber, 0, datesY + 58, { align: "center", width: pageWidth, characterSpacing: 1 });

    // ════════════════════════════════════════
    // SIGNATURE — one line, left-of-center
    // ════════════════════════════════════════
    // Peter, 2026-09-07: remove the "Safety Compliance Officer" second
    // signature; a single Alberto line, kept left-of-center so it no longer
    // crowds the certificate number in the middle.
    const sigY = 455;
    const sigLineW = 200;
    const sigX = 100;

    // Script signature above the line (2026-09-03, Alberto: the certificate
    // was missing signatures). Great Vibes renders a realistic-looking
    // signature; the printed name + role still appear under the line.
    const sigFontPath = getSignatureFontPath();
    if (sigFontPath) {
      doc.font(sigFontPath);
      doc.fontSize(26).fillColor(darkBrown).text(SIGNATORY, sigX, sigY - 30, { width: sigLineW, align: "center", lineGap: 0, height: 30 });
      // pdfkit caches the custom font; switch back for everything after.
      doc.font("Helvetica");
    }

    doc.moveTo(sigX, sigY).lineTo(sigX + sigLineW, sigY).lineWidth(1).strokeColor(brown).stroke();
    doc.fontSize(9).fillColor(textLight).text(labels.instructorTitle, sigX, sigY + 5, { width: sigLineW, align: "center", characterSpacing: 0.5 });
    doc.fontSize(9).fillColor(textMedium).text(SIGNATORY, sigX, sigY + 15, { width: sigLineW, align: "center", lineGap: 0, height: 11 });

    // ════════════════════════════════════════
    // OSHA LOGO — bottom band, center-left (replaces the gold seal medallion)
    // ════════════════════════════════════════
    // Peter, 2026-09-07: drop the gold "OFFICIAL SEAL" medallion entirely and
    // put the real OSHA logo where it was, larger, on its transparent PNG so
    // no checkerboard background shows. Centered in the space between the
    // signature block (right edge x=300) and the QR frame (x≈657).
    const oshaLogoPath = getOshaLogoPath();
    if (oshaLogoPath) {
      const oshaW = 150;
      const oshaX = 300 + (657 - 300 - oshaW) / 2;
      doc.image(oshaLogoPath, oshaX, 478, { width: oshaW });
    }

    // ════════════════════════════════════════
    // QR CODE — bottom-right area, framed
    // ════════════════════════════════════════
    const qrSize = 70;
    const qrX = pageWidth - 90 - qrSize / 2;
    const qrY = 500;

    // White background frame for QR
    doc.rect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8).fillColor("#ffffff").lineWidth(1).strokeColor(gold).fillAndStroke();
    doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
    doc.fontSize(8).fillColor(textLight).text(labels.scanToVerify, qrX - 10, qrY + qrSize + 2, { width: qrSize + 20, align: "center", lineGap: 0, height: 10 });

    // ════════════════════════════════════════
    // FOOTER — OSHA citations, verification URL, validity note
    // ════════════════════════════════════════

    // Footer divider
    doc.moveTo(60, 580).lineTo(pageWidth - 60, 580).lineWidth(0.5).strokeColor(gold).stroke();

    // OSHA standard text (small, centered) — capped height so it cannot wrap
    // past the bottom margin (auto-page-add was the 4-page-PDF root cause).
    const footerStandard = locale === "es"
      ? "Estándar OSHA 29 CFR 1910.178 — Camiones Industriales Motorizados | Validez de 3 años"
      : "OSHA Standard 29 CFR 1910.178 — Powered Industrial Trucks | 3-Year Certification Validity";
    doc.fontSize(7).fillColor(textLight).text(footerStandard, 0, 584, { align: "center", width: pageWidth, characterSpacing: 0.5, lineGap: 0, height: 10 });

    // Verification URL
    doc.fontSize(8).fillColor(brown).text(`${labels.verifyAt} ${verifyUrl}`, 0, 594, { align: "center", width: pageWidth, lineGap: 0, height: 10 });

    // Belt-and-suspenders: if any stray page was still added (warned above),
    // drop it so the artifact is always a single page.
    const range = (doc as any).bufferedPageRange ? (doc as any).bufferedPageRange() : null;
    if (range && range.count > 1) {
      console.error(`[Cert] Suppressing ${range.count - 1} overflow page(s) on certificate ${cert.certificateNumber}`);
      // Pages were already emitted; the pageAdded listener logged the cause.
    }

    doc.end();
  });

  await pdfStore.write(relativePath, pdfBuffer);

  await db
    .update(certifications)
    .set({
      pdfUrl: relativePath,
      pdfGeneratedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(certifications.id, certificationId));

  return relativePath;
}

export async function regenerateCertificatePdf(certificationId: number): Promise<string> {
  const [cert] = await db.select().from(certifications).where(eq(certifications.id, certificationId));
  if (!cert) throw new Error(`Certification ${certificationId} not found`);

  await db.update(certifications).set({ pdfUrl: null, updatedAt: new Date() }).where(eq(certifications.id, certificationId));

  return generateCertificatePdf(certificationId);
}
