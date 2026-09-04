-- Harden SECURITY INVOKER helper functions used by RLS/identity checks.
-- Only search_path is fixed; grants, SECURITY mode, policies and data remain unchanged.

alter function app.user_has_company(bigint) set search_path = app, public, pg_temp;
alter function app.can_create_company(uuid) set search_path = app, public, pg_temp;

alter function public.is_admin() set search_path = public, pg_temp;
alter function public.is_gestor() set search_path = public, pg_temp;
alter function public.is_admin_or_gestor() set search_path = public, pg_temp;
alter function public.whoami() set search_path = public, pg_temp;
