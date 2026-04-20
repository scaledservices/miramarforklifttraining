# ForkliftCertified — Deployment & Custom Domain Guide

## Deployment Architecture

| Component | Technology |
|-----------|-----------|
| Platform | Replit Autoscale |
| Build | `npm run build` (Vite client + esbuild server → `dist/`) |
| Run | `node ./dist/index.cjs` |
| Database | PostgreSQL (Replit managed) |
| Port | 5000 (mapped to 80 externally) |

---

## Environment Variables Checklist

### Required (Fatal if missing in production)

| Variable | Source | Notes |
|----------|--------|-------|
| `DATABASE_URL` | Auto (Replit) | Managed automatically by Replit PostgreSQL |
| `SESSION_SECRET` | Replit Secrets | Session cookie signing. Must be a strong random string. |
| `TOKEN_HMAC_SECRET` | Replit Secrets | HMAC signing for password reset tokens. Must be a strong random string. |
| `RESEND_API_KEY` | Replit Secrets | Email delivery via Resend. Without it, emails log to outbox only. |

### Required for Production URLs

| Variable | Environment | Value |
|----------|-------------|-------|
| `SITE_URL` | Production | `https://forkliftcertified.training` |
| `CERTIFICATE_BASE_URL` | Production | `https://forkliftcertified.training` |

### Must NOT Be Set in Production

| Variable | Reason |
|----------|--------|
| `DEMO_MODE` | Bypasses payment processing. Server crashes on startup if `true` in production. |
| `VITE_DEMO_MODE` | Frontend companion to DEMO_MODE. |

### Optional

| Variable | Default | Purpose |
|----------|---------|---------|
| `ADMIN_EMAIL` | `admin@forkliftcertified.training` | Admin notification recipient |
| `OPENCLAW_GATEWAY_URL` | — | AI assistant gateway |
| `OPENCLAW_GATEWAY_KEY` | — | AI assistant API key |
| `OPENCLAW_GATEWAY_TOKEN` | — | AI assistant auth token |
| `GOOGLE_CLIENT_ID` | — | Google OAuth (buttons hidden if absent) |
| `GOOGLE_CLIENT_SECRET` | — | Google OAuth |
| `LINKEDIN_CLIENT_ID` | — | LinkedIn OAuth (buttons hidden if absent) |
| `LINKEDIN_CLIENT_SECRET` | — | LinkedIn OAuth |
| `FACEBOOK_APP_ID` | — | Facebook OAuth (buttons hidden if absent) |
| `FACEBOOK_APP_SECRET` | — | Facebook OAuth |

### Auto-Managed (Do Not Set Manually)

| Variable | Source |
|----------|--------|
| `REPLIT_DOMAINS` | Replit runtime |
| `REPLIT_DEV_DOMAIN` | Replit runtime |
| `REPL_ID` | Replit runtime |
| `DATABASE_URL` | Replit PostgreSQL |
| `PG*` vars | Replit PostgreSQL |

---

## Custom Domain Setup: forkliftcertified.training

### Step 1: Verify Domain Ownership

Ensure you own `forkliftcertified.training` and have access to DNS management at your registrar.

### Step 2: DNS Configuration

Create the following DNS record at your domain registrar:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | `@` or root | `<your-repl-slug>.replit.app` | 300 (5 min) |

If your registrar doesn't support CNAME at root (apex domain), use one of these alternatives:
- **ALIAS/ANAME record** (if supported by your registrar): Point to `<your-repl-slug>.replit.app`
- Check the Replit Deployments → Custom Domain panel for registrar-specific instructions

For `www` subdomain redirect:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | `www` | `<your-repl-slug>.replit.app` | 300 |

### Step 3: Attach Domain in Replit

