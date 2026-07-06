import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { brand } from "@shared/config/brand";
import { documentCatalog, generateDocumentPdf, getDocumentDef } from "../document-pdf";
import { sendBookingConfirmation, sendBookingCancellation, sendBookingConfirmedEmail, sendBookingCompletedEmail, sendBookingAdminNotificationToAll, sendBookingCancellationAdminAlert, sendBalanceDueEmail } from "../email";
import { resolveLocale } from "../locale-resolver";
import { requireAuth, requireRole } from "./middleware";
import { db } from "../db";
import { computeBookingPrice } from "@shared/config/bookingPricing";
import { createTransactionFromNonce, isAuthorizeNetConfigured, calculateCardSurcharge } from "../authorizeNetClient";
import { isAdminRole } from "@shared/roles";

export function registerServiceRoutes(app: Express) {
app.get("/api/documents", (_req: Request, res: Response) => {
  return res.json({ documents: documentCatalog });
});

app.get("/api/documents/:docId/download", async (req: Request, res: Response) => {
  try {
    const docDef = getDocumentDef(req.params.docId);
    if (!docDef) return res.status(404).json({ error: "Document not found" });

    const locale = (req.query.locale as string) || "en";
    const { buffer, resolvedLocale } = await generateDocumentPdf(req.params.docId, locale);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${docDef.filename}"`);
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("X-Content-Locale", resolvedLocale);
    if (locale !== "en" && resolvedLocale === "en") {
      res.setHeader("X-Locale-Fallback", "true");
    }
    return res.send(buffer);
  } catch (error) {
    console.error("[Docs] PDF generation error:", error);
    return res.status(500).json({ error: "Failed to generate document" });
  }
});

// ──── SERVICE AREAS & BOOKING ────────────────────────────────────

app.get("/api/service-areas", async (_req: Request, res: Response) => {
  try {
    const areas = await storage.getServiceAreas();
    return res.json(areas);
  } catch (error) {
    console.error("[ServiceAreas] Error:", error);
    return res.status(500).json({ error: "Failed to fetch service areas" });
  }
});

app.get("/api/service-areas/check", async (req: Request, res: Response) => {
  try {
    const zip = req.query.zip as string;
    if (!zip || !/^\d{5}$/.test(zip)) {
      return res.status(400).json({ error: "Valid 5-digit ZIP code required" });
    }
    const area = await storage.checkServiceAreaByZip(zip);
    if (area) {
      return res.json({ available: true, serviceArea: area });
    }
    return res.json({ available: false, serviceArea: null });
  } catch (error) {
    console.error("[ServiceAreas] Check error:", error);
    return res.status(500).json({ error: "Failed to check service area" });
  }
});

app.get("/api/available-slots", async (req: Request, res: Response) => {
  try {
    const serviceAreaId = Number(req.query.serviceAreaId);
    const from = req.query.from as string;
    const to = req.query.to as string;

    if (!serviceAreaId || !from || !to) {
      return res.status(400).json({ error: "serviceAreaId, from, and to are required" });
    }

    const slots = await storage.getAvailableSlots(serviceAreaId, from, to);
    return res.json(slots);
  } catch (error) {
    console.error("[Slots] Error:", error);
    return res.status(500).json({ error: "Failed to fetch available slots" });
  }
});

app.patch("/api/service-areas/:id/availability", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const area = await storage.getServiceAreaById(id);
    if (!area) return res.status(404).json({ error: "Service area not found" });

    const { availabilityRules } = req.body;
    if (!availabilityRules) return res.status(400).json({ error: "availabilityRules required" });

    if (!Array.isArray(availabilityRules.daysOfWeek) || availabilityRules.daysOfWeek.length === 0) {
      return res.status(400).json({ error: "daysOfWeek must be a non-empty array of numbers 0-6" });
    }
    if (!availabilityRules.daysOfWeek.every((d: any) => typeof d === "number" && d >= 0 && d <= 6)) {
      return res.status(400).json({ error: "daysOfWeek values must be numbers 0-6" });
    }
    if (!Array.isArray(availabilityRules.timeSlots) || availabilityRules.timeSlots.length === 0) {
      return res.status(400).json({ error: "timeSlots must be a non-empty array" });
    }
    for (const slot of availabilityRules.timeSlots) {
      if (!slot.startTime || !slot.endTime || typeof slot.startTime !== "string" || typeof slot.endTime !== "string") {
        return res.status(400).json({ error: "Each timeSlot must have startTime and endTime strings" });
      }
    }
    if (typeof availabilityRules.maxParticipants !== "number" || availabilityRules.maxParticipants < 1) {
      return res.status(400).json({ error: "maxParticipants must be a positive number" });
    }

    const updated = await storage.updateServiceArea(id, { availabilityRules });

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "availability_rules_updated",
      entity: "service_area",
      entityId: String(id),
      metadata: { rules: availabilityRules },
    });

    return res.json(updated);
  } catch (error) {
    console.error("[AvailabilityRules] Update error:", error);
    return res.status(500).json({ error: "Failed to update availability rules" });
  }
});

