-- Add order_index to german_course_videos
ALTER TABLE public.german_course_videos 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Create table for tracking student progress
CREATE TABLE IF NOT EXISTS public.german_course_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID NOT NULL REFERENCES public.german_course_videos(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, video_id)
);

-- Enable RLS
ALTER TABLE public.german_course_progress ENABLE ROW LEVEL SECURITY;

-- Policies for progress tracking
CREATE POLICY "Students can view their own progress"
ON public.german_course_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Students can update their own progress"
ON public.german_course_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can modify their own progress"
ON public.german_course_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Force refresh of schema cache
NOTIFY pgrst, 'reload schema';
