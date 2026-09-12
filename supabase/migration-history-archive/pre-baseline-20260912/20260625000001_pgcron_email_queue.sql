-- email-queue cron: moved from vercel.json (Hobby plan limitation)
-- Calls /api/cron/email-queue every hour via pg_net HTTP request

create extension if not exists pg_net schema extensions;
create extension if not exists pg_cron schema extensions;

select cron.schedule(
  'email-queue-hourly',
  '0 * * * *',
  $$
  select extensions.http_post(
    url := 'https://expertconsulting.es/api/cron/email-queue',
    headers := '{"x-vercel-cron": "1"}'::jsonb,
    body := '{}'::jsonb
  )
  $$
);
