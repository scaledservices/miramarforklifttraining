-- Add customerClassification column to onsite_training_requests
-- Every lead starts as 'unverified'; admin marks new/existing during follow-up.

ALTER TABLE onsite_training_requests
  ADD COLUMN IF NOT EXISTS customer_classification TEXT NOT NULL DEFAULT 'unverified';
