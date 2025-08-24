-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.app_role AS ENUM ('student', 'admin');
CREATE TYPE public.checklist_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE public.application_status AS ENUM ('draft', 'submitted', 'interview', 'offer', 'rejected');
CREATE TYPE public.service_request_status AS ENUM ('new', 'in_review', 'payment_pending', 'in_progress', 'completed');
CREATE TYPE public.aps_pathway AS ENUM ('stk', 'bachelor_2_semesters', 'master_applicants');
CREATE TYPE public.german_level AS ENUM ('none', 'a1', 'a2', 'b1', 'b2', 'c1', 'c2');
CREATE TYPE public.admin_note_visibility AS ENUM ('admin_only', 'shared');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  full_name TEXT,
  date_of_birth DATE,
  country_of_education TEXT,
  
  -- Academic information
  class_10_marks TEXT,
  class_12_marks TEXT,
  class_12_stream TEXT,
  bachelor_degree_name TEXT,
  bachelor_field TEXT,
  bachelor_cgpa_percentage TEXT,
  bachelor_duration_years INTEGER,
  bachelor_credits_ects INTEGER,
  master_degree_name TEXT,
  master_field TEXT,
  master_cgpa_percentage TEXT,
  
  -- Work experience
  work_experience_years INTEGER,
  work_experience_field TEXT,
  
  -- Language proficiency
  ielts_toefl_score TEXT,
  german_level german_level DEFAULT 'none',
  
  -- APS pathway (auto-determined)
  aps_pathway aps_pathway,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create checklist_items table
CREATE TABLE public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module TEXT NOT NULL,
  item_name TEXT NOT NULL,
  status checklist_status NOT NULL DEFAULT 'not_started',
  notes TEXT,
  file_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module, item_name)
);

-- Create universities table (master catalog)
CREATE TABLE public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  country TEXT DEFAULT 'Germany',
  website_url TEXT,
  languages TEXT[], -- ['EN', 'DE']
  is_public BOOLEAN DEFAULT true,
  has_tuition_fees BOOLEAN DEFAULT false,
  fields TEXT[], -- Major fields offered
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  university_name TEXT NOT NULL,
  program_name TEXT NOT NULL,
  ielts_requirement TEXT,
  german_requirement TEXT,
  fees_eur INTEGER,
  start_date DATE,
  end_date DATE,
  application_method TEXT, -- 'Uni-assist' or 'Direct'
  required_tests TEXT,
  portal_link TEXT,
  status application_status NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create files table
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT, -- 'document', 'image', 'pdf'
  file_path TEXT NOT NULL,
  module TEXT, -- Which module this file belongs to
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service_requests table
CREATE TABLE public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_type TEXT NOT NULL,
  service_price INTEGER, -- Price in paise/cents
  service_currency TEXT DEFAULT 'INR',
  request_details TEXT,
  preferred_timeline TEXT,
  status service_request_status NOT NULL DEFAULT 'new',
  payment_reference TEXT,
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_notes table
CREATE TABLE public.admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  note TEXT NOT NULL,
  visibility admin_note_visibility NOT NULL DEFAULT 'admin_only',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table (audit log)
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = is_admin.user_id 
    AND role = 'admin'
  );
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view and edit their own profile" ON public.profiles
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- RLS Policies for checklist_items
CREATE POLICY "Users can manage their own checklist items" ON public.checklist_items
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all checklist items" ON public.checklist_items
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all checklist items" ON public.checklist_items
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- RLS Policies for universities (public read)
CREATE POLICY "Everyone can read universities" ON public.universities
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage universities" ON public.universities
  FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for applications
CREATE POLICY "Users can manage their own applications" ON public.applications
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all applications" ON public.applications
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all applications" ON public.applications
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- RLS Policies for files
CREATE POLICY "Users can manage their own files" ON public.files
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all files" ON public.files
  FOR SELECT USING (public.is_admin(auth.uid()));

-- RLS Policies for service_requests
CREATE POLICY "Users can manage their own service requests" ON public.service_requests
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view and update all service requests" ON public.service_requests
  FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for admin_notes
CREATE POLICY "Students can view shared notes about them" ON public.admin_notes
  FOR SELECT USING (student_id = auth.uid() AND visibility = 'shared');

CREATE POLICY "Admins can manage all notes" ON public.admin_notes
  FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for events
CREATE POLICY "Users can view events related to them" ON public.events
  FOR SELECT USING (user_id = auth.uid() OR actor_id = auth.uid());

CREATE POLICY "Admins can view all events" ON public.events
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "All authenticated users can insert events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_checklist_items_updated_at
  BEFORE UPDATE ON public.checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();