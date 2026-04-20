# Configuration Guide — ForkliftCertified Platform

This guide documents the centralized configuration system introduced to make the codebase reusable across training platforms. All brand-specific, industry-specific, and visual theme values are extracted into three config files under `shared/config/`.

---

## Config Files Overview

| File | Purpose | Import Path |
|------|---------|-------------|
| `shared/config/brand.ts` | Site identity, contact info, logo paths, emails | `@shared/config/brand` |
| `shared/config/industry.ts` | Regulatory references, equipment types, certification types | `@shared/config/industry` |
| `shared/config/theme.ts` | Color palette for CSS, emails, and PDFs | `@shared/config/theme` |

All config files export `as const` typed objects for full TypeScript inference.

---

## brand.ts — Site Identity

### Core Identity

| Key | Current Value | Used In |
|-----|--------------|---------|
| `brand.name` | `"ForkliftCertified"` | SEO titles, email subjects, footer, login/register pages, structured data |
| `brand.legalEntity` | `"ForkliftCertified Training"` | Invoice PDF footer |
| `brand.domain` | `"forkliftcertified.training"` | Email fallback URLs, legal pages, invoice PDF, SEO canonical |
| `brand.tagline` | `"Professional Forklift Certification Training"` | Email header |
| `brand.description` | OSHA-aligned description | Structured data (schema.org Organization) |

### Support Contact

| Key | Current Value | Used In |
|-----|--------------|---------|
| `brand.support.email` | `"support@forkliftcertified.training"` | Email templates, legal pages, booking cancellation text |
| `brand.support.infoEmail` | `"info@forkliftcertified.training"` | Footer, support page, contact forms |
| `brand.support.phone` | `"(858) 401-0700"` | Footer, support page |
| `brand.support.phoneTel` | `"+18584010700"` | `tel:` links in footer and support page |
| `brand.support.phoneE164` | `"+1-858-401-0700"` | Structured data (schema.org ContactPoint) |

### Email Sending

| Key | Current Value | Used In |
|-----|--------------|---------|
| `brand.emails.noreply` | `"noreply@forkliftcertified.training"` | Resend "from" address |
| `brand.emails.fromName` | `"ForkliftCertified"` | Resend "from" display name |
| `brand.emails.from` | Computed: `"ForkliftCertified <noreply@...>"` | `FROM_EMAIL` in email.ts |

### Logo Paths

| Key | Current Value | Used In |
|-----|--------------|---------|
| `brand.logo.navbar` | `/images/forkliftcertified-navbar-56h.png` | Logo component (navbar variant) |
| `brand.logo.mark` | `/images/forkliftcertified-navbar-44h.png` | Logo component (mark variant) |
| `brand.logo.full` | `/images/forkliftcertified-logo-transparent.png` | Logo component (full variant, light theme), email header |
| `brand.logo.fullDark` | `/images/forkliftcertified-logo-darkbg.png` | Logo component (full variant, dark theme) |
| `brand.logo.favicon` | `/favicon.png` | Structured data logo URL |
| `brand.logo.serverFile` | `forkliftcertified-logo-transparent.png` | PDF generators (resolved from filesystem) |

### Other

| Key | Purpose |
|-----|---------|
| `brand.og.defaultImage` | Default Open Graph image path |
| `brand.social.*` | Social media profile URLs (for schema.org `sameAs`) |
| `brand.locations[]` | Training facility locations (name + slug) |
| `brand.prefixes.orderNumber` | Order number prefix (e.g., "FC") |
| `brand.prefixes.invoiceNumber` | Invoice number prefix (e.g., "INV") |

---

## industry.ts — Regulatory & Equipment

### Regulatory References

| Key | Current Value | Used In |
|-----|--------------|---------|
| `industry.regulatory.body` | `"OSHA"` | Content references |
| `industry.regulatory.standard` | `"29 CFR 1910.178"` | Certificate PDF, compliance pages, FAQs |
| `industry.regulatory.complianceText` | `"in accordance with OSHA Standard 29 CFR 1910.178"` | Certificate PDF compliance line |
| `industry.regulatory.certificationValidity` | `"3 years"` | FAQ and content references |
| `industry.regulatory.alignmentLabel` | `"OSHA-aligned"` | Marketing copy |

### Equipment & Certification Types

| Key | Purpose |
|-----|---------|
| `industry.equipmentClasses[]` | OSHA forklift classes 1-7 with names |
| `industry.equipmentTypes[]` | Specific equipment (sit-down, reach truck, etc.) |
| `industry.certificationTypes[]` | Online, hands-on, train-the-trainer, bundle |
| `industry.trainingTopics[]` | OSHA-required formal instruction topics |

---

## theme.ts — Visual Identity

### Brand Colors

| Key | Hex | Used In |
|-----|-----|---------|
| `theme.colors.primary.hex` | `#0A3D66` | Email header bg, PDF borders/titles, CSS var fallback |
| `theme.colors.primary.hsl` | `207 82% 22%` | CSS custom property `--primary` (light mode) |
| `theme.colors.accent.hex` | `#F97316` | Email CTA buttons, PDF accent borders |
| `theme.colors.accent.hsl` | `25 95% 53%` | CSS custom property `--accent` (light mode) |