app.post("/api/bookings", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ error: "User not found" });

    const { serviceAreaId, productSlug, sessionDate, startTime, endTime, participantCount, customerAddress, customerCity, customerState, customerZip, contactName, contactPhone, contactEmail, specialRequests, productPrice } = req.body;

    if (!serviceAreaId || !productSlug || !sessionDate || !startTime || !endTime || !participantCount || !customerAddress || !customerCity || !customerState || !customerZip || !contactName || !contactPhone || !contactEmail) {
      return res.status(400).json({ error: "All booking fields are required" });
    }

    const area = await storage.getServiceAreaById(serviceAreaId);
    if (!area) return res.status(404).json({ error: "Service area not found" });

    const rules = area.availabilityRules as any;
    if (!rules || !rules.daysOfWeek || !rules.timeSlots) {
      return res.status(400).json({ error: "Service area has no availability rules configured" });
    }

    const requestedDate = new Date(sessionDate + "T12:00:00Z");
    const dayOfWeek = requestedDate.getUTCDay();
    if (!rules.daysOfWeek.includes(dayOfWeek)) {
      return res.status(400).json({ error: "Training is not available on this day of the week" });
    }

    const validSlot = rules.timeSlots.some((s: any) => s.startTime === startTime && s.endTime === endTime);
    if (!validSlot) {
      return res.status(400).json({ error: "Invalid time slot" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const leadDate = new Date(today);
    leadDate.setDate(leadDate.getDate() + (rules.leadTimeDays || 2));
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + (rules.windowDays || 90));

    if (requestedDate < leadDate) {
      return res.status(400).json({ error: `Bookings require at least ${rules.leadTimeDays || 2} days advance notice` });
    }
    if (requestedDate > maxDate) {
      return res.status(400).json({ error: "Date is outside the booking window" });
    }

    if (rules.blackoutDates && rules.blackoutDates.includes(sessionDate)) {
      return res.status(400).json({ error: "This date is blocked for training" });
    }

    const trainerBusy = await storage.isTrainerBookedOnDate(sessionDate, serviceAreaId);
    if (trainerBusy) {
      return res.status(409).json({ error: "The trainer is already booked at another location on this date. Please select a different date." });
    }

    const maxParticipants = rules.maxParticipants || 10;
    const bookedAlready = await storage.getBookedParticipants(serviceAreaId, sessionDate, startTime);
    const remaining = maxParticipants - bookedAlready;

    if (participantCount > remaining) {
      return res.status(400).json({ error: `Only ${remaining} spots remaining for this time slot` });
    }

    // Price is computed server-side from the shared pricing map — the client's
    // productPrice is display-only and never trusted for the charge.
    const productSlugs: string[] = Array.isArray(req.body.productSlugs) ? req.body.productSlugs : [];
    const pricing = computeBookingPrice(productSlugs, Number(participantCount));

    // Custom/equipment-only selections have no published price: fall back to the
    // legacy request flow (pending booking, price confirmed by the office, no charge).
    const totalPrice = pricing
      ? pricing.total.toFixed(2)
      : ((Number(productPrice) || 0) * Number(participantCount)).toFixed(2);

    // Deposit-at-booking: when Authorize.net is configured and the selection has
    // published pricing, a 50% deposit (plus card surcharge) is charged up front;
    // balance is due on completion.
    let orderId: number | null = null;
    let depositCharged = 0;
    let depositSurcharge = 0;

    if (pricing && isAuthorizeNetConfigured()) {
      const { paymentNonce } = req.body;
      if (!paymentNonce) {
        return res.status(400).json({ error: "Payment details are required to book" });
      }

      depositSurcharge = calculateCardSurcharge(pricing.deposit);
      const chargeAmount = Number((pricing.deposit + depositSurcharge).toFixed(2));

      const order = await storage.createOrder({
        userId: user.id,
        total: totalPrice,
        status: "pending",
        refundPolicyAccepted: true,
      });

      const result = await createTransactionFromNonce(paymentNonce, chargeAmount, order.id, order.orderNumber, true);
      if (!result.success) {
        return res.status(400).json({ error: result.errorMessage || "Payment was declined" });
      }

      const { payments: paymentsTable } = await import("@shared/schema");
      await db.insert(paymentsTable).values({
        orderId: order.id,
        provider: "authorize_net",
        providerTransactionId: result.transactionId,
        amount: String(chargeAmount),
        status: "approved",
        rawResponse: { surcharge: depositSurcharge, principal: pricing.deposit },
      });

      orderId = order.id;
      depositCharged = chargeAmount;
    }

    let booking;
    try {
      booking = await storage.createBooking({
        userId: user.id,
        serviceAreaId,
        productSlug,
        sessionDate,
        startTime,
        endTime,
        participantCount,
        customerAddress,
        customerCity,
        customerState,
        customerZip,
        contactName,
        contactPhone,
        contactEmail,
        specialRequests: specialRequests || null,
        totalPrice,
        status: "pending",
        orderId,
      });
    } catch (bookingErr) {
      // The deposit has already been captured — surface enough detail for the
      // office to reconcile manually rather than silently orphaning the charge.
      console.error(`[Bookings] CRITICAL: deposit captured (order ${orderId}) but booking creation failed`, bookingErr);
      return res.status(500).json({
        error: "Your deposit was received but the booking could not be finalized. Please call us and reference your receipt — we will complete your booking manually.",
        orderId,
      });
    }

    await storage.createAuditLog({
      actorUserId: user.id,
      action: "booking_created",
      entity: "booking",
      entityId: String(booking.id),
      metadata: { bookingNumber: booking.bookingNumber, serviceAreaId, sessionDate, startTime, participantCount },
    });

    try {
      const bookingLocale = await resolveLocale({ userId: user.id });
      await sendBookingConfirmation({
        to: contactEmail,
        bookingNumber: booking.bookingNumber,
        trainingType: productSlug,
        sessionDate,
        startTime,
        endTime,
        onsiteAddress: `${customerAddress}, ${customerCity}, ${customerState} ${customerZip}`,
        participantCount,
        totalPrice: Number(totalPrice),
        actorUserId: user.id,
        locale: bookingLocale,
      });
      await sendBookingAdminNotificationToAll({
        bookingNumber: booking.bookingNumber,
        contactName,
        contactPhone,
        contactEmail,
        trainingType: productSlug,
        sessionDate,
        startTime,
        endTime,
        customerAddress,
        customerCity,
        customerState,
        customerZip,
        participantCount,
        specialRequests: specialRequests || null,
        actorUserId: user.id,
      });
    } catch (emailErr) {
      console.error("[Booking] Email error (non-fatal):", emailErr);
    }

    return res.status(201).json({
      ...booking,
      pricing: pricing === null ? null : {
        perPerson: pricing.perPerson,
        subtotal: pricing.subtotal,
        volumeDiscount: pricing.volumeDiscount,
        total: pricing.total,
        deposit: pricing.deposit,
        depositSurcharge,
        depositCharged,
        balanceDue: pricing.balance,
      },
    });
  } catch (error) {
    console.error("[Bookings] Create error:", error);
    return res.status(500).json({ error: "Failed to create booking" });
  }
});

