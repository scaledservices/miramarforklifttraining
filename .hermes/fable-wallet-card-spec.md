# Wallet Card / Photo ID Redesign — Design Spec

Status: design only. No code changes in this document.
Author: Fable 5 (design pass)
Scope: online course checkout add-on + dashboard reorder flow + saved-card (CIM) + shipping-at-checkout.

## 0. Summary of the change

Today the photo ID / wallet card is a **post-certification** upsell that lives entirely in
`client/src/pages/OrderCertCard.tsx` (a 5-step wizard: confirm → shipping → method → payment →
done) and is charged through `POST /api/cert-cards` (`server/routes/certs.ts`). That flow collects
shipping, billing, and photo all at once, charge-first, and writes a `cert_card_orders` row.

The redesign splits that into three moves:

1. **Photo ID becomes an add-on at initial course checkout** (`client/src/pages/Checkout.tsx`) — an
   optional line item priced $9.99 + a shipping tier. The physical card is fulfilled by Alberto, not
   a carrier, so "shipping" here is a flat handling/mail tier, not live rates.
2. **Shipping address moves to course checkout** (collected once, with a short "why we collect this"
   note) and is **saved to the user profile**, so later card orders and re-purchases prefill it.
3. **The dashboard order flow is reordered** so step 1 is a **required** photo upload (you cannot
   proceed without it), step 2 is review + pay with prefilled saved billing/shipping, step 3 is
   confirmation. Group admins get a per-member photo-ID status view.

Cross-cutting: **Authorize.net Customer Profiles (CIM)** so a returning buyer (more seats, renewals,
a later card order) can charge a **saved tokenized card** without re-entering PAN/CVV. We never store
PANs; we store the CIM profile/payment-profile ids plus display-only metadata (last4, brand, expiry).

Product priority reminder (Onsite > Hands-on > Online): this feature lives in the online flow. Keep
the add-on visually secondary — a single opt-in row in the checkout summary, never a step that
blocks or competes with course enrollment.

Ship in 3 PR-sized chunks (see §6). Chunk boundaries are called out inline as **[Chunk N]**.

---

## 1. Checkout add-on UX (`client/src/pages/Checkout.tsx` + `POST /api/authorize-net/charge`)

### 1.1 Where it appears

Add one new opt-in block in the **order summary column** (the right `lg:col-span-1` `Card`, around
`Checkout.tsx:560`), directly under the line items and above the discount-code block. Rationale:
this is a secondary purchase, so it belongs in the summary rail, not as a new step in the left
payment column. It renders for every cart but is **collapsed to a single checkbox row by default**:

```
[ ] Add a Photo ID wallet card  —  $9.99 + shipping
```

Checking it expands an inline sub-panel:
- Shipping tier radio (Standard $4.99 / Expedited $9.99) reusing the existing
  `SHIPPING_RATES` values already in `server/constants.ts`.
- A one-line note: "Alberto mails your printed wallet card after you finish. Add the address below."
- (No photo upload here — see §1.3.)

### 1.2 Per-seat vs per-order quantity

**Per-seat, quantity-driven.** A team purchase has one cart line with `quantity = N`
(`buildOrder` in `server/routes/authorizeNet.ts:295` fans `quantity` into N enrollments). The add-on
must mirror that: the manager chooses **how many photo IDs** (0..N, default 0) with a small stepper,
because not every team member will want the physical card. Individual purchases are the N=1 case with
a plain checkbox.

Add-on math on the client (mirror server; server is source of truth):
- `cardUnit = 9.99`, `shipUnit = tier rate`.
- `photoIdCount` = 1 for individuals if checked, else the stepper value (0..seatCount) for teams.
- `addOnSubtotal = photoIdCount * (cardUnit + shipUnit)`.
- Add-on subtotal feeds the **existing** discounted-subtotal → 3% surcharge → total pipeline
  (`Checkout.tsx:189-193`). Do not surcharge it separately; fold it into `discountedSubtotal` before
  `surcharge` is computed so there is one 3% line, matching how course seats already work.

