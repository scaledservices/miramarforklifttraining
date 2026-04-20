import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { SHIPPING_RATES } from "../constants";
import { generateCertificatePdf } from "../certificate-pdf";
import { sendCertificationEmail, sendCardOrderReceipt } from "../email";
import { pdfStore } from "../pdf-store";
import { requireAuth, verifyLimiter } from "./middleware";
import { isAdminRole } from "@shared/roles";
import { resolveLocale } from "../locale-resolver";

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

app.post("/api/cert-cards", requireAuth, async (req: Request, res: Response) => {
  try {
    const { certificationId, shippingAddress, shippingMethod } = req.body;
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
    const totalAmount = cardPrice + shippingCost;

    const isDemoMode = process.env.DEMO_MODE === "true";
    const initialStatus = isDemoMode ? "paid" : "pending_payment";

    const cardOrder = await storage.createCertCardOrder({
      userId: req.session.userId!,
      certificationId,
      quantity: 1,
      shippingAddress,
      shippingMethod,
      shippingCost: String(shippingCost),
      totalAmount: String(totalAmount),
      status: initialStatus,
    });

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "card_upsell_purchased",
      entity: "cert_card_orders",
      entityId: String(cardOrder.id),
      metadata: { certificationId, totalAmount, demoMode: isDemoMode },
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
