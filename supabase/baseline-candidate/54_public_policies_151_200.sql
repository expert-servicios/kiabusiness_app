-- Candidate current-schema baseline for issue #143.
-- Public RLS policies 151-200 at snapshot gate 20260911174615.

create policy "client own case messages" on public.messages as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM cases c
  WHERE ((c.id = messages.case_id) AND (c.client_id = auth.uid())))));
create policy "Allow admin full access to migration requests" on public.migration_requests as PERMISSIVE for ALL to public using ((auth.email() = 'expertestudiospro@gmail.com'::text));
create policy admin_only_ms365_tokens on public.ms365_tokens as PERMISSIVE for ALL to public using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));
create policy "admin all newsletter" on public.newsletter_subscribers as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "public insert newsletter" on public.newsletter_subscribers as PERMISSIVE for INSERT to public with check (true);
create policy nba_admin_all on public.next_best_actions as PERMISSIVE for ALL to authenticated using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'owner'::text]))))));
create policy obligations_calendar_admin_all on public.obligations_calendar as PERMISSIVE for ALL to authenticated using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'owner'::text])) AND (COALESCE(p.status, 'active'::text) <> 'inactive'::text))))) with check ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = ANY (ARRAY['admin'::text, 'owner'::text])) AND (COALESCE(p.status, 'active'::text) <> 'inactive'::text)))));
create policy "Users can insert their own orders" on public.orders as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "Users can view their own orders" on public.orders as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy "admin all orders" on public.orders as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "client view own orders" on public.orders as PERMISSIVE for SELECT to public using ((client_id = auth.uid()));
create policy "tenant_admin select orders" on public.orders as PERMISSIVE for SELECT to public using ((is_tenant_admin() AND (tenant_id = auth_tenant_id())));
create policy "Allow individual read access for own payments" on public.pagos_expert as PERMISSIVE for SELECT to public using (((auth.uid() = user_id) OR (customer_email = (auth.jwt() ->> 'email'::text))));
create policy "Allow individual read access on pagos_expert" on public.pagos_expert as PERMISSIVE for SELECT to public using ((auth.email() = customer_email));
create policy "Allow service_role full access on pagos_expert" on public.pagos_expert as PERMISSIVE for ALL to public using ((auth.role() = 'service_role'::text)) with check ((auth.role() = 'service_role'::text));
create policy "Allow service_role to insert payments" on public.pagos_expert as PERMISSIVE for INSERT to service_role with check (true);
create policy "Allow admin full access to presupuestos" on public.presupuestos_solicitados as PERMISSIVE for ALL to public using (((auth.jwt() ->> 'email'::text) = 'soy@kseniailicheva.com'::text));
create policy "Allow public insert for presupuestos" on public.presupuestos_solicitados as PERMISSIVE for INSERT to public with check (true);
create policy "admin all profile_companies" on public.profile_companies as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "member view own companies" on public.profile_companies as PERMISSIVE for SELECT to public using ((profile_id = auth.uid()));
create policy "Admins can manage all profiles" on public.profiles as PERMISSIVE for ALL to public using (is_admin_email());
create policy "Admins can view all profiles" on public.profiles as PERMISSIVE for SELECT to public using (is_admin_email());
create policy "Users can update own profile" on public.profiles as PERMISSIVE for UPDATE to public using ((auth.uid() = id));
create policy "Users can view own profile" on public.profiles as PERMISSIVE for SELECT to public using ((auth.uid() = id));
create policy "admin all profiles" on public.profiles as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "tenant_admin select profiles" on public.profiles as PERMISSIVE for SELECT to public using ((is_tenant_admin() AND (tenant_id = auth_tenant_id())));
create policy "user own profile" on public.profiles as PERMISSIVE for SELECT to public using ((id = auth.uid()));
create policy "user update own profile" on public.profiles as PERMISSIVE for UPDATE to public using ((id = auth.uid())) with check ((id = auth.uid()));
create policy "Admin can delete all projects" on public.proyectos as PERMISSIVE for DELETE to public using (((auth.jwt() ->> 'email'::text) = 'soy@kseniailicheva.com'::text));
create policy "Admin can insert projects" on public.proyectos as PERMISSIVE for INSERT to public with check (((auth.jwt() ->> 'email'::text) = 'soy@kseniailicheva.com'::text));
create policy "Admin can update all projects" on public.proyectos as PERMISSIVE for UPDATE to public using (((auth.jwt() ->> 'email'::text) = 'soy@kseniailicheva.com'::text));
create policy "Admin can view all projects" on public.proyectos as PERMISSIVE for SELECT to public using (((auth.jwt() ->> 'email'::text) = 'soy@kseniailicheva.com'::text));
create policy "Users can view own projects" on public.proyectos as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy "Allow admin full access" on public.public_support_tickets as PERMISSIVE for ALL to service_role using (true) with check (true);
create policy "Allow public insert for anyone" on public.public_support_tickets as PERMISSIVE for INSERT to public with check (true);
create policy "Users manage own subscriptions" on public.push_subscriptions as PERMISSIVE for ALL to public using ((auth.uid() = user_id)) with check ((auth.uid() = user_id));
create policy "admin all quote_templates" on public.quote_templates as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "admin all quotes" on public.quotes as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "client view own quotes" on public.quotes as PERMISSIVE for SELECT to public using ((client_id = auth.uid()));
create policy "tenant_admin select quotes" on public.quotes as PERMISSIVE for SELECT to public using ((is_tenant_admin() AND (tenant_id = auth_tenant_id())));
create policy "Admin full access for resources" on public.resources as PERMISSIVE for ALL to public using ((auth.email() = 'expertestudiospro@gmail.com'::text));
create policy "Public read access for resources" on public.resources as PERMISSIVE for SELECT to public using (true);
create policy "admin all review_requests" on public.review_requests as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "client view own review_requests" on public.review_requests as PERMISSIVE for SELECT to public using ((client_id = auth.uid()));
create policy "admin all reviews" on public.reviews as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy "client insert own reviews" on public.reviews as PERMISSIVE for INSERT to public with check ((client_id = auth.uid()));
create policy "public view published reviews" on public.reviews as PERMISSIVE for SELECT to public using ((published = true));
create policy "Anyone can view role_permissions" on public.role_permissions as PERMISSIVE for SELECT to public using (true);
create policy "admin all saas_leads" on public.saas_leads as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy security_alerts_deny_anon on public.security_alerts as PERMISSIVE for ALL to public using (false);
