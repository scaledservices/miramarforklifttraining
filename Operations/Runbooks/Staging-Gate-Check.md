# Staging Gate-Check Suite

Canonical verification protocol for `training.miramarforklift.com` staging.
Run before any production merge recommendation reaches Peter.
Last updated: 2026-07-16

## Priority Rule (Hard)

Onsite/company training > Hands-on/location training > Online certification.
Never favor online. The homepage, product cards, and guided selector must
reflect this ordering.

---

## 1. Automated Gate Scripts

Two scripts in the repo at `scripts/`. Run in order.

### 1.1 Basic Gate (API-level, no browser)

```
node scripts/e2e-gate-basic.mjs
```

Covers 43 checks:
- 1a-1g: Homepage 200, bundle JS referenced, TrustBadgeBar copy, $45 price
  anchor, requestQuote i18n key, ES copy, Authorize.net reference
- 2a-2d: /get-certified, /checkout, /request-quote all 200, crew-path lead
  POST 201
- 3a-3j: ZIP 92101 served, available slot found, register 201, payment config
  sandbox, card tokenize, booking created, total=$280, order attached, status
  pending, balance=0
- M: Manager login (harbor logistics)
- 4a-4c: Balance endpoint, pay balance or already settled, balance now 0
- 5a-5c: Cert verify MFT-2024-001234, expiry within 90 days, recert-interest
  lead capture
- 6a: Referral code endpoint
- 7: /refund-policy 200
- 8: /es/ 200
- A: Admin login (alberto)
- 9: /api/admin/today shape -- KNOWN FAIL (returns error, not broken shape)
- 10a-10b: Admin bookings list, booking 10 finance
- 11a-11b: Money summary, statement + split parties
- 12a-12b: Discount codes list, validate ALBERTO10
- 13: Service areas
- 14a-14b: Manager groups, roster
- 15a-15b: Audit binder data + PDF -- KNOWN FAIL (500 errors)

> Current status: 40/43 pass. 3 failures are known non-funnel issues
> (admin/today API shape, audit binder endpoints). Funnel-critical paths
> (booking, payment, checkout, cert verify, quotes) all pass.

### 1.2 Full Gate (DB-backed, end-to-end pipeline)

```
DBURL=postgresql://... node scripts/e2e-gate-full.mjs
```

Requires `DBURL` env var pointing to staging Postgres. Covers:

- **Flow 1 - Individual online cert**: Register -> Authorize.net charge $45
  -> DB order/paid -> payment approved $46.35 (45 + 3% card) -> enrollment
  created -> complete LMS course (video + exam + content steps) -> certificate
  issued -> 3-year expiry -> /verify endpoint shows correct holder + course
- **Flow 2 - Team purchase + seats**: Register team buyer -> charge 3 seats
  $139.05 (135 + 3%) -> group_admin role auto-assigned -> group auto-created
  -> unassigned seats exist -> invite member -> member registers + accepts
  -> seat assigned -> member completes course -> certificate issued -> group
  progress + certifications views
- **Flow 3 - Harbor manager compliance**: Login -> /api/groups non-empty
  -> roster has employees + cert status -> own onsite booking visible
- **Flow 4 - Admin oversight**: Login -> all bookings visible -> money
  summary reflects payments -> split sums to revenue -> admin certifications
  list -> certs carry status/expiry -> complete onsite booking -> leads
  present -> contact submissions present
- **Flow 5 - Email verification**: All recent emails routed to EMAIL_OVERRIDE
  -> subjects carry [TEST prefix] -> order receipt email sent -> certificate
  email sent -> booking email sent

---

## 2. Sandbox Purchase Flow (Pass/Fail Checklist)

### 2.1 Individual Online Certification

