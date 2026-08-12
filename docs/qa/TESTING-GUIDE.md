# Website Testing Guide — Step by Step

**For:** Alberto  **Site (practice):** https://exquisite-perception-staging-725a.up.railway.app

Hi Alberto. This walks you through testing the new website, one step at a time. Each step has a picture so you can see exactly what it should look like. Nothing here charges a real card or emails a real customer. It is a safe practice copy.

**The most important tip:** there is a **yellow bar at the very top of every page**. Click **"Switch account"** to jump between a customer and the admin without typing a password. If you are testing a **new purchase**, click **"Log out"** in that yellow bar first so it feels like a brand new customer.

---

## Test 1 — Look at the prices

1. Open the practice site: https://exquisite-perception-staging-725a.up.railway.app
2. On the home page, look at the training options.
3. **What to check:** "Onsite Training" should say **"Get a quote"** (no dollar price). "Hands-On Training" should show **$280** per person.

![Homepage](runs/e2e-2026-08-12/screenshots/A-homepage.png)

---

## Test 2 — Book a hands-on class (the most important test)

1. Click **Book Training**.
2. **What to check:** the city page shows **3 cities only** — Fresno, San Diego, Las Vegas. (There should be NO "San Diego (Staging Test)" option. That was a bug and it is fixed.)

![City picker](runs/e2e-2026-08-12/screenshots/B1-city-picker.png)

3. Pick **San Diego**, then pick a **date** and a **time**.
4. **What to check:** Fresno classes are on **Saturday at 9:00 AM**. Every session is **4 hours** (9 to 1, or 1 to 5).
5. On the **Your Details** step, set the number of participants with the **+ and -** buttons.
6. **What to check:** tapping + or - changes the number cleanly, and the price on the right updates. (Typing used to get stuck or turn 3 into 13. That is fixed.)

![Details step](runs/e2e-2026-08-12/screenshots/B3-details-stepper.png)

7. Continue to payment. Use this **test card**: `4111 1111 1111 1111`, any future date, any 3-digit code. (No real charge.)
8. On the last screen you will see **"Who's attending?"** — try adding a name, and also try leaving it blank. Both work.

![Confirmation](runs/e2e-2026-08-12/screenshots/I-booking-confirmation-attendee.png)

---

## Test 3 — The QR code sign-in (new, replaces the paper sheet)

1. In the yellow bar, click **Switch account** and choose **Alberto (Admin)**.
2. Go to **Admin → Bookings**, click any booking, then click **"Class sign-in QR"**.
3. A QR code appears. On a real training day, trainees scan this with their phone to sign in.

![QR dialog](runs/e2e-2026-08-12/screenshots/F-signin-qr-dialog.png)

4. To see what a trainee sees, open the link shown under the QR code on your phone. Type a name and tap **Sign In**.
5. **What to check:** the phone shows "You're signed in." The name is now saved with that class.

![Sign-in success](runs/e2e-2026-08-12/screenshots/G-signin-success.png)

---

## Test 4 — Add a booking yourself (for phone bookings)

1. Stay logged in as admin. Go to **Admin → Bookings**.
2. Click the **"New Booking"** button (top right).
3. Fill in the location, date, time, number of people, and the customer's name, phone, and email. Set it to **Confirmed** and save.
4. **What to check:** the booking appears on the calendar and blocks that time, so you never double-book the trainer.

![New Booking](runs/e2e-2026-08-12/screenshots/E-new-booking-dialog.png)

---

## Test 5 — Your "Today" page (your daily home screen)

1. In the admin area, click **Today** (the first page you see).
2. **What to check:** it shows money this week, today's sessions, new leads, and anything that needs your attention.
3. **Tell me:** Is this page useful? Is anything missing or confusing? We will simplify it more based on what you say.

---

## Test 6 — What your customer sees

1. In the yellow bar, click **Switch account** and choose **Individual** (a normal customer).
2. Go to the **Dashboard**.
3. **What to check:** if that customer has a class booked, there is a new **"Your upcoming training"** section at the top with a small calendar (the class day is highlighted) and the seats.

![Dashboard](runs/e2e-2026-08-12/screenshots/H-dashboard-upcoming-training.png)

---

## If something looks wrong

Take a screenshot and send it to me. A short note about what you clicked is a big help.

**Two things I still need from you before we go live:**
1. The correct **San Diego training address** (the site still shows the old Marindustry one).
2. **3 to 5 real customer reviews** from your Google profile, so we can put them on the home page.
