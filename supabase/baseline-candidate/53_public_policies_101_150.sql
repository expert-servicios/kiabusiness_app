-- Candidate current-schema baseline for issue #143.
-- Public RLS policies 101-150 at snapshot gate 20260911174615.

create policy "admin all fiscal_obligations" on public.fiscal_obligations as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "client own fiscal_obligations" on public.fiscal_obligations as PERMISSIVE for SELECT to public using ((user_id = auth.uid()));
create policy "Allow admin full access to free_trial_requests" on public.free_trial_requests as PERMISSIVE for ALL to public using ((((auth.jwt() ->> 'email'::text) = 'expertestudiospro@gmail.com'::text) OR ((auth.jwt() ->> 'email'::text) = 'soy@kseniailicheva.com'::text)));
create policy "Allow public insert for free_trial_requests" on public.free_trial_requests as PERMISSIVE for INSERT to public with check (true);
create policy "Admin manages gmail tokens" on public.gmail_tokens as PERMISSIVE for ALL to authenticated using ((( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text)) with check ((( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text));
create policy "No client access" on public.gmail_tokens as RESTRICTIVE for ALL to authenticated using (false);
create policy "Users can manage own google tokens" on public.google_tokens as PERMISSIVE for ALL to public using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));
create policy "Admin full access" on public.holded_demos as PERMISSIVE for ALL to authenticated using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));
create policy "admin all holded_demos" on public.holded_demos as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy mcp_connections_deny_anon on public.holded_mcp_connections as PERMISSIVE for ALL to public using (false);
create policy mcp_events_deny_anon on public.holded_mcp_events as PERMISSIVE for ALL to public using (false);
create policy "users can read own mcp events" on public.holded_mcp_events as PERMISSIVE for SELECT to public using ((((auth.jwt() ->> 'email'::text) IS NOT NULL) AND (user_email = (auth.jwt() ->> 'email'::text))));
create policy "admin all holded_sync_jobs" on public.holded_sync_jobs as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "member read own sync jobs" on public.holded_sync_jobs as PERMISSIVE for SELECT to public using (((client_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM profile_companies pc
  WHERE ((pc.company_id = holded_sync_jobs.company_id) AND (pc.profile_id = auth.uid()))))));
create policy "Admins can delete all implementation_projects" on public.implementation_projects as PERMISSIVE for DELETE to public using (is_admin_user());
create policy "Admins can insert implementation_projects" on public.implementation_projects as PERMISSIVE for INSERT to public with check (is_admin_user());
create policy "Admins can update all implementation_projects" on public.implementation_projects as PERMISSIVE for UPDATE to public using (is_admin_user()) with check (is_admin_user());
create policy "Admins can view all implementation_projects" on public.implementation_projects as PERMISSIVE for SELECT to public using (is_admin_user());
create policy "admin all integration_sync_events" on public.integration_sync_events as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy internal_tasks_admin_all on public.internal_tasks as PERMISSIVE for ALL to authenticated using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'owner'::text]))))));
create policy "Admins can manage all invoices" on public.invoices as PERMISSIVE for ALL to public using (is_admin_email());
create policy "Admins can view all invoices" on public.invoices as PERMISSIVE for SELECT to public using (is_admin_email());
create policy "Users can insert own invoices" on public.invoices as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "Users can update own invoices" on public.invoices as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id));
create policy "Users can view own invoices" on public.invoices as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy "admin manage kia_auditor_reviews" on public.kia_auditor_reviews as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "admin read kia_auditor_reviews" on public.kia_auditor_reviews as PERMISSIVE for SELECT to public using (is_admin());
create policy "admin manage kia_auditor_rule_results" on public.kia_auditor_rule_results as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "admin read kia_auditor_rule_results" on public.kia_auditor_rule_results as PERMISSIVE for SELECT to public using (is_admin());
create policy "admin manage kia_behavior_anomalies" on public.kia_behavior_anomalies as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "admin read kia_behavior_anomalies" on public.kia_behavior_anomalies as PERMISSIVE for SELECT to public using (is_admin());
create policy cart_items_select_own on public.kia_cart_items as PERMISSIVE for SELECT to public using (((auth.uid() = client_id) OR (phone_number = ( SELECT kia_cart_items.phone_number
   FROM profiles
  WHERE (profiles.id = auth.uid())
 LIMIT 1))));
create policy cart_items_service_all on public.kia_cart_items as PERMISSIVE for ALL to public using ((auth.role() = 'service_role'::text)) with check ((auth.role() = 'service_role'::text));
create policy "admin manage kia_decision_logs" on public.kia_decision_logs as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "admin read kia_decision_logs" on public.kia_decision_logs as PERMISSIVE for SELECT to public using (is_admin());
create policy reports_select_own on public.kia_financial_reports as PERMISSIVE for SELECT to public using ((auth.uid() = client_id));
create policy reports_service_insert on public.kia_financial_reports as PERMISSIVE for INSERT to public with check (true);
create policy reports_service_update on public.kia_financial_reports as PERMISSIVE for UPDATE to public using (true);
create policy "admin manage kia_health_check_results" on public.kia_health_check_results as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "admin read kia_health_check_results" on public.kia_health_check_results as PERMISSIVE for SELECT to public using (is_admin());
create policy "admin manage kia_health_runs" on public.kia_health_runs as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "admin read kia_health_runs" on public.kia_health_runs as PERMISSIVE for SELECT to public using (is_admin());
create policy kia_reports_admin_select on public.kia_reports as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'staff'::text]))))));
create policy kia_reports_select_own on public.kia_reports as PERMISSIVE for SELECT to public using (((auth.uid() = client_id) OR (phone_number = ( SELECT kia_reports.phone_number
   FROM profiles
  WHERE (profiles.id = auth.uid())
 LIMIT 1))));
create policy kia_reports_service_all on public.kia_reports as PERMISSIVE for ALL to public using ((auth.role() = 'service_role'::text)) with check ((auth.role() = 'service_role'::text));
create policy "Service role full access" on public.kia_sessions as PERMISSIVE for ALL to public using (true);
create policy "admin all lead_stripe_customers" on public.lead_stripe_customers as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "admin all leads" on public.leads as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy service_role_only on public.manual_payments as PERMISSIVE for ALL to public using (false) with check (false);
create policy "admin all messages" on public.messages as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
