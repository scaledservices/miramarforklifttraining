# Epic B — Booking hands-on training (the most important test)

**You are:** a new customer booking a hands-on class. **Not logged in.**
**Time:** ~30 minutes · [◂ Back to Start Here](README.md)

**Setup:** private/incognito window. Have the test card handy:

> Card `4007 0000 0000 027` · any future expiry · any CVV · any ZIP

**Use your REAL email** in these tests — the confirmation email should arrive
to you. (This used to be broken; we just fixed it. It's the #1 thing to check.)

---

## Story B1 — Book a class in San Diego · P0

1. Click: **https://exquisite-perception-staging-725a.up.railway.app/book-training**
2. **City:** click **San Diego**. A course is pre-picked for you.
3. Click **Next**.
4. **Calendar:** pick any highlighted day (San Diego trains Mon/Wed/Fri).
   Then pick a time block (like 9:00 AM–1:00 PM).
5. Click **Next**.
6. **Your details:** fill in your real name, **your real email**, your phone.
   - Try the participants **+ / − buttons** — the number should change by 1
     each tap and the price on the right should update.
7. Click **Continue to Payment**.
8. **Payment:** enter the test card (above). Accept the refund policy checkbox.
9. Click **Pay**.

**You should see:**
- A confirmation page: "Payment Received" with a **booking number** (BK-…)
- A **"Who's attending?"** box where you can type attendee names
- Within a few minutes: **a confirmation email in YOUR inbox** ✅
  (check junk/spam too — and TELL ME which folder it landed in)

**Report if:** the email goes to anyone but you, never arrives, or lands in
spam; the page errors; or anything confuses you.

---

## Story B2 — The optional password box · P0

Same flow as B1 (book another class), but on the **Your details** step:

1. Notice the **Password (optional)** box under your email/phone.
2. Type a password you'll remember (8+ letters), e.g. `AlbertoTest2026!`
3. Finish the booking and pay with the test card.
4. After the confirmation, click: **https://exquisite-perception-staging-725a.up.railway.app/login**
5. Log in with **your real email** and the password you just typed.

**You should see:** you're logged in, and your dashboard shows the booking you
just made. **This proves the account was created while booking.**

Then book a THIRD class leaving the password box **empty** — it should also
work (the site makes a password for you and you can reset it later).

---

## Story B3 — Already-have-an-account path · P1

1. Book another class using the **same email** as B2.
2. On the payment step, since you already have an account, it should ask you
   to **sign in** (your email already filled in) instead of creating a new one.

**You should see:** sign-in box with your email prefilled. After signing in
you can pay and finish — no duplicate account, no error.

---

## Story B4 — Las Vegas shows a "trainer confirms" note · P1

1. Start a booking for **Las Vegas**:
   **https://exquisite-perception-staging-725a.up.railway.app/book-training**
2. Pick the available day (Las Vegas trains Mondays).

**You should see:** a note that the date is **subject to trainer confirmation**
— Vegas dates are tentative until you confirm them.

---

## Story B5 — Declined card shows a friendly error · P1

1. Start any booking, get to payment.
2. Use the **decline card**: `4000 0000 0000 002` (any expiry/CVV/ZIP).

**You should see:** a clear, polite "payment was declined" message — NOT a
technical error, NOT a frozen page. You should be able to try the good card
right after.

---

## Story B6 — What if I pick a day the trainer is busy? · P2

This one is optional (Peter may need to set it up — ask him first). Two
bookings on the same day in different cities should not both take the trainer
when they're a big group.

**You should see:** the site warns and asks for a different date — it never
lets a double-booking happen silently.

---

✅ **Done with Epic B?** Go to
[Epic C — Buying and taking an online course](epic-c-online-course.md).
