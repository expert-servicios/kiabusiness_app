-- Kia structured AI decision logs.
-- Stores audit summaries only; never store chain-of-thought, raw documents, API keys, or secrets.

create table if not exists public.kia_decision_logs (
  id                       uuid        primary key default gen_random_uuid(),
  provider                 text,
  model                    text,
  task_type                text        not null,
  channel                  text        not null,
  contact_status           text,
  client_id                uuid        references public.profiles(id) on delete set null,
  lead_id                  uuid        references public.leads(id) on delete set null,
  case_id                  uuid        references public.cases(id) on delete set null,
  company_id               uuid        references public.companies(id) on delete set null,
  input_hash               text,
  output_json              jsonb       not null default '{}'::jsonb,
  decision_summary         text,
  rules_applied            jsonb       not null default '[]'::jsonb,
  confidence               numeric,
  requires_meeting         boolean     not null default false,
  requires_manual_review   boolean     not null default false,
  tool_calls               jsonb       not null default '[]'::jsonb,
  tool_results_summary     jsonb       not null default '[]'::jsonb,
  error                    text,
  created_at               timestamptz not null default now()
);

create index if not exists kia_decision_logs_created_at_idx
  on public.kia_decision_logs (created_at desc);

create index if not exists kia_decision_logs_task_channel_idx
  on public.kia_decision_logs (task_type, channel, created_at desc);

create index if not exists kia_decision_logs_client_idx
  on public.kia_decision_logs (client_id, created_at desc)
  where client_id is not null;

alter table public.kia_decision_logs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'kia_decision_logs'
      and policyname = 'admin read kia_decision_logs'
  ) then
    create policy "admin read kia_decision_logs" on public.kia_decision_logs
      for select using (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'kia_decision_logs'
      and policyname = 'admin manage kia_decision_logs'
  ) then
    create policy "admin manage kia_decision_logs" on public.kia_decision_logs
      for all using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

grant select on public.kia_decision_logs to authenticated;
grant select, insert, update, delete on public.kia_decision_logs to service_role;
