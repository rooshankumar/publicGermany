-- Add comprehensive fields for Europass CV generation

-- 1. Extend profiles table with additional personal info columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS passport_number TEXT,
  ADD COLUMN IF NOT EXISTS place_of_birth TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS nationality TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS address_street TEXT,
  ADD COLUMN IF NOT EXISTS address_city TEXT,
  ADD COLUMN IF NOT EXISTS address_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS address_country TEXT,
  ADD COLUMN IF NOT EXISTS signature_url TEXT,
  ADD COLUMN IF NOT EXISTS signature_date DATE;

-- 2. Create supporting tables for arrays of structured data

-- education/training history
CREATE TABLE IF NOT EXISTS public.profile_educations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  degree_title TEXT NOT NULL,
  field_of_study TEXT NOT NULL,
  institution TEXT NOT NULL,
  country TEXT NOT NULL,
  start_year INTEGER NOT NULL,
  end_year INTEGER NOT NULL,
  final_grade TEXT,
  max_scale INTEGER,
  total_credits NUMERIC,
  credit_system TEXT,
  thesis_title TEXT,
  key_subjects TEXT,
  academic_highlights TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- work experience entries
CREATE TABLE IF NOT EXISTS public.profile_work_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  job_title TEXT,
  organisation TEXT,
  city_country TEXT,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT FALSE,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- language skill rows
CREATE TYPE IF NOT EXISTS public.cefr_level AS ENUM ('A1','A2','B1','B2','C1','C2');

CREATE TABLE IF NOT EXISTS public.profile_language_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  language_name TEXT NOT NULL,
  mother_tongue BOOLEAN DEFAULT FALSE,
  listening cefr_level,
  reading cefr_level,
  writing cefr_level,
  speaking cefr_level,
  ielts_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- certifications
CREATE TABLE IF NOT EXISTS public.profile_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  institution TEXT,
  date DATE,
  certificate_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- publications
CREATE TABLE IF NOT EXISTS public.profile_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  journal TEXT,
  year INTEGER,
  doi_url TEXT,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- recommendations / referees
CREATE TABLE IF NOT EXISTS public.profile_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  designation TEXT,
  institution TEXT,
  email TEXT,
  contact TEXT,
  lor_link TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- additional arbitrary sections
CREATE TABLE IF NOT EXISTS public.profile_additional_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  section_title TEXT NOT NULL,
  section_content TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- digital/research skills could be stored as a single JSON object
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS digital_research_skills JSONB;

-- 3. Enable RLS and policies for new tables (mirror existing patterns)

ALTER TABLE public.profile_educations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_work_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_language_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_additional_sections ENABLE ROW LEVEL SECURITY;

-- policy helpers already exist (is_admin function)

CREATE POLICY IF NOT EXISTS "Users can manage own educations" ON public.profile_educations
  FOR ALL USING (profile_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Admins can view all educations" ON public.profile_educations
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY IF NOT EXISTS "Admins can update educations" ON public.profile_educations
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS "Users can manage own work_experiences" ON public.profile_work_experiences
  FOR ALL USING (profile_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Admins can view all work_experiences" ON public.profile_work_experiences
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY IF NOT EXISTS "Admins can update work_experiences" ON public.profile_work_experiences
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS "Users can manage own language_skills" ON public.profile_language_skills
  FOR ALL USING (profile_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Admins can view all language_skills" ON public.profile_language_skills
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY IF NOT EXISTS "Admins can update language_skills" ON public.profile_language_skills
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS "Users can manage own certifications" ON public.profile_certifications
  FOR ALL USING (profile_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Admins can view all certifications" ON public.profile_certifications
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY IF NOT EXISTS "Admins can update certifications" ON public.profile_certifications
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS "Users can manage own publications" ON public.profile_publications
  FOR ALL USING (profile_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Admins can view all publications" ON public.profile_publications
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY IF NOT EXISTS "Admins can update publications" ON public.profile_publications
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS "Users can manage own recommendations" ON public.profile_recommendations
  FOR ALL USING (profile_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Admins can view all recommendations" ON public.profile_recommendations
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY IF NOT EXISTS "Admins can update recommendations" ON public.profile_recommendations
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS "Users can manage own additional_sections" ON public.profile_additional_sections
  FOR ALL USING (profile_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Admins can view all additional_sections" ON public.profile_additional_sections
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY IF NOT EXISTS "Admins can update additional_sections" ON public.profile_additional_sections
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Optional: trigger to update updated_at on profiles when any related row changes
CREATE OR REPLACE FUNCTION public.touch_profile_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles SET updated_at = now() WHERE user_id = NEW.profile_id;
  RETURN NEW;
END;
$$;

-- Attach triggers for all child tables
CREATE TRIGGER trg_touch_profile_educations
 AFTER INSERT OR UPDATE OR DELETE ON public.profile_educations
 FOR EACH ROW EXECUTE FUNCTION public.touch_profile_updated_at();

CREATE TRIGGER trg_touch_profile_work_experiences
 AFTER INSERT OR UPDATE OR DELETE ON public.profile_work_experiences
 FOR EACH ROW EXECUTE FUNCTION public.touch_profile_updated_at();

CREATE TRIGGER trg_touch_profile_language_skills
 AFTER INSERT OR UPDATE OR DELETE ON public.profile_language_skills
 FOR EACH ROW EXECUTE FUNCTION public.touch_profile_updated_at();

CREATE TRIGGER trg_touch_profile_certifications
 AFTER INSERT OR UPDATE OR DELETE ON public.profile_certifications
 FOR EACH ROW EXECUTE FUNCTION public.touch_profile_updated_at();

CREATE TRIGGER trg_touch_profile_publications
 AFTER INSERT OR UPDATE OR DELETE ON public.profile_publications
 FOR EACH ROW EXECUTE FUNCTION public.touch_profile_updated_at();

CREATE TRIGGER trg_touch_profile_recommendations
 AFTER INSERT OR UPDATE OR DELETE ON public.profile_recommendations
 FOR EACH ROW EXECUTE FUNCTION public.touch_profile_updated_at();

CREATE TRIGGER trg_touch_profile_additional_sections
 AFTER INSERT OR UPDATE OR DELETE ON public.profile_additional_sections
 FOR EACH ROW EXECUTE FUNCTION public.touch_profile_updated_at();
