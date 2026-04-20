-- Phase 9A: Schema Linkage — add FK columns for cross-record company linkage
-- All columns are nullable and additive (no data loss)

ALTER TABLE orders ADD COLUMN IF NOT EXISTS training_event_id INTEGER REFERENCES training_events(id);
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
ALTER TABLE certifications ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