Note: discount codes today apply to course `totalPrice`. Decide explicitly that **discounts do NOT
apply to the photo-ID add-on** (it is a fixed fulfillment cost). Implement by computing the discount
on course subtotal only, then adding `addOnSubtotal` after discount, before surcharge. Call this out
in the summary so the math is legible.

### 1.3 Photo collection is deferred (critical for team purchases)

A manager buying for others **cannot** supply each member's photo at checkout. So **no photo upload
happens in `Checkout.tsx` at all** — even for individuals — to keep one consistent path. Instead:

- At checkout we only record **intent + count + shipping address + shipping tier**.
- Each purchased photo ID creates a **"photo needed"** obligation tied to the enrollment (and, once
  the member certifies, to their certification). The buyer (individual) or each member (team) uploads
  the photo later from the dashboard (§2), which is where the required-upload step now lives.
- For individuals we still nudge immediately: after order confirmation, route them to the dashboard
  photo-upload step with a toast "One more thing — add your photo so we can print your card."
- For teams, each member gets an email + a dashboard prompt once they are certified (see §5 and the
  status model in §2.3).

This cleanly resolves the "manager buys, member owns the photo" problem: payment and photo are
decoupled by design, not patched after the fact.

### 1.4 How it flows through `POST /api/authorize-net/charge`

Extend the existing charge payload (`Checkout.tsx:201` / handler `authorizeNet.ts:59`) rather than
adding a second endpoint — the card must be charged **once** for course + add-on together.

Add to the request body:
```jsonc
{
  // ...existing items, refundPolicyAccepted, isTeamPurchase, locale, isCardPayment, discountCode...
  "photoIdAddOn": {
    "count": 2,                       // 0..seatCount
    "shippingMethod": "standard",     // "standard" | "expedited"
    "shippingAddress": { name, address, city, state, zip, country }
  }
}
```

Server changes in `authorizeNet.ts`:
1. In `buildOrder`, after building course order items, if `photoIdAddOn.count > 0` add the add-on to
   `total` using `SHIPPING_RATES` and `cardPrice = 9.99` (server recomputes, never trusts client).
   Keep the add-on **out** of the discount base (§1.2).
2. After the single `createTransactionFromNonce` charge succeeds and the order is `paid`, create the
   `cert_card_orders` rows — but at checkout time the buyer may have **no certification yet** (they
   just enrolled). See §1.5 for the "pre-cert card order" shape.
3. Persist the shipping address to the buyer's user profile (§3).
4. Add `photoIdAddOn` detail to the `payment_completed` audit metadata.

### 1.5 Pre-certification card orders — the schema tension

`cert_card_orders.certificationId` is **NOT NULL** (`schema.ts:220`). At course checkout the
certification does not exist yet. Two options; the spec recommends **Option B**:

- **Option A (denormalize now):** loosen `certificationId` to nullable + add `enrollmentId` FK, so a
  card order can attach to an enrollment first and be linked to the cert when it is issued. Larger
  migration, touches the charge-first invariant in `certs.ts`.
- **Option B (entitlement record, recommended):** at checkout, do **not** create `cert_card_orders`
  rows. Instead record the **paid entitlement** as order-level metadata: a new
  `photo_id_entitlements` table keyed by `orderId` + `enrollmentId`, holding `count`, `shippingMethod`,
  `shippingAddress`, `status = 'awaiting_photo'`, and the split share of the charge. When a member
  later uploads their photo from the dashboard, we **consume one entitlement** and create the real
  `cert_card_orders` row (now with a valid `certificationId`), reusing the existing fulfillment
  columns. This keeps `cert_card_orders` meaning "a physical card we will print/mail" and keeps
  charge-first semantics: money already moved at checkout, the later step is fulfillment only (no
  second charge).

