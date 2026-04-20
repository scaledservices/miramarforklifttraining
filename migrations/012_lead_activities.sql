-- Phase 7: Lead Activities & Next-Action Workflow
-- This migration was originally applied via direct SQL ALTER TABLE statements.
-- This file documents the schema changes for migration tracking.

CREATE TABLE IF NOT EXISTS lead_activities (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES onsite_training_requests(id),
  company_id INTEGER REFERENCES companies(id),
  contact_id INTEGER REFERENCES contacts(id),
  actor_user_id INTEGER REFERENCES users(id),
  activity_type TEXT NOT NULL,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_company_id ON lead_activities(company_id);

ALTER TABLE onsite_training_requests
  ADD COLUMN IF NOT EXISTS next_action_type TEXT,
  ADD COLUMN IF NOT EXISTS next_action_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP;
