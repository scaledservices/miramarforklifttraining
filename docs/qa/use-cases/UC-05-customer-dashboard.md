# UC-05 — Customer dashboard (calendar + seat tracking)

Priority: **P0**. Role: Individual, Group admin (must own a booking).

## Preconditions
- The signed-in account has at least one upcoming, non-cancelled booking.

## Steps
1. Log in and go to `/dashboard` (`dashboard-page`).
2. Confirm the **"Your upcoming training"** section (`dashboard-bookings`) appears at top.
3. Mini calendar: the booked session date is highlighted (`cal-booked-YYYY-MM-DD`).
   Navigate months with the prev/next arrows (`button-cal-prev` / `button-cal-next`).
4. Booking card (`dashboard-booking-<id>`): shows date, time, area, product, and a
   seat badge ("N seats").
5. **Seat tracking** — the embedded attendee form (`attendee-names-form`):
   - "Add attendee (N seats left)" reflects purchased minus named seats.
   - Add a name → Save (`button-save-attendees`) → it appears in the saved list.
   - Leave blank / cancel — no error (names are optional).

## Expected
- Calendar and cards reflect only that user's bookings, ordered by date.
- Seat count is accurate; adding names reduces open seats.
- Empty state: if no upcoming bookings, the section hides (returns null) — correct.

## Verified
2026-08-12 staging — PASSED (user@ with booking BK-...1B14, 2 seats; calendar
highlighted Aug 19; card + seat tracking rendered).
