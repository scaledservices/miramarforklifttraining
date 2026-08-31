# Epic D — Photo-ID wallet card

**You are:** testing the $25 photo-ID wallet card (the plastic card workers
carry). **Time:** ~20 minutes · [◂ Back to Start Here](README.md)

> ⚠️ **Heads-up:** this feature is turned OFF on the practice site by a switch.
> Peter will flip it ON before you run this epic — **check with him first.**
> If the photo-ID offer never appears in Story D1, the switch is still off;
> skip to Epic E and come back.

**Why we test this:** on the OLD site, a customer paid $25 for a card and the
system didn't show whether he'd paid — Christine had to spot the payment in
Authorize.net manually. The new system must track everything.

---

## Story D1 — The upsell shows up at checkout · P1

1. Add the online course to the cart and go to
   **https://exquisite-perception-staging-725a.up.railway.app/checkout**
2. Look at the page **above** the payment card.

**You should see:** a photo-ID wallet card offer (checkbox) with its price,
ABOVE the payment section — easy to spot. Check it → the total updates.

---

## Story D2 — Company buys a card for a worker (Flow 1) · P1

**Log in as the crew manager:** `group@miramarforklift.com` / `DemoPass!234`

1. Go to **https://exquisite-perception-staging-725a.up.railway.app/group/certifications**
2. Find a member who finished their course, and use the **Order** photo-ID
   option for them. Pay with the test card.

**You should see:** the member gets an **email asking for their photo** (use
your own email for the member so you can see it). The order shows as paid —
no guessing, no checking Authorize.net.

---

## Story D3 — Worker uploads their photo (Flow 2) · P1

1. Open the photo-request email from D2 and click the upload link.
2. Upload any portrait photo from your phone/computer (a selfie is fine).

**You should see:** confirmation the photo was received, and the crew manager
+ you (operator) get a "ready to print" notification.

---

## Story D4 — Worker requests a card after finishing (Flow 3) · P1

1. As a worker who completed a course WITHOUT a pre-paid card
   (`member1@miramarforklift.com` / `DemoPass!234`), open your dashboard.
2. Look for the option to get your photo-ID card.

**You should see:** a clear button to buy/upload for the card. The crew
manager gets notified about the purchase opportunity.

---

## Story D5 — Bad photo is rejected nicely · P2

1. In any upload box, try uploading a non-image file (e.g. a PDF) or a huge photo.

**You should see:** a friendly "please use a photo" message — no crash,
no technical error.

---

✅ **Done?** Go to [Epic E — Buying for a crew](epic-e-crew.md).
