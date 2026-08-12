# UC-03 — Checkout + photo-ID upsell placement

Priority: **P0**. Role: Individual, Group admin.

Note: the photo-ID add-on lives on the **/checkout** page (online course cart).
The hands-on book-training payment step (`CardPaymentSection`) is a SEPARATE flow
that currently does NOT offer the photo-ID add-on (see report finding #1 — open
decision on whether to add it there).

## Steps
1. Add an online course to the cart and go to `/checkout`.
2. Confirm the **photo-ID wallet-card upsell card** (`photo-id-upsell-card`) appears
   **ABOVE** the Payment card (Alberto 7/28: move it up for upsell visibility).
3. Check the box (`checkbox-photo-id-addon`) — the line item + total appear in the
   order-summary rail (`text-photo-id-line-item`).
4. Confirm the total updates by the add-on amount (+shipping) in `text-checkout-total`.
5. Complete a sandbox purchase; the order confirmation offers photo upload.

## Expected
- Upsell is prominent, above payment; totals always reflect the add-on.
- Server re-prices the add-on (client math is display-only).

## Verified
Placement change committed 5486bca; confirmed in code + earlier /checkout check.
Full sandbox photo-ID purchase path: covered by cert-card order tests (photoId routes).