app.get("/api/bookings", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ error: "User not found" });

    if (isAdminRole(user.role)) {
      const filters: any = {};
      if (req.query.status) filters.status = req.query.status;
      if (req.query.serviceAreaId) filters.serviceAreaId = Number(req.query.serviceAreaId);
      if (req.query.from) filters.from = req.query.from;
      if (req.query.to) filters.to = req.query.to;
      const allBookings = await storage.getAllBookings(filters);
      return res.json(allBookings);
    }

    const userBookings = await storage.getBookingsForUser(user.id);
    return res.json(userBookings);
  } catch (error) {
    console.error("[Bookings] List error:", error);
    return res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

app.get("/api/bookings/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const booking = await storage.getBookingById(Number(req.params.id));
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ error: "User not found" });
    if (!isAdminRole(user.role) && booking.userId !== user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    return res.json(booking);
  } catch (error) {
    console.error("[Bookings] Get error:", error);
    return res.status(500).json({ error: "Failed to fetch booking" });
  }
});

app.patch("/api/bookings/:id/cancel", requireAuth, async (req: Request, res: Response) => {
  try {
    const booking = await storage.getBookingById(Number(req.params.id));
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(401).json({ error: "User not found" });
    if (!isAdminRole(user.role) && booking.userId !== user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    if (booking.status === "cancelled") {
      return res.status(400).json({ error: "Booking is already cancelled" });
    }

    const updated = await storage.updateBookingStatus(booking.id, "cancelled");

    await storage.createAuditLog({
      actorUserId: user.id,
      action: "booking_cancelled",
      entity: "booking",
      entityId: String(booking.id),
      metadata: { bookingNumber: booking.bookingNumber },
    });

    try {
      const cancelLocale = await resolveLocale({ userId: user.id });
      await sendBookingCancellation({
        to: booking.contactEmail,
        bookingNumber: booking.bookingNumber,
        trainingType: booking.productSlug,
        sessionDate: booking.sessionDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        actorUserId: user.id,
        locale: cancelLocale,
      });
      await sendBookingCancellationAdminAlert({
        bookingNumber: booking.bookingNumber,
        contactName: booking.contactName,
        trainingType: booking.productSlug || "On-Site Training",
        sessionDate: booking.sessionDate || "",
        startTime: booking.startTime || "",
        endTime: booking.endTime || "",
        participantCount: booking.participantCount,
        cancelledBy: user.name || user.email,
        actorUserId: user.id,
      });
    } catch (emailErr) {
      console.error("[Booking] Cancel email error:", emailErr);
    }

    return res.json(updated);
  } catch (error) {
    console.error("[Bookings] Cancel error:", error);
    return res.status(500).json({ error: "Failed to cancel booking" });
  }
});

app.patch("/api/bookings/:id/confirm", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const booking = await storage.getBookingById(Number(req.params.id));
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.status !== "pending") {
      return res.status(400).json({ error: "Only pending bookings can be confirmed" });
    }

    const updated = await storage.updateBookingStatus(booking.id, "confirmed");

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "booking_confirmed",
      entity: "booking",
      entityId: String(booking.id),
      metadata: { bookingNumber: booking.bookingNumber },
    });

    try {
      const confirmLocale = await resolveLocale({ userId: booking.userId ?? undefined });
      await sendBookingConfirmedEmail({
        to: booking.contactEmail,
        bookingNumber: booking.bookingNumber,
        trainingType: booking.productSlug || "On-Site Training",
        sessionDate: booking.sessionDate || "",
        locale: confirmLocale,
        startTime: booking.startTime || "",
        endTime: booking.endTime || "",
        onsiteAddress: `${booking.customerAddress || ""}, ${booking.customerCity || ""}, ${booking.customerState || ""} ${booking.customerZip || ""}`,
        participantCount: booking.participantCount,
        actorUserId: req.session.userId!,
      });
    } catch (emailErr) {
      console.error("[Bookings] Confirmed email error (non-fatal):", emailErr);
    }

    return res.json(updated);
  } catch (error) {
    console.error("[Bookings] Confirm error:", error);
    return res.status(500).json({ error: "Failed to confirm booking" });
  }
});


