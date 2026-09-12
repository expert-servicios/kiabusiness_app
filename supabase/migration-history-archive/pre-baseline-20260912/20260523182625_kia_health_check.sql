-- Kia health check observability.
-- Stores synthetic checks and anomaly metadata only; never store secrets, raw documents, API keys, or chain-of-thought.

create table if not exists public.kia_health_runs (
  id                uuid        primary key default gen_random_uuid(),
  run_type          text        not null check (run_type in ('canary', 'nightly_eval', 'manual', 'post_deploy', 'incident_check')),
  status            text        not null check (status in ('success', 'warning', 'failed')),
  score             numeric,
  total_checks      integer     not null default 0,
  passed_checks     integer     not null default 0,
  failed_checks     integer     not null default 0,
  warning_checks    integer     not null default 0,
  provider          text,
  model             text,
  started_at        timestamptz not null default now(),
  finished_at       timestamptz,
  duration_ms       integer,
  summary           text,
  created_by        uuid        references public.profiles(id) on delete set null,
  metadata          jsonb       not null default '{}'::jsonb
);

create table if not exists public.kia_health_check_results (
  id                uuid        primary key default gen_random_uuid(),
  run_id            uuid        not null references public.kia_health_runs(id) on delete cascade,
  check_id          text        not null,
  category          text        not null check (category in ('technical', 'behavioral', 'business', 'security', 'cost', 'latency')),
  severity          text        not null check (severity in ('info', 'warning', 'critical')),
  status            text        not null check (status in ('passed', 'failed', 'warning', 'skipped')),
  input_message     text,
  expected          jsonb,
  actual            jsonb,
  provider          text,
  model             text,
  latency_ms        integer,
  tokens_input      integer,
  tokens_output     integer,
  cost_estimate     numeric,
  error             text,
  decision_log_id   uuid        references public.kia_decision_logs(id) on delete set null,
  created_at        timestamptz not null default now()
);

create table if not exists public.kia_behavior_anomalies (
  id                        uuid        primary key default gen_random_uuid(),
  source                    text        not null check (source in ('canary', 'production', 'admin_review', 'eval')),
  severity                  text        not null check (severity in ('low', 'medium', 'high', 'critical')),
  anomaly_type              text        not null check (anomaly_type in (
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
    'repeated_answer_loop'
  )),
  title                     text        not null,
  description               text        not null,
  related_decision_log_id   uuid        references public.kia_decision_logs(id) on delete set null,
  related_conversation_id   uuid        references public.whatsapp_conversations(id) on delete set null,
  status                    text        not null default 'open' check (status in ('open', 'acknowledged', 'fixed', 'ignored')),
  metadata                  jsonb       not null default '{}'::jsonb,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists kia_health_runs_started_at_idx
  on public.kia_health_runs (started_at desc);

create index if not exists kia_health_runs_status_idx
  on public.kia_health_runs (status, started_at desc);

create index if not exists kia_health_check_results_run_idx
  on public.kia_health_check_results (run_id, category, status);

create index if not exists kia_health_check_results_check_idx
  on public.kia_health_check_results (check_id, created_at desc);

create index if not exists kia_behavior_anomalies_open_idx
  on public.kia_behavior_anomalies (severity, created_at desc)
  where status = 'open';

create index if not exists kia_behavior_anomalies_type_idx
  on public.kia_behavior_anomalies (anomaly_type, created_at desc);

alter table public.kia_health_runs enable row level security;
alter table public.kia_health_check_results enable row level security;
alter table public.kia_behavior_anomalies enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'kia_health_runs'
      and policyname = 'admin read kia_health_runs'
  ) then
    create policy "admin read kia_health_runs" on public.kia_health_runs
      for select using (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'kia_health_runs'
      and policyname = 'admin manage kia_health_runs'
  ) then
    create policy "admin manage kia_health_runs" on public.kia_health_runs
      for all using (public.is_admin()) with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'kia_health_check_results'
      and policyname = 'admin read kia_health_check_results'
  ) then
    create policy "admin read kia_health_check_results" on public.kia_health_check_results
      for select using (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'kia_health_check_results'
      and policyname = 'admin manage kia_health_check_results'
  ) then
    create policy "admin manage kia_health_check_results" on public.kia_health_check_results
      for all using (public.is_admin()) with check (public.is_admin());
  end if;

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

grant select on public.kia_health_runs to authenticated;
grant select on public.kia_health_check_results to authenticated;
grant select on public.kia_behavior_anomalies to authenticated;

grant select, insert, update, delete on public.kia_health_runs to service_role;
grant select, insert, update, delete on public.kia_health_check_results to service_role;
grant select, insert, update, delete on public.kia_behavior_anomalies to service_role;
