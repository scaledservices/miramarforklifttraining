# UC-04 — QR on-site digital sign-in

Priority: **P0**. Roles: Alberto/trainer (shows QR), trainee (public, no account).

Replaces the paper sign-in sheet. Captures each trainee's name (and optional
email/phone) into `booking_attendees` for the marketing database.

## A. Trainer shows the QR (admin)
1. Log in as an admin (training@miramarforklift.com).
2. Admin → **Bookings** → click a booking.
3. Click **"Class sign-in QR"** (`button-show-signin-qr`).
4. A dialog shows a large QR code + the sign-in URL + "Copy sign-in link".
   Verified: QR renders as a base64 PNG.

## B. Trainee signs in (public, no login)
1. Open `/signin/{bookingNumber}` (scan the QR or open the link on an iPad).
2. Page shows the class: area, date, time, training type. (`BookingSignIn`)
3. Enter First name + Last name (required); Email + Phone optional.
   (`input-signin-first`, `input-signin-last`, `input-signin-email`, `input-signin-phone`)
4. Tap **Sign In** (`button-signin-submit`) — disabled until both names present.

## Expected
- Success screen: "You're signed in. Thanks, {name}. Your attendance for {date} is recorded."
- An attendee row is created: source=`signin`, `checked_in_at` set.
- Booking open-seats count decreases by 1.
- Duplicate name for the same booking returns the existing row (no double-count).
- Sign-ins cannot exceed purchased seats (409 when full).

## Verified
2026-08-12 staging — full loop PASSED ("Test Trainee" on BK-1784243684826-50O1,
openSeats 1→0).
