-- Migration: Update onsite_training_requests status enum from legacy to CRM pipeline statuses
-- Legacy statuses: pending, reviewing, approved, declined, scheduled
-- New statuses: new_lead, contacted, quoted, quote_accepted, quote_declined, scheduled, confirmed, completed, invoiced, unresponsive, cancelled

-- Step 1: Drop the old check constraint
ALTER TABLE onsite_training_requests DROP CONSTRAINT IF EXISTS onsite_training_requests_status_check;

-- Step 2: Migrate legacy status values
UPDATE onsite_training_requests SET status = CASE
  WHEN status = 'pending' THEN 'new_lead'
  WHEN status = 'reviewing' THEN 'contacted'
  WHEN status = 'approved' THEN 'scheduled'
  WHEN status = 'declined' THEN 'cancelled'
  ELSE status
END
WHERE status IN ('pending', 'reviewing', 'approved', 'declined');

-- Step 3: Add new check constraint with CRM pipeline statuses
ALTER TABLE onsite_training_requests ADD CONSTRAINT onsite_training_requests_status_check
  CHECK (status IN ('new_lead','contacted','quoted','quote_accepted','quote_declined','scheduled','confirmed','completed','invoiced','unresponsive','cancelled'));

-- Step 4: Update default value for new rows
ALTER TABLE onsite_training_requests ALTER COLUMN status SET DEFAULT 'new_lead';
