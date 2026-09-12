-- Harden low-risk SECURITY INVOKER functions by fixing search_path only.
-- No data, grants, policies, SECURITY mode, or trigger bindings are changed.

-- pg_net exposes http_post in schema net.
alter function public.notify_admin_on_new_user() set search_path = public, net, pg_temp;
alter function public.notify_admin_on_service_request() set search_path = public, net, pg_temp;
alter function public.notify_admin_on_client_upload() set search_path = public, net, pg_temp;

alter function public.fn_check_asiento_cuadrado() set search_path = public, pg_temp;
alter function public._ensure_updated_trigger(regclass, text) set search_path = public, pg_temp;

-- pgvector operators/types are installed in extensions.
alter function public.kia_memories_search(vector, uuid, uuid, text, double precision, integer)
  set search_path = public, extensions, pg_temp;
