-- Migration 021: CRM import schema expansion
-- Adds fields to support Alberto's historical data import (3 datasets)
-- Approved by Peter on 2026-07-12 per CRM_DATA_ANALYSIS.md recommendations 1-5

-- Recommendation 1: revenue on training_events (297 historical revenue data points)
ALTER TABLE training_events ADD COLUMN IF NOT EXISTS revenue integer;

-- Recommendation 2: raw employees code on training_events (preserves Alberto's original notation)
ALTER TABLE training_events ADD COLUMN IF NOT EXISTS raw_employees_code text;

-- Recommendation 3: import_batch_id on companies and contacts (idempotency + traceability)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS import_batch_id text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS import_batch_id text;

-- Recommendation 4: source_era on companies and training_events (distinguish FLA-era vs MFT-era)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS source_era text;
ALTER TABLE training_events ADD COLUMN IF NOT EXISTS source_era text;

-- Recommendation 5: status_notes on training_events (Alberto's COMMENTS field)
ALTER TABLE training_events ADD COLUMN IF NOT EXISTS status_notes text;

-- Also add import_batch_id to training_events for idempotent training event imports
ALTER TABLE training_events ADD COLUMN IF NOT EXISTS import_batch_id text;

-- Indexes for the new columns
CREATE INDEX IF NOT EXISTS companies_import_batch_id_idx ON companies(import_batch_id);
CREATE INDEX IF NOT EXISTS contacts_import_batch_id_idx ON contacts(import_batch_id);
CREATE INDEX IF NOT EXISTS training_events_import_batch_id_idx ON training_events(import_batch_id);
