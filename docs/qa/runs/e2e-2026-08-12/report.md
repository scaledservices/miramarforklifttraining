# E2E QA Run — 2026-08-12 (staging)

Target: https://exquisite-perception-staging-725a.up.railway.app
Triggered by: Alberto demo failure (2026-08-11). Goal: verify every fix + new
feature actually works on staging before handing back to Alberto.
Method: live browser, driving the DOM (browser tool refs go stale on this app),
screenshots as evidence. Payments in sandbox (Authorize.net test card, no real
charge). All test accounts share password `DemoPass!234`.

## Result summary

| # | Use case | Result | Screenshot |
|---|----------|--------|-----------|
| A | Homepage + pricing (onsite "Get a quote", hands-on $280) | ✅ PASS | A-homepage.png |
| B1 | City picker: loads, 3 cities only (SD/LV/Fresno), no "Staging Test" row | ✅ PASS | B1-city-picker.png |
| B2 | City selection + schedule: 4-hr blocks 9–1 / 1–5, Mon/Wed/Fri for SD | ✅ PASS | B2-city-selected.png |
| B3 | Participant stepper (−/+/type-on-blur), summary updates | ✅ PASS | B3-details-stepper.png |
| C | QA account switcher present + switches between accounts | ✅ PASS | (in-flow) |
| D | Alberto login training@miramarforklift.com → super_admin → /admin | ✅ PASS | (in-flow) |
| E | Admin "New Booking" manual booking dialog opens, full form | ✅ PASS | E-new-booking-dialog.png |
| F | Admin booking → "Class sign-in QR" shows scannable QR + copy link | ✅ PASS | F-signin-qr-dialog.png |
| G | Public QR sign-in /signin/{bookingNumber}: form → submit → success, attendee persisted (source=signin, checkedIn, openSeats updated) | ✅ PASS (full loop) | G-signin-success.png |
| H | Customer dashboard "Your upcoming training": mini calendar (booked date highlighted) + booking card + seat tracking | ✅ PASS | H-dashboard-upcoming-training.png |
| I | Booking confirmation "Who's attending?" optional name entry | ✅ PASS | I-booking-confirmation-attendee.png |

## Evidence (screenshots)

**A — Homepage: onsite "Get a quote", hands-on $280**
![Homepage](screenshots/A-homepage.png)

**B1 — City picker: 3 real cities, loading skeleton, no QA row**
![City picker](screenshots/B1-city-picker.png)

**B3 — Details step: participant stepper (− 3 +), summary updates**
![Participant stepper](screenshots/B3-details-stepper.png)

**E — Admin "New Booking" manual booking dialog**
![New Booking dialog](screenshots/E-new-booking-dialog.png)

**F — Class sign-in QR dialog (scannable QR + copy link)**
![Sign-in QR](screenshots/F-signin-qr-dialog.png)

**G — Public QR sign-in success ("You're signed in")**
![Sign-in success](screenshots/G-signin-success.png)

**H — Customer dashboard "Your upcoming training" (calendar + seat tracking)**
![Dashboard](screenshots/H-dashboard-upcoming-training.png)

**I — Booking confirmation "Who's attending?" (optional names, seats left)**
![Booking confirmation](screenshots/I-booking-confirmation-attendee.png)


## Bugs found this run

0. **(Found after the main run, during Alberto super_admin UAT) Admin "Today"
   page returned "Failed to load today dashboard" (500).** Root cause: more
   staging schema drift — this time at the COLUMN level, which my earlier
   table-existence check missed. Staging was missing `contacts.import_batch_id`,
   `companies.import_batch_id`/`source_era`, `training_events.import_batch_id`,
   and the `system_logs` and `page_views` tables. These power Today, the logger,
   and Analytics/Funnel. **Fixed:** added all missing columns + both tables;
   verified `/api/admin/today`, `/api/admin/analytics/funnel`, and
   `/api/admin/certifications` all return 200. **Lesson (now in README):** the
   schema-drift check must compare COLUMNS, not just table existence.

