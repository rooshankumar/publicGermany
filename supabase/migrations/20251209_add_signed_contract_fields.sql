-- Add signed_document_url column and update status check constraint
-- This allows students to upload signed contracts

-- First, drop the existing check constraint
ALTER TABLE public.contracts
DROP CONSTRAINT IF EXISTS contracts_status_check;

-- Add the signed_document_url column if it doesn't exist
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS signed_document_url TEXT,
ADD COLUMN IF NOT EXISTS contract_pdf_url TEXT;

-- Add the new check constraint with 'signed' status
ALTER TABLE public.contracts
ADD CONSTRAINT contracts_status_check 
CHECK (status IN ('draft', 'signed_by_admin', 'sent', 'viewed', 'signed', 'completed', 'rejected'));

-- Create index for signed_document_url lookups
CREATE INDEX IF NOT EXISTS idx_contracts_signed_document_url ON public.contracts(signed_document_url);
