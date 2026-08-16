# QA Run — 2026-08-15 — Section 6 (Customer dashboard + account)

Runner: Hermes (Kimi K3). Target: **staging**. Method: live API + DB verification.

Legend: ✅ pass · ⚠️ pass-with-note · ❌ fail · 🔲 not run

## Section 6 — customer dashboard + account
| # | Flow | Result |
|---|------|--------|
| 6.1 | "Your upcoming training" — calendar + seat tracking | ✅ (prior run) |
| 6.2 | Register (clean error messages) | ✅ (prior run) |
| 6.3 | Login / logout / forgot-password reset email | ✅ full flow verified (below) |
| 6.4 | Group admin: crew dashboard, seats, member cert status | ⚠️ endpoint 200 but crew test acct has 0 groups on staging (no seeded group) |
| 6.5 | Profile: saved addresses prefill at checkout | ✅ mechanism verified (below) |

## 6.3 — forgot-password (full E2E)
- **Request:** generic message for existing AND non-existent emails → no user enumeration ✅
- **Token:** hashed (`passwordResetTokenHash`) on user record; raw token only in reset email ✅
- **Email:** "Reset Your Password" queued, 60-min expiry notice, `[TEST →]` sandboxed ✅
- **Confirm:** new password set → login with new password 200 ✅
- **Single-use:** `password_reset_token_used_at` set after use (replay protection) ✅
- **Session kill:** all existing sessions deleted on reset (compromise-safe) ✅
- **Password rules:** min 8 + upper + lower + number enforced ✅
- **Cleanup:** original test password restored after verification.

## 6.4 — crew dashboard (note)
`/api/groups` returns 200 but empty for `group@` (group_admin id=48) — the crew test
account is not linked to any group on staging. The endpoint works; there is simply no
seeded group data. **Recommend:** seed a demo crew (group + members + a team enrollment)
on staging so Alberto can see the crew dashboard populated during UAT.

## 6.5 — saved-address prefill (mechanism)
`/api/auth/me` returns `savedShippingAddress` + `savedBillingAddress` (both null for the
test user — no photo-ID purchase has saved one yet; photo-ID is gated OFF). The chain is
verified in code: photo-ID purchase → saves shipping address → profile returns it →
checkout prefills. Will be exercisable end-to-end once the photo-ID flag is enabled.
