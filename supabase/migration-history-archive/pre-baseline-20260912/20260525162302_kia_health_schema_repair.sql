-- Repair Kia Health/Auditor schemas when an older remote table already existed.
--
-- The first health migration used CREATE TABLE IF NOT EXISTS. If a table had
-- been created manually or by an earlier draft, Postgres skipped the CREATE and
-- did not add later columns/constraints. Keep this migration additive and safe.

alter table public.kia_health_check_results
  add column if not exists decision_log_id uuid
    references public.kia_decision_logs(id) on delete set null;

create index if not exists kia_health_check_results_decision_log_idx
  on public.kia_health_check_results (decision_log_id, created_at desc)
  where decision_log_id is not null;

alter table public.kia_behavior_anomalies
  add column if not exists status text,
  add column if not exists updated_at timestamptz;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'kia_behavior_anomalies'
      and column_name = 'resolved'
  ) then
    execute $sql$
      update public.kia_behavior_anomalies
      set status = case
        when coalesce(resolved, false) then 'fixed'
        else 'open'
      end
      where status is null
    $sql$;
  else
    update public.kia_behavior_anomalies
    set status = 'open'
    where status is null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'kia_behavior_anomalies'
      and column_name = 'resolved_at'
  ) then
    execute $sql$
      update public.kia_behavior_anomalies
      set updated_at = coalesce(resolved_at, created_at, now())
      where updated_at is null
    $sql$;
  else
    update public.kia_behavior_anomalies
    set updated_at = coalesce(created_at, now())
    where updated_at is null;
  end if;
end $$;

alter table public.kia_behavior_anomalies
  alter column status set default 'open',
  alter column status set not null,
  alter column updated_at set default now(),
  alter column updated_at set not null;

alter table public.kia_behavior_anomalies
  drop constraint if exists kia_behavior_anomalies_status_check;

alter table public.kia_behavior_anomalies
  add constraint kia_behavior_anomalies_status_check
  check (status in ('open', 'acknowledged', 'fixed', 'ignored'));

alter table public.kia_behavior_anomalies
  drop constraint if exists kia_behavior_anomalies_anomaly_type_check;

alter table public.kia_behavior_anomalies
  add constraint kia_behavior_anomalies_anomaly_type_check
  check (anomaly_type in (
    'invalid_json',
    'wrong_intent',
    'wrong_flow',
    'forbidden_checkout',
    'api_key_leak_risk',
    'hallucination_risk',
    'wrong_language',
    'excessive_needs_review',
    'tool_schema_error',
    'latency_spike',
    'provider_failure',
    'unsafe_accounting_action',
    'tax_presentation_claim',
    'repeated_answer_loop',
    'auditor_rule_failure'
  ));

create index if not exists kia_behavior_anomalies_open_idx
  on public.kia_behavior_anomalies (severity, created_at desc)
  where status = 'open';

create index if not exists kia_behavior_anomalies_type_idx
  on public.kia_behavior_anomalies (anomaly_type, created_at desc);

alter table public.kia_behavior_anomalies enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'kia_behavior_anomalies'
      and policyname = 'admin read kia_behavior_anomalies'
  ) then
    create policy "admin read kia_behavior_anomalies" on public.kia_behavior_anomalies
      for select using (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'kia_behavior_anomalies'
      and policyname = 'admin manage kia_behavior_anomalies'
  ) then
    create policy "admin manage kia_behavior_anomalies" on public.kia_behavior_anomalies
      for all using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

grant select on public.kia_health_check_results to authenticated;
grant select, insert, update, delete on public.kia_health_check_results to service_role;

grant select on public.kia_behavior_anomalies to authenticated;
grant select, insert, update, delete on public.kia_behavior_anomalies to service_role;

-- Defense in depth for IMP-002: secrets table must stay service-role only.
revoke all on public.client_integration_secrets from anon;
revoke all on public.client_integration_secrets from authenticated;
grant select, insert, update, delete on public.client_integration_secrets to service_role;
