create or replace function public.auth_tenant_id()
returns uuid
language plpgsql
stable
security invoker
set search_path = private, public, pg_temp
as $$
begin
  if auth.uid() is null then
    return null;
  end if;
  return private.auth_tenant_id();
end;
$$;

create or replace function public.is_tenant_admin()
returns boolean
language plpgsql
stable
security invoker
set search_path = private, public, pg_temp
as $$
begin
  if auth.uid() is null then
    return false;
  end if;
  return private.is_tenant_admin();
end;
$$;

create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security invoker
set search_path = private, public, pg_temp
as $$
begin
  if auth.uid() is null then
    return false;
  end if;
  return private.is_admin();
end;
$$;

revoke all on function public.auth_tenant_id() from public;
revoke all on function public.is_tenant_admin() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.auth_tenant_id() to anon, authenticated, service_role;
grant execute on function public.is_tenant_admin() to anon, authenticated, service_role;
grant execute on function public.is_admin() to anon, authenticated, service_role;
