-- Phase 10A: Quote Pipeline Backend Foundation
-- Additive migration for the quotes table.

CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  contact_id INTEGER REFERENCES contacts(id),
  originating_lead_id INTEGER REFERENCES onsite_training_requests(id),
  linked_training_event_id INTEGER REFERENCES training_events(id),
  status TEXT NOT NULL DEFAULT 'draft',
  title TEXT NOT NULL,
  participant_count INTEGER,
  location_slug TEXT,
  location_type TEXT,
  onsite_street TEXT,
  onsite_city TEXT,
  onsite_state TEXT,
  onsite_zip TEXT,
  equipment_types TEXT[] NOT NULL DEFAULT '{}',
  subtotal INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  pricing_notes TEXT,
  valid_until TIMESTAMP,
  created_by_user_id INTEGER REFERENCES users(id),
  sent_at TIMESTAMP,
  responded_at TIMESTAMP,
  approved_at TIMESTAMP,
  declined_at TIMESTAMP,
  internal_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS quotes_company_id_idx ON quotes(company_id);
CREATE INDEX IF NOT EXISTS quotes_contact_id_idx ON quotes(contact_id);
CREATE INDEX IF NOT EXISTS quotes_originating_lead_id_idx ON quotes(originating_lead_id);
CREATE INDEX IF NOT EXISTS quotes_linked_training_event_id_idx ON quotes(linked_training_event_id);
CREATE INDEX IF NOT EXISTS quotes_status_idx ON quotes(status);
CREATE INDEX IF NOT EXISTS quotes_created_at_idx ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS quotes_valid_until_idx ON quotes(valid_until);
CREATE INDEX IF NOT EXISTS quotes_location_slug_idx ON quotes(location_slug);
CREATE INDEX IF NOT EXISTS quotes_created_by_user_id_idx ON quotes(created_by_user_id);
