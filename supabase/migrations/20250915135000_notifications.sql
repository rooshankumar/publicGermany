-- Notifications table for in-app bell, per user
create extension if not exists pgcrypto;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  seen boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

-- Users can read their own notifications
create policy if not exists "notif_select_own"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

-- Users can insert notifications for themselves (client-side flows)
create policy if not exists "notif_insert_self"
  on public.notifications for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can mark their notifications as seen
create policy if not exists "notif_update_seen"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
