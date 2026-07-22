import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { SHIPPING_RATES } from "../constants";
import { generateCertificatePdf } from "../certificate-pdf";
import { sendCertificationEmail, sendCardOrderReceipt, sendContactFormAdminAlert } from "../email";
import { pdfStore } from "../pdf-store";
import { requireAuth, verifyLimiter, payLimiter } from "./middleware";
import { rateLimit } from "../rate-limit";
import { isAdminRole } from "@shared/roles";
import { resolveLocale } from "../locale-resolver";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { certCardOrders, platformSettings } from "@shared/schema";
import {
  isAuthorizeNetConfigured,
  createTransactionFromNonce,
  calculateCardSurcharge,
} from "../authorizeNetClient";
import { logger } from "../monitoring";

export const verifyCache = new Map<string, { data: any; expiresAt: number }>();

export function registerCertRoutes(app: Express) {
app.get("/api/certifications", requireAuth, async (req: Request, res: Response) => {
  try {
    const certs = await storage.getCertificationsByUser(req.session.userId!);
    return res.json({ certifications: certs });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/certifications/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const cert = await storage.getCertification(parseInt(req.params.id as string));
    if (!cert || cert.userId !== req.session.userId) return res.status(404).json({ error: "Certification not found" });
    return res.json({ certification: cert });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/certifications/:id/download", requireAuth, async (req: Request, res: Response) => {
  try {
    const cert = await storage.getCertification(parseInt(req.params.id as string));
    if (!cert) return res.status(404).json({ error: "Certification not found" });

    const isOwner = cert.userId === req.session.userId;
    const currentUser = await storage.getUser(req.session.userId!);
    const isAdmin = currentUser ? isAdminRole(currentUser.role) : false;
    let isGroupAdmin = false;
    if (!isOwner && !isAdmin && currentUser?.role === "group_admin") {
      const groups = await storage.getGroupsByAdmin(req.session.userId!);
      for (const group of groups) {
        const members = await storage.listGroupMembers(group.id);
        if (members.some(m => m.userId === cert.userId)) {
          isGroupAdmin = true;
          break;
        }
      }
    }
    if (!isOwner && !isAdmin && !isGroupAdmin) {
      return res.status(404).json({ error: "Certification not found" });
    }

    let relativePath = cert!.pdfUrl;
    if (!relativePath) {
      relativePath = await generateCertificatePdf(cert!.id);
    }

    const pdfBuffer = await pdfStore.read(relativePath);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="certificate-${cert!.certificateNumber}.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error("[Cert] Download error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/verify/:certificateNumber", verifyLimiter, async (req: Request, res: Response) => {
  try {
    const certNumber = req.params.certificateNumber as string;
    const cached = verifyCache.get(certNumber);
    if (cached && cached.expiresAt > Date.now()) {
      return res.json(cached.data);
    }

    const cert = await storage.getCertificationByNumber(certNumber);
    if (!cert) return res.status(404).json({ error: "Certificate not found" });

    const user = await storage.getUser(cert.userId);
    const course = await storage.getCourse(cert.courseId);

    const firstName = user?.name.split(" ")[0] || "";
    const lastInitial = user?.name.split(" ").slice(1).map(n => n[0]).join("") || "";
    const displayName = lastInitial ? `${firstName} ${lastInitial}.` : firstName;

    const data = {
      valid: cert.status !== "revoked",
      certificateNumber: cert.certificateNumber,
      holderName: displayName,
      courseName: course?.title || "",
      issuedAt: cert.issuedAt,
      expiresAt: cert.expiresAt,
      status: cert.status,
    };

    verifyCache.set(certNumber, { data, expiresAt: Date.now() + 60000 });
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

const recertInterestLimiter = rateLimit({ name: "recert_interest", windowMs: 60_000, max: 5 });

const recertInterestSchema = z.object({
  name: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.union([z.literal(""), z.string().trim().email("Valid email required")]).optional(),
  certificateNumber: z.string().trim().min(3).max(64),
}).refine(
  (d) => Boolean(d.phone && d.phone.trim().length >= 7) || Boolean(d.email && d.email.trim() !== ""),
  { message: "A phone number or email is required" },
);

app.post("/api/certs/recert-interest", recertInterestLimiter, async (req: Request, res: Response) => {
  try {
    const result = recertInterestSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid form data", details: result.error.issues });
    }
    const { name, phone, email, certificateNumber } = result.data;

    const cert = await storage.getCertificationByNumber(certificateNumber);
    if (!cert) return res.status(404).json({ error: "Certificate not found" });

    const expiryText = cert.expiresAt
      ? new Date(cert.expiresAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : "no expiration on file";
    const isExpired = cert.expiresAt ? new Date(cert.expiresAt).getTime() < Date.now() : false;

    const submissionName = name && name.trim() !== "" ? name.trim() : "Recertification Lead";
    const message = [
      "Recertification interest from the certificate verification page.",
      `Certificate number: ${cert.certificateNumber}`,
      `${isExpired ? "Expired" : "Expires"}: ${expiryText}`,
      `Requested: a reminder / callback about recertification.`,
    ].join("\n");

    await storage.saveContactSubmission({
      name: submissionName,
      email: email?.trim() || "",
      phone: phone?.trim() || undefined,
      trainingType: "individual",
      message,
    });

    try {
      await sendContactFormAdminAlert({
        name: submissionName,
        email: email?.trim() || "",
        phone: phone?.trim() || undefined,
        trainingType: "individual",
        message,
      });
    } catch (emailErr) {
      console.error("[RecertInterest] Admin alert email error (non-fatal):", emailErr);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[RecertInterest] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const addressSchema = z.object({
  name: z.string().min(1).max(120),
  address: z.string().min(1).max(120),
  city: z.string().min(1).max(60),
  state: z.string().min(1).max(60),
  zip: z.string().min(1).max(20),
  country: z.string().max(60).optional(),
});

const certCardOrderSchema = z.object({
  certificationId: z.number().int().positive(),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  shippingMethod: z.enum(["standard", "expedited"]),
  paymentNonce: z.string().max(512).optional(),
  // JPEG data URL, client-downscaled to <=480px. Hard cap keeps the JSON body
  // under Express's 100KB parser limit; anything bigger is rejected, not truncated.
  idPhoto: z.string().regex(/^data:image\/jpeg;base64,/, "Photo must be a JPEG").max(120_000).optional(),
});

app.post("/api/cert-cards", requireAuth, payLimiter, async (req: Request, res: Response) => {
  try {
    const parsed = certCardOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid card order" });
    }
    const { certificationId, shippingAddress, shippingMethod, paymentNonce, idPhoto } = parsed.data;
    const billingAddress = parsed.data.billingAddress ?? parsed.data.shippingAddress;

    const cert = await storage.getCertification(certificationId);
    if (!cert) return res.status(404).json({ error: "Certification not found" });

    const existingCardOrders = await storage.getCertCardOrdersByCertification(certificationId);
    const activeCardOrder = existingCardOrders.find(
      (co) => co.userId === req.session.userId! && !["canceled", "refunded"].includes(co.status)
    );
    if (activeCardOrder) {
      return res.status(409).json({
        error: "You already have an active card order for this certification",
        existingOrderId: activeCardOrder.id,
        existingStatus: activeCardOrder.status,
      });
    }

    const shippingCost = SHIPPING_RATES[shippingMethod as keyof typeof SHIPPING_RATES];
    if (!shippingCost) return res.status(400).json({ error: "Invalid shipping method" });

    const cardPrice = 9.99;
    const subtotal = cardPrice + shippingCost;
    // Same 3% card surcharge as course checkout (matches the client-side total).
    const surcharge = calculateCardSurcharge(subtotal);
    const totalAmount = Number((subtotal + surcharge).toFixed(2));

    const isDemoMode = process.env.DEMO_MODE === "true" && !isAuthorizeNetConfigured();

    // CHARGE FIRST. The order row is created only after money moves (or in
    // demo mode). The old handler never read paymentNonce, so production
    // orders were created without any charge - a free-cards hole.
    let transactionId: string;
    if (isDemoMode) {
      transactionId = `demo-${Date.now()}`;
    } else {
      if (!isAuthorizeNetConfigured()) {
        return res.status(503).json({ error: "Payment is not configured. Please call us to order." });
      }
      if (!paymentNonce) {
        return res.status(400).json({ error: "Payment nonce required" });
      }
      const nameParts = billingAddress.name.trim().split(/\s+/);
      const charge = await createTransactionFromNonce(
        paymentNonce,
        totalAmount,
        certificationId, // no order id exists yet; cert id + invoice carry the reference
        `CARD-${cert.certificateNumber}`,
        true,
        {
          firstName: nameParts.slice(0, -1).join(" ") || nameParts[0],
          lastName: nameParts.length > 1 ? nameParts[nameParts.length - 1] : "-",
          address: billingAddress.address,
          city: billingAddress.city,
          state: billingAddress.state,
          zip: billingAddress.zip,
          country: billingAddress.country || "US",
        }
      );
      if (!charge.success) {
        logger.warn("[CertCards] Card charge declined", {
          source: "payment",
          metadata: { certificationId, amount: totalAmount, declineReason: charge.errorMessage },
        });
        return res.status(400).json({ error: charge.errorMessage || "Payment was declined" });
      }
      transactionId = charge.transactionId!;
    }

    // Earnings split, same 70/30 default and profit_split convention as
    // course-order payments. Stored on the card order itself because the
    // payments table requires a course-order FK (orderId NOT NULL).
    const splitSetting = await db.select().from(platformSettings).where(eq(platformSettings.key, "profit_split"));
    const split = (splitSetting[0]?.value as any) || { platformPercent: 70, partnerPercent: 30 };
    const platformCut = Number((totalAmount * split.platformPercent / 100).toFixed(2));
    const partnerCut = Number((totalAmount - platformCut).toFixed(2));

    const cardOrder = await storage.createCertCardOrder({
      userId: req.session.userId!,
      certificationId,
      quantity: 1,
      shippingAddress,
      billingAddress,
      idPhoto: idPhoto ?? null,
      shippingMethod,
      shippingCost: String(shippingCost),
      totalAmount: String(totalAmount),
      status: "paid",
      providerTransactionId: transactionId,
      chargeMetadata: {
        provider: isDemoMode ? "demo_sandbox" : "authorize_net",
        surcharge,
        platformEarnings: platformCut,
        partnerEarnings: partnerCut,
      },
      paidAt: new Date(),
    });

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "card_upsell_purchased",
      entity: "cert_card_orders",
      entityId: String(cardOrder.id),
      metadata: { certificationId, totalAmount, transactionId, demoMode: isDemoMode, hasIdPhoto: !!idPhoto },
    });

    try {
      const cardUser = await storage.getUser(req.session.userId!);
      if (cardUser) {
        const cardLocale = await resolveLocale({ userId: cardUser.id });
        await sendCardOrderReceipt({
          to: cardUser.email,
          certNumber: cert.certificateNumber,
          shippingMethod,
          shippingCost,
          totalAmount,
          actorUserId: req.session.userId!,
          locale: cardLocale,
        });
      }
    } catch (emailErr) {
      console.error("[CertCards] Receipt email error (non-fatal):", emailErr);
    }

    return res.status(201).json({ cardOrder });
  } catch (error) {
    console.error("[CertCards] Create error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
}
