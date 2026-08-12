# UC-02 — Book a hands-on class (end to end)

Priority: **P0** (smoke subset). Roles: Visitor, Individual, Group admin.

## Preconditions
- On staging, the QA banner account switcher is available (or use /login).
- Sandbox payment: Authorize.net test card `4007000000027`, any future MM/YY, any CVV/ZIP.

## Steps
1. Go to `/book-training`. (data-testid: `step-1-content`)
2. Confirm the city picker shows a loading skeleton, then exactly **3 cities**: Fresno, San Diego, Las Vegas. NO "San Diego (Staging Test)" or other QA rows. (`city-option-<slug>`)
3. Select **San Diego** (`city-option-southern-california`). A program is pre-selected.
4. Click **Next** (`button-step-next`) to step 2 (date).
5. Verify the calendar only enables that city's days (SD = Mon/Wed/Fri). Pick an enabled day (`calendar-day-YYYY-MM-DD`).
6. Confirm time slots are **4-hour blocks**: 9:00 AM–1:00 PM and 1:00 PM–5:00 PM. Select one.
7. Next to step 3 (details). Fill contact name, email, phone.
8. **Participant stepper** (`button-participants-minus`, `input-booking-participants`, `button-participants-plus`):
   - Tap `+` — count increments, Booking Summary total updates.
   - Tap `-` — decrements (never below 1).
   - Type a number and tab away — commits on blur.
   - Regression: typing must NOT produce "13"-style appends; clearing must not snap to 1.
9. Next to step 4 (payment). Fill sandbox card, accept the refund policy (`checkbox-policy-accept`).
10. Click **Pay** (`button-pay-and-book`).

## Expected
- Confirmation screen "Payment Received — You're Booked!" with a booking reference (`text-booking-number`).
- The **"Who's attending?" (optional)** section appears (`attendee-names-form`) with "Add attendee (N seats left)" matching the participant count.
- Confirmation email queued (sandbox / email outbox).

## Verified
2026-08-12 staging run — PASSED (booking BK-1786552769273-1B14, 2 seats, $576.80).
