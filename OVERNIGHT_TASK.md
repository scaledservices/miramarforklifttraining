# Overnight Task: Alberto Demo Website Adjustments

You are working autonomously overnight on the Miramar Forklift Training web app while Peter
sleeps. Work ONLY on the current git branch `feat/alberto-demo-adjustments`. Deliver a clean,
reviewable set of local commits. Peter reviews the diff in the morning.

## ABSOLUTE RULES (do not violate)
- LOCAL ONLY. Do NOT `git push`. Do NOT deploy. Do NOT touch DNS, payment credentials, or
  Authorize.net config. Do NOT modify certificate/license ISSUANCE LOGIC (visual/template
  fixes to the certificate document are fine). Do NOT import customer data. Do NOT send any
  email/SMS or hit external send endpoints. Do NOT change miramarforklift.com (that is a
  separate WordPress site, not this repo).
- Stay on branch `feat/alberto-demo-adjustments`. Commit incrementally with clear messages.
- After each change, run `npm run check` (TypeScript) and `npm run build` (Vite). Both must
  stay green. If a change breaks the build and you cannot fix it quickly, revert that change,
  leave a note in PROGRESS.md, and move on — do not leave the branch broken.
- No en-dashes in any user-facing copy (use hyphens/commas/colons).
- Site is bilingual EN+ES via react-i18next. Keep BOTH languages in sync for any copy change.
- Product priority rule (hard): Onsite > Hands-on > Online. Never favor online in ordering,
  emphasis, or default selection. This was a confirmed bug — do not reintroduce it.

## TASKS (do as many as you cleanly can, in this priority order)
Read each carefully; explore the codebase to find the right files before editing.

1. HOMEPAGE — display all three certification paths (Onsite, Hands-on, Online) directly under
   the "Get Certified Today" heading, in that priority order, so users see all options without
   extra clicks. Onsite most prominent.
2. ON-SITE REQUEST PAGE — remove the pricing display; route users to the "Request a Quote"
   form instead (quotes are customized by company size and location). Also ensure the flow
   clearly shows the address of the specific facility the customer selected.
3. HANDS-ON / LOCATION PAGE — show ONLY the selected location's details, not the full list of
   all locations.
4. ONLINE COURSE — reduce the NUMBER of interim mini-quizzes to simplify the student
   experience. KEEP the interactive presentation elements and the final exam. Do not remove
   interactivity wholesale — just reduce quiz frequency. Then streamline the course steps /
   front page to minimize clicks.
5. CERTIFICATE DOCUMENT — repair the OSHA logo in the bottom-left corner. Visual/template fix
   ONLY. Do not touch issuance logic.
6. WALLET CARD purchase form — collect BOTH billing and shipping address, and allow the user
   to upload their own photo for the ID card. Do the FORM/UX changes. If this requires
   touching issuance LOGIC, do the form part and flag the logic part in PROGRESS.md for Peter.

## DELIVERABLE
- Incremental commits on `feat/alberto-demo-adjustments`.
- A `PROGRESS.md` at the repo root summarizing: what you completed, what you skipped and why,
  any decisions/assumptions, anything that needs Peter's review, and the final `npm run check`
  + `npm run build` status. This is the first thing Peter reads in the morning.
- Do NOT open a PR or push. Just leave the branch and PROGRESS.md.

Full context on the meeting these came from: the file
"/Users/peternemrow/Documents/Peter Nemrow OS/03 Clients/Miramar/Sessions/2026-07-13-Alberto-Demo-Action-Items.md"
Repo conventions: see AGENTS.md in the repo root.