1. **(Note, not a regression) Photo-ID upsell location.** The "move photo-ID
   upsell above payment" change (commit 5486bca) applies to the **/checkout**
   page (online course cart). The **book-training payment step**
   (`CardPaymentSection`) is a separate flow and does NOT show the photo-ID
   add-on. Decision needed: does Alberto want the photo-ID upsell on the
   hands-on booking flow too, or only on online-course checkout? Currently only
   the latter has it.

2. **(Test-data note) "San Diego (Staging Test)" service-area row** still
   exists in the DB and appears on the public QR sign-in page for OLD bookings
   made against it. It is correctly filtered OUT of the new booking city picker,
   so it cannot be selected going forward. Recommend deactivating that QA row
   (set is_active=false) so legacy test bookings don't surface it.

3. **(Tooling, not app) browser_vision image analysis returns 404** on the
   current model (no image input). Workaround used: read content via DOM
   snapshots + capture screenshots directly. Does not affect the app.

## Regression checks (the demo breakers) — all confirmed fixed
- City picker loads on first click (loading skeleton present), no stray QA row.
- Participant count stepper: no "13" append, no stuck-at-1. −/+ and type-on-blur
  all work; booking summary tracks the count correctly.
- Registration no longer 500s (root cause was staging DB schema drift; columns +
  2 tables added, schema now in sync).

## Verified end-to-end loop (the headline new feature)
Admin opens a booking → "Class sign-in QR" → scannable QR → public
/signin/{bookingNumber} page → trainee enters name → "You're signed in" →
attendee record created (source=signin, checked_in_at set) → seat count updates
(1/1 → 0 open seats) → admin/purchaser can see it. Full loop PASSED.

## Environment / state after run
- Staging DB schema in sync with code (0 missing tables).
- Test accounts seeded on staging incl. training@miramarforklift.com (super_admin).
- ENABLE_QA_ACCOUNT_SWITCHER=true set on staging (banner live).
- One real sandbox booking created for H: BK-1786552769273-1B14 (user@, 2 seats).
- One test attendee signed into old booking BK-1784243684826-50O1 ("Test Trainee").

---

## Second batch (2026-08-12, expanded matrix — 3 parallel QA subagents + manual verification)

### Online course flow (Sections 3–4)
| # | Item | Result |
|---|------|--------|
| 3.1 | Buy online course via sandbox card (order FC-2026-000027, $46.35, Paid) | ✅ PASS |
| 3.2 | Course player: 32 steps / 9 modules load, images render | ✅ PASS |
| 3.3 | Progress auto-saves (0%→3%→6%), resume works | ✅ PASS |
| 3.4–3.5 | Full exam → certificate issue + download | ⚠️ BLOCKED (32-step curriculum needs more runtime than the tool allowed; player/quiz/progression all work) |
| 4.x | Photo-ID add-on at /checkout ABOVE payment; total $46.35→$61.78 with shipping; line item correct | ✅ PASS |

### Admin operations (Section 7)
| # | Item | Result |
|---|------|--------|
| 7.1 | Today page loads with real data | ✅ PASS |
| 7.2 | Bookings list renders (12 rows, all statuses) | ✅ PASS |
| 7.3 | Manual New Booking SUBMIT persists + appears in list (BK-1786561505160-VLZA) | ✅ PASS (manually re-verified after a subagent reported it missing — that was a list-refresh artifact, not a persistence bug) |
| 7.4 | Confirm/reschedule an existing booking | 🔲 not reached (subagent iteration limit) |
| 7.5 | Availability editor | 🔲 not reached |
| 7.7 | Leads page loads | ✅ PASS |
| 7.9 | Money + Analytics pages load | ✅ PASS |
| 7.10 | Companies page loads | ✅ PASS |
| 7.11 | Certificates admin page loads | ✅ PASS |

