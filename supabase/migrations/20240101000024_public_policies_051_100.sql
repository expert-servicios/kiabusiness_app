-- Candidate current-schema baseline for issue #143.
-- Public RLS policies 051-100 at snapshot gate 20260911174615.

create policy "user insert own suggestions" on public.company_data_suggestions as PERMISSIVE for INSERT to public with check ((profile_id = auth.uid()));
create policy "user read own suggestions" on public.company_data_suggestions as PERMISSIVE for SELECT to public using ((profile_id = auth.uid()));
create policy "user update own suggestions" on public.company_data_suggestions as PERMISSIVE for UPDATE to public using ((profile_id = auth.uid())) with check ((profile_id = auth.uid()));
create policy company_fiscal_templates_admin_all on public.company_fiscal_templates as PERMISSIVE for ALL to authenticated using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'owner'::text])) AND (COALESCE(p.status, 'active'::text) <> 'inactive'::text))))) with check ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'owner'::text])) AND (COALESCE(p.status, 'active'::text) <> 'inactive'::text)))));
create policy "admin all query logs" on public.company_open_data_query_logs as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "user insert query logs" on public.company_open_data_query_logs as PERMISSIVE for INSERT to public with check (((profile_id = auth.uid()) OR (profile_id IS NULL)));
create policy "user read own query logs" on public.company_open_data_query_logs as PERMISSIVE for SELECT to public using ((profile_id = auth.uid()));
create policy "Clients read own audit logs" on public.connector_audit_logs as PERMISSIVE for SELECT to public using ((client_id = auth.uid()));
create policy "Service role full access on audit_logs" on public.connector_audit_logs as PERMISSIVE for ALL to public using ((auth.role() = 'service_role'::text));
create policy "Clients read own connector instances" on public.connector_instances as PERMISSIVE for SELECT to public using ((client_id = auth.uid()));
create policy "Service role full access on connector_instances" on public.connector_instances as PERMISSIVE for ALL to public using ((auth.role() = 'service_role'::text));
create policy "Clients read own usage events" on public.connector_usage_events as PERMISSIVE for SELECT to public using ((client_id = auth.uid()));
create policy "Service role full access on usage_events" on public.connector_usage_events as PERMISSIVE for ALL to public using ((auth.role() = 'service_role'::text));
create policy "Admin full access for contact_messages" on public.contact_messages as PERMISSIVE for ALL to public using ((auth.email() = 'expertestudiospro@gmail.com'::text));
create policy "Public insert for contact_messages" on public.contact_messages as PERMISSIVE for INSERT to public with check (true);
create policy "Allow admin full access" on public.contact_requests as PERMISSIVE for ALL to authenticated using (((auth.jwt() ->> 'email'::text) = 'soy@kseniailicheva.com'::text)) with check (((auth.jwt() ->> 'email'::text) = 'soy@kseniailicheva.com'::text));
create policy "Allow anonymous insert" on public.contact_requests as PERMISSIVE for INSERT to anon, authenticated with check (true);
create policy "Allow anonymous insert contacts" on public.contacts as PERMISSIVE for INSERT to public with check (true);
create policy "Allow authenticated select contacts" on public.contacts as PERMISSIVE for SELECT to public using ((auth.role() = 'authenticated'::text));
create policy "Allow admin full access to demo requests" on public.demo_requests as PERMISSIVE for ALL to public using ((auth.email() = 'expertestudiospro@gmail.com'::text));
create policy "Allow public insert for demo requests" on public.demo_requests as PERMISSIVE for INSERT to public with check (true);
create policy doc_classifications_admin_all on public.document_classifications as PERMISSIVE for ALL to authenticated using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'owner'::text]))))));
create policy doc_classifications_client_select on public.document_classifications as PERMISSIVE for SELECT to authenticated using ((client_id = auth.uid()));
create policy "admin all documents" on public.documents as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "client insert own documents" on public.documents as PERMISSIVE for INSERT to public with check ((client_id = auth.uid()));
create policy "client view own documents" on public.documents as PERMISSIVE for SELECT to public using ((client_id = auth.uid()));
create policy "tenant_admin all documents" on public.documents as PERMISSIVE for ALL to public using ((is_tenant_admin() AND (client_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.tenant_id = auth_tenant_id())))));
create policy "admin all email attachment documents" on public.email_attachment_documents as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "admin all email_events" on public.email_events as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy service_role_only on public.email_inbox_cache as PERMISSIVE for ALL to public using (false) with check (false);
create policy "admin all email_queue" on public.email_queue as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "Admin manages email threads" on public.email_threads as PERMISSIVE for ALL to authenticated using ((( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text)) with check ((( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = 'admin'::text));
create policy "admin all expert_companies" on public.expert_companies as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "member read expert_company" on public.expert_companies as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM expert_profile_companies pc
  WHERE ((pc.company_id = expert_companies.id) AND (pc.profile_id = auth.uid())))));
create policy "owner manage expert_company" on public.expert_companies as PERMISSIVE for ALL to public using ((EXISTS ( SELECT 1
   FROM expert_profile_companies pc
  WHERE ((pc.company_id = expert_companies.id) AND (pc.profile_id = auth.uid()) AND (pc.role = 'owner'::text))))) with check ((EXISTS ( SELECT 1
   FROM expert_profile_companies pc
  WHERE ((pc.company_id = expert_companies.id) AND (pc.profile_id = auth.uid()) AND (pc.role = 'owner'::text)))));
create policy "admin all expert_orders" on public.expert_orders as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "client own expert_orders" on public.expert_orders as PERMISSIVE for SELECT to public using ((client_id = auth.uid()));
create policy "admin all expert_profile_companies" on public.expert_profile_companies as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "user own expert_profile_companies" on public.expert_profile_companies as PERMISSIVE for ALL to public using ((profile_id = auth.uid())) with check ((profile_id = auth.uid()));
create policy "Allow admin full access" on public.express_consultations as PERMISSIVE for ALL to public using ((auth.email() = 'expertestudiospro@gmail.com'::text)) with check ((auth.email() = 'expertestudiospro@gmail.com'::text));
create policy "Allow public insert for anyone" on public.express_consultations as PERMISSIVE for INSERT to public with check (true);
create policy "admin all external_mappings" on public.external_mappings as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "Admins can manage all files" on public.files as PERMISSIVE for ALL to public using (is_admin_email());
create policy "Admins can view all files" on public.files as PERMISSIVE for SELECT to public using (is_admin_email());
create policy "Users can delete own files" on public.files as PERMISSIVE for DELETE to public using ((auth.uid() = user_id));
create policy "Users can insert own files" on public.files as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "Users can view own files" on public.files as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy "Admins can manage all fiscal obligations" on public.fiscal_obligations as PERMISSIVE for ALL to public using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));
create policy "Users can read own fiscal obligations" on public.fiscal_obligations as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy "Users can update own fiscal obligations" on public.fiscal_obligations as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));
