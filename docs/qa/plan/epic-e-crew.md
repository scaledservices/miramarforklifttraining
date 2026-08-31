# Epic E — Buying for a crew (company manager experience)

**You are:** a company safety manager buying courses for your workers.
**Time:** ~30 minutes · [◂ Back to Start Here](README.md)

**Setup:** have 2–3 REAL email addresses ready that you can open
(your Outlook, a Gmail, maybe Christine's or a family member's — with their OK).
Gmail trick: `youremail+worker1@gmail.com`, `youremail+worker2@gmail.com` all
land in your one Gmail inbox.

**This epic tests the 3 bugs you found on Aug 18 — all should be FIXED:**
auto-assigned seat, the "already pending" error, and invites not arriving.

---

## Story E1 — Buy 4 seats · P0

1. In a private window, click:
   **https://exquisite-perception-staging-725a.up.railway.app/online-forklift-certification**
2. Choose to buy for a **team / multiple people** — select **4 seats**.
3. Check out with your real email and the test card.

**You should see:**
- After payment you land **directly on the seat-assignment screen**
  (NOT a generic dashboard) ← new fix
- **You are NOT using up one of the 4 seats yourself** ← bug you found; fixed
- A receipt email in your inbox

---

## Story E2 — Invite 3 workers · P0

1. On the seat-assignment screen, invite your 3 test emails, one after another.
2. Repeat quickly — invite #2 and #3 right after #1.

**You should see:**
- Each invite saves with NO error ← the "seat already pending" bug you hit;
  it's fixed, so report it immediately if it reappears
- **Each invitee email receives an invitation** — open each inbox and confirm
  (check junk/spam and TELL ME where it landed, especially in Outlook)

---

## Story E3 — A worker accepts the invite · P0

1. Open one of the invite emails and click its link.
2. Set a password for that "worker."

**You should see:** the worker lands inside the course, seat now shows as
used, and the crew manager screen shows them as a member.

---

## Story E4 — Resend an invite · P1

1. Back as the crew manager, find a pending (not-yet-accepted) invite.
2. Click **resend / reissue**.

**You should see:** a fresh email arrives; no duplicate seats appear.

---

## Story E5 — Remove a member · P2

1. Remove one of your test members.

**You should see:** their seat frees up (the seat count goes back up).

---

## Story E6 — Watch a worker's progress · P1

1. As the crew manager, open:
   **https://exquisite-perception-staging-725a.up.railway.app/group/progress**

**You should see:** each member, their course progress, and their certificate
status when they finish.

---

✅ **Done?** Go to [Epic F — Account and dashboard](epic-f-account.md).
