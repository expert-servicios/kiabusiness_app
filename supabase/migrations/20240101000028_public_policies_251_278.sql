-- Candidate current-schema baseline for issue #143.
-- Public RLS policies 251-278 at snapshot gate 20260911174615.

create policy "Admins can delete all profiles" on public.user_profiles_ext as PERMISSIVE for DELETE to public using (is_admin_user());
create policy "Admins can insert profiles" on public.user_profiles_ext as PERMISSIVE for INSERT to public with check (is_admin_user());
create policy "Admins can update all profiles" on public.user_profiles_ext as PERMISSIVE for UPDATE to public using (is_admin_user()) with check (is_admin_user());
create policy "Admins can view all profiles" on public.user_profiles_ext as PERMISSIVE for SELECT to public using (is_admin_user());
create policy "Users can delete own profile" on public.user_profiles_ext as PERMISSIVE for DELETE to public using ((auth.uid() = id));
create policy "Users can insert own profile" on public.user_profiles_ext as PERMISSIVE for INSERT to public with check ((auth.uid() = id));
create policy "Users can update own profile" on public.user_profiles_ext as PERMISSIVE for UPDATE to public using ((auth.uid() = id)) with check ((auth.uid() = id));
create policy "Users can view own profile" on public.user_profiles_ext as PERMISSIVE for SELECT to public using ((auth.uid() = id));
create policy "Anyone can view roles" on public.user_roles as PERMISSIVE for SELECT to public using (true);
create policy "Admins can delete all user_services" on public.user_services as PERMISSIVE for DELETE to public using (is_admin_user());
create policy "Admins can insert user_services" on public.user_services as PERMISSIVE for INSERT to public with check (is_admin_user());
create policy "Admins can update all user_services" on public.user_services as PERMISSIVE for UPDATE to public using (is_admin_user()) with check (is_admin_user());
create policy "Admins can view all user_services" on public.user_services as PERMISSIVE for SELECT to public using (is_admin_user());
create policy "Users can manage their own sessions" on public.user_sessions as PERMISSIVE for ALL to public using ((auth.uid() = user_id));
create policy "Users can view team members in their workspace" on public.user_team_members as PERMISSIVE for SELECT to public using (((workspace_id IN ( SELECT user_team_members_1.workspace_id
   FROM user_team_members user_team_members_1
  WHERE (user_team_members_1.user_id = auth.uid()))) OR (workspace_id IN ( SELECT user_workspaces.id
   FROM user_workspaces
  WHERE (user_workspaces.owner_id = auth.uid())))));
create policy "Workspace owners can delete team members" on public.user_team_members as PERMISSIVE for DELETE to public using ((workspace_id IN ( SELECT user_workspaces.id
   FROM user_workspaces
  WHERE (user_workspaces.owner_id = auth.uid()))));
create policy "Workspace owners can insert team members" on public.user_team_members as PERMISSIVE for INSERT to public with check ((workspace_id IN ( SELECT user_workspaces.id
   FROM user_workspaces
  WHERE (user_workspaces.owner_id = auth.uid()))));
create policy "Workspace owners can update team members" on public.user_team_members as PERMISSIVE for UPDATE to public using ((workspace_id IN ( SELECT user_workspaces.id
   FROM user_workspaces
  WHERE (user_workspaces.owner_id = auth.uid())))) with check ((workspace_id IN ( SELECT user_workspaces.id
   FROM user_workspaces
  WHERE (user_workspaces.owner_id = auth.uid()))));
create policy "Users can manage their own tickets" on public.user_tickets as PERMISSIVE for ALL to public using ((auth.uid() = user_id));
create policy "Users can create workspaces" on public.user_workspaces as PERMISSIVE for INSERT to public with check ((auth.uid() = owner_id));
create policy "Users can update their workspaces" on public.user_workspaces as PERMISSIVE for UPDATE to public using ((owner_id = auth.uid())) with check ((owner_id = auth.uid()));
create policy "Users can view their workspaces" on public.user_workspaces as PERMISSIVE for SELECT to public using (((owner_id = auth.uid()) OR (id IN ( SELECT user_team_members.workspace_id
   FROM user_team_members
  WHERE (user_team_members.user_id = auth.uid())))));
create policy "Users can insert their own client profile" on public.users_clients as PERMISSIVE for INSERT to public with check ((auth.uid() = user_id));
create policy "Users can update their own client profile" on public.users_clients as PERMISSIVE for UPDATE to public using ((auth.uid() = user_id));
create policy "Users can view their own client profile" on public.users_clients as PERMISSIVE for SELECT to public using ((auth.uid() = user_id));
create policy "admin all viability_assessments" on public.viability_assessments as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
create policy service_role_all on public.viability_assessments as PERMISSIVE for ALL to service_role using (true) with check (true);
create policy "admin manage whatsapp" on public.whatsapp_conversations as PERMISSIVE for ALL to public using (is_admin()) with check (is_admin());
