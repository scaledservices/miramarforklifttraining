-- Phase 8: Training Events (Scheduling & Fulfillment)
-- Migration: 013_training_events.sql

CREATE TABLE IF NOT EXISTS training_events (
  id SERIAL PRIMARY KEY,
  originating_lead_id INTEGER REFERENCES onsite_training_requests(id),
  company_id INTEGER REFERENCES companies(id),
  primary_contact_id INTEGER REFERENCES contacts(id),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unscheduled',
  location_type TEXT NOT NULL,
  location_slug TEXT,
  onsite_street TEXT,
  onsite_city TEXT,
  onsite_state TEXT,
  onsite_zip TEXT,
  scheduled_start TIMESTAMP,
  scheduled_end TIMESTAMP,
  timezone TEXT,
  trainee_count INTEGER,
  equipment_types TEXT[] NOT NULL DEFAULT '{}',
  instructor_id INTEGER REFERENCES instructors(id),
  admin_notes TEXT,
  created_by_user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS training_events_status_idx ON training_events(status);
CREATE INDEX IF NOT EXISTS training_events_company_id_idx ON training_events(company_id);
CREATE INDEX IF NOT EXISTS training_events_lead_id_idx ON training_events(originating_lead_id);
CREATE INDEX IF NOT EXISTS training_events_scheduled_start_idx ON training_events(scheduled_start);
CREATE INDEX IF NOT EXISTS training_events_location_slug_idx ON training_events(location_slug);
