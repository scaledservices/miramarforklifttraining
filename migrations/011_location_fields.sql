-- Add location-aware fields to onsite_training_requests
-- These columns track which market and training type a lead requested
ALTER TABLE onsite_training_requests
  ADD COLUMN IF NOT EXISTS requested_location_slug varchar(50),
  ADD COLUMN IF NOT EXISTS requested_location_type varchar(20);