### Email Theme

| Key | Purpose |
|-----|---------|
| `theme.email.headerBg` | Email header background color |
| `theme.email.headerText` | Email header text color |
| `theme.email.footerBg` | Email footer background |
| `theme.email.footerBorder` | Email footer top border |
| `theme.email.linkColor` | Email link/CTA color |
| `theme.email.bodyFont` | Email body font stack |

### PDF Theme

| Key | Purpose |
|-----|---------|
| `theme.pdf.borderPrimary` | Certificate outer border color |
| `theme.pdf.borderAccent` | Certificate inner border / accent lines |
| `theme.pdf.titleColor` | Certificate/invoice heading color |
| `theme.pdf.tableHeaderBg` | Invoice table header background |
| `theme.pdf.footerText` | Invoice footer text color |

---

## Cloning for a New Platform

To adapt this codebase for a new training platform (e.g., crane certification):

### Step 1: Update brand.ts

```typescript
export const brand = {
  name: "CraneCertified",
  domain: "cranecertified.training",
  tagline: "Professional Crane Operator Certification",
  support: {
    email: "support@cranecertified.training",
    // ... update all contact info
  },
  logo: {
    // ... update all logo paths
  },
  // ... etc
};
```

### Step 2: Update industry.ts

```typescript
export const industry = {
  name: "Crane Certification",
  equipmentType: "Crane",
  regulatory: {
    body: "OSHA",
    standard: "29 CFR 1926.1427",
    // ... update regulatory references
  },
  // ... etc
};
```

### Step 3: Update theme.ts (if rebranding colors)

Update the color values to match the new brand palette. The `theme.cssVars` section contains HSL values that must be synced with `client/src/index.css` CSS custom properties (`--primary`, `--accent`, and derived sidebar/ring values).

### Step 4: Sync CSS Variables

Update `client/src/index.css` to match the new `theme.cssVars` values:
- `--primary: <new primary HSL>`
- `--accent: <new accent HSL>`
- Also update derived variables: `--sidebar-primary`, `--sidebar-ring`, `--ring`

### Step 5: Replace Assets

- Replace logo image files in `client/public/images/`
- Update `brand.logo.serverFile` if the filename changes
- Replace hero images and OG image

### Step 6: Update Content Files

The following content files contain industry-specific text that may need manual updates:
- `client/src/data/catalog.ts` — Product listings and descriptions
- `client/src/data/blog.ts` — Blog post content
- `client/src/data/faq.ts` — FAQ answers (OSHA references, validity periods)
- `client/src/pages/OshaCompliance.tsx` — Compliance details
- `client/src/pages/LocationPage.tsx` — Location descriptions
- `client/src/locales/en/common.json` — i18n locale strings (JSON, no template literal support)
- `server/seo-ssr.ts` — SSR SEO content templates
- `server/assistant.ts` — AI chatbot knowledge base and responses

### Step 7: Update Environment Variables

- Set `SITE_URL` to the new domain
- Set `CERTIFICATE_BASE_URL` to the new domain
- Update `ADMIN_EMAIL` to the new admin address
- Update DNS and OAuth callback URLs

---

## Files Consuming Config

### Server-side
- `server/email.ts` — Brand name, logos, support email, colors (via `brand` + `theme`)
- `server/certificate-pdf.ts` — Logo paths, colors, compliance text (via `brand` + `theme` + `industry`)
- `server/invoice-pdf.ts` — Logo paths, brand name, colors (via `brand` + `theme`)
- `server/seo-ssr.ts` — Site name, domain, OG image (via `brand`)
- `server/seo.ts` — Domain for sitemap/robots (via `brand`)

### Client-side
- `client/src/components/ui/Logo.tsx` — Logo paths, alt text
- `client/src/components/seo/SEOHead.tsx` — Site name, domain, OG image
- `client/src/components/seo/StructuredData.tsx` — Organization schema, contact info
- `client/src/components/seo/SeoBodySections.tsx` — Brand name in comparison table
- `client/src/components/layout/Footer.tsx` — Contact info, copyright
- `client/src/App.tsx` — Default page title
- `client/src/pages/Home.tsx` — Home page title
- `client/src/pages/Login.tsx` — Login description
- `client/src/pages/Register.tsx` — Welcome toast, description
- `client/src/pages/Support.tsx` — Assistant greeting, contact info
- `client/src/pages/Business.tsx` — Section heading
- `client/src/pages/Terms.tsx` — Legal entity references
- `client/src/pages/Privacy.tsx` — Legal entity references
- `client/src/pages/RefundPolicy.tsx` — Support email
- `client/src/pages/OshaCompliance.tsx` — Brand references, compliance text
- `client/src/pages/CertificateVerify.tsx` — Verification branding
- `client/src/pages/BecomeAnInstructor.tsx` — Brand references throughout
- `client/src/pages/AcceptInvite.tsx` — Welcome toast
- `client/src/pages/LocationPage.tsx` — Location schema, titles
- `client/src/pages/LocationsHub.tsx` — Page title
- `client/src/pages/RequestOnsiteTraining.tsx` — Titles, contact email
