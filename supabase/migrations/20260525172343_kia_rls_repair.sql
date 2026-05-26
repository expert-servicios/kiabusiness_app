-- Repair RLS and admin policies for Kia observability tables that may have
-- existed before the final migrations were applied.

alter table public.kia_decision_logs enable row level security;
alter table public.kia_health_runs enable row level security;
alter table public.kia_health_check_results enable row level security;
alter table public.kia_behavior_anomalies enable row level security;
alter table public.kia_auditor_reviews enable row level security;
alter table public.kia_auditor_rule_results enable row level security;
alter table public.client_integration_secrets enable row level security;

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
end $$;

grant select on public.kia_decision_logs to authenticated;
grant select on public.kia_health_runs to authenticated;
grant select on public.kia_health_check_results to authenticated;

grant select, insert, update, delete on public.kia_decision_logs to service_role;
grant select, insert, update, delete on public.kia_health_runs to service_role;
grant select, insert, update, delete on public.kia_health_check_results to service_role;

revoke all on public.client_integration_secrets from anon;
revoke all on public.client_integration_secrets from authenticated;
grant select, insert, update, delete on public.client_integration_secrets to service_role;
