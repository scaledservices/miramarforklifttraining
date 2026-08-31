# Epic F — Account and dashboard

**You are:** a returning customer managing their account.
**Time:** ~15 minutes · [◂ Back to Start Here](README.md)

---

## Story F1 — Register a brand-new account · P1

1. Click: **https://exquisite-perception-staging-725a.up.railway.app/register**
2. Fill it in; use a test email alias.
3. **Try to break it first:** submit with an empty field, then with a bad
   email ("abc"), then with a 3-letter password.

**You should see:** clear, human error messages for each mistake
("Please enter a valid email") — never raw codes like `400: {}`.

---

## Story F2 — Login and logout · P0

1. **https://exquisite-perception-staging-725a.up.railway.app/login** — log in
   as `user@miramarforklift.com` / `DemoPass!234`.
2. Look at the dashboard. Then log out (menu, top right).

**You should see:** dashboard loads with the user's name; logout returns you
to the public site.

---

## Story F3 — Forgot password · P1

1. On the login page, click **Forgot password?**
2. Enter YOUR real email (use one tied to a test account you made in Epic B2,
   or ask Peter to add one). Submit.
3. Check your email, click the reset link, set a new password.
4. Log in with the new password. Then try the SAME reset link again.

**You should see:** reset email arrives (note the folder!), new password
works, and the used link is dead (can't be reused).

---

## Story F4 — The dashboard · P1

1. Log in as `certified@miramarforklift.com` / `DemoPass!234`
2. Open **https://exquisite-perception-staging-725a.up.railway.app/dashboard**

**You should see:** courses, progress, and certificates — everything a
customer needs, nothing broken.

---

## Story F5 — Edit the profile · P2

1. In the dashboard, find profile/settings. Change the phone number; save.
2. Start a checkout — the saved info should prefill.

**You should see:** changes save and show up later.

---

✅ **Done?** Go to [Epic G — QR sign-in at a class](epic-g-qr-signin.md).
