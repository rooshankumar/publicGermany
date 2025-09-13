-- Add status fields to documents and admin policy
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  ADD COLUMN IF NOT EXISTS reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Admins can manage all documents
CREATE POLICY IF NOT EXISTS "Admins can manage all documents"
ON public.documents
FOR ALL
USING (is_admin(auth.uid()));
