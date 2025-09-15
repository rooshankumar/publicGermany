-- Emails log table for tracking transactional sends via Brevo
create table if not exists public.emails_log (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  subject text not null,
  template text,
  payload jsonb,
  status text not null check (status in ('success','error')),
  error text,
  created_at timestamptz not null default now()
);

-- Helpful index for querying recent activity
create index if not exists emails_log_created_at_idx on public.emails_log (created_at desc);
create index if not exists emails_log_to_email_idx on public.emails_log (to_email);

-- RLS off for now; only service role writes. You can enable with specific policies later.
alter table public.emails_log enable row level security;
-- Allow service role to insert/select via edge functions; app clients should not access directly.
-- Define policies only if you want limited read access from admin UI later.
