-- Fix RLS security issues from the linter

-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payments table
CREATE POLICY "Admins can view all payments" 
ON public.payments 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all payments" 
ON public.payments 
FOR ALL 
USING (is_admin(auth.uid()));

-- Enable RLS on student_favorites table  
ALTER TABLE public.student_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for student_favorites table
CREATE POLICY "Admins can manage student favorites" 
ON public.student_favorites 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Students can view their favorite admins" 
ON public.student_favorites 
FOR SELECT 
USING (student_id = auth.uid());

-- Ensure all other critical tables have proper RLS policies
-- These should already be enabled but let's make sure

-- Check and fix any missing policies
CREATE POLICY IF NOT EXISTS "Admins can delete all documents" 
ON public.documents 
FOR DELETE 
USING (is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS "Admins can view all documents" 
ON public.documents 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS "Admins can delete all checklist items" 
ON public.checklist_items 
FOR DELETE 
USING (is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS "Admins can insert checklist items" 
ON public.checklist_items 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS "Admins can delete all reminders" 
ON public.reminders 
FOR DELETE 
USING (is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS "Admins can view all files" 
ON public.files 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY IF NOT EXISTS "Admins can manage all files" 
ON public.files 
FOR ALL 
USING (is_admin(auth.uid()));