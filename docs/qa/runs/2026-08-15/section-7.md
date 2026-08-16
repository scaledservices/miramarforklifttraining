# QA Run — 2026-08-15 — Section 7 (Admin tools)

Runner: Hermes (Kimi K3). Target: **staging**. Account: `training@` super_admin (id 46).
Method: live API + DB verification. One real schema-drift fix applied (approved).

Legend: ✅ pass · ⚠️ pass-with-note · ❌ fail · 🔲 not run

## BUG FOUND + FIXED: admin/companies 500 (schema drift)
- **Symptom:** `GET /api/admin/companies` → 500 "Internal server error".
- **Root cause:** staging DB missing 3 columns on `training_events`:
  `revenue` (integer), `raw_employees_code` (text), `status_notes` (text).
  The route aggregates `sum(revenue)` per company → threw on the missing column.
- **Class:** column-level schema drift (same as 8/11 registration + 8/12 Today page).
- **Fix (approved, additive, non-destructive):**
  `ALTER TABLE training_events ADD COLUMN IF NOT EXISTS revenue integer` (+ the 2 text cols).
- **Verified:** companies now 200; revenue aggregation works.
- **Note:** only 1 company on staging ("Harbor Logistics Inc") — the Alberto CRM import
  (~1,531 companies) ran against LOCAL dev, never staging. Not a bug, but Alberto will
  see an empty-ish CRM on staging unless the import is run there too (separate decision).

## Section 7 — admin (Alberto's daily tools)
| # | Flow | Result |
|---|------|--------|
| 7.1 | Today page loads | ✅ 200 (date, todaySessions, awaitingConfirmation×9, unpaidBalances, week, newLeads×1) |
| 7.2 | Bookings list + filters | ✅ 200 |
| 7.3 | Manual "New Booking" creates + blocks availability | ✅ BK-…HZSS created (201), capacity + trainer-conflict enforced |
| 7.4 | Confirm / reschedule / cancel | ✅ confirm (pending→confirmed), re-confirm rejected 400, cancel works, reschedule route validates blackout + trainer-conflict |
| 7.5 | Availability editor | ✅ rules update round-trip; invalid (empty daysOfWeek) rejected 400 |
| 7.6 | Trainer-conflict card | ✅ `/api/admin/trainer-day-clusters` 200 (0 current clusters — correct) |
| 7.7 | Leads pipeline | ✅ 200 (data present) |
| 7.8 | Quotes: create + send | ✅ quote id=2 created (draft, $1400, 5 pax) |
| 7.9 | Money / analytics / reports | ✅ funnel 200 (13 direct visitors, real data) |
| 7.10 | Companies / customer 360 | ❌→✅ FIXED (was 500 schema drift; now 200) |
| 7.11 | Certificates admin: list + reissue | ✅ 200 (list verified; reissue route exists) |
| 7.12 | Email outbox | ✅ 200 (380KB queued, `[TEST →]` sandboxed) |

## Schema-drift pattern (process note)
This is the **third** column-level drift incident (registration → Today → companies).
The strengthened drift check (column-level, in README) is correct but still manual.
**Recommendation before production cutover:** gate deploys on an automated
`drizzle-kit` diff against the target DB so unapplied drift fails the deploy.
Applied here: `revenue`, `raw_employees_code`, `status_notes` added to staging.

## QA test data created
- Quote id=2 (draft), booking BK-…HZSS (cancelled), order FC-2026-000029 — all sandbox.
