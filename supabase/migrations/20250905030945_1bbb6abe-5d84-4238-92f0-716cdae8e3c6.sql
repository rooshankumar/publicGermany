-- Fix foreign key relationships and ensure proper constraints

-- Update applications table to properly reference profiles
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_user_id_fkey;
ALTER TABLE public.applications ADD CONSTRAINT applications_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Update documents table to properly reference profiles  
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_user_id_fkey;
ALTER TABLE public.documents ADD CONSTRAINT documents_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Update service_requests table to properly reference profiles
ALTER TABLE public.service_requests DROP CONSTRAINT IF EXISTS service_requests_user_id_fkey;
ALTER TABLE public.service_requests ADD CONSTRAINT service_requests_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Update checklist_items table to properly reference profiles
ALTER TABLE public.checklist_items DROP CONSTRAINT IF EXISTS checklist_items_user_id_fkey;
ALTER TABLE public.checklist_items ADD CONSTRAINT checklist_items_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Update reminders table to properly reference profiles
ALTER TABLE public.reminders DROP CONSTRAINT IF EXISTS reminders_user_id_fkey;
ALTER TABLE public.reminders ADD CONSTRAINT reminders_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Update files table to properly reference profiles
ALTER TABLE public.files DROP CONSTRAINT IF EXISTS files_user_id_fkey;
ALTER TABLE public.files ADD CONSTRAINT files_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Update payments table to properly reference profiles (if student_id should reference profiles)
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_student_id_fkey;
ALTER TABLE public.payments ADD CONSTRAINT payments_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Update admin_notes table to properly reference profiles
ALTER TABLE public.admin_notes DROP CONSTRAINT IF EXISTS admin_notes_student_id_fkey;
ALTER TABLE public.admin_notes ADD CONSTRAINT admin_notes_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.admin_notes DROP CONSTRAINT IF EXISTS admin_notes_admin_id_fkey;
ALTER TABLE public.admin_notes ADD CONSTRAINT admin_notes_admin_id_fkey 
    FOREIGN KEY (admin_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Update student_favorites table to properly reference profiles
ALTER TABLE public.student_favorites DROP CONSTRAINT IF EXISTS student_favorites_student_id_fkey;
ALTER TABLE public.student_favorites ADD CONSTRAINT student_favorites_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.student_favorites DROP CONSTRAINT IF EXISTS student_favorites_admin_id_fkey;
ALTER TABLE public.student_favorites ADD CONSTRAINT student_favorites_admin_id_fkey 
    FOREIGN KEY (admin_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Enable real-time updates for all tables
ALTER TABLE public.applications REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.documents REPLICA IDENTITY FULL;
ALTER TABLE public.service_requests REPLICA IDENTITY FULL;
ALTER TABLE public.checklist_items REPLICA IDENTITY FULL;
ALTER TABLE public.reminders REPLICA IDENTITY FULL;
ALTER TABLE public.files REPLICA IDENTITY FULL;
ALTER TABLE public.payments REPLICA IDENTITY FULL;
ALTER TABLE public.admin_notes REPLICA IDENTITY FULL;
ALTER TABLE public.student_favorites REPLICA IDENTITY FULL;
ALTER TABLE public.universities REPLICA IDENTITY FULL;
ALTER TABLE public.contact_submissions REPLICA IDENTITY FULL;
ALTER TABLE public.events REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; 
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checklist_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reminders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.files;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_favorites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.universities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;