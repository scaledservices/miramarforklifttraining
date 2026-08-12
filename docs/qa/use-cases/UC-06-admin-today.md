# UC-06 — Admin "Today" (daily simplified view)

Priority: **P0**. Role: Alberto (super_admin) / admin.

This is the `/admin` landing page — Alberto's requested simplified daily view
(money, today's sessions, leads, needs-action). It already exists; this UC is
about confirming it loads and is useful, then capturing Alberto's feedback.

## Steps
1. Log in as admin → land on `/admin` (Today) (`text-admin-today-title`).
2. **Money story** card (`card-money-story`): this week's collected total
   (`text-week-collected`), trend chip vs last week, 14-day sparkline.
3. **Quick stats** row (`row-quick-stats`): sessions this week, new leads,
   certificates issued.
4. **Today's Sessions** section: each session card with a Confirm action.
5. **Needs action** list: awaiting-confirmation bookings + unpaid balances.
6. Confirm a pending booking from a session card — status flips, customer notified.

## Expected
- Page loads without errors; numbers match /api/admin/today.
- It reads as a simple "what do I do today" view, not a dense dashboard.

## Verified
Component reviewed + admin login confirmed on staging (2026-08-12). Alberto's
qualitative feedback ("is it useful / what's missing") is collected at the next
meeting — that is the open item, not a code gap.
