-- Add level column to german_course_videos
ALTER TABLE public.german_course_videos 
ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'A1' NOT NULL;

-- Update RLS policies to ensure admin can manage all levels
-- (Already handled by "Manage german_course_videos" policy)
