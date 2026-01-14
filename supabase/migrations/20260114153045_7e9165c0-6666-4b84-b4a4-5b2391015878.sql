-- Create student_notes table for students to write notes/hints
-- These notes are visible to both the student who created them AND all admins

CREATE TABLE public.student_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add a unique constraint so each student has one notes record
ALTER TABLE public.student_notes ADD CONSTRAINT student_notes_user_id_unique UNIQUE (user_id);

-- Enable RLS
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

-- Students can view and manage their own notes
CREATE POLICY "Students can manage their own notes" 
ON public.student_notes 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all student notes
CREATE POLICY "Admins can view all student notes" 
ON public.student_notes 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Admins can update student notes
CREATE POLICY "Admins can update student notes" 
ON public.student_notes 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_student_notes_updated_at
BEFORE UPDATE ON public.student_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();