-- Migration: 027_training_expenses.sql
-- Purpose: Record Alberto's costs per training (travel, lodging, meals...) so
--          new-customer revenue is split net of expenses (Peter, 2026-11-14),
--          and the assistant can log expenses / "no expenses" per training.
-- Impact: New table only. No existing rows or columns are modified.

CREATE TABLE IF NOT EXISTS "training_expenses" (
  "id" serial PRIMARY KEY,
  "order_id" integer REFERENCES "orders"("id"),
  "booking_id" integer REFERENCES "bookings"("id"),
  "training_event_id" integer REFERENCES "training_events"("id"),
  "category" text NOT NULL,
  "description" text,
  "amount" numeric(10, 2) NOT NULL,
  "incurred_on" date NOT NULL,
  "source" text NOT NULL DEFAULT 'admin',
  "created_by_user_id" integer REFERENCES "users"("id"),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "training_expenses_amount_check" CHECK ("amount" >= 0),
  CONSTRAINT "training_expenses_link_check" CHECK ("order_id" IS NOT NULL OR "booking_id" IS NOT NULL OR "training_event_id" IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS "training_expenses_order_idx" ON "training_expenses" ("order_id");
CREATE INDEX IF NOT EXISTS "training_expenses_booking_idx" ON "training_expenses" ("booking_id");
CREATE INDEX IF NOT EXISTS "training_expenses_event_idx" ON "training_expenses" ("training_event_id");
CREATE INDEX IF NOT EXISTS "training_expenses_incurred_idx" ON "training_expenses" ("incurred_on");
