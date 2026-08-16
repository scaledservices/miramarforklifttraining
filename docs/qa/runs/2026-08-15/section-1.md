# QA Run — 2026-08-15 — Section 1 (Public funnel) + 8.4 (SEO)

Runner: Hermes (Kimi K3). Target: **staging**. Method: live HTTP + admin/DB verification.

Legend: ✅ pass · ⚠️ pass-with-note · ❌ fail · 🔲 not run

## Section 1 — public funnel (revenue-critical)
| # | Flow | Result |
|---|------|--------|
| 1.1 | Homepage loads; onsite "Get a quote"; hands-on $280; online $45 | ✅ (prior + pricing fix this session) |
| 1.2 | Location pages (SD/LV/Fresno) load; correct address/SEO meta | ✅ all 200, correct `<title>` per city |
| 1.3 | Service-area SEO pages render | ✅ sample (LA, Bakersfield, forklift-training-los-angeles) 200 |
| 1.4 | Request-a-quote form submits; lead lands in admin Leads | ✅ 201 id=10 ("QA Quote Test", 6 pax) confirmed in `/api/admin/onsite-requests` |
| 1.5 | Contact form submits; lands in admin | ✅ 200; stored in `contact_submissions` id=15 |
| 1.6 | EN/ES toggle works; ES pages render | ✅ `/es` + `/es/locations/san-diego` 200 |
| 1.7 | 404 / bad route shows a friendly page | ✅ SPA catch-all `<Route component={NotFound}>` renders title+description (client-side; server returns 200 as expected for SPA) |
| 1.8 | Mobile layout | 🔲 visual check — recommend Alberto spot-check on a phone during UAT |

## 8.4 — meta/OG/sitemap/schema
| Check | Result |
|-------|--------|
| sitemap.xml | ✅ 200, valid XML, **300 URLs**, hreflang EN/ES alternates, includes location pages |
| robots.txt | ✅ 200 |
| Meta/OG tags | ✅ present on homepage + location pages (title/description/og:*/twitter:card verified earlier) |
| schema.org JSON-LD | ✅ `localBusinessSchema` injected on location pages (in LocationPage.tsx) |

## Form validation (positive finding)
Both lead forms reject invalid enum values with 400 (contact `trainingType` ∈
individual/business/trainer/other; quote `leadSource` ∈ organic/referral/direct/paid/
rep_sourced/unknown). Server-side validation works — no bad data slips through.

## Notes
- Lead-capture path is **fully closed-loop**: public form → DB → admin leads list. No silent drops.
- Quote form is rate-limited (5/min) — appropriate for a public form.
- QA test data: quote request id=10, contact submission id=15.
