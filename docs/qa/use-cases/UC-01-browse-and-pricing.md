# UC-01 — Browse + pricing display

Priority: **P0**. Role: Visitor (not logged in).

## Steps
1. Go to `/` (home). Confirm page loads, Miramar logo, phone (858) 901-0149.
2. Find the three training path cards (Onsite / Hands-On / Online).
3. Confirm **Onsite Training** shows **"Get a quote"** — NOT a dollar price.
4. Confirm **Hands-On Training** shows **"From $280"** per person.
5. Navigate a location page (`/locations/san-diego`) and an SEO service-area page
   (`/service-areas/<city>`) — confirm onsite references say "Get a quote", not a fixed $.

## Expected
- Onsite is always quote-based (Alberto 7/28: a fixed onsite price discourages
  customers who expect a quoted discount).
- Hands-on keeps the flat $280 (includes card fee).
- Online renewal stays $45.
- No console errors.

## Verified
2026-08-12 staging — PASSED.
