-- groups.company_id: links a self-serve crew to its company record so the
-- compliance dashboard, roster, and audit binder resolve a companyId without
-- needing an issued certification first. Present in shared/schema.ts since the
-- team-purchase work but never migrated (staging drift found 2026-08-31).
-- Nullable + additive; no data loss.
ALTER TABLE groups ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
