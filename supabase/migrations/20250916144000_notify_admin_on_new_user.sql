-- Notify all admins when a new student profile is created
create or replace function public.notify_admin_new_student()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Insert a notification for each admin in profiles
  insert into public.notifications (user_id, title, type, ref_id, meta)
  select p.user_id,
         'New student signed up',
         'student',
         new.user_id,
         jsonb_build_object('full_name', new.full_name)
  from public.profiles p
  where p.role = 'admin';
  return new;
end;
$$;

create trigger trg_notify_admin_new_student
after insert on public.profiles
for each row
when (new.role is distinct from 'admin')  -- only when a non-admin profile is created
execute function public.notify_admin_new_student();
