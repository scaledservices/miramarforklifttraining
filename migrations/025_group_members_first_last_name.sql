-- Migration: 025_group_members_first_last_name.sql
-- Purpose: Store crew member first/last name separately (Peter, 2026-09-07).
--          The single `name` field is kept for display; new columns drive the
--          invite prefill and crew-member sign-up form.
-- Impact: Adds two nullable text columns. No existing rows are modified.
--         Application code should populate first_name/last_name going forward
--         and fall back to `name` when they are null.

ALTER TABLE "group_members"
  ADD COLUMN "first_name" text,
  ADD COLUMN "last_name" text;

-- Optional: backfill from existing `name` (best-effort split on first space).
-- This is a one-time convenience; application code should still treat
-- first_name/last_name as the source of truth going forward.
UPDATE "group_members"
SET
  "first_name" = split_part("name", ' ', 1),
  "last_name"  = CASE
                   WHEN position(' ' in "name") > 0
                   THEN substring("name" from position(' ' in "name") + 1)
                   ELSE ''
                 END
WHERE "first_name" IS NULL;