// ---------- Phase A: booking finance, balance collection, reschedule, no-show ----------

async function getBookingFinance(bookingId: number) {
  const booking = await storage.getBookingById(bookingId);
  if (!booking) return null;
  const total = Number(booking.totalPrice);
  let paid = 0;
  let payments: any[] = [];
  if (booking.orderId) {
    payments = await storage.getPaymentsByOrder(booking.orderId);
    // Card surcharges are processing fees, not payment toward the training
    // price — count only the principal against the booking total.
    paid = payments
      .filter((p: any) => p.status === "approved")
      .reduce((sum: number, p: any) => {
        const surcharge = Number((p.rawResponse as any)?.surcharge) || 0;
        return sum + Number(p.amount) - surcharge;
      }, 0);
    // Refunds reduce the paid total
    paid -= payments
      .filter((p: any) => p.status === "refunded")
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  }
  const balanceDue = Math.max(0, Math.round((total - paid) * 100) / 100);
  return { booking, total, paid: Math.round(paid * 100) / 100, balanceDue, payments };
}

app.get("/api/admin/bookings/:id/finance", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const fin = await getBookingFinance(Number(req.params.id));
    if (!fin) return res.status(404).json({ error: "Booking not found" });
    const { booking, total, paid, balanceDue, payments } = fin;
    return res.json({
      bookingId: booking.id,
      orderId: booking.orderId,
      total,
      paid,
      balanceDue,
      payments: payments.map((p: any) => ({ id: p.id, provider: p.provider, status: p.status, amount: Number(p.amount), createdAt: p.createdAt })),
    });
  } catch (error) {
    console.error("[Bookings] Finance error:", error);
    return res.status(500).json({ error: "Failed to load booking finance" });
  }
});

