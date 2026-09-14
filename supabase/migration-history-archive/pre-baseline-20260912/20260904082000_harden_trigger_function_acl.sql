-- Harden legacy SECURITY DEFINER trigger functions exposed through PostgREST.
-- No table data is modified. Active database triggers continue to execute these
-- functions internally; direct RPC execution is restricted to service_role.

alter function public.delete_user_data() set search_path = public, pg_temp;
alter function public.fn_handle_new_user() set search_path = public, pg_temp;
alter function public.handle_new_auth_user() set search_path = public, pg_temp;
alter function public.handle_new_contact_request() set search_path = public, extensions, pg_temp;
alter function public.handle_new_user_to_usuarios() set search_path = public, pg_temp;

revoke execute on function public.delete_user_data() from public, anon, authenticated;
revoke execute on function public.fn_handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.handle_new_contact_request() from public, anon, authenticated;
revoke execute on function public.handle_new_user_to_usuarios() from public, anon, authenticated;

grant execute on function public.delete_user_data() to service_role;
grant execute on function public.fn_handle_new_user() to service_role;
grant execute on function public.handle_new_auth_user() to service_role;
grant execute on function public.handle_new_contact_request() to service_role;
grant execute on function public.handle_new_user_to_usuarios() to service_role;
