# Miramar QA — Testing System

Durable, repeatable QA for `training.miramarforklift.com` so a bad demo never
ships again. Format: **markdown in the vault** (source of truth). Alberto reads
these via the GitHub repo when Peter points him at them. A PDF can be generated
from any use-case doc when we want to hand Alberto something polished.

## When to run

- **Full matrix** — before any staging → production push.
- **Smoke subset** (book flow + login + QR sign-in) — after ANY change to
  booking, checkout, auth, payments, or scheduling.
- **Schema-sync check** — after any schema.ts change, confirm the target DB is
  not behind the code (the 2026-08-11 registration 500 was staging schema
  drift). See "Schema drift check" below.

## Layout

```
Operations/qa/
├── README.md            <- this file (how/when to run)
├── test-plan.md         <- master use-case matrix (roles x flows)
├── use-cases/           <- one doc per use case, kept current
│   ├── UC-01-browse-and-pricing.md
│   ├── UC-02-book-hands-on.md
│   ├── UC-03-checkout-and-photo-id.md
│   ├── UC-04-qr-signin.md
│   ├── UC-05-customer-dashboard.md
│   ├── UC-06-admin-today.md
│   ├── UC-07-admin-manual-booking.md
│   └── UC-08-qa-account-switcher.md
└── runs/
    └── e2e-2026-08-12/  <- each dated run: report.md + screenshots/
```

## Roles (test accounts — password for all: DemoPass!234)

| Role | Email | Use |
|------|-------|-----|
| Super admin (Alberto) | training@miramarforklift.com | admin flows, real login |
| Super admin | admin@miramarforklift.com | generic admin |
| Group admin | group@miramarforklift.com | multi-seat purchase |
| Individual | user@miramarforklift.com | first-time student |
| Member | member1@miramarforklift.com | crew member, no purchases |
| Certified student | certified@miramarforklift.com | renewal / dashboard cert |

On staging/local, the yellow **QA banner** (top of every page) switches between
these instantly. On staging it is enabled by `ENABLE_QA_ACCOUNT_SWITCHER=true`.
**Never enable on production.** Seed/refresh accounts:
`npx tsx scripts/seed-test-accounts.ts` (idempotent, never wipes).

## Schema drift check (run before any DB-touching deploy)

The 2026-08-11 demo broke because staging DB was behind the code. Before
deploying schema-affecting work, confirm the target DB has all tables/columns
the code expects. Quick check: compare `information_schema.tables` against the
`pgTable` list in `shared/schema.ts`. Long-term: gate this in CI.

## Automation path (later)

Playwright is the plan, deliberately deferred. The use-case docs in
`use-cases/` are written as numbered, selector-friendly steps (every step cites
a `data-testid`) so they can be transcribed into Playwright specs 1:1 without
rework. Priority for automation: UC-02 (book), UC-08 (switcher), UC-03
(checkout) — the smoke subset.

## Rules

- Staging/QA only — never test production with real cards. Sandbox cards only.
- No real external sends. Email is sandboxed on staging (resend.dev override).
- Report honestly: a failed test is a useful test. Log it, screenshot it, fix it.
