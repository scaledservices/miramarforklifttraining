# Miramar QA — Master Test Plan (use-case matrix)

Rows = user role. Columns = flow. Cell = priority (P0 = must-pass before any
production push, P1 = before staging handoff, P2 = periodic).

| Flow \ Role | Visitor | Individual | Group admin | Certified | Alberto (super_admin) |
|---|---|---|---|---|---|
| Browse + pricing ("Get a quote" onsite / $280 hands-on) | **P0** | P1 | P1 | P2 | P1 |
| Register / login | **P0** | **P0** | P1 | P2 | **P0** |
| Book hands-on (city, schedule, stepper) | **P0** | **P0** | **P0** | — | P1 |
| Checkout + photo-ID upsell above payment | — | **P0** | **P0** | — | P1 |
| QR on-site sign-in | **P0** (public link) | — | — | — | **P0** (show QR) |
| Customer dashboard (calendar + seats) | — | **P0** | **P0** | P1 | — |
| Admin Today (daily view) | — | — | — | — | **P0** |
| Admin manual "New Booking" | — | — | — | — | **P0** |
| Admin availability / blackout dates | — | — | — | — | **P0** |
| Certificates view/download | — | P1 | P1 | **P0** | P1 |
| Training schedule correct (Fresno Sat 9a; 4-hr blocks) | **P0** | **P0** | — | — | P1 |

## Smoke subset (run after ANY booking/checkout/auth/scheduling change)
1. UC-08 switcher present + switch works
2. UC-02 book hands-on end-to-end (city → schedule → stepper → checkout)
3. Register + login
4. UC-04 QR sign-in page loads

## Confirmed schedule truth (verify against these)
- San Diego (Southern California): Mon/Wed/Fri, 09:00–13:00 and 13:00–17:00
- Fresno (Central California): Saturday only, 09:00–13:00
- Las Vegas (Southern Nevada): Monday only, 09:00–13:00 and 13:00–17:00
- All sessions are 4-hour blocks. Fresno start moved to 9:00 AM (Alberto 7/28).

## Known watch-items
- **Schema drift** — staging DB must match code before any schema deploy (see README).
- City picker must show ONLY San Diego / Las Vegas / Fresno (filter drops QA rows).
- "San Diego (Staging Test)" is a leftover QA row in the DB — harmless now (filtered
  from the picker) but should be deactivated if it ever surfaces elsewhere.

Each use-case doc in `use-cases/` lists numbered steps with expected results and
the `data-testid` selectors, so a run is just: follow the doc, check each box,
screenshot, log pass/fail in `runs/<date>/report.md`.
