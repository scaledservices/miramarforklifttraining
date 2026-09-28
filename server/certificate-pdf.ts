import { pdfStore } from "./pdf-store";
import { db } from "./db";
import { certifications, users, courses, enrollments } from "@shared/schema";
import { and, eq, desc } from "drizzle-orm";
import { renderCertificatePdf } from "./certificate-template";

function getCertPath(certificateNumber: string): string {
  return `certificates/${certificateNumber}.pdf`;
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

  const pdfBuffer = await renderCertificatePdf({ cert, user, course, trainingEnrollment });

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
