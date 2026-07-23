-- Chunk 1 (wallet card redesign): photo ID add-on at course checkout.
-- users: saved addresses for prefill on later purchases.
-- photo_id_entitlements: paid claims to a wallet card, created at checkout
-- before any certification exists; consumed on photo upload at fulfillment.

ALTER TABLE users ADD COLUMN IF NOT EXISTS saved_shipping_address jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS saved_billing_address jsonb;

CREATE TABLE IF NOT EXISTS photo_id_entitlements (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  enrollment_id INTEGER REFERENCES enrollments(id),
  purchased_by_user_id INTEGER NOT NULL REFERENCES users(id),
  shipping_method TEXT NOT NULL CHECK (shipping_method IN ('standard', 'expedited')),
  shipping_address jsonb NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'awaiting_photo' CHECK (status IN ('awaiting_photo', 'fulfilled', 'refunded')),
  cert_card_order_id INTEGER REFERENCES cert_card_orders(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS photo_id_entitlements_order_idx ON photo_id_entitlements(order_id);
CREATE INDEX IF NOT EXISTS photo_id_entitlements_buyer_idx ON photo_id_entitlements(purchased_by_user_id);
CREATE INDEX IF NOT EXISTS photo_id_entitlements_enrollment_idx ON photo_id_entitlements(enrollment_id);
