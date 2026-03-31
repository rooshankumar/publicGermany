-- Create resources table
CREATE TABLE IF NOT EXISTS public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    exam TEXT,
    level TEXT,
    type TEXT,
    category TEXT NOT NULL, -- 'IELTS', 'German', 'Additional'
    image_url TEXT,
    view_url TEXT,
    download_url TEXT,
    external_url TEXT,
    tags TEXT[] DEFAULT '{}',
    is_new BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone can view resources
CREATE POLICY "Allow public read access to resources"
    ON public.resources FOR SELECT
    USING (true);

-- Only admins can insert/update/delete resources
CREATE POLICY "Allow admins to manage resources"
    ON public.resources FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Storage bucket for resources if not exists
-- Note: This might need to be run in the Supabase console or via a separate script if storage API is used
-- For now, we assume the 'resources' bucket exists as seen in the URLs.
