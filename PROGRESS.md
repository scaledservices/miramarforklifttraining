# Overnight Progress Report: Alberto Demo Adjustments

Date: 2026-07-16 (overnight run)
Branch: `feat/alberto-demo-adjustments` (6 new local commits, NOT pushed)
Source: OVERNIGHT_TASK.md + 2026-07-13 Alberto demo action items

## Build status (first thing to know)

- `npm run build`: GREEN (exit 0) after every commit and at the end.
- `npm run check` (tsc): 146 errors, ALL PRE-EXISTING. I captured a baseline
  by stashing my changes and running tsc on the untouched branch: the same
  146 errors exist before any of my work (files: server/routes/*,
  server/storage.ts, shared/schema.ts, scripts/demo-seed.ts, 2 admin pages).
  I verified after every task that my changes introduce ZERO new errors
  (identical error sets, only tsc's nondeterministic union-order wording in
  a few messages differs between runs). I did not attempt to fix the 146
  because they sit in payment/cert/schema code that the task rules gate.
  Baseline saved at /tmp/check-baseline.txt.

## Completed (in priority order)

### 1. Homepage: all three certification paths in the hero (c04b02e)
- `client/src/pages/Home.tsx`: the single "Get Certified Today" button is now
  a "Get Certified Today" heading with all three paths directly under it:
  Onsite (gold card, "Most Popular" badge, most prominent) > Hands-on >
  Online. Each card shows price and links straight to its funnel
  (/request-quote, /book-training, /p/online-forklift-operator-training).
- Secondary link "Not sure which is right for you?" still goes to
  /get-certified (GuidedSelector) for people who want the comparison.
- Prices reuse the existing guidedSelector i18n keys; new keys added to EN
  and ES in sync. Priority rule Onsite > Hands-on > Online respected.

### 2. On-site request page: pricing removed, quote-first, facility address (25b1831)
- `/request-onsite-training` already redirects to `/request-quote`
  (App.tsx:197), so the quote form IS the onsite request page.
- `RequestQuote.tsx`: removed the "Starting Prices" card (From $280 etc.);
  replaced with a "Custom Quote for Your Team" callout explaining quotes are
  customized by company size, location, and equipment.
- NEW: when the customer picks "at our facility", the form now shows a
  highlighted box with the selected facility's name and full address
  (data-testid `facility-address-display`), updating live with the location
  dropdown.
- `RequestOnsiteTraining.tsx` (legacy page, currently unrouted): its
  "Pricing Guide" card removed too, so no pricing shows if it is ever
  re-linked. Orphaned pricing i18n keys removed from EN and ES.

### 3. Hands-on / location pages: only the selected location (fa05626)
This was actually broken in two places:
- `BookTraining.tsx` (the flow GuidedSelector routes hands-on users to):
  after the ZIP check it listed EVERY location's courses (28 products across
  SD/LV/Fresno). Now it maps the resolved service area to its facility
  (southern-california -> san-diego, central-california -> fresno,
  southern-nevada -> las-vegas) and lists only that facility's courses. The
  facility's name/address now shows in the ZIP success box and in the
  review-step summary.
  - Bonus bug fix: the "smart default" course preselect referenced
    `standard-forklift-certification-<serviceAreaSlug>` (e.g.
    ...-southern-california), which does not exist in the catalog, so it
    never fired. It now uses the facility slug and works.
- `HandsOnTraining.tsx`: had a single hardcoded San Diego card and listed all
  locations' programs. Now a 3-facility picker (SD / LV / Fresno, from
  shared/config/locations.ts); only the selected facility's address and
  programs are shown. Default selection: San Diego (HQ, first active).
- `LocationPage.tsx` (/locations/:slug) was already single-location; no
  change needed.

### 4. Online course simplified (33e604c)
- `scripts/course-content.ts` + `scripts/course-content-es.ts`:
  - Interim mini-quizzes (type "checkpoint") reduced 7 -> 3. Key questions
    from removed checkpoints merged into the survivors, so every module's
    topics still get checked: "OSHA & Forklift Basics", "Stability, Loads &
    Inspections", "Safe Operation & Shutdown".
  - Three separate download steps consolidated into one "Employer Packet &
    Reference Documents" step (same 5 files, same URLs).
  - Net: 32 steps -> 26 steps. Interactive lesson elements (hotspots, flip
    cards, drag-drop) and the final exam are untouched.
  - EN and ES verified step-for-step aligned (26 each, identical type
    sequence) via a tsx import check.
- Front page / purchase flow reviewed: ProductDetail already has a 1-click
  "Buy Now" -> /checkout, and CoursePlayer already auto-resumes at the first
  incomplete step and auto-advances on completion, so the step-count
  reduction is the main click saver. I did not touch the aerial or
  train-the-trainer course content (out of scope).
- IMPORTANT - needs your action to take effect: course steps live in the DB.
  I did NOT run anything against a database. To apply on staging:
  `DATABASE_URL=... npx tsx scripts/seed-online-courses.ts --refresh`
  Caveats of that script (pre-existing behavior, unchanged):
  - it updates steps in place by stepOrder, so existing enrollments keep
    their progress rows;
  - it never deletes rows: old steps at positions 27-32 will remain in the
    DB and the script prints a warning listing their ids. You may want to
    deactivate/delete those manually after checking enrollments, otherwise
    students will still see 6 stale steps after the exam. Flagging rather
    than changing the seeder since step deletion touches progress/exam
    tables.

### 5. Certificate OSHA seal repaired (b8ebab1)
- Root cause found in `server/certificate-pdf.ts` `drawCircularText()`: the
  per-glyph rotation did `(angle * 180) / Math.PI + 90` on an angle that was
  ALREADY in degrees (a radians->degrees conversion applied to degrees),
  multiplying every rotation by ~57. The seal's curved lettering rendered as
  scattered, unreadable marks - that is the "broken OSHA logo" bottom-left.
- Fix: use the degree value directly; and draw the bottom-arc label
  ("OFFICIAL SEAL" / "SELLO OFICIAL") inward so it reads upright left-to-
  right, like a real seal.
- Verified visually with a standalone pdfkit render of the seal (scratch
  script, deleted after use). Visual/template change only - zero changes to
  issuance logic, data, or endpoints.

### 6. Wallet card form: billing address + photo upload (06bd0be)
- `OrderCertCard.tsx`:
  - Payment step now has a Billing Address section: "same as my shipping
    address" checkbox (default on); unchecking reveals a full billing form
    (name/address/city/state/zip/country), required before Pay enables.
  - The billing ZIP is passed to Authorize.net Accept.js for AVS (replaces
    the old lone "Billing ZIP" field, which was removed).
  - Shipping step now has an optional "Photo for Your ID Card" upload:
    client-side downscale to max 480px JPEG (quality fallback keeps the data
    URL under ~90KB so the order POST stays under Express's 100KB JSON
    limit), preview, change/remove buttons.
  - EN and ES strings added in sync.
- FLAGGED FOR PETER (issuance/persistence side, intentionally not touched):
  `POST /api/cert-cards` destructures only certificationId/shippingAddress/
  shippingMethod and IGNORES the new `billingAddress` and `idPhoto` fields I
  send (harmless today). To actually store/print them you need: columns (or
  jsonb fields) on cert_card_orders + reading the fields in
  server/routes/certs.ts + using the photo in card fulfillment. That crosses
  into order/issuance logic and likely a DB migration, so I left it.

## Decisions and assumptions (made while you slept)

1. "Get Certified Today" hero: I kept the hero title and turned the CTA into
   a heading with the three path cards directly beneath it, replacing the
   single button and the price-anchor line (prices now live on the cards).
2. Onsite pricing STILL appears in two other places I did not touch:
   GuidedSelector (/get-certified) and the new homepage hero card, both show
   "From $280 per person". The meeting item only covered the request/quote
   page, but if Alberto wants onsite pricing fully hidden (custom quotes
   only), those two spots plus home.priceAnchorUnified copy need a decision.
3. Hands-on hero card links to /book-training directly (GuidedSelector's
   location step also sends every location there, so nothing is lost; the
   ZIP check drives the location).
4. HandsOnTraining page copy changed from "Service Areas / San Diego metro"
   to "Choose Your Training Location" (EN+ES) to match the new picker.
5. Course quiz consolidation kept 15 of 23 checkpoint questions; all removed
   TOPICS remain represented. Question texts were moved verbatim (one
   en-dash in a moved explanation was changed to "4 to 6"). Pre-existing
   en/em dashes elsewhere in course copy were left alone.
6. Removed-because-orphaned i18n keys: onsiteTraining pricing* + travelNote,
   requestQuote price*/startingPricesTitle, handsOnPage sanDiegoFacility*.
7. `.hermes/`, `Operations/`, `OVERNIGHT_TASK.md` untracked files were left
   untracked (not mine to commit).

## Needs Peter's review

- [ ] Run `npx tsx scripts/seed-online-courses.ts --refresh` on staging DB,
      then handle the 6 leftover step rows (ids printed by the script).
- [ ] Decide on persisting billingAddress + idPhoto for wallet card orders
      (schema + certs.ts + fulfillment); the form already sends both.
- [ ] Decide whether onsite "From $280" should also disappear from
      GuidedSelector and the homepage hero card (see Decisions #2).
- [ ] Verify the repaired certificate seal on a real generated PDF from
      staging (I verified with an isolated render only, no DB access).
- [ ] Eyeball the homepage hero on mobile (three cards stack vertically) and
      the ES pages: /es equivalents of home, request-quote, hands-on,
      book-training, order-cert-card.
- [ ] Pre-existing: `npm run check` fails with 146 errors on this branch
      BEFORE my work (mostly server routes + shared/schema.ts). Worth a
      separate cleanup pass; CLAUDE.md says check "works locally" so
      something drifted (TS 5.6.3 matches package.json, so likely code, not
      toolchain).

## What I did NOT do

- No push, no deploy, no DNS, no DB writes/reads, no emails/SMS, no payment
  config changes, no certificate issuance logic changes, no customer data.
- No changes to aerial / train-the-trainer course content.
- No fix for the 146 pre-existing TypeScript errors (out of scope + gated
  areas).

## Final command status

- `npm run check`: exit 1 - 146 errors, byte-identical set to the
  pre-change baseline (zero introduced by this branch's new commits).
- `npm run build`: exit 0 - green.

## Commits (oldest first)

1. c04b02e feat: show all three certification paths in homepage hero
2. 25b1831 feat: remove pricing from quote flow, show selected facility address
3. fa05626 feat: show only the selected location in hands-on training flows
4. 33e604c feat: simplify online course - fewer quizzes, fewer steps (32 to 26)
5. b8ebab1 fix: repair garbled OSHA seal on certificate (bottom-left corner)
6. 06bd0be feat: wallet card form - billing address and ID photo upload
