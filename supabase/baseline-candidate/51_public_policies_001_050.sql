-- Candidate current-schema baseline for issue #143.
-- Public RLS policies 001-050 at snapshot gate 20260911174615.

create policy "admin all academy_enrollments" on public.academy_enrollments as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "client own academy_enrollments" on public.academy_enrollments as PERMISSIVE for SELECT to public using ((client_id = auth.uid()));
create policy "admin all academy_knowledge_status" on public.academy_knowledge_status as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "admin staff create custom email folders" on public.admin_email_folders as PERMISSIVE for INSERT to authenticated with check (((is_system = false) AND (system_key IS NULL) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'owner'::text])) AND (COALESCE(p.status, 'active'::text) <> 'inactive'::text))))));
create policy "admin staff delete custom email folders" on public.admin_email_folders as PERMISSIVE for DELETE to authenticated using (((is_system = false) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'owner'::text])) AND (COALESCE(p.status, 'active'::text) <> 'inactive'::text))))));
create policy "admin staff read email folders" on public.admin_email_folders as PERMISSIVE for SELECT to authenticated using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'owner'::text])) AND (COALESCE(p.status, 'active'::text) <> 'inactive'::text)))));
create policy "admin staff update custom email folders" on public.admin_email_folders as PERMISSIVE for UPDATE to authenticated using (((is_system = false) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'owner'::text])) AND (COALESCE(p.status, 'active'::text) <> 'inactive'::text)))))) with check (((is_system = false) AND (system_key IS NULL) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'owner'::text])) AND (COALESCE(p.status, 'active'::text) <> 'inactive'::text))))));
create policy "admin staff manage email item state" on public.admin_email_item_state as PERMISSIVE for ALL to authenticated using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'owner'::text])) AND (COALESCE(p.status, 'active'::text) <> 'inactive'::text))))) with check ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'owner'::text])) AND (COALESCE(p.status, 'active'::text) <> 'inactive'::text)))));
create policy "Admin users can view admin_users table" on public.admin_users as PERMISSIVE for SELECT to public using ((auth.uid() IN ( SELECT admin_users_1.user_id
   FROM admin_users admin_users_1)));
create policy "admin read ai_logs" on public.ai_logs as PERMISSIVE for SELECT to public using (is_admin());
create policy "Admin full access for appointments" on public.appointments as PERMISSIVE for ALL to public using ((auth.email() = 'expertestudiospro@gmail.com'::text));
create policy "Public insert for appointments" on public.appointments as PERMISSIVE for INSERT to public with check (true);
create policy admin_all_appointments on public.appointments as PERMISSIVE for ALL to public using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));
create policy anyone_insert_appointments on public.appointments as PERMISSIVE for INSERT to public with check (true);
create policy "admin all audit_logs" on public.audit_logs as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "admin all automation_settings" on public.automation_settings as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "Admin can do everything" on public.blog_posts as PERMISSIVE for ALL to public using (((auth.jwt() ->> 'email'::text) = 'soy@kseniailicheva.com'::text));
create policy "Public can view published posts" on public.blog_posts as PERMISSIVE for SELECT to public using ((estado = 'publicado'::text));
create policy "Allow anonymous insert bookings" on public.bookings as PERMISSIVE for INSERT to public with check (true);
create policy "Allow authenticated select bookings" on public.bookings as PERMISSIVE for SELECT to public using ((auth.role() = 'authenticated'::text));
create policy service_role_only on public.campaign_sends as PERMISSIVE for ALL to public using (false) with check (false);
create policy service_role_only on public.campaigns as PERMISSIVE for ALL to public using (false) with check (false);
create policy "admin all case_documents" on public.case_documents as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "client own case_documents" on public.case_documents as PERMISSIVE for SELECT to public using ((client_id = auth.uid()));
create policy "admin all cases" on public.cases as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "client own cases" on public.cases as PERMISSIVE for SELECT to public using ((client_id = auth.uid()));
create policy "tenant_admin all cases" on public.cases as PERMISSIVE for ALL to public using ((is_tenant_admin() AND (tenant_id = auth_tenant_id())));
create policy "tenant_admin select cases" on public.cases as PERMISSIVE for SELECT to public using ((is_tenant_admin() AND (client_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.tenant_id = auth_tenant_id())))));
create policy "Public read access categories" on public.categories as PERMISSIVE for SELECT to public using (true);
create policy "Enable insert for authenticated users" on public.checkout_sessions as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "Enable read access for users to their own sessions" on public.checkout_sessions as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy "Enable service role full access" on public.checkout_sessions as PERMISSIVE for ALL to public using ((auth.role() = 'service_role'::text));
create policy "admin all accounting records" on public.client_accounting_records as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "member read own accounting records" on public.client_accounting_records as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM profile_companies pc
  WHERE ((pc.company_id = client_accounting_records.company_id) AND (pc.profile_id = auth.uid())))));
create policy "admin all client_integrations" on public.client_integrations as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "member read own integration" on public.client_integrations as PERMISSIVE for SELECT to public using (((client_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM profile_companies pc
  WHERE ((pc.company_id = client_integrations.company_id) AND (pc.profile_id = auth.uid()))))));
create policy "owner write own integration" on public.client_integrations as PERMISSIVE for ALL to public using (((client_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM profile_companies pc
  WHERE ((pc.company_id = client_integrations.company_id) AND (pc.profile_id = auth.uid()) AND (pc.role = 'owner'::text)))))) with check (((client_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM profile_companies pc
  WHERE ((pc.company_id = client_integrations.company_id) AND (pc.profile_id = auth.uid()) AND (pc.role = 'owner'::text))))));
create policy "Admins can delete all client_portal_invoices" on public.client_portal_invoices as PERMISSIVE for DELETE to public using (is_admin_user());
create policy "Admins can insert client_portal_invoices" on public.client_portal_invoices as PERMISSIVE for INSERT to public with check (is_admin_user());
create policy "Admins can update all client_portal_invoices" on public.client_portal_invoices as PERMISSIVE for UPDATE to public using (is_admin_user()) with check (is_admin_user());
create policy "Admins can view all client_portal_invoices" on public.client_portal_invoices as PERMISSIVE for SELECT to public using (is_admin_user());
create policy admins_can_view_all_requests on public.client_service_requests as PERMISSIVE for SELECT to public using (( SELECT (usuarios.roles @> '["admin"]'::jsonb)
   FROM usuarios
  WHERE (usuarios.id = auth.uid())));
create policy owner_can_select_own_requests on public.client_service_requests as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy "Admins can delete companies" on public.companies as PERMISSIVE for DELETE to public using (is_admin_email());
create policy "Users can insert own companies" on public.companies as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "Users can update own companies" on public.companies as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id));
create policy "Users can view own companies" on public.companies as PERMISSIVE for SELECT to public using (((auth.uid() = user_id) OR is_admin_email()));
create policy "tenant_admin select companies" on public.companies as PERMISSIVE for SELECT to public using ((is_tenant_admin() AND (tenant_id = auth_tenant_id())));
create policy "Admins read source logs" on public.company_data_sources_log as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'collaborator'::text]))))));
create policy "admin all suggestions" on public.company_data_suggestions as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
