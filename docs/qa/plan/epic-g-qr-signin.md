# Epic G — QR sign-in at a class

**You are:** (1) the trainer showing the class QR code, then (2) a student
signing in with their phone. **Time:** ~10 minutes · [◂ Back to Start Here](README.md)

**Setup:** use a booking you made in Epic B (or ask Peter for one). You need
the booking number (BK-…).

---

## Story G1 — The QR code exists and scans · P1

1. Log in as admin (`training@miramarforklift.com` / `DemoPass!234`).
2. Open **https://exquisite-perception-staging-725a.up.railway.app/admin/bookings**
   and open a confirmed booking.
3. Find the **Class sign-in QR** and scan it with your phone camera.

**You should see:** your phone opens a sign-in page showing the right class
(city, date, time).

---

## Story G2 — A student signs in · P1

1. On the sign-in page (or directly:
   **https://exquisite-perception-staging-725a.up.railway.app/signin/YOUR-BK-NUMBER**),
   enter a made-up student name, e.g. "Jose Testlopez".
2. Submit. Look at the attendee list on the booking.

**You should see:** the student appears, and open seats count down.

---

## Story G3 — Same name twice doesn't double-count · P1

1. Sign in again with the EXACT same name ("Jose Testlopez").

**You should see:** no duplicate — the list still shows him once, seats
unchanged.

---

## Story G4 — Full class stops sign-ins · P2

1. Sign in names until the class is full, then try one more.

**You should see:** a friendly "class is full" message — the extra person
can't sneak in.

---

## Story G5 — The QR-attendee idea (your opinion wanted) · P1

Remember our idea: put a QR code on the **first slide of your presentation**
so students enter their own name + email (+ maybe photo) while you set up.
Try Stories G1–G3 imagining that moment, with 18 guys in the room.

**Then tell Peter:** would this save time or slow you down? What would you
change? This is a decision, not just a bug check.

---

✅ **Done?** Go to [Epic H — Onsite training (quote flow)](epic-h-onsite.md).
