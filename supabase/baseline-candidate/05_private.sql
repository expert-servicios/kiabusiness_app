-- Candidate current-schema baseline for issue #143.
-- Private RLS helper schema verified against production on 2026-09-11.
-- These SECURITY DEFINER helpers are the implementation behind the public
-- wrapper functions used by production RLS policies.

create schema if not exists private;

CREATE OR REPLACE FUNCTION private.auth_tenant_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select tenant_id
  from public.profiles
  where id = auth.uid()
  limit 1
$function$;

CREATE OR REPLACE FUNCTION private.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists(
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  )
$function$;

CREATE OR REPLACE FUNCTION private.is_tenant_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists(
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'tenant_admin'
      and tenant_id is not null
  )
$function$;