`photo_id_entitlements` sketch (**[Chunk 1]**):
```ts
export const photoIdEntitlements = pgTable("photo_id_entitlements", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  enrollmentId: integer("enrollment_id").references(() => enrollments.id), // null until claimed by a member
  purchasedByUserId: integer("purchased_by_user_id").notNull().references(() => users.id),
  shippingMethod: text("shipping_method", { enum: ["standard", "expedited"] }).notNull(),
  shippingAddress: jsonb("shipping_address").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),      // per-ID charged share incl. surcharge
  status: text("status", { enum: ["awaiting_photo", "fulfilled", "refunded"] }).notNull().default("awaiting_photo"),
  certCardOrderId: integer("cert_card_order_id").references(() => certCardOrders.id), // set on fulfillment
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

For an **individual** buyer the entitlement's `enrollmentId` is set immediately (single enrollment).
For a **team** buyer, N entitlements are created with `enrollmentId = null` and are claimed
first-come as members certify and upload (or the manager assigns them per member in §2.3).

### 1.5.1 New i18n keys (EN + ES)

Namespace `checkout.photoId.*`:
- `checkout.photoId.addTitle` — "Add a Photo ID wallet card" / "Agregar una tarjeta de identificacion con foto"
- `checkout.photoId.priceNote` — "$9.99 + shipping" / "$9.99 + envio"
- `checkout.photoId.mailNote` — "Alberto mails your printed wallet card after you finish. Add the address below." / "Alberto envia su tarjeta impresa cuando termine. Agregue la direccion abajo."
- `checkout.photoId.countLabel` — "How many photo IDs?" / "Cuantas tarjetas con foto?"
- `checkout.photoId.standard` / `.expedited` (reuse `orderCertCard.standardShipping` copy values)
- `checkout.photoId.photoLater` — "You will add each photo from your dashboard after checkout." / "Agregara cada foto desde su panel despues del pago."
- `checkout.photoId.lineItem` — "Photo ID wallet card (x{{count}})" / "Tarjeta de identificacion con foto (x{{count}})"

(No en-dashes in any string above — verified.)

---

## 2. Dashboard order flow redesign (`client/src/pages/OrderCertCard.tsx`)

Rename the page purpose from "order your wallet card" to "**Order a Photo ID**". Copy string
`orderCertCard.pageTitle` changes value (key stays). The stepper collapses from 5 steps to **3**:

| Old (`STEPS` at `OrderCertCard.tsx:120`) | New |
|---|---|
| Confirm, Shipping, Method, Payment, Done | **Photo, Review + Pay, Done** |

### 2.1 Step 1 — REQUIRED photo upload

- Reuse `processPhotoFile` (`OrderCertCard.tsx:35`) unchanged (480px downscale, JPEG, <90KB guard).
- The current upload UI (`OrderCertCard.tsx:427-461`) moves to step 1 and becomes **required**:
  `canProceed()` returns false on step 0 unless `idPhoto` is set. The Continue button stays disabled
  (existing `disabled={!canProceed()}` at line 712 already supports this).
- Add crop/preview guidance below the preview: a fixed **aspect box** (ID cards are landscape; guide
  to a head-and-shoulders framing) with helper copy. Full client-side cropping is optional polish; the
  MVP shows the 480px preview and a "center your face, plain background" hint. The existing preview
  `img` (`OrderCertCard.tsx:434`) already renders a square crop via `object-cover`.
- If the user arrives here from a **prepaid entitlement** (§1.5), there is **no payment step** — after
  a valid photo they land straight on a "photo received, card queued" confirmation and the entitlement
  flips `awaiting_photo → fulfilled` (creating the `cert_card_orders` row). Branch on an
  `entitlementId` route/query param.

### 2.2 Step 2 — Review + pay (prefilled)

- Only shown when there is **no prepaid entitlement** (i.e. a fresh dashboard purchase, individual or
  a manager buying more).
- Prefill shipping + billing from the saved user profile (§3) and the saved card (§4). If a saved
  card exists, default to "Pay with saved card ending {{last4}}" and hide the raw card fields behind a
  "Use a different card" toggle. If none, show the existing Accept.js fields (`OrderCertCard.tsx:574`).
- Billing "same as shipping" checkbox behavior is preserved (`OrderCertCard.tsx:527`), defaulting to
  the saved shipping address.
- Shipping-tier selection (old step 2) folds into this review screen as a compact radio, not its own
  step.

### 2.3 Group-admin team view

New section on the dashboard (component `client/src/components/dashboard/TeamPhotoIdStatus.tsx`) for
`role = group_admin`. It lists each **certified** member of the admin's groups with a photo-ID status
badge and a per-member action:

| Status | Meaning | Action |
|---|---|---|
| `not_ordered` | No entitlement, no card order | "Order Photo ID" (opens step-2 pay flow for that member) |
| `photo_needed` | Prepaid entitlement, `awaiting_photo` | "Remind member" (re-sends upload email) or "Upload on their behalf" |
| `ordered` | `cert_card_orders` row `paid`/`processing` | view only |
| `shipped` | `cert_card_orders.status = shipped` + tracking | show tracking |

Data source: join the admin's groups → `group_members` (`schema.ts:35`) → their `certifications` →
left join `photo_id_entitlements` and `cert_card_orders`. Add a read endpoint
`GET /api/groups/:id/photo-id-status` (group-admin-scoped, mirror the ownership check already used in
`certs.ts:53-62`). This is **[Chunk 2]**.

Manager "upload on their behalf" reuses step 1's uploader but posts to a member-scoped variant
(`POST /api/photo-id/:entitlementId/photo`) guarded by the same group-admin membership check.

### 2.4 New i18n keys

Namespace `orderCertCard.*` (extend existing) + `teamPhotoId.*`:
- `orderCertCard.stepPhoto` — "Photo" / "Foto"
- `orderCertCard.stepReview` — "Review and pay" / "Revisar y pagar"
- `orderCertCard.photoRequired` — "A photo is required to print your card." / "Se necesita una foto para imprimir su tarjeta."
- `orderCertCard.photoGuidance` — "Center your face. Use a plain background. Good light." / "Centre su cara. Use un fondo simple. Buena luz."
- `orderCertCard.prepaidTitle` — "Your card is already paid. Just add your photo." / "Su tarjeta ya esta pagada. Solo agregue su foto."
- `orderCertCard.savedCard` — "Pay with saved card ending {{last4}}" / "Pagar con la tarjeta guardada que termina en {{last4}}"
- `orderCertCard.useDifferentCard` — "Use a different card" / "Usar otra tarjeta"
- `teamPhotoId.title` — "Team photo IDs" / "Tarjetas con foto del equipo"
- `teamPhotoId.statusNotOrdered` / `.statusPhotoNeeded` / `.statusOrdered` / `.statusShipped`
- `teamPhotoId.orderFor` — "Order Photo ID" / "Ordenar tarjeta con foto"
- `teamPhotoId.remind` — "Remind member" / "Recordar al miembro"
- `teamPhotoId.uploadFor` — "Upload photo for them" / "Subir su foto"

---

## 3. Shipping address at course checkout

### 3.1 New form section in `Checkout.tsx`

Only rendered when the photo-ID add-on is checked (§1.1). Fields match `addressSchema` in
`certs.ts:180` (name, address, city, state, zip, country) plus the "why" note:

- `checkout.shipping.whyTitle` — "Where should we mail the wallet card?" / "A donde enviamos la tarjeta?"
- `checkout.shipping.whyNote` — "We collect this now so Alberto can mail your printed card as soon as it is ready." / "Pedimos esto ahora para que Alberto pueda enviar su tarjeta impresa apenas este lista."

For teams, one shipping address per order (all cards mailed together to the manager) is the MVP;
per-member addresses are out of scope for the first cut (call out in UI: "All cards ship to one
address; hand them out to your crew.").

### 3.2 Schema changes

Save shipping (and billing) to the **users** table so future purchases prefill without re-entry.
**[Chunk 1]** migration adds nullable columns to `users` (`schema.ts:8`):
```ts
savedShippingAddress: jsonb("saved_shipping_address"),   // { name, address, city, state, zip, country }
savedBillingAddress:  jsonb("saved_billing_address"),
```
Do **not** add address columns to `orders` — the address belongs to the person, and the
`photo_id_entitlements` row already snapshots the address that was used for that specific order (so a
later profile edit does not rewrite historical fulfillment addresses).

### 3.3 Prefill rules

- On any later card purchase (dashboard step 2, or a second checkout), prefill
  `shipping`/`billing` state from `users.savedShippingAddress` / `savedBillingAddress`.
- Prefill is a **default, not a lock** — the user can edit; on submit, update the saved profile copy
  (last-write-wins) while the entitlement/card-order snapshots the address actually used.
- If saved address is null (first-ever purchase), fields render empty.

---

## 4. CIM saved-card design (`server/authorizeNetClient.ts`)

### 4.1 Which Authorize.net APIs

Use **`createCustomerProfileFromTransactionRequest`** after the **first approved charge**, not
`createCustomerProfile` upfront. Rationale: our client already produces an Accept.js nonce and we
already call `createTransactionFromNonce` (`authorizeNetClient.ts:69`). Creating the profile *from the
successful transaction id* means we never handle card data a second time and we only persist a token
for cards that actually cleared. Flow:

1. `createTransactionFromNonce(...)` → approved, returns `transactionId` (existing).
2. If the buyer opted into "save this card" (new checkbox), call
   `createCustomerProfileFromTransactionRequest({ transId })`. Authorize.net returns
   `customerProfileId` + `customerPaymentProfileId`.
3. Fetch display metadata via the transaction response we already get (last4, card type) or
   `getCustomerPaymentProfileRequest` — store display-only fields.
4. Subsequent charges call **`createCustomerProfileTransactionRequest`** (a.k.a.
   `profileTransAuthCapture`) with `customerProfileId` + `customerPaymentProfileId` + amount. No nonce,
   no Accept.js round-trip.

New functions to add to `server/authorizeNetClient.ts` (**[Chunk 3]**), same fetch/JSON style as the
existing module, same `getApiUrl()` sandbox/production switch, same `merchantAuthentication` from the
existing `AUTHORIZE_*` env vars:
```ts
export async function createCustomerProfileFromTransaction(transactionId: string):
  Promise<{ success: boolean; customerProfileId?: string; customerPaymentProfileId?: string; errorMessage?: string }>;

