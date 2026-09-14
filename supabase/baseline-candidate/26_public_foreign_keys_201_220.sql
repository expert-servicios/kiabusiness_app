-- Candidate current-schema baseline for issue #143.
-- Foreign keys 201-220 of 220. Apply only after all local PK/UNIQUE/CHECK constraints.

alter table public.user_files add constraint user_files_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.user_invitations add constraint user_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.user_invitations add constraint user_invitations_role_id_fkey FOREIGN KEY (role_id) REFERENCES user_roles(id) ON DELETE CASCADE;
alter table public.user_invitations add constraint user_invitations_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES user_workspaces(id) ON DELETE CASCADE;
alter table public.user_meetings add constraint user_meetings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.user_profiles_ext add constraint user_profiles_ext_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.user_sessions add constraint user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.user_team_members add constraint user_team_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.user_team_members add constraint user_team_members_role_id_fkey FOREIGN KEY (role_id) REFERENCES user_roles(id) ON DELETE SET NULL;
alter table public.user_team_members add constraint user_team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.user_team_members add constraint user_team_members_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES user_workspaces(id) ON DELETE CASCADE;
alter table public.user_tickets add constraint user_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.user_training_credits add constraint user_training_credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.user_workspaces add constraint user_workspaces_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.users_clients add constraint users_clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.usuarios add constraint usuarios_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.verifactu_queue add constraint verifactu_queue_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
alter table public.whatsapp_conversations add constraint whatsapp_conversations_case_id_fkey FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL;
alter table public.whatsapp_conversations add constraint whatsapp_conversations_client_id_fkey FOREIGN KEY (client_id) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.whatsapp_conversations add constraint whatsapp_conversations_reply_to_message_id_fkey FOREIGN KEY (reply_to_message_id) REFERENCES whatsapp_conversations(id) ON DELETE SET NULL;