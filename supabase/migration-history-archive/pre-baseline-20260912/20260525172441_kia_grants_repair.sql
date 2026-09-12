-- Tighten table-level grants for Kia observability/admin tables.
--
-- RLS is the main row-level guard, but table privileges should not expose
-- admin-only tables to anon, and authenticated users only need SELECT through
-- admin policies. Server routes use service_role for writes.

revoke all on public.kia_decision_logs from anon;
revoke all on public.kia_health_runs from anon;
revoke all on public.kia_health_check_results from anon;
revoke all on public.kia_behavior_anomalies from anon;
revoke all on public.kia_auditor_reviews from anon;
revoke all on public.kia_auditor_rule_results from anon;
revoke all on public.client_integration_secrets from anon;

revoke all on public.kia_decision_logs from authenticated;
revoke all on public.kia_health_runs from authenticated;
revoke all on public.kia_health_check_results from authenticated;
revoke all on public.kia_behavior_anomalies from authenticated;
revoke all on public.kia_auditor_reviews from authenticated;
revoke all on public.kia_auditor_rule_results from authenticated;
revoke all on public.client_integration_secrets from authenticated;

grant select on public.kia_decision_logs to authenticated;
grant select on public.kia_health_runs to authenticated;
grant select on public.kia_health_check_results to authenticated;
grant select on public.kia_behavior_anomalies to authenticated;
grant select on public.kia_auditor_reviews to authenticated;
grant select on public.kia_auditor_rule_results to authenticated;

grant select, insert, update, delete on public.kia_decision_logs to service_role;
grant select, insert, update, delete on public.kia_health_runs to service_role;
grant select, insert, update, delete on public.kia_health_check_results to service_role;
grant select, insert, update, delete on public.kia_behavior_anomalies to service_role;
grant select, insert, update, delete on public.kia_auditor_reviews to service_role;
grant select, insert, update, delete on public.kia_auditor_rule_results to service_role;
grant select, insert, update, delete on public.client_integration_secrets to service_role;
