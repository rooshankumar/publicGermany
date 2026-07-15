-- Add trainer name and verification columns to referrals table
ALTER TABLE public.referrals 
  ADD COLUMN IF NOT EXISTS trainer_name text,
  ADD COLUMN IF NOT EXISTS verified_by_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES public.profiles(user_id) ON DELETE SET NULL;

COMMENT ON COLUMN public.referrals.trainer_name IS 'Assigned trainer for this referral (e.g. Shalini Chauhan, Esha Chowdhury)';
COMMENT ON COLUMN public.referrals.verified_by_admin IS 'Admin verification status — when true, editors cannot edit this referral';
COMMENT ON COLUMN public.referrals.verified_at IS 'Timestamp when admin verified this referral';
COMMENT ON COLUMN public.referrals.verified_by IS 'Admin who verified this referral';