| # | Step | Test Action | Expected | Pass/Fail |
|---|---|---|---|---|
| P1 | Navigate to / | Homepage loads, buyer cards in priority order | Onsite first, Online third | |
| P2 | Guided funnel | Click "Get Certified" -> session | /get-certified loads | |
| P3 | Select individual | Choose individual path | /checkout loads | |
| P4 | Checkout page | Cart shows online certification $45.00 | $45 price visible | |
| P5 | 3% surcharge | Review order summary | Surcharge line item visible | |
| P6 | Card payment | Enter sandbox Visa 4007000000027 | Tokenization succeeds | |
| P7 | Submit order | Click pay | Confirmation page / order-id | |
| P8 | DB verification | Check orders table | Status=paid, total=46.35 | |
| P9 | Decline flow | Repeat with 4000000000000002 | Error displayed, no charge | |
| P10 | Discount code | Apply ALBERTO10 | 10% discount reflected | |
| P11 | Certificate | Complete LMS course | Certificate issued | |
| P12 | Verify public | /api/verify/<cert-no> | Valid=true, holder name matches | |

### 2.2 Onsite / Hands-On Booking

| # | Step | Test Action | Expected | Pass/Fail |
|---|---|---|---|---|
| B1 | ZIP check | /api/service-areas/check?zip=92101 | available=true | |
| B2 | Check availability | Browse available slots | At least one slot found | |
| B3 | Register | POST /api/auth/register | 201 created | |
| B4 | Payment config | GET /api/payment/config | configured=true, sandbox | |
| B5 | Tokenize card | Sandbox card 4007000000027 | opaqueData returned | |
| B6 | Create booking | POST /api/bookings with slot + nonce | 200/201, booking.id | |
| B7 | Verify total | booking.totalPrice | $280.00 (100% upfront, 1 person) | |
| B8 | Order attached | booking.orderId | Non-null | |
| B9 | Status | booking.status | "pending" (manual confirm) | |
| B10 | Balance | GET /api/bookings/<id>/balance | balanceDue=0 | |

### 2.3 Team Purchase

| # | Step | Test Action | Expected | Pass/Fail |
|---|---|---|---|---|
| T1 | Register buyer | POST /api/auth/register | 201 | |
| T2 | Charge 3 seats | POST /api/authorize-net/charge x3 qty | 200, $139.05 | |
| T3 | Role promoted | users.role for buyer | "group_admin" | |
| T4 | Group created | groups table | Has admin_user_id=buyer | |
| T5 | Open seats | enrollments count where user_id=null | >= 2 | |
| T6 | Invite member | POST /api/groups/<id>/invite | 200 | |
| T7 | Invite token stored | group_members table | token present | |
| T8 | Member registers | /api/auth/register | 201 | |
| T9 | Accept invite | /api/auth/accept-invite | 200 | |
| T10 | Seat assigned | enrollments for member | enrollment exists | |
| T11 | Member completes course | LMS steps | Certificate issued | |
| T12 | Group progress view | GET /api/groups/<id>/enrollments | >= 3 enrollments | |
| T13 | Group certs view | GET /api/groups/<id>/certifications | >= 1 cert | |

### 2.4 Refund Path

| # | Step | Test Action | Expected | Pass/Fail |
|---|---|---|---|---|
| R1 | Admin login | POST /api/auth/login as admin | 200 | |
| R2 | Find order | GET /api/bookings or /admin/orders | Order visible | |
| R3 | Issue refund | POST /api/orders/<id>/refund | 200 | |
| R4 | Refund recorded | payments table | Refund entry with amount | |
| R5 | Order status | orders.status | "refunded" | |
| R6 | Negative test | Refund already-refunded order | 400 error | |

---

## 3. Cross-Browser / Mobile Smoke Matrix

Test across this matrix before any merge recommendation. Load each URL,
check for JS console errors, layout breakage, and missing content.

### Test Grid

| URL | Chrome | Safari | Firefox | 375px | 768px | 1024px | 1440px |
|---|---|---|---|---|---|---|---|
| / | | | | | | | |
| /get-certified | | | | | | | |
| /checkout | | | | | | | |
| /request-quote | | | | | | | |
| /request-onsite-training | | | | | | | |
| /locations | | | | | | | |
| /locations/las-vegas | | | | | | | |
| /locations/fresno | | | | | | | |
| /locations/san-diego | | | | | | | |
| /renewal | | | | | | | |
| /faq | | | | | | | |
| /refund-policy | | | | | | | |
| /contact | | | | | | | |
| /es/ | | | | | | | |
| /certificate-verify | | | | | | | |
| /service-areas | | | | | | | |
| /industries | | | | | | | |
| /osha-compliance | | | | | | | |

