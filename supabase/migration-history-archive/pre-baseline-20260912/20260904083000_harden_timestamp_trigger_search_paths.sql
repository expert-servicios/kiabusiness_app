-- Harden simple timestamp trigger functions by fixing their search_path.
-- These functions are SECURITY INVOKER and only assign NEW.updated_at = now().
-- No table data, grants, policies, or trigger bindings are changed.

alter function public.kia_reports_set_updated_at() set search_path = public, pg_temp;
alter function public.set_email_queue_updated_at() set search_path = public, pg_temp;
alter function public.set_fiscal_obligations_updated_at() set search_path = public, pg_temp;
alter function public.set_kia_session_updated_at() set search_path = public, pg_temp;
alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.set_updated_at_sra() set search_path = public, pg_temp;
alter function public.update_admin_users_updated_at() set search_path = public, pg_temp;
alter function public.update_companies_updated_at() set search_path = public, pg_temp;
alter function public.update_connector_instances_updated_at() set search_path = public, pg_temp;
alter function public.update_entitlements_updated_at() set search_path = public, pg_temp;
alter function public.update_subscription_trials_updated_at() set search_path = public, pg_temp;
alter function public.update_updated_at_column() set search_path = public, pg_temp;
