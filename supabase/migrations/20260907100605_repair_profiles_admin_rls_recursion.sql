create or replace function private.is_admin()
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
      and role = 'admin'
  )
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated, service_role;

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = private, public, pg_temp
as $$
  select case
    when auth.uid() is null then false
    else private.is_admin()
  end
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;