### Per-Cell Checks

Place a mark in the cell after verifying:
- [ ] Page loads without console errors (open DevTools Console)
- [ ] Layout renders correctly with no overlapping elements
- [ ] All images load (no broken src)
- [ ] All links are clickable and point to valid routes
- [ ] Header + Footer render with correct content
- [ ] Language switcher is visible and functional
- [ ] Mobile: CTA bar visible, nav hamburger works
- [ ] Desktop: full nav bar visible, no horizontal scroll

### Browser Testing Tools

- **Chrome DevTools** device toolbar: built-in responsive mode
- **Safari**: Develop > Enter Responsive Design Mode (Cmd+Shift+R)
- **Firefox**: Responsive Design Mode (Cmd+Opt+M)
- **BrowserStack** (if available): cross-browser real device testing

---

## 4. EN + ES Parity Sweep

### 4.1 Content Parity Table

Verify every page has a Spanish version at `/es/<path>`.

| EN Route | ES Route | Content Present | Prices Match | Nav Works |
|---|---|---|---|---|
| / | /es/ | | | |
| /request-quote | /es/request-quote | | | |
| /request-onsite-training | /es/request-onsite-training | | | |
| /checkout | /es/checkout | | | |
| /locations | /es/locations | | | |
| /locations/las-vegas | /es/locations/las-vegas | | | |
| /locations/fresno | /es/locations/fresno | | | |
| /locations/san-diego | /es/locations/san-diego | | | |
| /renewal | /es/renewal | | | |
| /faq | /es/faq | | | |
| /refund-policy | /es/refund-policy | | | |
| /contact | /es/contact | | | |
| /certificate-verify | /es/certificate-verify | | | |
| /service-areas | /es/service-areas | | | |

### 4.2 Per-Page Checks

For each Spanish page:
- [ ] All headings and body text are in Spanish (no untranslated EN copy)
- [ ] Navigation menu items are localized
- [ ] Prices and currency formatting match EN version
- [ ] Form labels and validation messages are in Spanish
- [ ] Error pages / 404s are localized
- [ ] Language switcher correctly toggles EN <-> ES
- [ ] Meta tags (title, description) are localized
- [ ] Menu does not break on Spanish text length

### 4.3 Critical Path in Spanish

Run the full purchase funnel in Spanish:
- [ ] /es/ -> select certification -> /es/checkout -> logged-in checkout
- [ ] /es/ -> request-onsite-training -> fill form -> submit
- [ ] /es/ -> request-quote -> fill form -> submit
- [ ] /es/ -> /es/faq -> all questions visible in Spanish

---

## 5. Launch-Day Smoke Protocol

Run this script alongside Peter's first real transaction. Print this page
and check off each step.

### 5.1 Pre-Launch (15 min before)

```
[ ] 01. Run basic gate (node scripts/e2e-gate-basic.mjs) -- all funnel-critical pass
[ ] 02. Run full gate (DBURL=... node scripts/e2e-gate-full.mjs) -- all pass
[ ] 03. Verify payment config returns sandbox (will swap to prod after)
[ ] 04. Confirm Authorize.net sandbox credentials are active
[ ] 05. No outstanding console errors on homepage
[ ] 06. SSL cert valid on staging domain
[ ] 07. Last deployed commit matches intended release
```

### 5.2 First Real Transaction (with Peter)

```
[ ] 08. Peter opens staging in Chrome
[ ] 09. Peter navigates to checkout
[ ] 10. Peter enters real card (not sandbox)
[ ] 11. Tokenization succeeds
[ ] 12. Order confirmation page displays
[ ] 13. Capture order ID from confirmation
```

### 5.3 Post-Transaction Verification

```
[ ] 14. Payment appears in Authorize.net merchant dashboard
[ ] 15. DB: orders table has record with status=paid
[ ] 16. DB: payments table has record with status=approved
[ ] 17. Email receipt was sent (check EMAIL_OVERRIDE inbox)
[ ] 18. Admin dashboard shows the new booking/order
[ ] 19. Money summary reflects the new transaction
[ ] 20. Certificate verify URL works for the new cert
```