1. Open Replit project → Deployments tab
2. Click "Custom Domain"
3. Enter `forkliftcertified.training`
4. Replit will verify DNS and automatically provision SSL/TLS (Let's Encrypt)
5. SSL provisioning takes 1-5 minutes after DNS propagation

### Step 4: Verify

- Visit `https://forkliftcertified.training` — should load the app with valid SSL
- Check certificate: should show Let's Encrypt issuer
- Verify `SITE_URL` env var matches: `https://forkliftcertified.training`

---

## OAuth Callback URLs

Once deployed, register these callback URLs in each OAuth provider console:

### Using custom domain (forkliftcertified.training)

| Provider | Callback URL |
|----------|-------------|
| Google | `https://forkliftcertified.training/api/auth/google/callback` |
| LinkedIn | `https://forkliftcertified.training/api/auth/linkedin/callback` |
| Facebook | `https://forkliftcertified.training/api/auth/facebook/callback` |

### Using .replit.app domain (fallback)

| Provider | Callback URL |
|----------|-------------|
| Google | `https://<your-slug>.replit.app/api/auth/google/callback` |
| LinkedIn | `https://<your-slug>.replit.app/api/auth/linkedin/callback` |
| Facebook | `https://<your-slug>.replit.app/api/auth/facebook/callback` |

Google also requires an **Authorized JavaScript Origin**:
- `https://forkliftcertified.training`
- `https://<your-slug>.replit.app` (if using .replit.app)

---

## Pre-Launch Checklist (Private → Public)

### Before First Deploy

- [ ] `SESSION_SECRET` is set in Replit Secrets
- [ ] `TOKEN_HMAC_SECRET` is set in Replit Secrets
- [ ] `RESEND_API_KEY` is set in Replit Secrets
- [ ] `DEMO_MODE` is NOT set in production env (dev-only)
- [ ] `SITE_URL` is set in production env
- [ ] `CERTIFICATE_BASE_URL` is set in production env
- [ ] Build succeeds: `npm run build` completes without errors
- [ ] Super admin account exists with production credentials

### Deploy (Private)

1. Open your Replit project
2. Click the **Publish** button (top right of the editor)
3. Deployment builds and starts automatically
4. Verify at `.replit.app` URL — site loads, login works
5. By default, the deployment is accessible via the `.replit.app` URL

### Switch from Private to Public

To control who can access your deployed app:

1. Go to your Replit project → **Deployments** tab (left sidebar)
2. Under deployment settings, find the **Visibility** or **Access** control
3. While in pre-launch: keep the deployment on your `.replit.app` URL for internal testing
4. When ready to go public: attach the custom domain (see below) and share the production URL
5. The `.replit.app` URL remains accessible as a fallback regardless of custom domain status

### Attach Custom Domain

1. Set DNS records (see above)
2. Wait for DNS propagation (5-30 min, check with `dig forkliftcertified.training`)
3. Attach domain in Replit Deployments → Custom Domain
4. Wait for SSL provisioning (1-5 min)
5. Verify `https://forkliftcertified.training` loads correctly

### Go Public

1. Verify all pages load correctly on the custom domain
2. Test critical flows: registration, login, checkout, course completion
3. Verify emails are sending (check Resend dashboard)
4. Verify SEO: check `https://forkliftcertified.training/robots.txt` and `/sitemap.xml`
5. Set up OAuth providers with production callback URLs (if using social login)
6. Update Google Search Console with the production domain
7. Submit sitemap to Google: `https://forkliftcertified.training/sitemap.xml`

### Post-Launch Verification

- [ ] Homepage loads with correct branding and SSL
- [ ] `/robots.txt` returns valid content with correct sitemap URL
- [ ] `/sitemap.xml` returns valid XML with correct domain
- [ ] Login/register works
- [ ] Stripe checkout processes test payment
- [ ] Certificate PDF generates with correct QR code URL
- [ ] Emails contain correct links (not dev URLs)
- [ ] Admin dashboard accessible to super admin
- [ ] SEO landing pages render with correct canonical URLs

---

## Rollback Procedure

If a deployment causes issues:

1. **Quick fix**: Replit maintains deployment history — redeploy a previous version from the Deployments tab
2. **Code rollback**: Use Replit checkpoints to revert to a known-good state
3. **Database**: Migrations are forward-only. Write a compensating migration if needed.

---

## Monitoring

- **Application logs**: Replit Deployments → Logs tab
- **Email delivery**: Resend dashboard + `email_outbox` database table
- **Stripe payments**: Stripe dashboard
- **Database**: Direct SQL access via Replit's database tab

---

## Fallback URL Strategy

| Priority | URL | Status |
|----------|-----|--------|
| Primary | `https://forkliftcertified.training` | Custom domain (production) |
| Fallback | `https://<slug>.replit.app` | Always available |

If the custom domain has issues (DNS, SSL), the `.replit.app` URL continues to work as a fallback. No code changes needed — the app dynamically resolves its domain from `REPLIT_DOMAINS`.
