# Miramar Comprehensive Test Plan — Skeleton (Use Cases & User Stories)

Status: **skeleton** — scope and structure only. Each entry is a stub to be
expanded into a full use case (steps, test data, expected results, screenshots)
in the style of `docs/qa/use-cases/UC-*.md`. Priorities: P0 = revenue/go-live
critical, P1 = important, P2 = nice to verify.

Product priority convention: **Onsite > Hands-on > Online** — never favor a
lower tier over a higher one in copy, routing, or fixes.

---

## Actors

| Actor | Description |
|-------|-------------|
| Visitor | Anonymous, arriving from Google/referral (EN or ES) |
| Individual | Self-pay customer buying for themselves |
| Crew admin | Company contact buying seats and managing a team |
| Crew member | Invited trainee, consumes a seat |
| Onsite customer | Company requesting training at their facility (quote flow) |
| Alberto (operator/admin) | Runs daily operations: bookings, confirmation, certs |
| Peter (super_admin) | Platform owner: settings, users, money, SEO |
| Instructor | Assigned trainer for events (future-facing) |
| System | Scheduled jobs, emails, certificates, integrations |

---

## Epic A — Public funnel & content (Visitor)

- A1. Land on homepage; three training paths presented onsite-first
- A2. See correct pricing conventions: onsite = "Get a quote", hands-on = $280, online = $45
- A3. Browse location pages (San Diego / Las Vegas / Fresno) with correct address + SEO
- A4. Browse SEO service-area/city pages; hreflang EN/ES correct
- A5. Submit request-a-quote form; lead appears in admin
- A6. Submit contact form; appears in admin
- A7. Switch language EN/ES mid-funnel; state and pricing intact
- A8. View FAQ / industries / business pages; CTAs route to the right funnel
- A9. Hit a 404 and recover
- A10. Mobile viewport: home, booking, checkout all usable (phone)
- A11. AI assistant: ask a product question, get routed to the right page (P1)

## Epic B — Booking: hands-on training (Individual / Crew admin)

- B1. Pick a city; exactly the 3 real cities, correct schedule per city
- B2. Calendar: only valid days enabled; tentative dates flagged (LV)
- B3. Select a 4-hour time slot
- B4. Enter details; participant stepper behaves (no append/snap bugs)
- B5. Optional password on Details step → account created with chosen password
- B6. Blank password → silent temp-password account + note
- B7. Existing email → inline sign-in prefilled, no duplicate account
- B8. Apply a discount code; server-side price honored
- B9. Pay in full via card (surcharge shown as separate line item)
- B10. Confirmation page: booking number, "Who's attending" names form
- B11. Confirmation email to the CUSTOMER's address (regression: EMAIL_OVERRIDE)
- B12. Admin notification email to operations
- B13. Volume/multi-course add-ons (e.g. forklift + scissor lift) price correctly
- B14. Capacity: slot full → prevented, clear message (prevention-first)
- B15. Trainer conflict across cities same day → group-priority, no double-book
- B16. Booking blocked inside lead time / blackout dates
- B17. Crew purchase lands on seat-assignment screen post-payment
- B18. Pay-balance / residual payment path (if re-enabled) (P2)

## Epic C — Online course purchase & completion (Individual)

- C1. Buy online course; account created inline during checkout
- C2. Immediate course access after payment
- C3. Course player: all modules/slides load, hero images correct
- C4. Progress saves; resume across devices
- C5. Checkpoints + final exam; retake rules honored
- C6. Pass → certificate issued with **Date of Training** + gold seal
- C7. Certificate PDF download (EN/ES)
- C8. Public certificate verification link validates the cert number
- C9. Receipt email; certificate email with links
- C10. Fail exam → retake path clear, no dead end (P1)

## Epic D — Photo-ID wallet card (gated pre-go-live)

- D1. Add-on shown above payment at checkout when flag ON
- D2. Prepaid entitlement created per seat, capped at seat count
- D3. Flow 1: crew admin pays for member's card → member photo request email
- D4. Flow 2: member uploads photo → fulfilled alert to admin + operator
- D5. Flow 3: non-prepaid member requests card post-completion → purchase offer
- D6. Photo validation (JPEG, size cap); bad photo rejected gracefully
- D7. Card order appears in admin Card Orders; printable/mailable (P1)
- D8. Flag OFF → add-on unreachable, clean "not available" (regression gate)

## Epic E — Crew management (Crew admin / Crew member)

- E1. Buy N seats; purchaser NOT auto-assigned a seat (regression)
- E2. Invite members by email; invite email arrives (Outlook deliverability)
- E3. Sequential invites; no false "already pending" error (regression)
- E4. Invitee accepts: set password → land in course (closed loop)
- E5. Assign/reassign/unassign seats; seat counts consistent everywhere
- E6. Resend/reissue invite; expired-token path friendly
- E7. Remove a member; seat freed
- E8. Crew dashboard: member cert status visible to admin
- E9. Group order confirmation: Order/View states correct
- E10. Member completes course → cert visible to member AND crew admin

## Epic F — Customer account & dashboard (Individual / Crew admin)

- F1. Register standalone (clean validation errors, no raw 400s)
- F2. Login/logout; session persistence
- F3. Forgot password: reset email, single-use token, session invalidation
- F4. Dashboard: upcoming training, progress, certificates
- F5. Profile edit: name/phone/locale; saved addresses prefill checkout
- F6. OAuth providers (Google/LinkedIn/Facebook) if enabled (P1)
- F7. Order history + receipts downloadable (P1)

## Epic G — QR sign-in & attendance (System / Alberto / attendee)

