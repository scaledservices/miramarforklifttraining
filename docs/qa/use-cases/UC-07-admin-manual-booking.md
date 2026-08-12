# UC-07 — Admin manual "New Booking"

Priority: **P0**. Role: Alberto (super_admin) / admin.

Records phone / in-person bookings so the calendar and trainer availability stay
accurate. No online payment is captured (office collects by its normal channel).

## Steps
1. Admin → **Bookings** → click **"New Booking"** (`button-new-booking`).
2. Dialog opens (`NewBookingDialog`) with: Location, Program, Date, Time slot
   (from the area's availabilityRules), Participants, Total price, Status,
   Contact name/phone/email, onsite Training address, Notes.
3. Pick a location — the time-slot dropdown populates from that area's rules.
4. Fill required fields (location, date, contact name/phone/email, participants).
5. Submit (`button-nb-submit`).

## Expected
- Booking is created and appears on the calendar/list with a booking number.
- The trainer's availability updates (no double-booking): creating a booking that
  would conflict with a committed GROUP at another city returns 409.
- Seat capacity enforced (cannot exceed remaining spots).
- Audit log entry `admin_booking_created`.
- Toast confirms creation; the list refreshes.

## Verified
2026-08-12 staging — dialog opens with all fields populated from area rules
(screenshot E-new-booking-dialog.png). Server route POST /api/admin/bookings
enforces trainer-conflict + capacity.
