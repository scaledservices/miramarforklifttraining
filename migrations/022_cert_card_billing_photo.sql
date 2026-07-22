-- Wallet card orders: persist billing address (AVS) + customer ID photo.
-- Columns are nullable so existing rows remain valid; new paid orders always
-- carry billing_address. id_photo stays null when the customer skips upload.

ALTER TABLE cert_card_orders ADD COLUMN IF NOT EXISTS billing_address jsonb;
ALTER TABLE cert_card_orders ADD COLUMN IF NOT EXISTS id_photo text;

-- Payment reference for the card charge. The payments table keys to course
-- orders (order_id NOT NULL FK), so card-order charges are referenced here.
ALTER TABLE cert_card_orders ADD COLUMN IF NOT EXISTS provider_transaction_id text;
ALTER TABLE cert_card_orders ADD COLUMN IF NOT EXISTS charge_metadata jsonb;
