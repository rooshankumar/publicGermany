-- Add total_fees column to the referrals table for storing expected fee amounts
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS total_fees TEXT;

-- Add comment explaining the field
COMMENT ON COLUMN referrals.total_fees IS 'Expected total fees for the referral (stored as text, e.g. ₹5,000 or EUR 500)';
