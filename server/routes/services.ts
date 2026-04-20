import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { brand } from "@shared/config/brand";
import { documentCatalog, generateDocumentPdf, getDocumentDef } from "../document-pdf";
import { sendBookingConfirmation, sendBookingCancellation, sendBookingConfirmedEmail, sendBookingCompletedEmail, sendBookingAdminNotificationToAll, sendBookingCancellationAdminAlert } from "../email";
import { resolveLocale } from "../locale-resolver";
import { requireAuth, requireRole } from "./middleware";
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

    const price = Number(productPrice) || 0;
    const totalPrice = (price * participantCount).toFixed(2);

    const booking = await storage.createBooking({
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
      orderId: null,
    });

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

    return res.status(201).json(booking);
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
