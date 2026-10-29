-- Migration: 026_page_views_visitor_utm_geo.sql
-- Purpose: Accurate website traffic (Peter, 2026-10-29). Persistent visitor id
--          (new vs returning), campaign tags, device, and visitor id on events.
--          Country/region/city columns already exist and are now filled at ingest.
-- Impact: Additive nullable columns + indexes. No existing rows are modified.

ALTER TABLE "page_views"
  ADD COLUMN IF NOT EXISTS "visitor_id" text,
  ADD COLUMN IF NOT EXISTS "is_new_visitor" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "utm_source" text,
  ADD COLUMN IF NOT EXISTS "utm_medium" text,
  ADD COLUMN IF NOT EXISTS "utm_campaign" text,
  ADD COLUMN IF NOT EXISTS "device" text;

CREATE INDEX IF NOT EXISTS "page_views_visitor_idx" ON "page_views" ("visitor_id");

ALTER TABLE "analytics_events"
  ADD COLUMN IF NOT EXISTS "visitor_id" text;
