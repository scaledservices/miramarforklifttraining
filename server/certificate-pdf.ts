import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { pdfStore } from "./pdf-store";
import { db } from "./db";
import { certifications, users, courses } from "@shared/schema";
import { eq } from "drizzle-orm";
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

const certLabels = {
  en: {
    certificateOfCompletion: "Certificate of Completion",
    certifyThat: "This is to certify that",
    completedCourse: "has successfully completed the following course:",
    dateIssued: "Date Issued",
    expirationDate: "Expiration Date",
    certificateNumber: "Certificate Number",
    scanToVerify: "Scan to verify",
    verifyAt: "Verify at:",
    instructorTitle: "Qualified Field Instructor / Evaluator",
    complianceOfficer: "Safety Compliance Officer",
    officialSeal: "OFFICIAL SEAL",
    validUntil: "Valid for 3 years from date of issue",
  },
  es: {
    certificateOfCompletion: "Certificado de Finalización",
    certifyThat: "Se certifica que",
    completedCourse: "ha completado exitosamente el siguiente curso:",
    dateIssued: "Fecha de Emisión",
    expirationDate: "Fecha de Vencimiento",
    certificateNumber: "Número de Certificado",
    scanToVerify: "Escanear para verificar",
    verifyAt: "Verificar en:",
    instructorTitle: "Instructor de Campo / Evaluador",
    complianceOfficer: "Oficial de Cumplimiento de Seguridad",
    officialSeal: "SELLO OFICIAL",
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
 * Draw an official-looking gold seal at the given center coordinates.
 * Uses concentric circles, radial text, and a star motif.
 */
function drawOfficialSeal(doc: PDFKit.PDFDocument, cx: number, cy: number, radius: number, label: string) {
  const gold = theme.pdf.borderAccent;
  const darkGold = "#B8860B";
  const brown = theme.pdf.borderPrimary;

  // Outer ring (gold, thick)
  doc.save();
  doc.circle(cx, cy, radius).lineWidth(3).strokeColor(gold).stroke();

  // Inner ring (dark gold, thin)
  doc.circle(cx, cy, radius - 6).lineWidth(1).strokeColor(darkGold).stroke();

  // Innermost ring (brown, thin)
  doc.circle(cx, cy, radius - 18).lineWidth(0.5).strokeColor(brown).stroke();

  // Star at top of seal
  drawStar(doc, cx, cy - radius + 24, 7, 3.5, 5, gold);

  // Curved text along the top arc: "MIRAMAR FORKLIFT TRAINING"
  const topText = "MIRAMAR FORKLIFT TRAINING";
  drawCircularText(doc, cx, cy, radius - 12, topText, 200, 340, 10, brown);

  // Curved text along the bottom arc: label (e.g. "OFFICIAL SEAL")
  drawCircularText(doc, cx, cy, radius - 12, label, 20, 160, 9, brown);

  // Center text
  doc.fontSize(11).fillColor(brown).text("OSHA", cx - radius, cy - 10, {
    width: radius * 2,
    align: "center",
  });
  doc.fontSize(7).fillColor(brown).text("COMPLIANT", cx - radius, cy + 4, {
    width: radius * 2,
    align: "center",
  });
  doc.restore();
}

/**
 * Draw a star shape (n points) at the given center.
 */
function drawStar(
  doc: PDFKit.PDFDocument,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  points: number,
  color: string,
) {
  const total = points * 2;
  const angleStep = Math.PI / points;
  const startAngle = -Math.PI / 2; // point up

  doc.save();
  const pathPoints: [number, number][] = [];
  for (let i = 0; i < total; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = startAngle + i * angleStep;
    pathPoints.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }

  doc.moveTo(pathPoints[0][0], pathPoints[0][1]);
  for (let i = 1; i < pathPoints.length; i++) {
    doc.lineTo(pathPoints[i][0], pathPoints[i][1]);
  }
  doc.closePath();
  doc.fillColor(color);
  doc.fill();
  doc.restore();
}

/**
 * Draw text along a circular arc. Renders character-by-character with rotation.
 * angleStart/angleEnd define the arc in degrees (0 = right, 90 = bottom, 180 = left, 270 = top).
 */
function drawCircularText(
  doc: PDFKit.PDFDocument,
  cx: number,
  cy: number,
  r: number,
  text: string,
  angleStart: number,
  angleEnd: number,
  fontSize: number,
  color: string,
) {
  const chars = text.split("");
  const totalAngle = angleEnd - angleStart;
  const anglePerChar = totalAngle / (chars.length - 1 || 1);
  const rad = (deg: number) => (deg * Math.PI) / 180;

  doc.save();
  doc.fillColor(color);
  doc.fontSize(fontSize);

  for (let i = 0; i < chars.length; i++) {
    const angle = angleStart + i * anglePerChar;
    const x = cx + r * Math.cos(rad(angle));
    const y = cy + r * Math.sin(rad(angle));
    const rotation = (angle * 180) / Math.PI + 90;
    doc.save();
    doc.translate(x, y);
    doc.rotate(rotation);
    doc.text(chars[i], 0, -fontSize / 2, { align: "center", width: fontSize });
    doc.restore();
  }
  doc.restore();
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
    const rightColX = 500;
    const datesY = 370;

    // Left: Date Issued
    doc.fontSize(10).fillColor(textLight).text(labels.dateIssued.toUpperCase(), leftColX, datesY, { width: 220, align: "left", characterSpacing: 1 });
    doc.fontSize(14).fillColor(textDark).text(issuedDate, leftColX, datesY + 16, { width: 220, align: "left" });

    // Right: Expiration Date
    doc.fontSize(10).fillColor(textLight).text(labels.expirationDate.toUpperCase(), rightColX, datesY, { width: 220, align: "left", characterSpacing: 1 });
    doc.fontSize(14).fillColor(textDark).text(expiresDate, rightColX, datesY + 16, { width: 220, align: "left" });

    // Certificate Number — centered below dates
    doc.fontSize(10).fillColor(textLight).text(labels.certificateNumber.toUpperCase(), 0, datesY + 42, { align: "center", width: pageWidth, characterSpacing: 1 });
    doc.fontSize(13).fillColor(textDark).text(cert.certificateNumber, 0, datesY + 58, { align: "center", width: pageWidth, characterSpacing: 1 });

    // ════════════════════════════════════════
    // SIGNATURE LINES — two across
    // ════════════════════════════════════════
    const sigY = 455;
    const sigLineW = 200;
    const sigLeftX = (pageWidth / 2 - sigLineW) / 2 + 30;
    const sigRightX = pageWidth / 2 + (pageWidth / 2 - sigLineW) / 2 - 30;

    // Left signature line
    doc.moveTo(sigLeftX, sigY).lineTo(sigLeftX + sigLineW, sigY).lineWidth(1).strokeColor(brown).stroke();
    doc.fontSize(9).fillColor(textLight).text(labels.instructorTitle, sigLeftX, sigY + 5, { width: sigLineW, align: "center", characterSpacing: 0.5 });

    // Right signature line
    doc.moveTo(sigRightX, sigY).lineTo(sigRightX + sigLineW, sigY).lineWidth(1).strokeColor(brown).stroke();
    doc.fontSize(9).fillColor(textLight).text(labels.complianceOfficer, sigRightX, sigY + 5, { width: sigLineW, align: "center", characterSpacing: 0.5 });

    // ════════════════════════════════════════
    // OFFICIAL SEAL — bottom-left area
    // ════════════════════════════════════════
    drawOfficialSeal(doc, 90, 535, 42, labels.officialSeal);

    // ════════════════════════════════════════
    // QR CODE — bottom-right area, framed
    // ════════════════════════════════════════
    const qrSize = 70;
    const qrX = pageWidth - 90 - qrSize / 2;
    const qrY = 500;

    // White background frame for QR
    doc.rect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8).fillColor("#ffffff").lineWidth(1).strokeColor(gold).fillAndStroke();
    doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
    doc.fontSize(8).fillColor(textLight).text(labels.scanToVerify, qrX - 10, qrY + qrSize + 6, { width: qrSize + 20, align: "center" });

    // ════════════════════════════════════════
    // FOOTER — OSHA citations, verification URL, validity note
    // ════════════════════════════════════════

    // Footer divider
    doc.moveTo(60, 580).lineTo(pageWidth - 60, 580).lineWidth(0.5).strokeColor(gold).stroke();

    // OSHA standard text (small, centered)
    const footerStandard = locale === "es"
      ? "Estándar OSHA 29 CFR 1910.178 — Camiones Industriales Motorizados | Validez de 3 años"
      : "OSHA Standard 29 CFR 1910.178 — Powered Industrial Trucks | 3-Year Certification Validity";
    doc.fontSize(7).fillColor(textLight).text(footerStandard, 0, 586, { align: "center", width: pageWidth, characterSpacing: 0.5 });

    // Verification URL
    doc.fontSize(8).fillColor(brown).text(`${labels.verifyAt} ${verifyUrl}`, 0, 595, { align: "center", width: pageWidth });

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
