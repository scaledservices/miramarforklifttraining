# Next-Session Kickoff: Miramar Forklift Training

Branch: `feat/alberto-demo-adjustments`. Read `.hermes/fable-wallet-card-spec.md` (approved
design spec) and `git log --oneline -12` before acting. Repo rules live in `AGENTS.md` +
`.hermes.md`: hard gates on payments/certs/customer data; priority Onsite > Hands-on > Online;
no en-dashes in user-facing copy; EN+ES in sync.

## Current state (2026-07-22)

- **Chunk 1 wallet-card redesign DONE** (`9d593ac`): photo ID add-on at checkout behind
  `platform_settings.photo_id_addon_enabled` (default OFF), `photo_id_entitlements` table,
  migration 023 applied locally, saved addresses on users.
- **12 AI course images** in `/tmp/mira-gen/` awaiting veto (contact sheet reviewed);
  `dock-scene.png` already shipped with remapped pins (EN+ES).
- **tsc: 73 pre-existing errors.** 14 in `server/routes/groups.ts` are mechanical
  `req.params.x as string` casts. Failed subagent sweep analysis:
  `~/.hermes/profiles/operator-miramar-lean/cache/delegation/subagent-summary-0-20260722_225717_985960.txt`
- **Dev**: `npm run dev` -> https://localhost:8888 (HTTPS, self-signed). Builds need Node 20:
  `export PATH="$HOME/.nvm/versions/node/v20.18.3/bin:$PATH"`.
  Demo accounts (all `DemoPass!234`): admin@ / group@ / user@ / member1@ / certified@miramarforklift.com
  Authorize.net sandbox keys in `.env`; test card 4111 1111 1111 1111.

## Tasks, in order

1. **Enable + QA Chunk 1 locally**
   ```sql
   INSERT INTO platform_settings (key, value) VALUES ('photo_id_addon_enabled', 'true')
   ON CONFLICT (key) DO UPDATE SET value = 'true';
   ```
   Walk the checkout add-on as individual AND team cart; verify entitlement rows +
   `saved_shipping_address` land. Also align the DEMO_MODE charge path to create
   entitlements when Authorize.net is not configured (only the sandbox path does today).

2. **Chunk 2 (dashboard reorder, spec section 2)**: OrderCertCard.tsx becomes 3 steps
   (REQUIRED photo upload first, review+pay prefilled from saved addresses, confirmation)
   + prepaid-entitlement branch (`entitlementId` param -> no payment step; upload consumes
   entitlement -> creates cert_card_orders with valid certificationId) + group-admin
   per-member photo-ID status view. Ships unflagged.

3. **Image wiring**: copy approved PNGs from /tmp/mira-gen into client/public/images/training/,
   update `scripts/course-content.ts` + `course-content-es.ts`, remap hotspot pins for
   forklift-anatomy / pre-shift-checklist / osha-compliance per actual compositions (view
   each image first). Skip stability-triangle (keep geometric diagram).
   NOTE: content changes need a DB seed to appear: `npx tsx scripts/seed-online-courses.ts --refresh`
   (it warns about leftover step rows; handle per PROGRESS.md notes).

4. **Fable 5 specs via Claude Code CLI** (export CLAUDE_CODE_OAUTH_TOKEN from
   `~/.claude/.credentials.json` first), read-only specs into `.hermes/`:
   (a) Fresno/LV request-preferred-dates booking flow (Alberto trains M/W/F in SD only;
       LV/Fresno customers pick preferred dates excluding M/W/F, clearly a REQUEST not a
       reservation, multi-day select, admin follows up);
   (b) expense tracking per onsite/hands-on training + net revenue splits
       (revenue minus Alberto's expenses, then 50% owners / 25% Alberto / 25% Scaled);
   (c) admin Today dashboard rework (30-day traffic chart, monthly revenue stacked bar
       online vs onsite, remove "your cut", reorder leads > sessions > certs, merge
       today+week into Upcoming Sessions with click-through, Needs Action covering
       quotes/messages/photo-ID requests).

5. **Only after 1-4**: fix the 14 `req.params.x as string` casts in
   `server/routes/groups.ts` YOURSELF. Do NOT delegate - a subagent corrupted this file
   once. Verify with `npm run check` after.

## Gates

After every change: `npm run check` (<= 73 errors, all pre-existing) and `npm run build`
(green). Commit per task, clear messages. NO push, no deploy, no payment credential
changes, no certificate issuance logic changes, no customer data imports. If anything
conflicts with the spec, stop and flag it rather than improvising.
