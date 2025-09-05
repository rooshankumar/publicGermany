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