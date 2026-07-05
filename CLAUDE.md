# Miramar Forklift Training — Claude Code Context

Forklift training company (SD, LV, Fresno). React app replacing WordPress/WooCommerce at `training.miramarforklift.com`. Course sales, booking, CRM, LMS, certifications.

## Priority: Onsite > Hands-on > Online
Never favor online over onsite. Confirmed bug — don't reintroduce.

## People
- **Peter/Scaled Services LLC**: tech, marketing, AI partner. You work for him.
- **Alberto Rawlins**: training operator (not owner). Day-to-day SD/LV/Fresno. Base + 30% commission; 50% new-customer commission shared with Scaled Services.
- **Simon/Atef**: Miramar owners. Not party to Scaled Services agreement.

## Brand
- Gold `#FFC326` (primary), black nav, brown `#4f3b3b`, green `#019E7C`, orange `#FF7F00`
- Fonts: Roboto + Roboto Slab
- Logo: `client/public/images/miramar-navbar-56h.png`
- Phone: (858) 901-0149 | HQ: 6365 Marindustry Dr #A, San Diego, CA 92121
- LV: 3301 Martin Ave Suite A, Las Vegas, NV 89118 | Fresno: 3515 N. Sabre Drive, Fresno, CA 93727 (by appointment)

## Stack
React 18 + Vite 7 + Tailwind 3 + Shadcn/UI + Wouter + TanStack Query v5 | Express 5 + PostgreSQL + Drizzle 0.39 | Passport.js | Authorize.net (Accept.js dispatchData, sandbox on staging) | Resend | react-i18next (EN+ES) | Railway

## Commands
- `npm run check` — TypeScript (works locally)
- `npm run build` — Vite build (works locally on Vite 7.3)
- `npm run dev` — dev server

## Context Frugality Rules
- Only read files directly relevant to the current task
- Ask before expanding scope beyond 3 files
- Prefer grep/glob to locate, then read the specific region — not the entire file
- Summarize findings before deciding to read more
- Never read generated files, block files, fixtures, or lockfiles unless explicitly asked
- For large files (>500 lines), sample structure first (head/tail/grep), then targeted reads
- Use database queries or scripts for log/data exploration — never read raw log files
- Keep tool output minimal — pipe through grep/head/tail when possible

## Scope Boundaries
- NO touching miramarforklift.com (separate WordPress)
- NO changing payment credentials
- NO modifying certificate/license logic
- NO importing customer databases
- NO production deploy (staging only)
- NO GitHub push without explicit approval
- NO real payments
- NO reviving ForkliftCertified brand

## Repo Structure
```
client/src/{pages,components,data,hooks,lib}  # React frontend
shared/config/{brand,theme,locations,industry}.ts  # Config
server/{routes,authorizeNetClient.ts,storage.ts,index.ts}  # Backend
```

## Competitor: Forklift Academy (forkliftacademy.com)
Strengths: two-path hero, company-size tiering, dual FAQ schema, TL;DR blog blocks, free trial exam, trust badges, 5,300+ reviews, 10 location pages.
Miramar advantages: 3 real facilities, competitive pricing, experienced trainer, same-day cert, onsite training.

## Alberto Comms
Plain English, short sentences (ESL). No en-dashes. Conversational. "Payments" not "payment processors". License-card process untouched. End with clear, easy ask.