app.post("/api/admin/bookings/:id/record-balance", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const { method, amount, note } = req.body;
    const ALLOWED_METHODS = ["cash", "check", "card_reader", "other"];
    if (!ALLOWED_METHODS.includes(method)) return res.status(400).json({ error: "Invalid payment method" });
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return res.status(400).json({ error: "Invalid amount" });

    const fin = await getBookingFinance(Number(req.params.id));
    if (!fin) return res.status(404).json({ error: "Booking not found" });
    if (!fin.booking.orderId) return res.status(400).json({ error: "Booking has no linked order" });
    if (amt > fin.balanceDue + 0.01) {
      return res.status(400).json({ error: `Amount exceeds balance due ($${fin.balanceDue.toFixed(2)})` });
    }

    await storage.createPayment({
      orderId: fin.booking.orderId,
      provider: `manual_${method}`,
      providerTransactionId: null,
      status: "approved",
      amount: String(amt.toFixed(2)),
      rawResponse: { recordedBy: req.session.userId, note: note || null },
    });

    const after = await getBookingFinance(fin.booking.id);
    if (after && after.balanceDue <= 0.01) {
      await storage.updateOrderStatus(fin.booking.orderId, "paid");
    }

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "balance_payment_recorded",
      entity: "booking",
      entityId: String(fin.booking.id),
      metadata: { bookingNumber: fin.booking.bookingNumber, method, amount: amt, note: note || null },
    });

    return res.json({ success: true, balanceDue: after?.balanceDue ?? 0 });
  } catch (error) {
    console.error("[Bookings] Record balance error:", error);
    return res.status(500).json({ error: "Failed to record payment" });
  }
});

app.post("/api/admin/bookings/:id/send-balance-link", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const fin = await getBookingFinance(Number(req.params.id));
    if (!fin) return res.status(404).json({ error: "Booking not found" });
    if (fin.balanceDue <= 0.01) return res.status(400).json({ error: "No balance due on this booking" });

    const linkLocale = await resolveLocale({ userId: fin.booking.userId ?? undefined });
    await sendBalanceDueEmail({
      to: fin.booking.contactEmail,
      contactName: fin.booking.contactName,
      bookingNumber: fin.booking.bookingNumber,
      bookingId: fin.booking.id,
      balanceDue: fin.balanceDue,
      actorUserId: req.session.userId!,
      locale: linkLocale,
    });

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "balance_link_sent",
      entity: "booking",
      entityId: String(fin.booking.id),
      metadata: { bookingNumber: fin.booking.bookingNumber, balanceDue: fin.balanceDue, to: fin.booking.contactEmail },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("[Bookings] Send balance link error:", error);
    return res.status(500).json({ error: "Failed to send payment link" });
  }
});

