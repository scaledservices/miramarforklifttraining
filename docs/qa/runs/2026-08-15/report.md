# QA Run — 2026-08-15 — Section 2 (Booking E2E) + env gates

Runner: Hermes (Kimi K3). Target: **staging** (`exquisite-perception-staging-725a.up.railway.app`).
Method: live API + DB verification against staging Postgres. One real sandbox booking created.

Legend: ✅ pass · ⚠️ pass-with-note · ❌ fail · 🔲 not run

## Section 0 — environment gates
| # | Check | Result |
|---|-------|--------|
| 0.4 | Payment is SANDBOX on staging | ✅ `/api/payment/config` → `environment:"sandbox"`, apiLoginID `368kHk9YG`. No real charges possible. |
| 0.5 | Email sandboxed on staging | ✅ All outbound mail lands in `email_outbox` with `[TEST → original]` subject prefix, redirected to peter@scaled.services. No real customer email. |

## Section 2 — booking (hands-on) end to end
| # | Flow | Result |
|---|------|--------|
| 2.1 | City picker: 3 cities, correct addresses | ✅ SD = 8760 Miramar Place; LV = 3301 Martin Ave; Fresno = 3515 N. Sabre Dr |
| 2.2 | SD schedule Mon/Wed/Fri, 9–1 & 1–5 | ✅ live `/api/available-slots` (id=2) returns only Mon/Wed/Fri |
| 2.5 | Fresno Sat-only 9:00 start | ✅ id=3 returns ONLY Saturdays (8/22, 8/29) 09:00–13:00 |
| 2.6 | LV Mon-only + trainer-confirm | ✅ id=4 returns ONLY Mondays 9–1 & 1–5. Trainer-confirm = soft-hold "tentative" flag (observed live) |
| 2.7 | Volume discount | ✅ BY DESIGN — disabled (`VOLUME_DISCOUNT_RATE=0`) per Alberto 2026-07-06 "no automated bulk discounts; group pricing manual via quote" |
| 2.8 | Discount code | ✅ `ALBERTO10` (10%) validated + applied. Invalid→"Code not found"; empty→"No code provided". Rate-limited, server-side revalidated at booking. |
| 2.9 | Trainer conflict | ✅ group-priority hard-block (409), soft-hold tentative, capacity enforced via bookedParticipants |
| 2.10 | Confirmation email EN | ✅ customer + admin emails queued with correct content |

## 2.4 — full paid booking (the money proof)
Real sandbox booking executed end-to-end via the production code path
(Accept.js nonce → `/api/bookings` → Authorize.net charge → confirmation):

- **Booking:** `BK-1786841482564-MBTU` (id 21), SD, 2026-08-19 09:00–13:00, 1 seat
- **Pricing:** Standard Forklift $280 → ALBERTO10 −10% (−$28) → **$252.00**
- **Charge:** card surcharge $7.56 → **$259.56 charged**, txn `80058323571`, status **approved**
- **Order:** `FC-2026-000028`, $252.00
- **DB verified:** payments row (approved), discount_redemptions row ($28.00, code 1, booking 21, order 44), seat count 8/19 09:00 incremented 2→3
- **Emails:** id 143 customer confirmation + id 144 admin notification, both `[TEST →]` sandboxed

## Notes / follow-ups
1. **Booking UI "Next" gating (needs manual UAT):** browser automation could not advance the
   date-selection step (no JS error, button enabled, step content didn't render in a11y tree).
   The underlying API works perfectly (proven above). Likely an automation quirk, but Alberto
   should click through the date picker manually during UAT to rule out a real UX bug.
2. **Orphan service-area id=1** in staging DB returns junk 8am weekday slots. Not reachable
   from the UI city picker. Recommend a cleanup query before cutover.
3. **Cosmetic:** confirmation email shows raw product slug
   (`standard-forklift-certification-san-diego`) instead of a friendly name. Non-blocking.
4. **QA test data:** booking BK-…MBTU / order FC-2026-000028 are sandbox test rows; safe to
   leave or cancel from admin.
