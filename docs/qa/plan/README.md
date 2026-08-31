# Miramar Website Testing — Start Here

**For:** Alberto Rawlins
**From:** Peter
**Date:** August 31, 2026

Thank you for testing! Everything you need is on this page. You do NOT need to
install anything or be technical — you just click links, follow numbered steps,
and tell me what you see.

---

## The website you are testing (staging)

> ## 🔗 https://exquisite-perception-staging-725a.up.railway.app

This is a **practice copy** of the new website. Nothing here is real: no real
charges, no real customers. You cannot break anything. Try anything.

---

## Your toolbox (keep this page open while testing)

### 1. Test credit card (no real money)

| Field | What to enter |
|---|---|
| Card number | `4007 0000 0000 027` |
| Expiration | Any future date, e.g. `12/28` |
| Security code (CVV) | Any 3 digits, e.g. `123` |
| ZIP code | Any, e.g. `92101` |

To test a **declined** card (to see the error message): `4000 0000 0000 002`

### 2. Test accounts (password for ALL of them: `DemoPass!234`)

| Who you are pretending to be | Email | Use it to test |
|---|---|---|
| **Yourself (the boss/admin)** | `training@miramarforklift.com` | Admin dashboard, bookings, confirmations |
| A company manager buying for a crew | `group@miramarforklift.com` | Buying seats, inviting workers |
| A regular worker / individual | `user@miramarforklift.com` | Buying a course for himself |
| A crew member (already invited) | `member1@miramarforklift.com` | Seeing what a worker sees |
| A certified student | `certified@miramarforklift.com` | Certificates |

**Shortcut:** when you are logged in as `training@miramarforklift.com`, a
**yellow bar at the top of the page** lets you switch between these accounts
without typing passwords. Click "Switch account", pick one, then **refresh the
page**.

### 3. Email addresses for testing invites

When you invite "workers" during crew tests, use emails **you can actually
open** — the invitations now really arrive:

- Your own Outlook email (check the inbox AND the junk/spam folder)
- A second personal email if you have one (Gmail, Yahoo…)
- Christine's email (with her OK) or a family member's

Trick for Gmail addresses: if you have `yourname@gmail.com`, then
`yourname+test1@gmail.com`, `yourname+test2@gmail.com` etc. all arrive in the
same inbox. Each one counts as a different person on the website.

---

## The 3 golden rules

1. **Take a screenshot of anything weird.** (Windows: `Win+Shift+S`. Mac:
   `Cmd+Shift+4`. iPhone/iPad: power + volume up.)
2. **Write down the 5 things** in the report format below — that's all I need.
3. **There are no wrong answers.** If something confuses you, that's a bug in
   my design, not a mistake by you. Confusion reports are the most valuable.

### How to report (one note per problem)

1. Screenshot
2. The web address of the page (copy from the top of the browser)
3. Device + browser (example: "iPhone Safari" or "Windows Chrome")
4. Language: English or Español
5. What you expected vs. what happened — one sentence is fine

Send everything in one shared doc/album, or text me.

---

## The test stories (click one, follow the steps)

Each file is a group of stories. Each story is a numbered checklist with
**direct links** — click the link in the story and it opens the right page.

| Group | What it covers | Time |
|---|---|---|
| [Epic A — Browsing the site like a new customer](epic-a-public-funnel.md) | Homepage, prices, Spanish, forms | ~20 min |
| [Epic B — Booking hands-on training](epic-b-booking.md) | The full booking flow, payment, emails | ~30 min |
| [Epic C — Buying and taking an online course](epic-c-online-course.md) | Purchase, course player, exam, certificate | ~30 min |
| [Epic D — Photo-ID wallet card](epic-d-photo-id.md) | The $25 wallet card upsell (3 flows) | ~20 min |
| [Epic E — Buying for a crew (company manager)](epic-e-crew.md) | Seats, invites, member experience | ~30 min |
| [Epic F — Account and dashboard](epic-f-account.md) | Login, password reset, profile | ~15 min |
| [Epic G — QR sign-in at a class](epic-g-qr-signin.md) | The attendance QR code | ~10 min |
| [Epic H — Onsite training (quote flow)](epic-h-onsite.md) | Requesting a quote for a company | ~10 min |
| [Epic I — Your admin tools (daily work)](epic-i-admin.md) | Today page, bookings, confirming | ~30 min |
| [Epic M — Spanish sweep](epic-m-spanish.md) | Everything again, but in Español | ~30 min |

**Suggested order:** A → B → C → E → I first (those are the money flows).
Do M (Spanish) on a different day with fresh eyes. Use your phone for some,
laptop for others, iPad if handy.

---

## What "passing" looks like

A story passes when you can do every numbered step and the **"You should see"**
lines match what's on screen. If ANY step fails or looks wrong: screenshot,
note it, and keep going with the next story — don't get stuck.

## What to ignore

- The yellow "QA / testing" banner at the top — that's only on the practice site.
- If a page is slow the first time you open it (the practice server naps) —
  give it 30 seconds, refresh once. Only report it if it's slow every time.
