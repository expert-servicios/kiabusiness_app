-- Environment-bound production definitions captured for issue #143.
-- DO NOT include this file in a portable fresh-branch bootstrap as-is.
-- These functions hardcode the production Supabase project URL and can make
-- outbound network calls to production Edge Functions.

CREATE OR REPLACE FUNCTION public.handle_new_contact_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
BEGIN
  PERFORM net.http_post(
      url := 'https://ybtpqscmqrrjjmuoryap.supabase.co/functions/v1/send-email-notification',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.header.apikey') || '"}',
      body := json_build_object('record', NEW)
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_admin_on_client_upload()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'net', 'pg_temp'
AS $function$
BEGIN
  PERFORM http_post(
    'https://ybtpqscmqrrjjmuoryap.supabase.co/functions/v1/notify-admin-client-upload',
    json_build_object('record', NEW)::text,
    '{}'::jsonb,
    'text/plain'
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_admin_on_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'net', 'pg_temp'
AS $function$
BEGIN
  PERFORM http_post(
    'https://ybtpqscmqrrjjmuoryap.supabase.co/functions/v1/notify-admin-new-user',
    json_build_object('record', NEW)::text,
    '{}'::jsonb,
    'text/plain'
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_admin_on_service_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'net', 'pg_temp'
AS $function$
BEGIN
  PERFORM http_post(
    'https://ybtpqscmqrrjjmuoryap.supabase.co/functions/v1/notify-admin-service-request',
    json_build_object('record', NEW)::text,
    '{}'::jsonb,
    'text/plain'
  );
  RETURN NEW;
END;
$function$;
