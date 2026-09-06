import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth, requireRole } from "./middleware";
import { rateLimit } from "../rate-limit";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { bookingAttendees } from "@shared/schema";

// Booking attendees (Alberto meeting 2026-07-28):
//  #5 - purchaser optionally names attendees at booking creation (attached to
//       the POST /api/bookings payload and persisted here).
//  #8 - on-site digital sign-in: trainees scan a QR / open an iPad link and
//       self-register, feeding the marketing database.
//  #7 - seat reservation tracking on the customer dashboard.
//
// Name collection is intentionally OPTIONAL (managers often don't know the
// final attendee names at purchase time) - a booking with no named attendees
// is valid and shows as "open seats".

export function registerAttendeeRoutes(app: Express) {
  // ---- #5: list attendees for a booking the signed-in purchaser owns ----
  // Also usable by admins (any booking).
  app.get("/api/bookings/:id/attendees", requireAuth, async (req: Request, res: Response) => {
    try {
      const bookingId = Number(req.params.id);
      const booking = await storage.getBookingById(bookingId);
      if (!booking) return res.status(404).json({ error: "Booking not found" });

      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ error: "User not found" });
      const isAdmin = ["admin", "super_admin"].includes(user.role);
      if (!isAdmin && booking.userId !== user.id) {
        return res.status(403).json({ error: "Not your booking" });
      }

      const attendees = await storage.getAttendeesForBooking(bookingId);
      return res.json({
        bookingId,
        participantCount: booking.participantCount,
        attendees,
        openSeats: Math.max(0, booking.participantCount - attendees.length),
      });
    } catch (error) {
      console.error("[Attendees] List error:", error);
      return res.status(500).json({ error: "Failed to load attendees" });
    }
  });

  // ---- #5: purchaser (or admin) adds/updates attendee names after booking ----
  app.post("/api/bookings/:id/attendees", requireAuth, async (req: Request, res: Response) => {
    try {
      const bookingId = Number(req.params.id);
      const booking = await storage.getBookingById(bookingId);
      if (!booking) return res.status(404).json({ error: "Booking not found" });

      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ error: "User not found" });
      const isAdmin = ["admin", "super_admin"].includes(user.role);
      if (!isAdmin && booking.userId !== user.id) {
        return res.status(403).json({ error: "Not your booking" });
      }

      const list: { firstName?: string; lastName?: string; email?: string; phone?: string }[] =
        Array.isArray(req.body?.attendees) ? req.body.attendees : [];
      if (list.length === 0) return res.status(400).json({ error: "No attendees provided" });

      const existing = await storage.getAttendeesForBooking(bookingId);
      const capacity = booking.participantCount - existing.length;
      if (list.length > capacity) {
        return res.status(400).json({ error: `Only ${capacity} open seat(s) remaining on this booking` });
      }

      const source = isAdmin ? "admin" : "checkout";
      const created = [];
      for (const a of list) {
        if (!a.firstName && !a.lastName) continue; // skip fully blank rows
        // 2026-09-03 (Alberto): backstop for the client-side rule - the name
        // goes on the certification license, so both parts are required.
        if (!(a.firstName || "").trim() || !(a.lastName || "").trim()) {
          return res.status(400).json({ error: "First and last name are required for each attendee" });
        }
        created.push(await storage.addBookingAttendee({
          bookingId,
          firstName: (a.firstName || "").trim() || null,
          lastName: (a.lastName || "").trim() || null,
          email: (a.email || "").trim() || null,
          phone: (a.phone || "").trim() || null,
          source,
        }));
      }
      return res.status(201).json({ created, added: created.length });
    } catch (error) {
      console.error("[Attendees] Create error:", error);
      return res.status(500).json({ error: "Failed to save attendees" });
    }
  });

  // ---- #8: PUBLIC sign-in form bootstrap (no auth). Returns the minimal,
  // non-sensitive info a trainee needs to confirm they're at the right class.
  // Rate-limited; reveals only city-level location + time, never the customer
  // address or purchaser contact details.
  app.get(
    "/api/booking-signin/:bookingNumber",
    rateLimit({ name: "booking-signin-read", windowMs: 60_000, max: 30 }),
    async (req: Request, res: Response) => {
      try {
        const booking = await storage.getBookingByNumber(String(req.params.bookingNumber));
        if (!booking) return res.status(404).json({ error: "Sign-in link not found" });
        const area = await storage.getServiceAreaById(booking.serviceAreaId);
        return res.json({
          bookingNumber: booking.bookingNumber,
          sessionDate: booking.sessionDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
          trainingType: booking.productSlug,
          areaName: area?.name || null,
          status: booking.status,
        });
      } catch (error) {
        console.error("[Signin] Bootstrap error:", error);
        return res.status(500).json({ error: "Failed to load sign-in" });
      }
    }
  );

  // ---- #8: PUBLIC sign-in submission (no auth). A trainee records their own
  // name (and optionally email/phone for the marketing database). Marks the
  // attendee as checked in. Enforces the booked seat capacity.
  app.post(
    "/api/booking-signin/:bookingNumber",
    rateLimit({ name: "booking-signin-write", windowMs: 60_000, max: 20 }),
    async (req: Request, res: Response) => {
      try {
        const booking = await storage.getBookingByNumber(String(req.params.bookingNumber));
        if (!booking) return res.status(404).json({ error: "Sign-in link not found" });
        if (booking.status === "cancelled") {
          return res.status(400).json({ error: "This booking was cancelled" });
        }

        const firstName = (req.body?.firstName || "").trim();
        const lastName = (req.body?.lastName || "").trim();
        if (!firstName || !lastName) {
          return res.status(400).json({ error: "First and last name are required" });
        }

        // Capacity guard: never let sign-ins exceed purchased seats.
        const existing = await storage.getAttendeesForBooking(booking.id);
        if (existing.length >= booking.participantCount) {
          return res.status(409).json({ error: "All seats for this class are already signed in" });
        }

        // Idempotent-ish: if this exact name already signed in for this
        // booking, return the existing row instead of duplicating.
        const dupe = existing.find(
          (a) =>
            (a.firstName || "").toLowerCase() === firstName.toLowerCase() &&
            (a.lastName || "").toLowerCase() === lastName.toLowerCase()
        );
        if (dupe) {
          return res.json({ ok: true, attendee: dupe, alreadySignedIn: true });
        }

        const [row] = await db.insert(bookingAttendees).values({
          bookingId: booking.id,
          firstName,
          lastName,
          email: (req.body?.email || "").trim() || null,
          phone: (req.body?.phone || "").trim() || null,
          source: "signin",
          checkedInAt: new Date(),
        }).returning();

        return res.status(201).json({ ok: true, attendee: row, alreadySignedIn: false });
      } catch (error) {
        console.error("[Signin] Submit error:", error);
        return res.status(500).json({ error: "Failed to sign in" });
      }
    }
  );
}
