-- Expand allowed values for notifications.type to include 'student'
-- This fixes signup failures caused by notify_admin_new_student() inserting type 'student'

alter table public.notifications drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('application','document','service_request','student'));
