-- Add portal credentials columns to applications table
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS portal_login_id text,
ADD COLUMN IF NOT EXISTS portal_password text,
ADD COLUMN IF NOT EXISTS show_credentials_to_student boolean NOT NULL DEFAULT false;