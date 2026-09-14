create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;
grant usage on schema private to authenticated, service_role;

create or replace function private.auth_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select tenant_id
  from public.profiles
  where id = auth.uid()
  limit 1
$$;

create or replace function private.is_tenant_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists(
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'tenant_admin'
      and tenant_id is not null
  )
$$;

revoke all on function private.auth_tenant_id() from public, anon;
revoke all on function private.is_tenant_admin() from public, anon;
grant execute on function private.auth_tenant_id() to authenticated, service_role;
grant execute on function private.is_tenant_admin() to authenticated, service_role;

create or replace function public.auth_tenant_id()
returns uuid
language sql
stable
security invoker
set search_path = private, public, pg_temp
as $$
  select case
    when auth.uid() is null then null::uuid
    else private.auth_tenant_id()
  end
$$;

create or replace function public.is_tenant_admin()
returns boolean
language sql
stable
security invoker
set search_path = private, public, pg_temp
as $$
  select case
    when auth.uid() is null then false
    else private.is_tenant_admin()
  end
$$;

revoke all on function public.auth_tenant_id() from public, anon;
revoke all on function public.is_tenant_admin() from public, anon;
grant execute on function public.auth_tenant_id() to authenticated, service_role;
grant execute on function public.is_tenant_admin() to authenticated, service_role;

create or replace function public.is_admin_email()
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') in ('expertestudiospro@gmail.com', 'soy@kseniailicheva.com'),
    false
  )
$$;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') in ('expertestudiospro@gmail.com', 'soy@kseniailicheva.com'),
    false
  )
$$;

revoke all on function public.is_admin_email() from public;
revoke all on function public.is_admin_user() from public;
grant execute on function public.is_admin_email() to anon, authenticated, service_role;
grant execute on function public.is_admin_user() to anon, authenticated, service_role;

alter function public.increment_helpful_count(uuid) security invoker;
revoke all on function public.increment_helpful_count(uuid) from public, anon, authenticated;
grant execute on function public.increment_helpful_count(uuid) to service_role;
