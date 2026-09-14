-- Candidate current-schema baseline for issue #143.
-- Tables 121-155, extracted from production catalog on 2026-09-11.
-- Constraints, indexes, RLS, functions, triggers and grants are layered separately.

-- 121 session_history
create table public.session_history (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  session_date timestamp with time zone,
  session_type text,
  duration_minutes integer,
  topic text,
  notes text,
  created_at timestamp with time zone default now()
);

-- 122 settings
create table public.settings (
  company_id uuid not null,
  invoice_series text default 'A'::text,
  next_invoice_number integer default 1,
  default_tax_rate numeric default 21,
  verifactu_opt_in boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone,
  verifactu_mode text default 'non_verifactu'::text,
  legal_name text,
  tax_office_code text
);

-- 123 shareholders
create table public.shareholders (
  id uuid default gen_random_uuid() not null,
  company_id uuid not null,
  full_name text not null,
  nif text,
  participation numeric,
  data jsonb,
  created_at timestamp with time zone default now()
);

-- 124 site_config
create table public.site_config (
  id uuid default gen_random_uuid() not null,
  key text not null,
  value text,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 125 stripe_accounts
create table public.stripe_accounts (
  id uuid default gen_random_uuid() not null,
  email text not null,
  stripe_account_id text,
  conectado boolean default false,
  created_at timestamp with time zone default now()
);

-- 126 stripe_invoice_company_attributions
create table public.stripe_invoice_company_attributions (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  company_id uuid not null,
  stripe_invoice_id text not null,
  stripe_customer_id text not null,
  invoice_tax_id text,
  source text not null,
  status text default 'active'::text not null,
  evidence jsonb default '{}'::jsonb not null,
  created_by uuid,
  created_at timestamp with time zone default now() not null,
  revoked_by uuid,
  revoked_at timestamp with time zone,
  revocation_reason text
);

-- 127 stripe_processed_events
create table public.stripe_processed_events (
  event_id text not null,
  event_type text not null,
  processed_at timestamp with time zone default now() not null,
  status text default 'processed'::text not null,
  claimed_at timestamp with time zone,
  last_error text
);

-- 128 subscribers
create table public.subscribers (
  id uuid default gen_random_uuid() not null,
  email text not null,
  is_confirmed boolean default false,
  created_at timestamp with time zone default now()
);

-- 129 subscription_checkout_claims
create table public.subscription_checkout_claims (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  company_id uuid not null,
  intent_key text not null,
  owner_token uuid not null,
  state text default 'claimed'::text not null,
  stripe_session_id text,
  lease_expires_at timestamp with time zone default (now() + '00:02:00'::interval) not null,
  last_error text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 130 subscription_entitlements
create table public.subscription_entitlements (
  id uuid default gen_random_uuid() not null,
  client_id uuid not null,
  subscription_id uuid,
  feature_key text not null,
  tier text,
  active boolean default true not null,
  valid_from timestamp with time zone default now() not null,
  valid_until timestamp with time zone,
  granted_by text default 'stripe_webhook'::text not null,
  revoked_at timestamp with time zone,
  revoked_by text,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  primary_company_id uuid,
  beneficiary_company_id uuid,
  checkout_session_id uuid,
  benefit_value numeric(12,2),
  coverage_scope text,
  excluded_services text[] default '{}'::text[] not null
);

-- 131 subscription_trials
create table public.subscription_trials (
  id uuid default gen_random_uuid() not null,
  client_id uuid not null,
  company_id uuid,
  plan_slug text default 'copilot'::text not null,
  stripe_subscription_id text,
  stripe_customer_id text,
  trial_start timestamp with time zone default now() not null,
  trial_end timestamp with time zone not null,
  status text default 'trialing'::text not null,
  started_from text,
  holded_connected_at timestamp with time zone,
  first_copilot_use_at timestamp with time zone,
  trial_end_reminder_sent_at timestamp with time zone,
  holded_not_connected_reminder_sent_at timestamp with time zone,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 132 subscriptions
create table public.subscriptions (
  id uuid default gen_random_uuid() not null,
  client_id uuid not null,
  company_id uuid,
  stripe_subscription_id text not null,
  stripe_customer_id text not null,
  stripe_price_id text not null,
  plan_name text default 'Suscripción'::text not null,
  status text default 'active'::text not null,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  canceled_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  metadata jsonb default '{}'::jsonb not null,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  trial_status text,
  plan_slug text,
  cancel_at_period_end boolean default false not null,
  post_purchase_onboarding_at timestamp with time zone
);

-- 133 support_tickets
create table public.support_tickets (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  title text not null,
  description text not null,
  status text default 'open'::text,
  priority text default 'medium'::text,
  category text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  resolved_at timestamp with time zone
);

-- 134 system_kv
create table public.system_kv (
  key text not null,
  value jsonb not null,
  updated_at timestamp with time zone default now() not null
);

-- 135 tenant_integration_secrets
create table public.tenant_integration_secrets (
  id uuid default gen_random_uuid() not null,
  tenant_id uuid not null,
  integration text not null,
  encrypted_secret text not null,
  meta jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 136 tenants
create table public.tenants (
  id uuid default gen_random_uuid() not null,
  slug text not null,
  name text not null,
  domain text,
  plan text default 'starter'::text not null,
  settings jsonb default '{}'::jsonb not null,
  active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 137 training_orders
create table public.training_orders (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  company_id uuid,
  service_type text,
  duration_hours integer,
  holded_environment text,
  status text default 'pending'::text,
  stripe_session_id text,
  meeting_link text,
  meeting_date timestamp with time zone,
  notes text,
  created_at timestamp with time zone default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone default CURRENT_TIMESTAMP
);

-- 138 training_sessions
create table public.training_sessions (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  session_date timestamp with time zone,
  duration_hours integer,
  status text,
  recording_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 139 user_files
create table public.user_files (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  file_name text,
  file_url text,
  file_size bigint,
  file_type text,
  uploaded_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- 140 user_invitations
create table public.user_invitations (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid,
  email text not null,
  role_id uuid,
  invited_by uuid,
  token text not null,
  status text default 'pending'::text,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- 141 user_meetings
create table public.user_meetings (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  title text,
  description text,
  meeting_date timestamp with time zone,
  duration_minutes integer,
  meeting_type text,
  status text default 'scheduled'::text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 142 user_profiles_ext
create table public.user_profiles_ext (
  id uuid not null,
  full_name text,
  company_name text,
  email text,
  phone text,
  avatar_url text,
  google_id text,
  holded_account_id text,
  holded_api_key text,
  preferences jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  first_name text,
  bio text,
  company text,
  "position" text
);

-- 143 user_roles
create table public.user_roles (
  id uuid default gen_random_uuid() not null,
  role_name text not null,
  description text,
  permissions jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

-- 144 user_services
create table public.user_services (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  service_name text,
  status text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 145 user_sessions
create table public.user_sessions (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  session_date timestamp with time zone,
  session_type text,
  duration_minutes integer,
  topic text,
  notes text,
  created_at timestamp with time zone default now()
);

-- 146 user_team_members
create table public.user_team_members (
  id uuid default gen_random_uuid() not null,
  workspace_id uuid,
  user_id uuid,
  role_id uuid,
  invited_by uuid,
  status text default 'invited'::text,
  joined_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 147 user_tickets
create table public.user_tickets (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  title text,
  description text,
  status text default 'open'::text,
  priority text default 'medium'::text,
  category text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  resolved_at timestamp with time zone
);

-- 148 user_training_credits
create table public.user_training_credits (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  plan_name text,
  monthly_credits integer default 0 not null,
  used_credits integer default 0 not null,
  credits_reset_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 149 user_workspaces
create table public.user_workspaces (
  id uuid default gen_random_uuid() not null,
  owner_id uuid,
  workspace_name text not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 150 users
create table public.users (
  id uuid not null,
  email text not null,
  full_name text,
  created_at timestamp with time zone default now()
);

-- 151 users_clients
create table public.users_clients (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  company_name text,
  nif_cif text,
  address text,
  phone text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 152 usuarios
create table public.usuarios (
  id uuid not null,
  email text not null,
  nombre text,
  apellidos text,
  telefono text,
  roles jsonb default '[]'::jsonb not null,
  estado text default 'activo'::text not null,
  kyc_estado text default 'pendiente'::text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 153 verifactu_queue
create table public.verifactu_queue (
  id uuid default gen_random_uuid() not null,
  company_id uuid not null,
  invoice_id uuid not null,
  payload jsonb not null,
  signature text,
  status text default 'queued'::text not null,
  retries integer default 0 not null,
  last_error text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone
);

-- 154 viability_assessments
create table public.viability_assessments (
  id uuid default gen_random_uuid() not null,
  created_at timestamp with time zone default now() not null,
  service_slug text not null,
  service_name text not null,
  client_name text,
  client_email text,
  client_phone text,
  gdpr_consent boolean default false not null,
  gdpr_consent_at timestamp with time zone,
  answers jsonb default '{}'::jsonb not null,
  doc_status jsonb default '{}'::jsonb not null,
  ai_result text,
  ai_emoji text,
  ai_summary text,
  ai_met jsonb,
  ai_missing jsonb,
  ai_recommendations jsonb,
  ai_next_steps jsonb,
  ai_escalate boolean,
  checkout_url text,
  email_sent boolean default false not null,
  whatsapp_session_id text
);

-- 155 whatsapp_conversations
create table public.whatsapp_conversations (
  id uuid default gen_random_uuid() not null,
  client_id uuid,
  phone_number text not null,
  direction text not null,
  body text not null,
  whatsapp_message_id text,
  created_at timestamp with time zone default now() not null,
  needs_review boolean default false not null,
  ai_responded boolean default false not null,
  read_at timestamp with time zone,
  case_id uuid,
  media_url text,
  media_type text,
  meta_media_id text,
  reply_to_message_id uuid,
  reply_to_whatsapp_message_id text,
  quoted_body_snapshot text,
  quoted_direction text,
  quoted_created_at timestamp with time zone
);
