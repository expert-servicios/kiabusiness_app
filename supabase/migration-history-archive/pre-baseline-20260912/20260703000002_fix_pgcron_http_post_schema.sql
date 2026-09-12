-- Fix: 20260703000001 (and the original 20260625000001 before it) called
-- extensions.http_post(...), which has never existed — pg_net installs its
-- functions into the `net` schema, not `extensions`. The email-queue-hourly
-- job has failed at the SQL level on every single run since it was created
-- on 2026-06-25 (183 consecutive failures), independently of CRON_SECRET.
--
-- Confirmed via cron.job_run_details: "function extensions.http_post(...)
-- does not exist". pg_net's real signature is net.http_post(url, body,
-- params, headers, timeout_milliseconds).

do $$
begin
  perform cron.unschedule('email-queue-hourly');
exception when others then
  null;
end $$;

select cron.schedule(
  'email-queue-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://expertconsulting.es/api/cron/email-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  )
  $$
);
