-- Candidate current-schema baseline for issue #143.
-- Legacy snapshot tail: constraints 501-553 from the pre-20260911174615 catalog.
-- After the concurrent client_accounting_records migration these map to current
-- positions 506-558; names/definitions are unchanged.

alter table public.training_orders add constraint training_orders_pkey PRIMARY KEY (id);
alter table public.training_orders add constraint training_orders_status_check CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'scheduled'::text, 'completed'::text, 'cancelled'::text]));
alter table public.training_orders add constraint training_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
alter table public.training_sessions add constraint training_sessions_pkey PRIMARY KEY (id);
alter table public.user_files add constraint user_files_pkey PRIMARY KEY (id);
alter table public.user_files add constraint user_files_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.user_invitations add constraint user_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.user_invitations add constraint user_invitations_pkey PRIMARY KEY (id);
alter table public.user_invitations add constraint user_invitations_role_id_fkey FOREIGN KEY (role_id) REFERENCES user_roles(id) ON DELETE CASCADE;
alter table public.user_invitations add constraint user_invitations_status_check CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'expired'::text]));
alter table public.user_invitations add constraint user_invitations_token_key UNIQUE (token);
alter table public.user_invitations add constraint user_invitations_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES user_workspaces(id) ON DELETE CASCADE;
alter table public.user_meetings add constraint user_meetings_pkey PRIMARY KEY (id);
alter table public.user_meetings add constraint user_meetings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.user_profiles_ext add constraint user_profiles_ext_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.user_profiles_ext add constraint user_profiles_ext_pkey PRIMARY KEY (id);
alter table public.user_roles add constraint user_roles_pkey PRIMARY KEY (id);
alter table public.user_roles add constraint user_roles_role_name_key UNIQUE (role_name);
alter table public.user_services add constraint user_services_pkey PRIMARY KEY (id);
alter table public.user_sessions add constraint user_sessions_pkey PRIMARY KEY (id);
alter table public.user_sessions add constraint user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.user_team_members add constraint user_team_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.user_team_members add constraint user_team_members_pkey PRIMARY KEY (id);
alter table public.user_team_members add constraint user_team_members_role_id_fkey FOREIGN KEY (role_id) REFERENCES user_roles(id) ON DELETE SET NULL;
alter table public.user_team_members add constraint user_team_members_status_check CHECK (status = ANY (ARRAY['active'::text, 'invited'::text, 'inactive'::text]));
alter table public.user_team_members add constraint user_team_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.user_team_members add constraint user_team_members_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES user_workspaces(id) ON DELETE CASCADE;
alter table public.user_team_members add constraint user_team_members_workspace_id_user_id_key UNIQUE (workspace_id, user_id);
alter table public.user_tickets add constraint user_tickets_pkey PRIMARY KEY (id);
alter table public.user_tickets add constraint user_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.user_training_credits add constraint user_training_credits_pkey PRIMARY KEY (id);
alter table public.user_training_credits add constraint user_training_credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.user_training_credits add constraint user_training_credits_user_id_key UNIQUE (user_id);
alter table public.user_workspaces add constraint user_workspaces_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.user_workspaces add constraint user_workspaces_pkey PRIMARY KEY (id);
alter table public.users add constraint users_email_key UNIQUE (email);
alter table public.users add constraint users_pkey PRIMARY KEY (id);
alter table public.users_clients add constraint users_clients_pkey PRIMARY KEY (id);
alter table public.users_clients add constraint users_clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.usuarios add constraint usuarios_email_key UNIQUE (email);
alter table public.usuarios add constraint usuarios_estado_check CHECK (estado = ANY (ARRAY['activo'::text, 'pendiente'::text, 'suspendido'::text]));
alter table public.usuarios add constraint usuarios_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.usuarios add constraint usuarios_kyc_estado_check CHECK (kyc_estado = ANY (ARRAY['pendiente'::text, 'verificado'::text, 'rechazado'::text]));
alter table public.usuarios add constraint usuarios_pkey PRIMARY KEY (id);
alter table public.verifactu_queue add constraint verifactu_queue_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
alter table public.verifactu_queue add constraint verifactu_queue_pkey PRIMARY KEY (id);
alter table public.viability_assessments add constraint viability_assessments_ai_result_check CHECK (ai_result = ANY (ARRAY['viable'::text, 'parcial'::text, 'no_viable'::text]));
alter table public.viability_assessments add constraint viability_assessments_pkey PRIMARY KEY (id);
alter table public.whatsapp_conversations add constraint whatsapp_conversations_case_id_fkey FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL;
alter table public.whatsapp_conversations add constraint whatsapp_conversations_client_id_fkey FOREIGN KEY (client_id) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public.whatsapp_conversations add constraint whatsapp_conversations_direction_check CHECK (direction = ANY (ARRAY['inbound'::text, 'outbound'::text]));
alter table public.whatsapp_conversations add constraint whatsapp_conversations_pkey PRIMARY KEY (id);
alter table public.whatsapp_conversations add constraint whatsapp_conversations_reply_to_message_id_fkey FOREIGN KEY (reply_to_message_id) REFERENCES whatsapp_conversations(id) ON DELETE SET NULL;