### Public funnel + content (Sections 1, 8)
| # | Item | Result |
|---|------|--------|
| 1.4 | Quote form client validation + POST 200 | ⚠️ partial (automation couldn't complete the controlled-checkbox submit; needs a manual click-through) |
| 1.5 | Contact form submits, "Message Sent" success | ✅ PASS |
| 1.6 | EN/ES toggle — full Spanish render + hreflang | ✅ PASS |
| 1.7 | Friendly 404 with header/footer intact | ✅ PASS |
| 8.1 | Homepage testimonials marked as placeholder | ❌ FAIL → **FIXED** (see below) |
| 8.3 | No ForkliftCertified branding anywhere | ✅ PASS |

### Bug fixed in this batch
- **8.1 (commit 99f4a12):** `Home.tsx` had its own hardcoded testimonials section
  (Carlos M. / Danielle R. / Miguel A.) rendering with NO placeholder indicator —
  a violation of the no-fake-testimonials rule. Added a visible disclaimer under
  the section title (EN+ES): "Sample testimonials shown for layout. Real customer
  reviews coming soon." This is a stopgap until Alberto supplies real reviews.

### Remaining (not yet covered by anyone)
- 2.7 volume discount (5+), 2.8 discount code at booking, 2.9 same-day/2-location
  conflict surfacing, 2.10 confirmation email content (EN/ES)
- 3.4–3.5 full exam → certificate (needs longer runtime / scripted run)
- 6.3 forgot-password reset email, 6.4 group-admin crew dashboard, 6.5 saved-address prefill
- 7.4 confirm/reschedule, 7.5 availability editor, 7.6 trainer-conflict card, 7.8 quotes, 7.12 email outbox
- Section 9 pre-go-live security sweeps (secrets, switcher-off-in-prod, rate limits, real-payment path)

---

## Third batch (2026-08-12) — address update + content/security sweeps

### San Diego address (go-live item #3) — UNBLOCKED
Alberto supplied the new facility address: **8760 Miramar Place, San Diego, CA 92121**.
Updated across 8 files (locations.ts, brand.ts, catalog.ts, serviceAreaGenerator.ts,
SpanishServiceArea.tsx, EN+ES locales, assistant.ts). Zero Marindustry refs remain.
Commit 8d1fdf9. Staging redeployed; booking-flow city card shows the new address.
Build + check green. **Note:** the `/locations/san-diego` marketing page renders the
street address via a different path that came back empty in the DOM — cosmetic,
worth a look before cutover; the booking flow (customer-facing path) is correct.

**Follow-up (2026-08-15): RESOLVED — false positive, no code change needed.**
Re-investigated the "empty address" observation. Verified three ways:
(1) `getLocation("san-diego").address.full` returns the correct string when executed
in Node; (2) `LocationPage.tsx:174` renders `{loc.address.full}` directly with no
empty-string fallback; (3) the live staging bundle (`index-Bb1Dud8O.js`) contains
"8760 Miramar Place" (20 occurrences) and zero "Marindustry". Root cause of the
original observation: it was captured before commit 8d1fdf9 was redeployed — the SPA
mounts client-side, so a raw-HTML curl or a mid-deploy screenshot shows an empty
`#root` where the address would be. The redeploy that same session resolved it.
No bug exists; the marketing page renders the address correctly.

### Section 8 / 9 sweeps
| # | Check | Result |
|---|-------|--------|
| 8.2 | No en-dashes in external-facing text | ❌ FAIL → **FIXED** (commit 2359f2b): 5 en-dashes per locale (hours "Mon–Fri", "1–2 business days") replaced with hyphens; zero remain; JSON re-validated |
| 8.3 | No ForkliftCertified branding in client code | ✅ PASS (zero matches) |
| 9.1 | No committed secrets (cookies.txt / generated-pdfs / .env) | ✅ PASS (only local dev SSL cert.pem/key.pem, which are dev-only) |
| 9.2 | QA switcher OFF in production | 🔲 verify at cutover (build-time) |
| 9.4 | Real payment path reviewed; first real transaction by Peter | 🔲 at cutover |

### Still open
- Reviews from Alberto (he said he'd send this afternoon) → swap placeholder testimonials for real ones.
- 2.7 volume discount, 2.8 discount code, 2.9 conflict, 2.10 email content
- 3.4–3.5 exam → certificate (scripted run)
- 6.3 forgot-password, 6.4 crew dashboard, 6.5 saved-address prefill
- 7.4 confirm/reschedule, 7.5 availability editor, 7.6 trainer-conflict card, 7.8 quotes, 7.12 email outbox
- 9.2 / 9.4 (cutover-time gates)

