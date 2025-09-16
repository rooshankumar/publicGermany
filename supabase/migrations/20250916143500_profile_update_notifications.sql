-- Notify users on any profile update
create or replace function public.notify_profile_update()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Insert a simple notification for the owner of the profile
  insert into public.notifications (user_id, title, type, ref_id, meta)
  values (
    new.user_id,
    'Your profile was updated',
    null, -- keep type null for now to avoid violating existing CHECK; UI can still show and deep-link to /profile
    null,
    jsonb_build_object(
      'table', 'profiles',
      'updated_at', now()
    )
  );
  return new;
end;
$$;

-- Create trigger to run after any update to profiles
create trigger trg_notify_profile_update
after update on public.profiles
for each row
when (old is distinct from new)
execute function public.notify_profile_update();

-- Allow Supabase service role to insert notifications via triggers (bypass auth.uid())
create policy if not exists "notif_insert_service"
  on public.notifications for insert
  to service_role
  using (true)
  with check (true);
