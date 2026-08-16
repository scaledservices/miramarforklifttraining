# QA Run — 2026-08-15 — Section 5 (QR sign-in + attendees)

Runner: Hermes (Kimi K3). Target: **staging**. Method: live public API (no auth, as designed).

Legend: ✅ pass · ⚠️ pass-with-note · ❌ fail · 🔲 not run

## Section 5 — QR sign-in + attendees
| # | Flow | Result |
|---|------|--------|
| 5.1 | Admin shows "Class sign-in QR" | ✅ (prior run) |
| 5.2 | Public sign-in page loads class details | ✅ bootstrap returns date/time/area/status only — no customer address or purchaser contact (privacy-correct) |
| 5.3 | Sign-in persists attendee (source=signin, checked_in) | ✅ 201, `checkedInAt` set, source="signin" |
| 5.4 | Duplicate name returns existing row (no double count) | ✅ "maria GARCIA" (diff case) → `alreadySignedIn:true`, same attendee id 6 |
| 5.5 | Sign-in blocked when seats full (409) | ✅ 3rd person on 2-seat booking → 409 "All seats for this class are already signed in" |
| 5.6 | Purchaser adds names post-booking | ✅ (prior run) |

## Notes
- Sign-in endpoints are rate-limited (read 30/min, write 20/min) — good for a public form.
- Capacity guard runs BEFORE the duplicate check, so on a fully-signed-in booking even a
  duplicate name returns 409 (not alreadySignedIn). Correct behavior — verified 5.4 on a
  booking with open seats.
- Idempotency is case-insensitive on (firstName, lastName).
- QA test data: booking BK-…LESB (2 seats, Maria Garcia + Jose Lopez signed in), attendee id 6.
