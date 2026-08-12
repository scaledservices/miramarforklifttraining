# Miramar QA — Go-Live Test Plan (comprehensive)

Owner: Scaled Services (Peter). Goal: **we run the full matrix ourselves** so
Alberto's pass is a confirmation, not a bug hunt. Target: live in ~1 week.

Legend: ✅ verified in a prior run · 🔲 not yet run · ❌ failing · ⚠️ partial

---

## Section 0 — Environment & data integrity (run first, always)
| # | Check | Status |
|---|-------|--------|
| 0.1 | Staging DB schema matches code — TABLES + COLUMNS (drift check, see README) | ✅ 2026-08-12 |
| 0.2 | Test accounts seeded (6 roles) + `training@` super_admin login works | ✅ 2026-08-12 |
| 0.3 | `ENABLE_QA_ACCOUNT_SWITCHER=true` on staging; banner live; OFF in prod | ✅ 2026-08-12 |
| 0.4 | Payment is SANDBOX on staging (no real charges); prod uses real Authorize.net | 🔲 verify prod flag at cutover |
| 0.5 | Email is sandboxed on staging (resend.dev), not sending real customer email | 🔲 |

## Section 1 — Public funnel (revenue-critical)
| # | Flow | Status |
|---|------|--------|
| 1.1 | Homepage loads; onsite "Get a quote"; hands-on $280; online $45 | ✅ |
| 1.2 | Location pages (SD/LV/Fresno) load; correct address/SEO meta | 🔲 |
| 1.3 | Service-area SEO pages render (a sample of cities) | 🔲 |
| 1.4 | Request-a-quote form submits; lead lands in admin Leads | 🔲 |
| 1.5 | Contact form submits; lands in admin | 🔲 |
| 1.6 | EN/ES toggle works; ES pages render | 🔲 |
| 1.7 | 404 / bad route shows a friendly page | 🔲 |
| 1.8 | Mobile layout: home, book flow, checkout on a phone-width viewport | 🔲 |

## Section 2 — Booking (hands-on) end to end
| # | Flow | Status |
|---|------|--------|
| 2.1 | City picker: 3 cities, loading skeleton, no QA rows | ✅ |
| 2.2 | Schedule correct per city (SD MWF, Fresno Sat 9a, LV Mon) + 4-hr blocks | ✅ SD |
| 2.3 | Participant stepper (no 13-bug, no stuck-at-1) | ✅ |
| 2.4 | Full paid booking via sandbox card → confirmation + "Who's attending" | ✅ |
| 2.5 | Fresno booking specifically (Sat 9:00 AM start) | 🔲 |
| 2.6 | Las Vegas booking shows "to be confirmed by the trainer" banner | 🔲 |
| 2.7 | Volume discount for 5+ participants computes correctly | 🔲 |
| 2.8 | Discount code applies at booking | 🔲 |
| 2.9 | Same-day/2-location conflict → trainer-conflict surfaced, no double-book | 🔲 |
| 2.10 | Booking confirmation email content (EN + ES) correct | 🔲 |

## Section 3 — Online course (renewal) end to end
| # | Flow | Status |
|---|------|--------|
| 3.1 | Online course purchase via sandbox card → enrollment created | 🔲 |
| 3.2 | Course player: modules load, video/diagram images render | 🔲 |
| 3.3 | Progress saves; resume works | 🔲 |
| 3.4 | Exam: take + pass → certificate issued | 🔲 |
| 3.5 | Certificate PDF downloads; verification page validates the cert number | 🔲 |
| 3.6 | Photo-ID add-on at /checkout above payment; prepaid entitlement works | 🔲 |
| 3.7 | Exam retake allowed (unlimited retakes) | 🔲 |

## Section 4 — Photo-ID / wallet card
| # | Flow | Status |
|---|------|--------|
| 4.1 | Add-on appears above payment at /checkout | ✅ (code) |
| 4.2 | Prepaid entitlement created on purchase; count capped at seats | 🔲 |
| 4.3 | Post-completion photo upload works | 🔲 |
| 4.4 | Non-prepaid: buy+upload button on completion | 🔲 |

## Section 5 — QR sign-in + attendees
| # | Flow | Status |
|---|------|--------|
| 5.1 | Admin shows "Class sign-in QR" (scannable) | ✅ |
| 5.2 | Public sign-in page loads with class details | ✅ |
| 5.3 | Sign-in persists attendee (source=signin, checked_in), decrements open seats | ✅ |
| 5.4 | Duplicate name returns existing row (no double count) | 🔲 |
| 5.5 | Sign-in blocked when seats full (409) | 🔲 |
| 5.6 | Purchaser adds names post-booking (dashboard + confirmation) | ✅ |

## Section 6 — Customer dashboard + account
| # | Flow | Status |
|---|------|--------|
| 6.1 | "Your upcoming training" — calendar + seat tracking | ✅ |
| 6.2 | Register (clean error messages, no raw "400: {}") | ✅ |
| 6.3 | Login / logout / forgot-password reset email | 🔲 |
| 6.4 | Group admin: crew dashboard, seats, member cert status | 🔲 |
| 6.5 | Profile: saved addresses prefill at checkout | 🔲 |

## Section 7 — Admin (Alberto's daily tools)
| # | Flow | Status |
|---|------|--------|
| 7.1 | Today page loads (money, sessions, leads, needs-action) | ✅ (after drift fix) |
| 7.2 | Bookings list + filters + search | ✅ |
| 7.3 | Manual "New Booking" creates + blocks availability | ✅ dialog / 🔲 submit |
| 7.4 | Confirm / reschedule / no-show / cancel / complete a booking | 🔲 |
| 7.5 | Availability editor: set weekly days + blackout dates | 🔲 |
| 7.6 | Trainer-conflict card shows multi-city same-day clusters | 🔲 |
| 7.7 | Leads pipeline (new → contacted → quoted → won/lost) | 🔲 |
| 7.8 | Quotes: create + send a quote | 🔲 |
| 7.9 | Money / analytics / reports pages load | ✅ funnel (after fix) |
| 7.10 | Companies / customer 360 loads | 🔲 |
| 7.11 | Certificates admin: list + reissue | 🔲 |
| 7.12 | Email outbox shows queued sends | 🔲 |

## Section 8 — SEO / content integrity
| # | Flow | Status |
|---|------|--------|
| 8.1 | No fake testimonials (placeholder until Alberto's real reviews) | ✅ (still placeholder) |
| 8.2 | No en-dashes in external-facing text | 🔲 sweep |
| 8.3 | No ForkliftCertified branding anywhere | 🔲 sweep |
| 8.4 | Meta/OG tags + sitemap + schema.org valid | 🔲 |

## Section 9 — Security / safety (pre-go-live gates)
| # | Check | Status |
|---|-------|--------|
| 9.1 | No committed secrets (cookies.txt, generated-pdfs) — repo sweep | 🔲 |
| 9.2 | QA switcher OFF in production build | 🔲 at cutover |
| 9.3 | Rate limiting on public forms (sign-in, register, quote) | 🔲 |
| 9.4 | Real payment path reviewed; first real transaction run by Peter | 🔲 at cutover |

---

## Execution order (this week)
1. **Section 0** re-confirm after any deploy.
2. **Section 2 + 3 + 5** — the money + cert flows (highest risk).
3. **Section 7** — Alberto's admin tools.
4. **Section 1 + 6 + 4** — funnel + accounts.
5. **Section 8 + 9** — content + security sweeps before cutover.

Log each run in `runs/<date>/report.md` with screenshots. ❌ items get a bug
entry + fix + re-run before go-live.
