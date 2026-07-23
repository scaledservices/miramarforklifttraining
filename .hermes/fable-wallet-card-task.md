# Fable 5 Design Spec Task: Wallet Card / Photo ID Redesign

You are designing (NOT implementing) the next iteration of the wallet card / photo ID feature for Miramar Forklift Training. Output a written spec to `.hermes/fable-wallet-card-spec.md`. Do NOT modify any code files. Do NOT commit. Read-only + one output file.

## Business context (from owner QA + direction)
- The physical wallet card is fulfilled by Alberto (the operator), not mailed by a third party.
- The $9.99 photo ID (+ selected shipping cost) should become an **add-on at initial course checkout** (online course purchase), AND remain **purchasable later from the student dashboard** — for individuals AND for team managers (group_admin) buying on behalf of certified team members.
- The current post-certification flow (client/src/pages/OrderCertCard.tsx) collects shipping + billing + photo. The NEW flow: no separate shipping step at order time — shipping address is collected at initial course checkout (with a short explanation: "so we can mail your wallet card"), and the dashboard order flow's step 1 becomes a REQUIRED photo upload (cannot proceed without uploading).
- Copy: "Get your wallet card" becomes "Order a Photo ID" (or similar).
- Peter also wants billing + shipping saved to the user profile so future purchases (more seats, renewals) can charge the saved card WITHOUT re-entering details. This means Authorize.net Customer Profiles (CIM) — tokenized payment profiles; we never store PANs.

## Current implementation (already shipped, read these)
- `client/src/pages/OrderCertCard.tsx` — 4-step order flow (shipping, photo upload, payment w/ Accept.js, confirmation). Payment fields already masked.
- `server/routes/certs.ts` — POST /api/cert-cards: charge-first via Authorize.net (createTransactionFromNonce with billTo/AVS), persists billing_address + id_photo + provider_transaction_id + charge_metadata on cert_card_orders.
- `server/authorizeNetClient.ts` — nonce charge + refund + billTo support. NO CIM functions yet.
- `shared/schema.ts` — certCardOrders table (has billing_address, id_photo, provider_transaction_id, charge_metadata columns); users table; orders/orderItems for course checkout.
- `client/src/pages/Checkout.tsx` — course checkout (Accept.js card fields, refund policy, 3% surcharge).
- Group purchases: `server/routes/authorizeNet.ts` buildOrder() creates enrollments per seat; group admins exist (role group_admin).

## Spec must cover (numbered sections, concrete)
1. **Checkout add-on UX**: where in Checkout.tsx the photo-ID add-on appears (per-seat? per-order? quantity handling for team purchases), price presentation ($9.99 + shipping tier), and how it flows through POST /api/authorize-net/charge (new item type? metadata?). Note: photo upload CANNOT happen at checkout for team purchases (manager buys for others) — design how photo collection is deferred (dashboard prompt per certified member? email request?).
2. **Dashboard order flow redesign**: step order becomes (1) REQUIRED photo upload with preview/crop guidance, (2) review + pay (prefilled saved billing/shipping if present), (3) confirmation. For group admins: a team view showing each certified member's photo-ID status (not ordered / photo needed / ordered / shipped) with per-member order action.
3. **Shipping address at course checkout**: new form section (with the "why we collect this" copy), schema changes (orders table? users table?), prefill rules on later purchases.
4. **CIM saved-card design**: which Authorize.net Customer Profile APIs to use (createCustomerProfileFromTransaction after first approved charge vs createCustomerProfile upfront), what to store in DB (customerProfileId, customerPaymentProfileId, last4, cardType, expiry — NEVER PAN/CVV), schema migration sketch, and the charge-saved-card endpoint design (createCustomerProfileTransaction). Include the sandbox-vs-production credential story (existing AUTHORIZE_* env vars).
5. **Edge cases**: manager orders for member without photo yet; member uploads own photo after manager paid; refund of a card add-on inside a larger course order (partial refund via existing refundTransaction); address change between checkout and fulfillment; expired saved card.
6. **Migration/rollout**: what changes for existing cert_card_orders rows, feature-flag approach, what ships first.
7. **Out of scope (do not spec)**: certificate issuance logic changes, ForkliftCertified anything, real fulfillment/shipping carrier integration.

## Constraints
- Product priority: Onsite > Hands-on > Online. This feature serves all three but lives mostly in the online flow — do not let it visually dominate.
- Bilingual EN+ES: every new user-facing string needs both locales (list the keys you propose).
- No en-dashes in user-facing copy.
- Existing gates: no payment credential changes, no production deploy, no push. Spec only.
- Keep it implementable in 2-3 focused PR-sized chunks; call out the chunk boundaries.

Length: thorough but implementation-focused. Reference real file paths, real function names, real table/column names from the code you read.