// Customer-facing: view own booking balance
app.get("/api/bookings/:id/balance", requireAuth, async (req: Request, res: Response) => {
  try {
    const fin = await getBookingFinance(Number(req.params.id));
    if (!fin || fin.booking.userId !== req.session.userId) return res.status(404).json({ error: "Booking not found" });
    return res.json({
      bookingNumber: fin.booking.bookingNumber,
      sessionDate: fin.booking.sessionDate,
      total: fin.total,
      paid: fin.paid,
      balanceDue: fin.balanceDue,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to load balance" });
  }
});

// Customer-facing: pay own remaining balance by card
app.post("/api/bookings/:id/pay-balance", requireAuth, async (req: Request, res: Response) => {
  try {
    const fin = await getBookingFinance(Number(req.params.id));
    if (!fin || fin.booking.userId !== req.session.userId) return res.status(404).json({ error: "Booking not found" });
    if (!fin.booking.orderId) return res.status(400).json({ error: "Booking has no linked order" });
    if (fin.balanceDue <= 0.01) return res.status(400).json({ error: "No balance due" });
    if (!isAuthorizeNetConfigured()) return res.status(400).json({ error: "Online payment is not available. Please call us." });

    const { paymentNonce } = req.body;
    if (!paymentNonce) return res.status(400).json({ error: "Payment details required" });

    const surcharge = calculateCardSurcharge(fin.balanceDue);
    const chargeAmount = Number((fin.balanceDue + surcharge).toFixed(2));

    const order = await storage.getOrder(fin.booking.orderId);
    const result = await createTransactionFromNonce(paymentNonce, chargeAmount, fin.booking.orderId, order?.orderNumber || `BAL-${fin.booking.bookingNumber}`, true);
    if (!result.success) {
      return res.status(400).json({ error: result.errorMessage || "Payment was declined" });
    }

    const { payments: paymentsTable } = await import("@shared/schema");
    await db.insert(paymentsTable).values({
      orderId: fin.booking.orderId,
      provider: "authorize_net",
      providerTransactionId: result.transactionId,
      amount: String(chargeAmount),
      status: "approved",
      rawResponse: { surcharge, principal: fin.balanceDue },
    });
    await storage.updateOrderStatus(fin.booking.orderId, "paid");

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "balance_paid_online",
      entity: "booking",
      entityId: String(fin.booking.id),
      metadata: { bookingNumber: fin.booking.bookingNumber, amount: chargeAmount, transactionId: result.transactionId },
    });

    return res.json({ success: true, amountCharged: chargeAmount, surcharge });
  } catch (error) {
    console.error("[Bookings] Pay balance error:", error);
    return res.status(500).json({ error: "Failed to process payment" });
  }
});

app.patch("/api/admin/bookings/:id/reschedule", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const { sessionDate, startTime, endTime } = req.body;
    if (!sessionDate || !startTime || !endTime) return res.status(400).json({ error: "Date and time slot required" });

    const booking = await storage.getBookingById(Number(req.params.id));
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.status === "cancelled" || booking.status === "completed") {
      return res.status(400).json({ error: `Cannot reschedule a ${booking.status} booking` });
    }

    const area = await storage.getServiceAreaById(booking.serviceAreaId);
    const rules = area?.availabilityRules as any;
    if (rules?.blackoutDates?.includes(sessionDate)) {
      return res.status(400).json({ error: "That date is blocked for training" });
    }
    const trainerBusy = await storage.isTrainerBookedOnDate(sessionDate, booking.serviceAreaId);
    if (trainerBusy) {
      return res.status(409).json({ error: "The trainer is already booked at another location on this date" });
    }

    const { bookings: bookingsTable } = await import("@shared/schema");
    const { eq: eqOp } = await import("drizzle-orm");
    const [updated] = await db.update(bookingsTable)
      .set({ sessionDate, startTime, endTime, updatedAt: new Date() })
      .where(eqOp(bookingsTable.id, booking.id))
      .returning();

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "booking_rescheduled",
      entity: "booking",
      entityId: String(booking.id),
      metadata: { bookingNumber: booking.bookingNumber, from: `${booking.sessionDate} ${booking.startTime}`, to: `${sessionDate} ${startTime}` },
    });

    return res.json(updated);
  } catch (error) {
    console.error("[Bookings] Reschedule error:", error);
    return res.status(500).json({ error: "Failed to reschedule booking" });
  }
});

app.patch("/api/admin/bookings/:id/no-show", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const booking = await storage.getBookingById(Number(req.params.id));
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.status !== "confirmed" && booking.status !== "pending") {
      return res.status(400).json({ error: "Only pending or confirmed bookings can be marked no-show" });
    }
    const updated = await storage.updateBookingStatus(booking.id, "no_show");
    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "booking_no_show",
      entity: "booking",
      entityId: String(booking.id),
      metadata: { bookingNumber: booking.bookingNumber },
    });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: "Failed to update booking" });
  }
});

// ---------- Phase A: service-area management ----------

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

