-- Create table for student video access
CREATE TABLE IF NOT EXISTS public.german_course_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    has_access BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.german_course_access ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage access"
ON public.german_course_access
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow students to view their own access
CREATE POLICY "Users can view their own access"
ON public.german_course_access
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER handle_german_course_access_updated_at
    BEFORE UPDATE ON public.german_course_access
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
