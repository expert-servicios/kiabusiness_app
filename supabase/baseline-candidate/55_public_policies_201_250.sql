-- Candidate current-schema baseline for issue #143.
-- Public RLS policies 201-250 at snapshot gate 20260911174615.

create policy "Public read access metrics" on public.service_metrics as PERMISSIVE for SELECT to public using (true);
create policy profitability_events_admin_all on public.service_profitability_events as PERMISSIVE for ALL to authenticated using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'owner'::text]))))));
create policy profitability_snapshots_admin_all on public.service_profitability_snapshots as PERMISSIVE for ALL to authenticated using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'owner'::text]))))));
create policy "Users can insert own assessments" on public.service_readiness_assessments as PERMISSIVE for INSERT to public with check (((auth.uid() = user_id) OR (user_id IS NULL)));
create policy "Users can read own assessments" on public.service_readiness_assessments as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy "Admin full access to responses" on public.service_review_responses as PERMISSIVE for ALL to public using ((auth.email() = 'expertestudiospro@gmail.com'::text));
create policy "Public read access to responses" on public.service_review_responses as PERMISSIVE for SELECT to public using (true);
create policy "Allow admin full access to service_reviews" on public.service_reviews as PERMISSIVE for ALL to public using ((auth.email() = 'expertestudiospro@gmail.com'::text)) with check ((auth.email() = 'expertestudiospro@gmail.com'::text));
create policy "Allow authenticated users to insert service_reviews" on public.service_reviews as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "Allow public read access to approved service_reviews" on public.service_reviews as PERMISSIVE for SELECT to public using ((status = 'approved'::text));
create policy "Allow users to update their own service_reviews" on public.service_reviews as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));
create policy "Public read access services" on public.services as PERMISSIVE for SELECT to public using ((status = 'active'::text));
create policy "Allow individual read access on servicios_cliente" on public.servicios_cliente as PERMISSIVE for SELECT to public using ((auth.email() = email));
create policy "Admin can delete all sessions" on public.sesiones as PERMISSIVE for DELETE to public using (((auth.jwt() ->> 'email'::text) = 'soy@kseniailicheva.com'::text));
create policy "Admin can insert sessions" on public.sesiones as PERMISSIVE for INSERT to public with check (((auth.jwt() ->> 'email'::text) = 'soy@kseniailicheva.com'::text));
create policy "Admin can update all sessions" on public.sesiones as PERMISSIVE for UPDATE to public using (((auth.jwt() ->> 'email'::text) = 'soy@kseniailicheva.com'::text));
create policy "Admin can view all sessions" on public.sesiones as PERMISSIVE for SELECT to public using (((auth.jwt() ->> 'email'::text) = 'soy@kseniailicheva.com'::text));
create policy "Users can view own sessions" on public.sesiones as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy "Users can manage their own session history" on public.session_history as PERMISSIVE for ALL to public using ((auth.uid() = user_id));
create policy "Allow admin full access" on public.site_config as PERMISSIVE for ALL to public using (((auth.jwt() ->> 'email'::text) = ANY (ARRAY['soy@kseniailicheva.com'::text, 'expertestudiospro@gmail.com'::text])));
create policy "Allow public read access" on public.site_config as PERMISSIVE for SELECT to public using (true);
create policy "Allow admin read access to subscribers" on public.subscribers as PERMISSIVE for SELECT to public using ((auth.email() = 'expertestudiospro@gmail.com'::text));
create policy "Allow public insert for subscribers" on public.subscribers as PERMISSIVE for INSERT to public with check (true);
create policy "Clients read own entitlements" on public.subscription_entitlements as PERMISSIVE for SELECT to public using ((client_id = auth.uid()));
create policy "Service role full access on entitlements" on public.subscription_entitlements as PERMISSIVE for ALL to public using ((auth.role() = 'service_role'::text));
create policy subscription_trials_client_read on public.subscription_trials as PERMISSIVE for SELECT to authenticated using ((auth.uid() = client_id));
create policy subscription_trials_service_role_all on public.subscription_trials as PERMISSIVE for ALL to service_role using (true) with check (true);
create policy "admin all subscriptions" on public.subscriptions as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "client own subscriptions" on public.subscriptions as PERMISSIVE for SELECT to public using ((client_id = auth.uid()));
create policy "Admins can manage all tickets" on public.support_tickets as PERMISSIVE for ALL to public using (is_admin_email());
create policy "Admins can view all tickets" on public.support_tickets as PERMISSIVE for SELECT to public using (is_admin_email());
create policy "Users can insert own tickets" on public.support_tickets as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "Users can update own tickets" on public.support_tickets as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id));
create policy "Users can view own tickets" on public.support_tickets as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy service_role_only on public.system_kv as PERMISSIVE for ALL to public using (false) with check (false);
create policy "authenticated read own tenant" on public.tenants as PERMISSIVE for SELECT to public using ((id IN ( SELECT profiles.tenant_id
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.tenant_id IS NOT NULL)))));
create policy "Admins full access" on public.training_orders as PERMISSIVE for ALL to public using (is_admin_email());
create policy "Users can insert own training orders" on public.training_orders as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "Users can update own training orders" on public.training_orders as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id));
create policy "Users can view own training orders" on public.training_orders as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy "Admins can delete all training_sessions" on public.training_sessions as PERMISSIVE for DELETE to public using (is_admin_user());
create policy "Admins can insert training_sessions" on public.training_sessions as PERMISSIVE for INSERT to public with check (is_admin_user());
create policy "Admins can update all training_sessions" on public.training_sessions as PERMISSIVE for UPDATE to public using (is_admin_user()) with check (is_admin_user());
create policy "Admins can view all training_sessions" on public.training_sessions as PERMISSIVE for SELECT to public using (is_admin_user());
create policy "Users can manage their own files" on public.user_files as PERMISSIVE for ALL to public using ((auth.uid() = user_id));
create policy "Users can view invitations in their workspace" on public.user_invitations as PERMISSIVE for SELECT to public using (((workspace_id IN ( SELECT user_team_members.workspace_id
   FROM user_team_members
  WHERE (user_team_members.user_id = auth.uid()))) OR (workspace_id IN ( SELECT user_workspaces.id
   FROM user_workspaces
  WHERE (user_workspaces.owner_id = auth.uid())))));
create policy "Workspace owners can delete invitations" on public.user_invitations as PERMISSIVE for DELETE to public using ((workspace_id IN ( SELECT user_workspaces.id
   FROM user_workspaces
  WHERE (user_workspaces.owner_id = auth.uid()))));
create policy "Workspace owners can insert invitations" on public.user_invitations as PERMISSIVE for INSERT to public with check ((workspace_id IN ( SELECT user_workspaces.id
   FROM user_workspaces
  WHERE (user_workspaces.owner_id = auth.uid()))));
create policy "Workspace owners can update invitations" on public.user_invitations as PERMISSIVE for UPDATE to public using ((workspace_id IN ( SELECT user_workspaces.id
   FROM user_workspaces
  WHERE (user_workspaces.owner_id = auth.uid())))) with check ((workspace_id IN ( SELECT user_workspaces.id
   FROM user_workspaces
  WHERE (user_workspaces.owner_id = auth.uid()))));
create policy "Users can manage their own meetings" on public.user_meetings as PERMISSIVE for ALL to public using ((auth.uid() = user_id));