app.post("/api/admin/service-areas", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const { name, state, zipPrefixes, cities, availabilityRules } = req.body;
    if (!name || typeof name !== "string" || name.trim().length < 2) return res.status(400).json({ error: "Name is required" });
    if (!state || typeof state !== "string" || state.trim().length < 2) return res.status(400).json({ error: "State is required" });
    if (!Array.isArray(zipPrefixes) || zipPrefixes.length === 0 || !zipPrefixes.every((z: any) => /^\d{3,5}$/.test(String(z)))) {
      return res.status(400).json({ error: "At least one ZIP code or 3-digit ZIP prefix is required" });
    }

    const { serviceAreas: areasTable } = await import("@shared/schema");
    const slug = slugify(name);
    const values: any = {
      name: name.trim(),
      slug,
      state: state.trim().toUpperCase().slice(0, 2),
      zipPrefixes: zipPrefixes.map((z: any) => String(z)),
      cities: Array.isArray(cities) ? cities : [],
      isActive: true,
    };
    if (availabilityRules) values.availabilityRules = availabilityRules;

    const [created] = await db.insert(areasTable).values(values).returning();

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "service_area_created",
      entity: "service_area",
      entityId: String(created.id),
      metadata: { name: created.name, slug: created.slug },
    });

    return res.status(201).json(created);
  } catch (error: any) {
    if (error?.code === "23505") return res.status(400).json({ error: "A service area with this name already exists" });
    console.error("[ServiceAreas] Create error:", error);
    return res.status(500).json({ error: "Failed to create service area" });
  }
});

app.patch("/api/admin/service-areas/:id", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const { name, state, zipPrefixes, cities, isActive } = req.body;
    const { serviceAreas: areasTable } = await import("@shared/schema");
    const { eq: eqOp } = await import("drizzle-orm");

    const updates: any = { updatedAt: new Date() };
    if (name !== undefined) updates.name = String(name).trim();
    if (state !== undefined) updates.state = String(state).trim().toUpperCase().slice(0, 2);
    if (zipPrefixes !== undefined) {
      if (!Array.isArray(zipPrefixes) || !zipPrefixes.every((z: any) => /^\d{3,5}$/.test(String(z)))) {
        return res.status(400).json({ error: "ZIP prefixes must be 3-5 digit codes" });
      }
      updates.zipPrefixes = zipPrefixes.map((z: any) => String(z));
    }
    if (cities !== undefined) updates.cities = Array.isArray(cities) ? cities : [];
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    const [updated] = await db.update(areasTable).set(updates).where(eqOp(areasTable.id, Number(req.params.id))).returning();
    if (!updated) return res.status(404).json({ error: "Service area not found" });

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "service_area_updated",
      entity: "service_area",
      entityId: String(updated.id),
      metadata: { name: updated.name, isActive: updated.isActive },
    });

    return res.json(updated);
  } catch (error) {
    console.error("[ServiceAreas] Update error:", error);
    return res.status(500).json({ error: "Failed to update service area" });
  }
});

app.patch("/api/bookings/:id/complete", requireRole("admin", "super_admin"), async (req: Request, res: Response) => {
  try {
    const booking = await storage.getBookingById(Number(req.params.id));
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    if (booking.status !== "confirmed") {
      return res.status(400).json({ error: "Only confirmed bookings can be completed" });
    }

    const updated = await storage.updateBookingStatus(booking.id, "completed");

    await storage.createAuditLog({
      actorUserId: req.session.userId!,
      action: "booking_completed",
      entity: "booking",
      entityId: String(booking.id),
      metadata: { bookingNumber: booking.bookingNumber },
    });

    try {
      const completeLocale = await resolveLocale({ userId: booking.userId ?? undefined });
      await sendBookingCompletedEmail({
        to: booking.contactEmail,
        bookingNumber: booking.bookingNumber,
        trainingType: booking.productSlug || "On-Site Training",
        sessionDate: booking.sessionDate || "",
        contactName: booking.contactName,
        participantCount: booking.participantCount,
        actorUserId: req.session.userId!,
        locale: completeLocale,
      });
    } catch (emailErr) {
      console.error("[Bookings] Completed email error (non-fatal):", emailErr);
    }

    return res.json(updated);
  } catch (error) {
    console.error("[Bookings] Complete error:", error);
    return res.status(500).json({ error: "Failed to complete booking" });
  }
});
}
