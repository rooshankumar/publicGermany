-- Redefine german_course_access table
ALTER TABLE public.german_course_access 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' NOT NULL, -- pending, approved, rejected
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS request_message TEXT,
ADD COLUMN IF NOT EXISTS admin_message TEXT;

-- Update RLS for students to see their own access status/messages
DROP POLICY IF EXISTS "Students can view their own access" ON public.german_course_access;
CREATE POLICY "Students can view their own access"
ON public.german_course_access
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Students can insert a request
DROP POLICY IF EXISTS "Students can request access" ON public.german_course_access;
CREATE POLICY "Students can request access"
ON public.german_course_access
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Students can update their own request (e.g. resubmit)
DROP POLICY IF EXISTS "Students can update their own request" ON public.german_course_access;
CREATE POLICY "Students can update their own request"
ON public.german_course_access
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
