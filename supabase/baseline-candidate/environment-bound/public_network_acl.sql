-- Environment-bound ACL evidence for issue #143.
-- These functions currently hardcode the production Supabase project URL.
-- Do NOT include this file in a portable fresh bootstrap unless the corresponding
-- functions have been safely parameterized for the target environment.

set search_path = public, extensions, pg_temp;

-- Three legacy notification helpers are executable by PUBLIC and also have
-- explicit anon/authenticated EXECUTE entries in production.
grant execute on function
  public.notify_admin_on_client_upload(),
  public.notify_admin_on_new_user(),
  public.notify_admin_on_service_request()
to PUBLIC, anon, authenticated;

-- All four environment-bound functions are executable by service_role.
grant execute on function
  public.handle_new_contact_request(),
  public.notify_admin_on_client_upload(),
  public.notify_admin_on_new_user(),
  public.notify_admin_on_service_request()
to service_role;
