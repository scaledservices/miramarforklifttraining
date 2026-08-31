# Epic C — Buying and taking an online course

**You are:** a worker buying the online certification for yourself.
**Time:** ~30 minutes · [◂ Back to Start Here](README.md)

**Setup:** private/incognito window. Test card: `4007 0000 0000 027`.
Use a Gmail-style alias email if you have one (e.g. `youremail+student@gmail.com`)
so this "student" is separate from your other tests — or just use your real
email again, that's fine too.

---

## Story C1 — Buy the online course · P0

1. Click: **https://exquisite-perception-staging-725a.up.railway.app/online-forklift-certification**
2. Read the page like a customer would. Then click the buy/enroll button.
3. At checkout, create your account **right there on the page** (name, email,
   password) — you should NOT be sent away to a separate registration page.
4. Pay with the test card.

**You should see:**
- Immediate access to the course (no waiting, no manual step)
- A **receipt/welcome email** in your inbox within a few minutes

---

## Story C2 — The course player · P0

1. After purchase, open the course (it should take you there; otherwise
   **https://exquisite-perception-staging-725a.up.railway.app/dashboard** → your course).
2. Click through the first several modules/slides.

**You should see:**
- Every slide loads — text, images, and the new banner images look right
- A progress indicator that moves as you go
- **Tell me honestly:** does anything look cheap, broken, or unprofessional?
  This is what your customers see.

---

## Story C3 — Leave and come back · P1

1. Stop halfway through the course. Close the browser tab completely.
2. Open **https://exquisite-perception-staging-725a.up.railway.app/login**,
   log in with the account from C1, and open the course again.

**You should see:** you're back where you left off — progress was saved.

---

## Story C4 — Take the exam, get the certificate · P0

1. Finish the course and take the final exam. (Just click through — answers
   don't matter for testing; retakes are allowed.)
2. Pass it.

**You should see:**
- A certificate is issued with a certificate number
- **Download the PDF certificate** and open it. CHECK:
  - Your name is correct
  - There is a **"Date of Training"** on it ← this was MISSING before; it's
    the thing you flagged on the old site and we just fixed
  - The gold embossed seal looks good
- A **certificate email** arrives in your inbox

---

## Story C5 — Certificate verification (what an employer sees) · P1

1. Copy the certificate number from your certificate.
2. Open: **https://exquisite-perception-staging-725a.up.railway.app/verify**
3. Paste the number and submit.

**You should see:** a page confirming the certificate is valid, with the name
and course — this is what an employer checks.

---

## Story C6 — Fail the exam (optional) · P2

If you have time: deliberately answer wrong on an exam.

**You should see:** a friendly "try again" path — unlimited checkpoint
retries, up to 3 tries on the final. Never a dead end.

---

✅ **Done with Epic C?** Go to
[Epic D — Photo-ID wallet card](epic-d-photo-id.md) (short) or skip to
[Epic E — Buying for a crew](epic-e-crew.md).
