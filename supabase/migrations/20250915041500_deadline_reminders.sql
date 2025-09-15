-- Track which deadline reminders were sent
create table if not exists public.deadline_reminders (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  day_offset int not null check (day_offset in (1,3,7)),
  sent_at timestamptz not null default now(),
  unique (application_id, day_offset)
);

alter table public.deadline_reminders enable row level security;
-- No public policies; only service role (from Edge Functions) will write.
