-- Kia Auditor persistence.
-- Stores audit summaries and rule outcomes only. Do not store raw secrets, full documents, API keys, or chain-of-thought.

create table if not exists public.kia_auditor_reviews (
  id                  uuid        primary key default gen_random_uuid(),
  source_type         text        not null check (source_type in ('decision_log', 'conversation', 'message', 'health_check', 'manual', 'post_deploy')),
  source_id           text,
  conversation_id     uuid,
  decision_log_id     uuid        references public.kia_decision_logs(id) on delete set null,
  client_id           uuid        references public.profiles(id) on delete set null,
  lead_id             uuid        references public.leads(id) on delete set null,
  case_id             uuid        references public.cases(id) on delete set null,
  channel             text,
  overall_status      text        not null check (overall_status in ('pass', 'warning', 'fail')),
  score               numeric     not null default 0 check (score >= 0 and score <= 100),
  summary             text        not null,
  findings            jsonb       not null default '[]'::jsonb,
  rules_passed        text[]      not null default array[]::text[],
  rules_failed        text[]      not null default array[]::text[],
  recommendations     text[]      not null default array[]::text[],
  reviewer_provider   text,
  reviewer_model      text,
  acknowledged        boolean     not null default false,
  acknowledged_at     timestamptz,
  acknowledged_by     uuid        references public.profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.kia_auditor_rule_results (
  id            uuid        primary key default gen_random_uuid(),
  review_id     uuid        not null references public.kia_auditor_reviews(id) on delete cascade,
  rule_id       text        not null,
  category      text        not null check (category in ('safety', 'privacy', 'business_flow', 'checkout', 'holded', 'tax', 'accounting', 'language', 'tone', 'consistency', 'tool_use')),
  severity      text        not null check (severity in ('info', 'warning', 'critical')),
  status        text        not null check (status in ('passed', 'failed', 'warning', 'skipped')),
  expected      text,
  actual        text,
  explanation   text,
  created_at    timestamptz not null default now()
);

create index if not exists kia_auditor_reviews_created_at_idx
  on public.kia_auditor_reviews (created_at desc);

create index if not exists kia_auditor_reviews_status_idx
  on public.kia_auditor_reviews (overall_status, created_at desc);

create index if not exists kia_auditor_reviews_decision_log_idx
  on public.kia_auditor_reviews (decision_log_id, created_at desc)
  where decision_log_id is not null;

create index if not exists kia_auditor_rule_results_review_idx
  on public.kia_auditor_rule_results (review_id);

create index if not exists kia_auditor_rule_results_rule_status_idx
  on public.kia_auditor_rule_results (rule_id, status, created_at desc);

alter table public.kia_auditor_reviews enable row level security;
alter table public.kia_auditor_rule_results enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'kia_auditor_reviews'
      and policyname = 'admin read kia_auditor_reviews'
  ) then
    create policy "admin read kia_auditor_reviews" on public.kia_auditor_reviews
      for select using (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'kia_auditor_reviews'
      and policyname = 'admin manage kia_auditor_reviews'
  ) then
    create policy "admin manage kia_auditor_reviews" on public.kia_auditor_reviews
      for all using (public.is_admin()) with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'kia_auditor_rule_results'
      and policyname = 'admin read kia_auditor_rule_results'
  ) then
    create policy "admin read kia_auditor_rule_results" on public.kia_auditor_rule_results
      for select using (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'kia_auditor_rule_results'
      and policyname = 'admin manage kia_auditor_rule_results'
  ) then
    create policy "admin manage kia_auditor_rule_results" on public.kia_auditor_rule_results
      for all using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

grant select on public.kia_auditor_reviews to authenticated;
grant select on public.kia_auditor_rule_results to authenticated;

grant select, insert, update, delete on public.kia_auditor_reviews to service_role;
grant select, insert, update, delete on public.kia_auditor_rule_results to service_role;

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'kia_behavior_anomalies'
      and constraint_name = 'kia_behavior_anomalies_anomaly_type_check'
  ) then
    alter table public.kia_behavior_anomalies
      drop constraint kia_behavior_anomalies_anomaly_type_check;
  end if;

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
end $$;
