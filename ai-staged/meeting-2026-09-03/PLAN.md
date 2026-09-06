# 2026-09-03 Alberto Meeting - Implementation Plan

Branch: feat/2026-09-03-meeting-findings (local commits only, NO push)
Source: /tmp/miramar-2026-09-03-notes.md (Gemini notes + full transcript)

## Batch 1: Catalog + address (hands-on revenue correctness)
- [ ] LV address: 3301 W. Martin Ave Suite A (locations.ts) - verified against live old site
- [ ] bookingPricing.ts: remove LV scissor/550/650; remove LV add-on; add Fresno TTT x2 ($750)
- [ ] catalog.ts: remove LV scissor-aerial, LV 550, LV 650; remove ALL Fresno hands-on except standard
      (scissor, reach, order-picker, both 490s, 550, 650); add TTT forklift+aerial for Fresno
- [ ] Check BookTraining add-on flow still valid for SD only

## Batch 2: Payments (money accuracy)
- [ ] Surcharge 3% -> 3.5%: authorizeNetClient, Checkout.tsx, OrderCertCard.tsx, BookTraining 1.03,
      authorizeNet.ts:424, en/es common.json copy (999, 1068-1069, 2298, 2756)
- [ ] Wallet card $9.99 -> $24.99: certs.ts:262, OrderCertCard.tsx:261,620,761 + common.json priceNote
- [ ] Booking confirmation email: show total incl. fee (services.ts:355 + email.ts totalPrice)
- [ ] Order confirmation email: itemize photo-ID cards

## Batch 3: Crew flow
- [ ] "View My Bookings" -> "Add Crew Members" CTA (order confirmation email cta)
- [ ] AttendeeNamesForm: require first AND last name (both fields mandatory)
- [ ] Seat invite accept page: prefill name from manager entry
- [ ] Fix "Start Training" link in seat-assignment email -> course page not dashboard
- [ ] GroupDashboard member count includes manager

## Batch 4: Completion experience
- [ ] Remove "optional" wallet card framing; card ships 4-5 business days to manager address;
      display that address on completion/next-steps
- [ ] Photo upload step on congratulations/what's-next (prepaid -> upload step; not prepaid -> $24.99 offer)
- [ ] Fix manager photo-reminder email send
- [ ] Debug manager completion notification (sendCrewMemberCertifiedNotification)
- [ ] REFER20 in completion email, replace instructor-network pitch
- [ ] Certificate PDF: official OSHA logo (ai-staged/meeting-2026-09-03/osha-logo.jpg) + signature
      (Google-font-style script signature, Alberto Rawlins)

## Batch 5: Exam
- [ ] Post-pass missed-question review visible (ExamStep - don't fire onComplete before review seen;
      completed state shows review too)
- [ ] Spanish exam/content bug (course content + exam seed locale wiring)
- [ ] Legacy exam questions diff doc for Alberto (EN 27q + ES 28q provided; compare vs current)

## Batch 6: Admin hygiene
- [ ] Hide instructor applications admin page
- [ ] CRM Companies tab display investigation (read-only)

## Gated (not doing without explicit per-action approval)
- staging DB reseed, deploy/push, CRM customer-data writes
