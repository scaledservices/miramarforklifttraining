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
  },
} as const;

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

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 120, margin: 1 });
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

    const pageWidth = 792;
    const pageHeight = 612;

    doc.rect(20, 20, pageWidth - 40, pageHeight - 40).lineWidth(3).strokeColor(theme.pdf.borderPrimary).stroke();
    doc.rect(25, 25, pageWidth - 50, pageHeight - 50).lineWidth(1).strokeColor(theme.pdf.borderAccent).stroke();

    const logoPath = getLogoPath();
    if (logoPath) {
      doc.image(logoPath, (pageWidth - 200) / 2, 40, { width: 200 });
    } else {
      doc.fontSize(14).fillColor(theme.pdf.fallbackBrandColor).text(brand.name.toUpperCase(), 0, 50, { align: "center" });
    }
    doc.moveDown(0.5);

    doc.fontSize(32).fillColor(theme.pdf.titleColor).text(labels.certificateOfCompletion, 0, 90, { align: "center" });
    doc.moveDown(1);

    doc.fontSize(14).fillColor("#666666").text(labels.certifyThat, 0, 140, { align: "center" });
    doc.moveDown(0.5);

    doc.fontSize(28).fillColor(theme.pdf.titleColor).text(user.name, 0, 170, { align: "center" });
    doc.moveDown(0.5);

    doc.moveTo(200, 210).lineTo(592, 210).lineWidth(1).strokeColor(theme.pdf.borderAccent).stroke();

    doc.fontSize(14).fillColor("#666666").text(labels.completedCourse, 0, 225, { align: "center" });
    doc.moveDown(0.5);

    doc.fontSize(22).fillColor(theme.pdf.titleColor).text(course.title, 0, 255, { align: "center" });
    doc.moveDown(1);

    const complianceTextMap: Record<string, string> = {
      en: industry.regulatory.complianceText,
      es: "de acuerdo con el Estándar OSHA 29 CFR 1910.178",
    };
    doc.fontSize(12).fillColor(theme.colors.text.medium).text(complianceTextMap[locale] || complianceTextMap.en, 0, 295, { align: "center" });
    doc.moveDown(1.5);

    const issuedDate = cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric" }) : "N/A";
    const expiresDate = cert.expiresAt ? new Date(cert.expiresAt).toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric" }) : "N/A";

    const leftCol = 120;
    const rightCol = 460;
    const infoY = 350;

    doc.fontSize(11).fillColor("#999999").text(labels.dateIssued, leftCol, infoY, { width: 200 });
    doc.fontSize(13).fillColor("#333333").text(issuedDate, leftCol, infoY + 16, { width: 200 });

    doc.fontSize(11).fillColor("#999999").text(labels.expirationDate, rightCol, infoY, { width: 200 });
    doc.fontSize(13).fillColor("#333333").text(expiresDate, rightCol, infoY + 16, { width: 200 });

    doc.fontSize(11).fillColor("#999999").text(labels.certificateNumber, leftCol, infoY + 50, { width: 200 });
    doc.fontSize(13).fillColor("#333333").text(cert.certificateNumber, leftCol, infoY + 66, { width: 200 });

    doc.image(qrBuffer, rightCol + 30, infoY + 40, { width: 90, height: 90 });

    doc.fontSize(9).fillColor("#999999").text(labels.scanToVerify, rightCol + 40, infoY + 135, { width: 80, align: "center" });

    doc.fontSize(9).fillColor("#aaaaaa").text(
      `${labels.verifyAt} ${verifyUrl}`,
      0, pageHeight - 55,
      { align: "center", width: pageWidth }
    );

    doc.end();
  });

  await pdfStore.write(relativePath, pdfBuffer);

  await db.update(certifications).set({
    pdfUrl: relativePath,
    pdfGeneratedAt: new Date(),
    updatedAt: new Date(),
  }).where(eq(certifications.id, certificationId));

  return relativePath;
}

export async function regenerateCertificatePdf(certificationId: number): Promise<string> {
  const [cert] = await db.select().from(certifications).where(eq(certifications.id, certificationId));
  if (!cert) throw new Error(`Certification ${certificationId} not found`);

  await db.update(certifications).set({ pdfUrl: null, updatedAt: new Date() }).where(eq(certifications.id, certificationId));

  return generateCertificatePdf(certificationId);
}
