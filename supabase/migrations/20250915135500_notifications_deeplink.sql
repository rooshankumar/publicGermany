-- Add deep-link fields to notifications
alter table public.notifications
  add column if not exists type text check (type in ('application','document','service_request')),
  add column if not exists ref_id uuid,
  add column if not exists meta jsonb;

create index if not exists idx_notifications_user_type_created on public.notifications(user_id, type, created_at desc);
