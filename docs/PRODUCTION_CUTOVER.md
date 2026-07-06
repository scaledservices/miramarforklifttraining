# Production Cutover Checklist

Everything staging taught us, in run order. Target: replace WordPress/WooCommerce at `training.miramarforklift.com` with this app on Railway.

Staging reference: Railway project `splendid-caring`, environment `staging`, service `exquisite-perception` (exquisite-perception-staging-725a.up.railway.app).

## 1. Railway environment + infrastructure

- [ ] Create/confirm the **production** Railway environment with its own PostgreSQL database (never share the staging DB).
- [ ] Run Drizzle migrations against the production DB (`npm run db:push` or the migration flow used on staging) **before** first boot.
- [ ] **Session table**: `connect-pg-simple` is configured with `createTableIfMissing: true` (`server/routes/index.ts`), so the `session` table is auto-created on first boot — but the DB user must have CREATE TABLE rights. Verify the table exists after first deploy; logins fail without it (this bit us on staging).
- [ ] **Trust proxy**: `app.set("trust proxy", 1)` must stay (`server/routes/index.ts:29`). Behind Railway's proxy, express-session refuses to set Secure cookies without it and **all logins break**. Do not remove.
- [ ] `NODE_ENV=production` — this flips `cookie.secure: true` and makes `SESSION_SECRET` mandatory (server exits without it).

## 2. Environment variables (production values)

### Must set (server exits or breaks without these)
| Var | Production value / note |
|---|---|
| `DATABASE_URL` | Production Postgres (Railway plugin) |
| `SESSION_SECRET` | New long random value — do NOT reuse staging's. Fatal if missing in production. |
| `NODE_ENV` | `production` |
| `SITE_URL` | `https://training.miramarforklift.com` (used in emails, sitemap, canonical URLs) |

### Payments — Authorize.net (⚠️ real money)
| Var | Production value / note |
|---|---|
| `AUTHORIZE_ENVIRONMENT` | `production` (staging runs `sandbox`) |
| `AUTHORIZE_API_LOGIN_ID` | LIVE merchant login ID |
| `AUTHORIZE_TRANSACTION_KEY` | LIVE transaction key |
| `AUTHORIZE_CLIENT_KEY` | LIVE public client key (Accept.js) |

Accept.js host selection is driven by `/api/payment/config` → `environment`; the browser loads `jstest.authorize.net` for sandbox and `js.authorize.net` for production automatically (`Checkout.tsx`, `CardPaymentSection.tsx`, `OrderCertCard.tsx`). No code change needed at cutover — just the env vars. (Historical bug: `OrderCertCard.tsx` hardcoded the production host; fixed on `feat/ui-ux-overhaul`.)

Staging lessons already baked into code — do not regress:
- Accept.js tokenization retries on flaky `E_WC_14` init errors.
- Tokenize only after the Accept.js script has actually loaded.
- `invoiceNumber` (not `orderId`) in the Authorize.net order element.
- Card surcharge excluded from balance math.

### Email — Resend
| Var | Production value / note |
|---|---|
| `RESEND_API_KEY` | Production key, sending domain verified for miramarforklift.com |
| `EMAIL_OVERRIDE` | **REMOVE / leave unset in production.** On staging it redirects all mail to peter+miramar@scaled.services. If set in production, customers get no email. |
| `ADMIN_EMAIL` | Real operations inbox for admin notifications |

### Other
| Var | Production value / note |
|---|---|
| `TOKEN_HMAC_SECRET` | New random value (signs pay-link/cert tokens) — don't reuse staging |
| `DEMO_MODE` | Unset / `false` |
| `JOB_SCHEDULER_ENABLED` | `true` if scheduled jobs (e.g. balance reminders) should run; ensure only ONE service instance runs jobs |
| `CERTIFICATE_BASE_URL` | Production URL for cert verification links |
| `PDF_STORAGE_MODE` | Same mode as staging unless storage differs |
| `GOOGLE_CLIENT_ID/SECRET`, `FACEBOOK_APP_ID/SECRET`, `LINKEDIN_CLIENT_ID/SECRET` | Only if social login is enabled; OAuth redirect URIs must list the production domain |
| `VITE_SITE_URL` | `https://training.miramarforklift.com` (build-time, client) |
| `VITE_GA_MEASUREMENT_ID` | Production GA4 property (build-time, client) |
| `VITE_DEMO_MODE` | Unset / `false` (build-time, client) |

Note: `VITE_*` vars are baked in at **build time** — set them in Railway before the production build, not after.

Replit leftovers (`REPLIT_*`, `REPL_IDENTITY`, `WEB_REPL_RENEWAL`, `OPENCLAW_*`) are legacy — leave unset.

## 3. Domain + DNS

- [ ] Add `training.miramarforklift.com` as a custom domain on the production Railway service; add the CNAME at the DNS host.
- [ ] TLS cert issued and green before switching any links.
- [ ] Verify canonical URLs / sitemap / hreflang / JSON-LD all emit the production domain (driven by `SITE_URL` + `VITE_SITE_URL`).
- [ ] Keep miramarforklift.com (WordPress) untouched — separate site, out of scope.

## 4. Data + accounts

- [ ] Create the real admin accounts (Alberto = admin role, Peter = super-admin). No test users.
- [ ] Seed real service areas + availability rules (San Diego, Las Vegas, Fresno). The staging test area (San Diego / ZIP 92101 fixtures) is staging-only.
- [ ] Real course/pricing data verified against current WooCommerce prices.
- [ ] Do NOT import the old customer database (explicit scope boundary).

## 5. Pre-flight smoke tests (production, before announcing)

- [ ] Login/logout works (proves session table + trust proxy + secure cookies).
- [ ] `/api/payment/config` returns `environment: "production"` and the page loads `js.authorize.net` (check Network tab).
- [ ] One **real card, small amount** end-to-end booking with 50% deposit — then refund it via admin refunds. (Only person authorized to run a real payment should do this.)
- [ ] Booking confirmation + receipt emails arrive at a real external address (proves EMAIL_OVERRIDE is gone and Resend domain is verified).
- [ ] Pay-balance link from the email works.
- [ ] Certificate verification page loads a real cert URL.
- [ ] ES language toggle works on key pages.

## 6. Cutover + rollback

- [ ] Point `training.miramarforklift.com` DNS at Railway during a low-traffic window.
- [ ] Keep WooCommerce checkout disabled/redirected only after smoke tests pass.
- [ ] Rollback plan: DNS back to the old target; Railway keeps previous deploys — `railway redeploy` the prior build if the app itself is bad.
- [ ] Watch Railway logs + Authorize.net dashboard for the first day.