- G1. Admin displays class QR; it scans
- G2. Public sign-in page shows correct class details
- G3. Attendee signs in; seat decremented; source=signin recorded
- G4. Duplicate sign-in idempotent (same name, no double count)
- G5. Seats full → 409, friendly message
- G6. Purchaser adds names post-booking from dashboard/confirmation
- G7. QR attendee intake for onsite: first-slide QR collecting name/email/photo (P1 — decision pending with Alberto)

## Epic H — Onsite training operations (Onsite customer / Alberto)

- H1. Quote request → admin lead pipeline entry
- H2. Quote created and sent; customer can accept (P1)
- H3. Admin manual booking (phone/in-person sale) blocks availability
- H4. Onsite completion → issue digital certificates to all attendees (Alberto 8/18: email cert to student + company)
- H5. Onsite attendees without company email handled (personal email capture)
- H6. Invoicing for onsite corporate clients (P1)

## Epic I — Admin daily tools (Alberto)

- I1. Today page: sessions, money, needs-action accurate
- I2. Bookings list: filter/search; confirm/reschedule/no-show/cancel/complete
- I3. Confirm booking → customer confirmation email to correct recipient
- I4. Availability editor: weekly days, blackout dates, per-city rules
- I5. Trainer-conflict card surfaces multi-city clusters
- I6. Leads pipeline transitions; no lost leads
- I7. Quotes create/send/convert
- I8. Companies/customer 360 loads (schema-drift regression)
- I9. Certificates admin: list, reissue, regenerate PDF
- I10. Email outbox: queued/sent/failed visible; resend failed (P1)
- I11. Card orders queue for photo-ID fulfillment
- I12. Discount codes: create, limits, redemption tracking (P1)

## Epic J — Super admin & platform (Peter)

- J1. Users admin: roles, resets, impersonation-free safety
- J2. Platform settings: profit split, feature flags (photo-ID), pricing
- J3. Money pages: earnings split (70/30) on ALL payment paths (incl. booking deposits)
- J4. Analytics: funnel + pageview tracking accurate
- J5. SEO admin: pages, sitemap, health
- J6. Course editor: content changes publish safely (P1)
- J7. Audit log captures admin actions
- J8. Training events + standing sessions management (P1)
- J9. Referral program: codes, credits, redemption (P2)

## Epic K — Emails & notifications (System)

- K1. Every template sends to the CORRECT recipient (post-EMAIL_OVERRIDE regression suite)
- K2. EN/ES locale honored per user preference
- K3. Deliverability: Outlook/Gmail inbox placement (not spam)
- K4. From-address: staging sandbox vs production verified domain (go-live item)
- K5. Admin notifications honor per-type preferences (booking_new, order_new…)
- K6. SMS notifications if enabled (P2)

## Epic L — Payments & money integrity (System / Peter)

- L1. Authorize.net sandbox E2E; decline path shows friendly error
- L2. Surcharge math correct and disclosed pre-payment
- L3. Payment recorded with correct earnings split on every path
- L4. Refund path: admin-initiated, customer notified (P1)
- L5. First REAL production transaction runbook (cutover gate)
- L6. Discount + surcharge interaction math (P1)

## Epic M — Internationalization & accessibility (cross-cutting)

- M1. Full ES sweep: every public page, email, PDF
- M2. No EN leaks in ES flows; locale persists
- M3. Currency/date formats per locale
- M4. Keyboard navigation + screen-reader basics on funnel pages (P2)
- M5. Color contrast / tap-targets on mobile (P2)

## Epic N — Security, privacy & content compliance

- N1. No committed secrets; repo sweep
- N2. QA account switcher OFF in production
- N3. Rate limiting on public forms (register, sign-in, quote, contact)
- N4. Session security: fixation, timeout, single-use tokens
- N5. Role gates: crew admin can't reach admin; member can't reach crew tools
- N6. No ForkliftCertified branding anywhere (sweep)
- N7. No en-dashes in external-facing text (sweep)
- N8. Testimonials policy: labeled SAMPLE until real reviews (approved)
- N9. Privacy/refund policy pages accurate (P1)
- N10. Payment data: no PAN touches our servers (Accept.js nonce only)

## Epic O — Performance & reliability (P1)

- O1. Key pages < 3s on 4G: home, book, checkout, course player
- O2. Image weight: hero banners/seal optimized
- O3. Staging cold-start behavior acceptable
- O4. DB indexes on hot paths (bookings, orders, outbox)
- O5. Error monitoring captures 5xx with context

## Epic P — Go-live cutover gates

- P1. Production Authorize.net keys + first real charge
- P2. Resend domain verified; FROM = noreply@miramarforklift.com
- P3. EMAIL_OVERRIDE confirmed ABSENT in production
- P4. QA flags OFF (account switcher, seeded accounts removed/disabled)
- P5. DNS cutover to training.miramarforklift.com
- P6. Old-site replacement: certificate issuance parity (date-of-training bug was old-site)
- P7. Rollback plan documented
- P8. Alberto go/no-go sign-off on this plan's P0 items

---

## Coverage map (existing assets)

| Existing asset | Covers |
|---|---|
| `docs/qa/test-plan.md` sections 0–9 | A, B, C, D, E, F, G, I, M, N (partial) |
| `docs/qa/use-cases/UC-01…08` | A1–A5, B, C/D, G, F, I, J8 |
| `Operations/qa/2026-08-31-Alberto-Testing-Checklist.md` | Alberto UAT subset |
| **New (this skeleton)** | H, J, K, L, O, P + regression stubs from 8/18 fixes |

## Next steps

1. Review/edit scope: mark anything out-of-scope for go-live.
2. Expand P0 stubs into full `use-cases/UC-09+` docs (steps, data, expected).
3. Assign each P0 an owner (Peter QA vs Alberto UAT) and a target date.
4. Wire regression stubs (B11, E1, E3, K1, L3) into the per-deploy smoke run.
