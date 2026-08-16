# QA Run — 2026-08-15 — Section 3 (Online Course E2E)

Runner: Hermes (Kimi K3). Target: **staging**. Method: live API + DB verification.
Real sandbox purchases + a full exam→certificate issuance executed.

Legend: ✅ pass · ⚠️ pass-with-note · ❌ fail · 🔲 not run

## Section 3 — online course (renewal) end to end
| # | Flow | Result |
|---|------|--------|
| 3.1 | Online purchase → enrollment created | ✅ order `FC-2026-000029`, $45 + $1.35 surcharge = **$46.35 approved** (txn 80058323598); enrollment id=22 active (DB-verified) |
| 3.2 | Course player: 32 steps load | ✅ `/api/course-player/21/steps` returns all 32 (lessons, checkpoints, downloads, final exam) |
| 3.3 | Progress saves / resume | ✅ proven across full run: 2 lessons → 7 checkpoints → final exam → cert; step_progress persisted |
| 3.4 | Exam: take + pass → certificate issued | ✅ final exam score 96%, passed, allComplete → cert `CERT-1786841782465-1LR90C` (id 18) issued, 3-yr expiry |
| 3.5 | Cert PDF downloads + verification page validates | ✅ PDF 4 pages / 627KB valid; `/api/verify/CERT-…1LR90C` → valid, holder, course, dates, status |
| 3.6 | Photo-ID add-on at checkout | ✅ GATED OFF (by design) — `photo_id_addon_enabled` unset → "Photo ID add-on is not available". Pre-go-live default per spec. |
| 3.7 | Exam retake allowed | ✅ checkpoints unlimited (max 999, all passed 100%); final exam max 3 attempts enforced in code |

## Course structure (course id=2, verified)
32 steps: 18 lessons, 7 checkpoints (unlimited retakes), 3 downloads (OSHA ref,
employer eval packet, site presentation), 1 final exam (pass=80, max 3 attempts),
1 completion lesson. Bilingual (EN course id=2; ES course id=3 exists).

## Certificate issuance chain (3.4/3.5 evidence)
- Exam submit → grade (96%) → step complete → all-steps check → enrollment "completed"
- `issueCertification` → status "issued", expires 2029-08-15
- `generateCertificatePdf` → `certificates/CERT-…1LR90C.pdf`
- Audit log `certification_issued` + bilingual cert email queued (id 145, `[TEST →]` sandboxed)
- Public verify endpoint returns holder "Ulysses U.", course, issued/expires, status

## Notes / follow-ups
1. **buildOrder item field is `courseSlug`** (not `courseId`) — my first 3.1 attempt
   500'd on "Course not found: undefined". Not a product bug; client sends the right
   shape. Noted for future API consumers.
2. **Photo-ID add-on is intentionally OFF** (flag unset) until QA sign-off. To enable
   for go-live, set `platform_settings.photo_id_addon_enabled`. The full purchase +
   entitlement path is coded and seat-capped, just flag-gated.
3. **QA test data:** orders FC-2026-000028/29, certs CERT-…1LR90C, enrollments 21/22
   are sandbox rows; safe to leave.
