-- Pin search_path on the four functions confirmed by the 2026-09-05
-- production Security Advisor preflight. This deliberately does not change
-- SECURITY mode, grants, policies, trigger bindings or data.

alter function app.assign_master_admin() set search_path = app, public, pg_temp;

alter function public.increment_helpful_count(uuid) set search_path = public, pg_temp;
alter function public.is_admin_email() set search_path = public, pg_temp;
alter function public.is_admin_user() set search_path = public, pg_temp;
