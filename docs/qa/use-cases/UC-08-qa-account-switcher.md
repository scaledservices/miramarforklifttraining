# UC-08 — QA account switcher (yellow banner)

Priority: **P0** (it gates every other role-based test). Roles: all.

The yellow banner at the top of every page lets QA/Alberto switch instantly
between test accounts. Enabled on staging via `ENABLE_QA_ACCOUNT_SWITCHER=true`;
**never enable on production.**

## Steps
1. Load any page. Confirm the yellow banner is at the very top (`demo-banner`).
2. It reads "Staging (QA) - sandbox payments only" (or "Local dev" locally).
3. Click **"Switch account"** (`demo-banner-toggle`) — the account grid expands.
4. Confirm 6 accounts: Alberto (Admin) training@, Admin admin@, Crew Admin group@,
   Individual user@, Member member1@, Certified certified@.
5. Click **Log in** on one (`demo-login-<role>`).
6. Banner updates to "Logged in as {name} ({role})" and the app shows that role's view.
7. Switch to a different account — session swaps cleanly (query cache cleared).
8. **Log out** (`demo-banner-logout`) returns to logged-out state.

## Expected
- Switch is instant, no page reload needed, no manual password entry.
- Role changes take effect immediately (admin sees admin nav, etc.).

## Verified
2026-08-12 staging — PASSED (switched to Alberto/super_admin, Crew Admin, Individual;
each login verified via /api/auth/me).