export async function chargeSavedCard(
  customerProfileId: string,
  customerPaymentProfileId: string,
  amount: number,
  orderId: number,
  orderNumber: string,
): Promise<TransactionResult>;   // reuse existing TransactionResult

export async function getSavedCardMeta(customerProfileId: string, customerPaymentProfileId: string):
  Promise<{ last4?: string; cardType?: string; expiry?: string }>;
```

### 4.2 What we store (and never store)

New nullable columns on **users** (**[Chunk 3]** migration; keep CIM out of Chunk 1 so the address
work can ship first):
```ts
anetCustomerProfileId: text("anet_customer_profile_id"),
anetPaymentProfileId:  text("anet_payment_profile_id"),
savedCardLast4:  text("saved_card_last4"),     // display only, e.g. "4242"
savedCardBrand:  text("saved_card_brand"),     // "Visa", "Mastercard"
savedCardExpiry: text("saved_card_expiry"),    // "MM/YY", display only
```
NEVER store: PAN, CVV, full expiry beyond MM/YY display, or the Accept.js nonce (single-use anyway).
These are tokens + non-sensitive display metadata only. PCI scope stays SAQ-A / SAQ-A-EP exactly as
documented in `authorizeNetClient.ts:8-10` — card entry still happens via Accept.js; CIM stores
Authorize.net's own token, not card data.

### 4.3 Charge-saved-card endpoint

Extend `POST /api/authorize-net/charge` (`authorizeNet.ts:59`) to accept
`{ useSavedCard: true }` with **no** `paymentNonce`. When set and the user has
`anetCustomerProfileId`, branch to `chargeSavedCard(...)` instead of `createTransactionFromNonce(...)`.
Everything downstream (payment row, `updateOrderStatus`, `postPaymentProcessing`, split, emails) is
unchanged — only the "how we got the approval" differs. The dashboard card flow (`certs.ts` /
`OrderCertCard.tsx`) gets the same branch: if a saved card exists and the buyer picks it, call
`chargeSavedCard` instead of collecting a nonce.

Add a "**Save this card for faster checkout next time**" checkbox (default unchecked, individual
users only — not for team managers' shared cards unless they opt in) below the card fields in both
`Checkout.tsx` and `OrderCertCard.tsx`.

### 4.4 Sandbox vs production credential story

No credential changes (gated). CIM uses the **same** `AUTHORIZE_API_LOGIN_ID` /
`AUTHORIZE_TRANSACTION_KEY` / `AUTHORIZE_CLIENT_KEY` / `AUTHORIZE_ENVIRONMENT` already read at
`authorizeNetClient.ts:19-22`, and the same `getApiUrl()` switch (apitest vs api host). Sandbox
profiles are created against `apitest.authorize.net` and are isolated from production — a profile id
created in sandbox will not resolve in production, so `anetCustomerProfileId` values are
environment-scoped. Because staging runs sandbox and production runs live, a user who saved a card on
staging will simply see "no saved card" on production; no cross-environment leakage. No new env vars.

---

## 5. Edge cases

1. **Manager orders for a member who has no photo yet.** Handled by design (§1.3, §1.5): payment
   creates an `awaiting_photo` entitlement; the card row is created only when the photo arrives. The
   manager sees `photo_needed` in the team view (§2.3) until then.
2. **Member uploads their own photo after the manager paid.** Member's dashboard shows a "Your
   manager purchased a photo ID for you — add your photo" prompt (email + banner). Uploading consumes
   the oldest unclaimed entitlement for that group/order, sets `enrollmentId`, flips it to
   `fulfilled`, and creates the `cert_card_orders` row. No charge (already paid at checkout).
3. **Refund of a card add-on inside a larger course order.** The single charge covered course + N
   photo IDs. To refund just the add-on, call the existing `refundTransaction`
   (`authorizeNetClient.ts:183`) for the **add-on portion only** (`count * (9.99 + ship) * 1.03`),
   referencing the order's `providerTransactionId`. Authorize.net supports partial refunds against a
   settled transaction. Mark affected `photo_id_entitlements` → `refunded` and, if already fulfilled,
   set the `cert_card_orders.status = refunded` + `refundedAt`. The course enrollment is untouched.
   This must be an **admin action** (extend the admin refund endpoint `authorizeNet.ts:208`, which is
   already `isAdminRole`-gated, with an optional `amount`/`scope: "addon"` param). Never let a
   partial add-on refund flip the whole order to `refunded`.
4. **Address change between checkout and fulfillment.** The address is snapshotted on the entitlement
   (and copied to `cert_card_orders.shippingAddress` at fulfillment), so editing the saved profile
   address later does not silently reroute an in-flight card. Provide an admin/dashboard "update
   shipping address" action on any `cert_card_orders` row still in `paid`/`processing` (not yet
   `shipped`) that writes the new address to that row only.
5. **Expired saved card.** `chargeSavedCard` will decline (Authorize.net response code 2). Catch the
   decline in the charge handler, clear the stale `saved_card_*` display fields is optional; at
   minimum surface "Your saved card was declined. Please enter a card." and fall back to the Accept.js
   fields in the same screen. Also proactively compare `savedCardExpiry` to today on render and, if
   past, hide the "pay with saved card" default and prompt for a fresh card (which can re-save).

---

## 6. Migration / rollout

### Chunk boundaries

- **[Chunk 1] Shipping-at-checkout + entitlements (no CIM).**
  - Migrations: `users.savedShippingAddress`, `users.savedBillingAddress`; new
    `photo_id_entitlements` table.
  - `Checkout.tsx`: add-on block, shipping section, count stepper; extend charge payload.
  - `authorizeNet.ts`: server-recompute add-on into order total, create entitlements, save profile
    address.
  - Ships value immediately: buyers can add a photo ID at checkout; individuals get prompted to
    upload.
- **[Chunk 2] Dashboard reorder + fulfillment + team view.**
  - `OrderCertCard.tsx`: 3-step flow, required photo step, prepaid-entitlement branch.
  - Fulfillment path: upload consumes entitlement → creates `cert_card_orders` (valid
    `certificationId`).
  - `TeamPhotoIdStatus.tsx` + `GET /api/groups/:id/photo-id-status` +
    `POST /api/photo-id/:entitlementId/photo`.
- **[Chunk 3] CIM saved cards.**
  - Migrations: `users.anet*` + `saved_card_*` columns.
  - `authorizeNetClient.ts`: `createCustomerProfileFromTransaction`, `chargeSavedCard`,
    `getSavedCardMeta`.
  - "Save this card" checkbox + "pay with saved card" branch in both checkout and dashboard flows;
    partial add-on refund support in the admin refund endpoint.

### Existing `cert_card_orders` rows

No backfill required. Legacy rows keep their `certificationId`, `shippingAddress`, `billingAddress`,
`idPhoto`, `providerTransactionId`, `chargeMetadata` exactly as-is. The new `photo_id_entitlements`
table is additive; old rows simply have no matching entitlement (`certCardOrderId` null on the
entitlement side means "created the old way"). The current `POST /api/cert-cards` handler
(`certs.ts:200`) can remain functional during rollout as the "no prepaid entitlement, pay now" path
in the dashboard — the redesign reuses it for §2.2 rather than deleting it.

### Feature-flag approach

Gate the checkout add-on and the CIM save-card checkbox behind a `platform_settings` flag
(`platformSettings` table, same pattern as `profit_split` read at `authorizeNet.ts:355`), e.g.
`photo_id_addon_enabled` and `saved_cards_enabled`. This lets the add-on ship dark, be QA'd on
staging (sandbox), and be toggled without a deploy. Default both **off** until QA sign-off. The
dashboard reorder (Chunk 2) can ship unflagged since it only reshapes an existing page.

### What ships first

Chunk 1 first (address capture + entitlements is the foundation everything else consumes), then
Chunk 2 (fulfillment + team view — the part Alberto and managers actually operate), then Chunk 3
(CIM — a convenience layer that assumes the charge paths from Chunks 1-2 exist).

---

## 7. Out of scope (not specified here)

- Certificate issuance / license-card logic — untouched (hard rule).
- ForkliftCertified anything.
- Real fulfillment / shipping-carrier integration (tracking numbers are entered manually by Alberto;
  `cert_card_orders.trackingNumber` / `carrier` already exist for that).
- Per-member distinct shipping addresses for a single team order (MVP ships all cards to one address).
- Volume/automated discounts on the add-on (fixed cost; §1.2).

---

## Appendix A — Files touched (reference)

| File | Role in redesign |
|---|---|
| `client/src/pages/Checkout.tsx` | Add-on block, shipping section, count stepper, save-card checkbox |
| `client/src/pages/OrderCertCard.tsx` | 3-step reorder, required photo step, saved-card / prepaid branch |
| `client/src/components/dashboard/TeamPhotoIdStatus.tsx` | New — group-admin per-member status view |
| `server/routes/authorizeNet.ts` | Add-on in `buildOrder`, entitlements, saved-card branch, partial refund |
| `server/routes/certs.ts` | Reused as dashboard pay-now path; fulfillment (consume entitlement → cert_card_orders) |
| `server/authorizeNetClient.ts` | New CIM functions; existing charge/refund reused |
| `shared/schema.ts` | `photo_id_entitlements`; `users.saved*` + `users.anet*` columns |
| `server/constants.ts` | `SHIPPING_RATES` reused as-is |

## Appendix B — i18n key checklist (EN + ES both required, no en-dashes)

`checkout.photoId.addTitle`, `.priceNote`, `.mailNote`, `.countLabel`, `.standard`, `.expedited`,
`.photoLater`, `.lineItem`; `checkout.shipping.whyTitle`, `.whyNote`;
`orderCertCard.stepPhoto`, `.stepReview`, `.photoRequired`, `.photoGuidance`, `.prepaidTitle`,
`.savedCard`, `.useDifferentCard`; `teamPhotoId.title`, `.statusNotOrdered`, `.statusPhotoNeeded`,
`.statusOrdered`, `.statusShipped`, `.orderFor`, `.remind`, `.uploadFor`;
`checkout.saveCard` ("Save this card for faster checkout next time" / "Guardar esta tarjeta para pagar mas rapido la proxima vez").
