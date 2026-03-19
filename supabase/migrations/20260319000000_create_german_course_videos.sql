-- Create german_course_videos table
CREATE TABLE IF NOT EXISTS public.german_course_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    youtube_url TEXT, -- Make optional
    video_id TEXT,    -- Make optional
    video_url TEXT,   -- For direct links (Telegram/MP4)
    thumbnail_url TEXT, -- For custom thumbnails
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.german_course_videos ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow all authenticated users to manage videos for now to ensure deletion works
CREATE POLICY "Manage german_course_videos"
ON public.german_course_videos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow all authenticated users to view videos
CREATE POLICY "View german_course_videos"
ON public.german_course_videos
FOR SELECT
TO authenticated
USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER handle_german_course_videos_updated_at
    BEFORE UPDATE ON public.german_course_videos
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();
