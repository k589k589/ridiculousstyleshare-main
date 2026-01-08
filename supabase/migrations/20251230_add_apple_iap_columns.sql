-- Add Apple IAP support columns to vip_subscriptions table
-- Run this migration to support Apple In-App Purchases alongside PayPal

ALTER TABLE vip_subscriptions
ADD COLUMN IF NOT EXISTS apple_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS apple_original_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_source TEXT DEFAULT 'paypal';

-- Add index for faster lookup by Apple transaction ID
CREATE INDEX IF NOT EXISTS idx_vip_subscriptions_apple_original_transaction_id 
ON vip_subscriptions(apple_original_transaction_id);

-- Add comment for documentation
COMMENT ON COLUMN vip_subscriptions.apple_transaction_id IS 'Apple IAP transaction ID for the current billing period';
COMMENT ON COLUMN vip_subscriptions.apple_original_transaction_id IS 'Apple IAP original transaction ID (consistent across renewals)';
COMMENT ON COLUMN vip_subscriptions.subscription_source IS 'Payment source: paypal or apple';
