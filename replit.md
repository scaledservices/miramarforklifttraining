# Miramar Forklift Training — Full Production Platform

## Overview
Miramar Forklift Training is a comprehensive, full-stack SaaS operating system for a San Diego-based in-person and on-site forklift training company (6365 Marindustry Dr #A, San Diego, CA 92121, phone 858-901-0149). The platform supports B2B CRM/lead pipeline, quote-to-booking flows, company accounts, rep attribution (sales reps Stan and Peter), renewal tracking, e-commerce, a multi-step Learning Management System (LMS), group management, and QR-verified PDF certificate generation. Originally built as "ForkliftCertified" (multi-location), now transformed to single-tenant Miramar brand focused on San Diego.

## Brand Configuration
- **Brand config**: `shared/config/brand.ts` — single source of truth for name, domain, phone, email, address, pricing, and sales reps
- **Pricing**: Standard $200, Reach+Forklift $280, Order Picker+Forklift $280, Forklift+Scissor+EPJ $300, Full Multi-Equipment $350, Scissor+Aerial $280
- **Location**: San Diego only (Las Vegas and Fresno locations removed)
- **Sales Reps**: Stan and Peter

## User Preferences
The user prefers clear and concise communication. They value iterative development and expect to be consulted before any major architectural or design changes are implemented. The user also prefers detailed explanations for complex technical decisions.

## System Architecture

### UI/UX Decisions
The platform utilizes a modern design with a deep navy blue primary color, an orange accent, and a white background, using the Montserrat font. Shadcn/UI provides responsive UI components. FOUC (Flash of Unstyled Content) is eliminated through inline critical CSS, hydration reveal techniques, and theme initialization scripts.

### Technical Implementations
- **Frontend**: React, TypeScript, Tailwind CSS, Wouter for routing, TanStack Query v5.
- **Backend**: Express.js with TypeScript.
- **Database**: PostgreSQL with Drizzle ORM.
- **PDF Generation**: PDFKit and QRCode for dynamic certificates and invoices.
- **Authentication**: bcryptjs for password hashing, HMAC-SHA256 for token hashing, session management, and OAuth 2.0 social login (Google, LinkedIn, Facebook) via Passport.js, supporting a 7-role hierarchy.
- **E-commerce**: Secure checkout with deferred authentication, seat-based pricing, and bulk discounts.
- **LMS**: Multi-step courses, progress tracking, video integration, and exam submissions.
- **Group Management**: Member and seat assignment, progress monitoring.
- **Certificate Management**: Generation, download, and public verification.
- **Admin Dashboards**: Comprehensive management for users, courses, orders, enrollments, certificates, audit logs, on-site bookings, and training sessions, including a Profitability Dashboard. Includes Lead Pipeline (`/admin/leads`) with inline status transitions, rep assignment, and days-idle coloring; Company Management (`/admin/companies` + detail pages) with contacts, linked training requests, and orders.
- **On-Site Booking System**: Multi-step booking wizard (`BookTraining.tsx`) with ZIP-based availability check, real-time calendar/slot selection from `availabilityRules`, contact details form, pricing sidebar, inline auth at review step, and booking submission via `POST /api/bookings`. Also includes simpler lead-capture request form (`RequestOnsiteTraining.tsx`) as alternative entry point.
- **Instructor Application System**: Gated application for certified graduates with an audit trail and structured review process.
- **SEO System**: Database-backed generation of over 200 dynamic landing pages, sitemaps, robots.txt, canonical URLs, structured data, and internal linking, utilizing Server-Side Rendering (SSR). Full bilingual SEO architecture: hreflang tags (en/es/x-default) on every public page, locale-aware canonical URLs, localized metadata and structured data (inLanguage), bilingual sitemap with xhtml:link annotations, SSR locale detection for crawlers with Spanish static page meta, and 6 seeded Spanish SEO content pages.
- **Knowledge Center**: Content cluster system with pillar pages and articles.
- **Notification System**: Comprehensive transactional email system.
- **AI Support Assistant**: AI chat interface with PII redaction, actions, and SSE streaming integration.
- **Internationalization (i18n)**: Full bilingual EN/ES system using `react-i18next`. URL-level locale routing via custom wouter hook (`useLocaleLocation`) at `/en/...` and `/es/...` with Spanish slug translation (e.g., `/es/iniciar-sesion` → `/login`). Root `/` redirects to `/en`. Comprehensive translation dictionaries in `client/src/locales/{en,es}/common.json`. Language switcher in header with `LanguageBanner` for browser-language detection. All user-facing pages wired with `t()` calls. Server-side email i18n via `server/email-i18n.ts` (complete EN/ES string maps for all 18 customer-facing templates). Centralized locale resolver (`server/locale-resolver.ts`) with priority: user.locale → route locale → course language → "en". Locale-aware email URLs via `localePath()` helper with `ES_PATH_MAP`. Certificate PDF Spanish labels and compliance text. Spanish course content in `scripts/course-content-es.ts`. Users table has `locale` field for preference storage. Document download API returns `X-Content-Locale` and `X-Locale-Fallback` headers.

### System Design Choices
- **Modular Backend**: Server routes split into 12 domain modules under `server/routes/`: middleware.ts, auth.ts, onsite.ts, instructors.ts, lms.ts, orders.ts, certs.ts, groups.ts, admin.ts, services.ts, assistant.ts, training-events.ts, with index.ts as orchestrator.
- **Database Schema**: 25+ core tables, including companies, contacts, rep_attribution for B2B CRM, plus dynamic availability rules for service areas and instructor applications.
- **CRM State Machine**: Onsite training requests use a formalized state machine (new_lead→contacted→quoted→quote_accepted→scheduled→confirmed→completed→invoiced) with valid transitions enforced server-side. Config in `shared/config/onsite-states.ts`.
- **B2B CRM**: Company accounts, contacts (with roles: decision_maker, training_manager, employee, other), rep attribution tracking (per-entity with primary/secondary rep and lead source). Admin API routes for CRUD companies/contacts, enriched leads endpoint, rep assignment with attribution upsert. Lead activity timeline (`lead_activities` table) with auto-logged activities on status changes, rep assignments, company/contact linkage, and training event lifecycle (create/status change/material update). Next-action workflow (`nextActionType`, `nextActionDate`, `lastActivityAt` on leads) with overdue tracking. Admin Lead Pipeline enhanced with queue tabs (All/My Leads/Unassigned/Overdue/New), server-side sort (newest/oldest untouched/overdue first), and lead source/pipeline stage filters. Lead detail page has 3-column layout with CRM links panel (create company/contact from lead), training events panel (with "Create Event" button → prefilled form), next-action panel, note composer (log calls/emails/notes), and activity timeline. Three state domains kept separate: (1) CRM pipeline status, (2) next-action workflow, (3) fulfillment via training_events.
- **Scheduling & Fulfillment (Phase 8)**: Training events as separate fulfillment layer from CRM pipeline. `training_events` table with lifecycle states (unscheduled → scheduling_in_progress → scheduled → awaiting_confirmation → completed/canceled). Admin Scheduling Console (`/admin/training-events`) with queue views (Upcoming, Unscheduled Events, Awaiting Confirmation, Completed, Canceled, All), plus "Leads Needing Scheduling" section showing CRM leads without linked events. Lead-to-event conversion workflow: click "Create Event" on lead detail → form prefilled from lead data → activity logged → navigate to event. Activity types: `training_event_created`, `training_event_status_changed`, `training_event_updated`. Creating events does NOT auto-mutate CRM lead status. Config: `shared/config/training-events.ts`.
- **Unified Customer & Company Record (Phase 9)**: Cross-record FK linkage between orders/enrollments/certifications and companies. `enrollments` and `certifications` tables now have nullable `companyId` FK (auto-propagated from order→enrollment→certification chain on write). `orders` table has nullable `trainingEventId` for future event-to-order linkage. Company detail page (`/admin/companies/:id`) enriched with: (1) at-a-glance summary panel (revenue, paid orders, active learners, certifications, expiring-in-90d count) via `GET /api/admin/companies/:id/summary`, (2) real certifications table with status badges and expiration warnings. Storage methods: `getCertificationsByCompany`, `getEnrollmentsByCompany`, `getCompanySummaryStats`. FK conflict validation on write (enrollment/cert companyId must match order-derived companyId). Contact tags system: `tags` text[] column on contacts table with inline tag management UI (add/remove tags like business_contact, learner, decision_maker, safety_manager, billing, platform_user). Admin Reports page (`/admin/reports`) with operational metrics: conversion rates (lead→scheduled, scheduled→completed), event volume (onsite vs facility), revenue by company, certifications by company, expiring certifications (90-day window), rep performance. Backfill utilities (3 POST endpoints) for linking orphaned leads/orders/certs to companies. Full EN/ES i18n for reports and tags UI.
- **Job Scheduler**: Manages scheduled tasks.
- **PDF Storage**: Adaptable storage solution.
- **Security**: Helmet security headers, Origin/Referer CSRF validation, rate limiting, token security, anti-abuse measures, and PII redaction.
- **Production Startup Guards**: Fatal validation for critical environment variables in production.

## Full Spanish Internationalization (EN/ES)

### Route Strategy
- URL-level locale routing via `/en/...` and `/es/...` prefixes using a custom wouter hook (`useLocaleLocation`)
- Root `/` redirects to stored locale preference if present, otherwise defaults to `/en` (via `LocaleRedirect` in `App.tsx`)
- Spanish URLs use translated slugs (e.g., `/es/iniciar-sesion` for `/login`, `/es/crear-cuenta` for `/register`, `/es/certificacion-de-montacargas-en-linea` for `/online-forklift-certification`)
- Full slug maps defined in: `client/src/lib/locale.ts` (frontend), `server/seo.ts` (sitemap/robots), `server/seo-ssr.ts` (SSR), `server/email.ts` (email links)
- Language switcher in header with `LanguageBanner` for browser-language detection

### SEO Strategy
- Every public page emits `<link rel="alternate" hreflang="en|es|x-default">` tags via `SEOHead` component (frontend SPA) and `seo-ssr.ts` (server-rendered pages)
- Canonical URLs are locale-aware (e.g., `/es/certificacion-de-montacargas-en-linea`)
- Structured data includes `inLanguage` field set to current locale
- `og:locale` and `og:locale:alternate` tags switch between `en_US` and `es_ES`
- Bilingual sitemap (`/sitemap.xml`) with `xhtml:link` annotations pairing EN/ES page variants
- `robots.txt` disallows protected paths in both EN and ES variants (e.g., `/admin`, `/es/panel`, `/en/admin`)
- SSR locale detection: `parseLocaleFromPath()` extracts locale from URL and maps ES static slugs back to EN internal paths for template matching
- Protected pages (dashboard, login, register, cart, checkout, etc.) excluded from SSR SEO injection and sitemap

### Email Strategy
- All 18 customer-facing email templates have full EN/ES string maps in `server/email-i18n.ts`
- `emailT(locale, template, key)` function resolves localized strings with `{{placeholder}}` interpolation
- Centralized locale resolver in `server/locale-resolver.ts` with priority chain: `user.locale` → route locale → course language → `"en"`
- Most email call sites in `server/routes.ts` use `resolveLocale()` to determine the correct locale; a few (e.g., registration welcome) use `user.locale` directly
- Most email links use `localePath(locale, path)` with `ES_PATH_MAP` for Spanish URL variants (e.g., `/reset-password` → `/es/restablecer-contrasena`); some links like group invite accept URL remain non-localized
- Email footer, subject lines, headings, body copy, and CTAs are all fully localized
- Templates covered: welcome, orderReceipt, groupInvite, certification, cardOrderReceipt, shippingNotification, passwordReset, trainingReminder, bookingConfirmation, bookingCancellation, verifyEmail, abandonedCheckout, and more

### Training / Content Localization
- Spanish course content defined in `scripts/course-content-es.ts` (CANONICAL_COURSE_ES, COURSE_STEPS_ES)
- Course player UI (`CoursePlayer.tsx`, `CertificationSuccess.tsx`) uses `react-i18next` t() calls for all UI strings
- Certificate PDF (`server/certificate-pdf.ts`) renders Spanish labels and compliance text when course language is "es"
- Users table has a `locale TEXT NOT NULL DEFAULT 'en'` column for preference storage
- Registration form (`Register.tsx`) sends `i18n.language` as locale, persisted via `createUser({ locale })`

### Document Fallback
- Document download API (`/api/documents/:docId/download?locale=`) checks for locale-specific files first
- Response headers: `X-Content-Locale` (actual locale served) and `X-Locale-Fallback: true` (when falling back to EN)
- Frontend `Documentation.tsx` uses fetch-based download and shows a toast when `X-Locale-Fallback` header is present

### Frontend i18n Architecture
- `react-i18next` with translation dictionaries in `client/src/locales/{en,es}/common.json`
- Most user-facing pages wired with `t()` calls from `useTranslation()`; some content-heavy pages (blog articles, terms, privacy, certificate verification) have partial or no i18n coverage
- `useCurrentLocale()` hook returns current locale from URL
- `getAlternateLocalePath(path, locale)` computes the alternate-language URL for any given path
- Locale-aware navigation via `useLocaleLocation()` hook and `LocaleLink` component

### Known Gaps (Pre-existing, by design or future scope)
- Email `ES_PATH_MAP` uses `/certificacion-operador-montacargas-en-linea` for the course page while frontend uses `/certificacion-de-montacargas-en-linea` — slight slug inconsistency (both resolve correctly via routing)
- Some content-heavy pages (blog articles, terms, privacy, refund-policy) serve static English content regardless of locale — these are legal/editorial content not yet translated
- Certificate verification page (`CertificateVerify.tsx`) UI chrome is partially translated; certificate data itself displays as stored
- Admin-only UI strings remain English-only (admin pages are intentionally not translated)
- Group invite accept URL in email uses `/accept-invite?token=...` regardless of locale — the accept-invite page itself handles locale detection on load
- Document content files may not have ES variants for all documents (fallback to EN with `X-Locale-Fallback` header is by design)

### Bilingual QA Results
- Full e2e test results recorded in `docs/bilingual-qa-results.md`
- 62 checks across 5 test suites, all passing
- Suite 1: Public pages (EN/ES), SEO tags (hreflang, canonical, og:locale), language switcher round-trip
- Suite 2: Spanish auth flows (login, register, reset password), protected page indexing (robots.txt, sitemap.xml)
- Suite 3: Spanish marketing pages (business, training, locations, documentation), form validation
- Suite 4: Spanish training flow pages (online, hands-on, train-the-trainer, instructor application, certification, location sub-pages)
- Suite 5: Email localization triggers (password reset, contact form), transactional flow pages (cart, terms, privacy), certification CTA
- Email template verification: 18/18 templates have complete EN/ES string maps (code-level audit in QA doc)
- Requirement traceability matrix mapping each task requirement to test coverage

## Product Images & Image SEO
- Every product in `catalog.ts` has `image` and `imageAlt` fields for product-specific imagery
- `getProductImage()` and `getProductImageAltKey()` helpers in `catalog.ts` resolve product images with category-based fallbacks
- Image alt text is localized via `productImages.*` translation keys in both EN/ES locale files
- `ProductCard` (compact + full variants) renders thumbnail images; compact shows 144px header, full shows side column
- `ProductDetail` uses product-specific hero images instead of category fallback
- `courseSchema()` in `StructuredData.tsx` supports an `image` parameter for SEO-enriched JSON-LD
- Stock images: `trainer-instructor.jpg`, `certification-cards.jpg` added to `client/public/images/`

## External Dependencies
- **Payment Gateway**: Stripe (for payment processing, refunds, webhooks).
- **Email Service**: Resend API.
- **Frontend Libraries**: React, Tailwind CSS, Wouter, TanStack Query, react-i18next, canvas-confetti, recharts, @stripe/stripe-js, @stripe/react-stripe-js, react-icons.
- **Backend Libraries**: Express.js, helmet, compression, stripe, stripe-replit-sync, passport, passport-google-oauth20, passport-linkedin-oauth2, passport-facebook.
- **Database**: PostgreSQL.
- **ORM**: Drizzle ORM.
- **UI Components**: Shadcn/UI.
- **PDF Generation**: PDFKit, QRCode.
- **Authentication**: bcryptjs, Passport.js.
- **Session Management**: connect-pg-simple.
- **AI Integration**: OpenClaw Gateway.