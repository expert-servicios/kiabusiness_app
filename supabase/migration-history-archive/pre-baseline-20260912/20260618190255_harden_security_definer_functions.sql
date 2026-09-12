-- Harden SECURITY DEFINER helpers in exposed schema.
-- Keep current behavior, but pin search_path and make EXECUTE grants explicit.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role text := 'client';
begin
  if new.email = 'soy@kseniailicheva.com' then
    assigned_role := 'admin';
  end if;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    assigned_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.auth_tenant_id() returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id
  from public.profiles
  where id = auth.uid()
  limit 1
$$;

create or replace function public.is_tenant_admin() returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'tenant_admin'
      and tenant_id is not null
  )
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;

revoke all on function public.auth_tenant_id() from public, anon;
grant execute on function public.auth_tenant_id() to authenticated, service_role;

revoke all on function public.is_tenant_admin() from public, anon;
grant execute on function public.is_tenant_admin() to authenticated, service_role;
