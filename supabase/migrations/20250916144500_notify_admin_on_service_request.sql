-- Notify all admins when a new service request is created
create or replace function public.notify_admin_service_request()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.notifications (user_id, title, type, ref_id, meta)
  select p.user_id,
         'New service request created',
         'service_request',
         new.id,
         jsonb_build_object('service_type', new.service_type, 'user_id', new.user_id)
  from public.profiles p
  where p.role = 'admin';
  return new;
end;
$$;

create trigger trg_notify_admin_service_request
after insert on public.service_requests
for each row
execute function public.notify_admin_service_request();