### 5.4 Rollback Criteria

If any of the following occur, stop immediately and do not proceed to
production:
- Payment gateway returns unexpected error (not sandbox decline)
- Order created but no payment record
- Double charge detected
- Certificate not issued after payment
- Email receipt not sent after payment
- Admin dashboard doesn't show the transaction

---

## 6. Regression Checklist Template

Copy and paste this into every merge request or pre-deploy verification note.

### Merge Request Verification

```
**E2E Gate-Check Status**

Automated:
- [ ] Basic gate: ___/43 pass (must be >= 40, funnel-critical >= 22/23)
- [ ] Full gate: ___/___ pass (must be >= 90%)
- [ ] Known failures documented and acceptable: [yes/no]

Manual:
- [ ] Cross-browser smoke: Chrome [ ] Safari [ ] Firefox [ ]
- [ ] Mobile: 375px [ ] 768px [ ]
- [ ] EN+ES parity: ___/14 pages checked
- [ ] Spanish purchase path verified: [yes/no]

Funnel Priority Check:
- [ ] Homepage: Onsite card first, Online card third
- [ ] No "Most Popular" badge on Online certification
- [ ] /get-certified: Onsite option presented first
- [ ] All three products (Onsite, Hands-on, Online) visible

Sandbox Purchase:
- [ ] Online cert: approved card -> confirmation
- [ ] Online cert: declined card -> error message
- [ ] Onsite booking: ZIP check -> slot -> booking -> pending
- [ ] Team purchase: seats -> invite -> member -> cert

Previous Failures:
- [ ] Known issues from prior run still present (documented)
- [ ] No new regressions introduced

**Decision: [Approve / Blocked]**
```

### Weekly Regression Smoke

Run every Monday. Only the basic gate + cross-browser + EN/ES sweep.

```
[ ] Basic gate script: ___/43 pass
[ ] Chrome smoke: 5 key pages (/, /checkout, /request-quote, /locations, /es/)
[ ] Safari smoke: same 5 pages
[ ] Mobile 375px: same 5 pages
[ ] Spanish: /es/ homepage loads, no untranslated content blocks
[ ] Console errors: 0 on all pages above
```

---

## Appendix: Known Failures (as of 2026-07-16)

| Test | Script | Status | Notes |
|---|---|---|---|
| 9 /api/admin/today shape | e2e-gate-basic | FAIL | Endpoint returns error. Admin Today page uses it. Non-funnel. |
| 15a audit binder data | e2e-gate-basic | FAIL | 500 error. Audit binder is a manager feature. Non-funnel. |
| 15b audit binder PDF | e2e-gate-basic | FAIL | 500 error. Same root cause as 15a. Non-funnel. |
| 4.8 onsite cert auto-issue | e2e-gate-full | PASS (known gap) | Onsite completion doesnt auto-issue participant certs. Cert logic is scope-protected per GATES. |

## Appendix: Test Cards (Authorize.net Sandbox)

| Card Type | Number | Result |
|---|---|---|
| Visa (approved) | 4007000000027 | Transaction approved |
| Mastercard (approved) | 5424000000000015 | Transaction approved |
| Visa (declined) | 4000000000000002 | Transaction declined |
| Visa (AVS error) | 4007000000047 | AVS mismatch |
| Amex (approved) | 370000000000002 | Transaction approved |

Any future expiry date, any CVV.

## Appendix: Staging URL

```
Base: https://exquisite-perception-staging-725a.up.railway.app
API:  https://exquisite-perception-staging-725a.up.railway.app/api
```

## Appendix: Reference Links

- Testing & QA policy: repo `client/docs/testing-and-qa.md`
- Automated scripts: `scripts/e2e-gate-basic.mjs`, `scripts/e2e-gate-full.mjs`
- KPI ledger: `/Users/peternemrow/Documents/Peter Nemrow OS/03 Clients/Miramar/Operations/KPI-Ledger.md`
- Bug report format: `Staging QA Report YYYY-MM-DD.md` in vault Research/