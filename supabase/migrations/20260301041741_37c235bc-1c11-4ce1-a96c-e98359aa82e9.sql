-- Remove stray SQL comment that breaks types.ts generation
-- This is a no-op migration to trigger types regeneration
COMMENT ON COLUMN public.profiles.passport_number IS NULL;
COMMENT ON COLUMN public.profiles.place_of_birth IS NULL;
COMMENT ON COLUMN public.profiles.gender IS NULL;
COMMENT ON COLUMN public.profiles.nationality IS NULL;
COMMENT ON COLUMN public.profiles.phone IS NULL;
COMMENT ON COLUMN public.profiles.linkedin_url IS NULL;
COMMENT ON COLUMN public.profiles.address_street IS NULL;
COMMENT ON COLUMN public.profiles.address_city IS NULL;
COMMENT ON COLUMN public.profiles.address_postal_code IS NULL;
COMMENT ON COLUMN public.profiles.address_country IS NULL;
COMMENT ON COLUMN public.profiles.signature_url IS NULL;
COMMENT ON COLUMN public.profiles.signature_date IS NULL;