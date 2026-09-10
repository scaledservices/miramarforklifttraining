# QA Run — 2026-08-15 — Section 4 (Photo-ID / wallet card)

Runner: Hermes (Kimi K3). Target: **staging**. Method: live API + code verification.
**Photo-ID add-on is GATED OFF by design** (`platform_settings.photo_id_addon_enabled`
unset) — verified the gate + the full entitlement code path. No live purchase (flag off).

Legend: ✅ pass · ⚠️ pass-with-note · ❌ fail · 🔲 not run

## Section 4 — photo-ID / wallet card
| # | Flow | Result |
|---|------|--------|
| 4.1 | Add-on appears above payment at /checkout | ✅ (code, prior run) |
| 4.2 | Prepaid entitlement created on purchase; count capped at seats | ✅ code-verified (below) |
| 4.3 | Post-completion photo upload works | 🔲 requires flag ON — defer to go-live |
| 4.4 | Non-prepaid: buy+upload button on completion | 🔲 requires flag ON — defer to go-live |

## Gate verification (3.6, confirmed this session)
`POST /api/authorize-net/charge` with `photoIdAddOn` → **400 "Photo ID add-on is not
available"** when the flag is unset. Correct pre-go-live behavior — the feature cannot be
purchased until QA sign-off flips the flag.

## Entitlement code path (4.2, verified)
- **Price:** `PHOTO_ID_PRICE = $9.99` + shipping rate per unit.
- **Validation:** count must be integer 0–50 (`validateAddOn`).
- **Seat cap (server-enforced):** `count > seatCount` → 400 "exceeds seats purchased".
  Client stepper clamps but server never trusts it (spec 1.2).
- **Discounts never apply** to the add-on; 3% card surcharge folds in.
- **Entitlement rows:** single-buyer (count=1) links to the buyer's enrollment;
  team/multi-count creates N rows with `enrollmentId: null`. All start `status:
  "awaiting_photo"`. Per-unit amount = (addOnTotal + 3% share) / count.
- **Shipping address** saved to `users.savedShippingAddress` (drives 6.5 prefill).

## Go-live note
To enable: set `platform_settings.photo_id_addon_enabled = true`, then run 4.3/4.4
(photo upload + non-prepaid buy) against staging before cutover. The purchase,
entitlement, seat-cap, and address-save paths are all coded and ready.
