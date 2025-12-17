-- Create blogs table for publicgermany blog
CREATE TABLE public.blogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  excerpt TEXT,
  content_markdown TEXT NOT NULL,
  featured_image_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  read_time_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  published_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  author_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Public can read only published blogs
CREATE POLICY "Public can read published blogs" 
ON public.blogs
FOR SELECT
USING (
  status = 'published' AND
  published_at IS NOT NULL AND
  published_at <= now()
);

-- Admins can manage all blogs
CREATE POLICY "Admins can manage blogs" 
ON public.blogs
FOR ALL
USING (is_admin(auth.uid()));

-- Trigger to keep updated_at fresh (function already exists in previous migrations)
CREATE TRIGGER update_blogs_updated_at
BEFORE UPDATE ON public.blogs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER TABLE public.blogs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blogs;
