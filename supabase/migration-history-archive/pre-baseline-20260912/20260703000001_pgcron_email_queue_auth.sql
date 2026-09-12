-- Fix: the email-queue-hourly pg_cron job (20260625000001) called the cron
-- endpoint with only an "x-vercel-cron" header, which verifyCronRequest()
-- does not check. Every invocation has been failing closed with
-- {"error":"Cron not configured"} / 401 since it was created.
--
-- Stores the shared cron secret in Vault and sends it as a real Bearer
-- token, matching CRON_SECRET on Vercel and the GitHub Actions secret used
-- by .github/workflows/holded-sync.yml.
--
-- The value created here is a placeholder — it must be replaced with the
-- real secret via the SQL editor or `vault.update_secret()` so it matches
-- CRON_SECRET in Vercel. It is intentionally not the real value in this
-- migration file, which is committed to git.

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'cron_secret') then
    perform vault.create_secret(
      'REPLACE_VIA_SQL_EDITOR_TO_MATCH_VERCEL_CRON_SECRET',
      'cron_secret',
      'Shared secret for pg_cron -> Next.js cron routes. Must match CRON_SECRET in Vercel and in GitHub Actions secrets.'
    );
  end if;
end $$;

do $$
begin
  perform cron.unschedule('email-queue-hourly');
exception when others then
  null; -- job did not exist yet, nothing to remove
end $$;

select cron.schedule(
  'email-queue-hourly',
  '0 * * * *',
  $$
  select extensions.http_post(
    url := 'https://expertconsulting.es/api/cron/email-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  )
  $$
);
