-- Candidate current-schema baseline for issue #143.
-- Tables 001-040, extracted from production catalog on 2026-09-11.
-- Constraints, indexes, RLS, functions, triggers and grants are layered separately.

-- 001 academy_enrollments
create table public.academy_enrollments (
  id uuid default gen_random_uuid() not null,
  client_id uuid not null,
  program_slug text not null,
  program_name text not null,
  amount_eur numeric(10,2) not null,
  stripe_payment_id text not null,
  status text default 'active'::text not null,
  certification_requested boolean default false not null,
  certification_status text default 'none'::text not null,
  admin_note text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 002 academy_knowledge_status
create table public.academy_knowledge_status (
  slug text not null,
  status text not null,
  admin_note text,
  validated_by uuid,
  updated_at timestamp with time zone default now() not null
);

-- 003 activities
create table public.activities (
  id uuid default gen_random_uuid() not null,
  company_id uuid not null,
  cnae text,
  description text,
  created_at timestamp with time zone default now()
);

-- 004 admin_email_folders
create table public.admin_email_folders (
  id uuid default gen_random_uuid() not null,
  name text not null,
  slug text not null,
  system_key text,
  is_system boolean default false not null,
  sort_order integer default 100 not null,
  created_by uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 005 admin_email_item_state
create table public.admin_email_item_state (
  id uuid default gen_random_uuid() not null,
  source_kind text not null,
  provider text not null,
  source_key text not null,
  folder_id uuid,
  client_id uuid,
  company_id uuid,
  case_id uuid,
  is_archived boolean default false not null,
  assigned_by uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 006 admin_users
create table public.admin_users (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  role text default 'admin'::text not null,
  permissions text[] default '{}'::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 007 aeat_credentials
create table public.aeat_credentials (
  company_id uuid not null,
  mode text default 'test'::text,
  cert_alias text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 008 ai_logs
create table public.ai_logs (
  id bigint generated always as identity not null,
  event_type text not null,
  client_id uuid,
  input jsonb,
  output jsonb,
  model text,
  latency_ms integer,
  error text,
  created_at timestamp with time zone default now() not null
);

-- 009 appointments
create table public.appointments (
  id uuid default gen_random_uuid() not null,
  name text not null,
  email text not null,
  phone text not null,
  appointment_type text not null,
  appointment_date timestamp with time zone not null,
  notes text,
  created_at timestamp with time zone default now(),
  status text default 'pendiente'::text,
  preferred_date date,
  preferred_time text default 'mañana'::text,
  confirmed_date date,
  confirmed_time text,
  meeting_url text,
  admin_notes text,
  updated_at timestamp with time zone default now(),
  service text,
  google_event_id text,
  cal_uid text
);

-- 010 assets_realestate
create table public.assets_realestate (
  id uuid default gen_random_uuid() not null,
  company_id uuid not null,
  ref_catastral text,
  address jsonb,
  data jsonb,
  created_at timestamp with time zone default now()
);

-- 011 assets_vehicles
create table public.assets_vehicles (
  id uuid default gen_random_uuid() not null,
  company_id uuid not null,
  plate text,
  brand text,
  model text,
  data jsonb,
  created_at timestamp with time zone default now()
);

-- 012 audit_log
create table public.audit_log (
  id bigint default nextval('audit_log_id_seq'::regclass) not null,
  company_id uuid not null,
  actor_user_id uuid,
  actor_type text default 'user'::text not null,
  action text not null,
  details jsonb,
  created_at timestamp with time zone default now()
);

-- 013 audit_logs
create table public.audit_logs (
  id uuid default gen_random_uuid() not null,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now() not null
);

-- 014 automation_settings
create table public.automation_settings (
  key text not null,
  enabled boolean default true not null,
  updated_at timestamp with time zone default now() not null
);

-- 015 blog_posts
create table public.blog_posts (
  id uuid default gen_random_uuid() not null,
  titulo text not null,
  slug text not null,
  descripcion text,
  contenido text,
  autor text default 'Ksenia Ilicheva'::text,
  imagen_url text,
  categoria text,
  tags text[],
  fecha_publicacion timestamp with time zone default now(),
  estado text default 'publicado'::text,
  vistas integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 016 bookings
create table public.bookings (
  id uuid default gen_random_uuid() not null,
  name text not null,
  email text not null,
  phone text not null,
  booking_type text not null,
  message text,
  status text default 'pending'::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 017 campaign_sends
create table public.campaign_sends (
  id uuid default gen_random_uuid() not null,
  campaign_id uuid not null,
  recipient_email text not null,
  recipient_name text,
  status text default 'pending'::text not null,
  resend_id text,
  error text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

-- 018 campaigns
create table public.campaigns (
  id uuid default gen_random_uuid() not null,
  title text not null,
  status text default 'draft'::text not null,
  subject text default ''::text not null,
  body_html text default ''::text not null,
  body_text text,
  segment text default 'all_active'::text not null,
  segment_filters jsonb,
  recipient_count integer,
  sent_count integer default 0 not null,
  failed_count integer default 0 not null,
  scheduled_at timestamp with time zone,
  sent_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 019 case_documents
create table public.case_documents (
  id uuid default gen_random_uuid() not null,
  case_id uuid not null,
  client_id uuid not null,
  file_path text not null,
  original_name text not null,
  state text default 'pendiente'::text not null,
  created_at timestamp with time zone default now() not null
);

-- 020 cases
create table public.cases (
  id uuid default gen_random_uuid() not null,
  quote_id uuid,
  client_id uuid not null,
  company_id uuid,
  category text not null,
  service text not null,
  state text default 'pendiente_documentacion'::text not null,
  opened_at timestamp with time zone default now() not null,
  closed_at timestamp with time zone,
  admin_note text,
  docs_checklist jsonb default '[]'::jsonb,
  updated_at timestamp with time zone default now() not null,
  status text default 'nuevo'::text not null,
  priority text default 'media'::text,
  due_date date,
  next_action text,
  assigned_to uuid,
  service_id text,
  order_id uuid,
  checklist_json jsonb default '{}'::jsonb not null,
  received_documents_json jsonb default '{}'::jsonb not null,
  google_calendar_event_id text,
  tenant_id uuid
);

-- 021 categories
create table public.categories (
  id uuid default gen_random_uuid() not null,
  name text not null,
  slug text not null,
  description text,
  icon text,
  "order" integer default 0,
  created_at timestamp with time zone default now(),
  section text
);

-- 022 certificates
create table public.certificates (
  id uuid default gen_random_uuid() not null,
  company_id uuid not null,
  alias text,
  subject text,
  issuer text,
  valid_from timestamp with time zone,
  valid_to timestamp with time zone,
  storage text,
  created_at timestamp with time zone default now()
);

-- 023 checkout_sessions
create table public.checkout_sessions (
  id uuid default gen_random_uuid() not null,
  stripe_session_id text not null,
  service_id uuid,
  user_id uuid,
  status text default 'pending'::text,
  metadata jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  company_id uuid
);

-- 024 client_integration_secrets
create table public.client_integration_secrets (
  integration_id uuid not null,
  encrypted_api_key text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 025 client_integrations
create table public.client_integrations (
  id uuid default gen_random_uuid() not null,
  client_id uuid,
  company_id uuid,
  provider text not null,
  mode text default 'client_account'::text not null,
  api_version text,
  api_key_last4 text,
  permissions_detected jsonb default '{}'::jsonb not null,
  status text default 'pending'::text not null,
  sync_mode text default 'read_only'::text not null,
  last_sync_at timestamp with time zone,
  last_success_at timestamp with time zone,
  last_error text,
  connected_by uuid,
  disconnected_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  permissions_enabled jsonb,
  consent_at timestamp with time zone,
  consent_version text,
  channel text default 'dashboard'::text
);

-- 026 client_portal_invoices
create table public.client_portal_invoices (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  invoice_number text,
  amount numeric,
  currency text,
  status text,
  issue_date date,
  pdf_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 027 client_service_requests
create table public.client_service_requests (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  service_type text not null,
  details text,
  status text default 'pending'::text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 028 companies
create table public.companies (
  id uuid default gen_random_uuid() not null,
  name text default ''::text,
  vat_id text,
  timezone text default 'Europe/Madrid'::text,
  country text default 'ES'::text,
  verifactu_mode text default 'non_verifactu'::text,
  created_at timestamp with time zone default now(),
  user_id uuid,
  company_name text,
  industry text,
  contact_person text,
  email text,
  phone text,
  address text,
  city text,
  holded_account_id text,
  holded_environment text default 'production'::text,
  status text default 'active'::text not null,
  notes text,
  updated_at timestamp with time zone default now(),
  razon_social text,
  nombre_comercial text,
  cif_nif text,
  forma_juridica text,
  direccion text,
  ciudad text,
  provincia text,
  codigo_postal text,
  pais text default 'ES'::text,
  telefono text,
  web text,
  tenant_id uuid,
  stripe_customer_id text
);

-- 029 company_data_sources_log
create table public.company_data_sources_log (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  company_id uuid,
  source text not null,
  query jsonb not null,
  result_count integer,
  status text not null,
  error text,
  created_at timestamp with time zone default now() not null
);

-- 030 company_data_suggestions
create table public.company_data_suggestions (
  id uuid default gen_random_uuid() not null,
  profile_id uuid,
  company_id uuid,
  input_name text,
  input_tax_id text,
  source text not null,
  source_url text,
  source_license text,
  retrieved_at timestamp with time zone default now() not null,
  confidence text not null,
  warnings jsonb default '[]'::jsonb not null,
  raw_payload jsonb,
  normalized_payload jsonb default '{}'::jsonb not null,
  selected_by_user boolean default false not null,
  selected_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

-- 031 company_fiscal_templates
create table public.company_fiscal_templates (
  id uuid default gen_random_uuid() not null,
  client_id uuid not null,
  company_id uuid not null,
  template_code text not null,
  status text default 'active'::text not null,
  effective_from date default CURRENT_DATE not null,
  effective_to date,
  notes text,
  created_by uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 032 company_open_data_query_logs
create table public.company_open_data_query_logs (
  id uuid default gen_random_uuid() not null,
  profile_id uuid,
  company_id uuid,
  query_type text not null,
  input_hash text not null,
  sources_used text[] default '{}'::text[] not null,
  result_count integer default 0 not null,
  created_at timestamp with time zone default now() not null
);

-- 033 company_stripe_customers
create table public.company_stripe_customers (
  id uuid default gen_random_uuid() not null,
  company_id uuid not null,
  tenant_id uuid not null,
  stripe_customer_id text not null,
  is_primary boolean default false not null,
  status text default 'active'::text not null,
  source text default 'manual_review'::text not null,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 034 connector_audit_logs
create table public.connector_audit_logs (
  id uuid default gen_random_uuid() not null,
  instance_id uuid,
  client_id uuid not null,
  actor_type text default 'ai'::text not null,
  tool_name text not null,
  risk_level text default 'low'::text not null,
  result text not null,
  payload_hash text,
  confirmation_by text,
  holded_entity_id text,
  notes text,
  created_at timestamp with time zone default now() not null
);

-- 035 connector_instances
create table public.connector_instances (
  id uuid default gen_random_uuid() not null,
  client_id uuid not null,
  company_id uuid,
  connector_type text default 'claude_holded'::text not null,
  tier text not null,
  status text default 'inactive'::text not null,
  holded_integration_id uuid,
  mcp_client_id text,
  last_activity_at timestamp with time zone,
  activated_at timestamp with time zone,
  suspended_at timestamp with time zone,
  suspension_reason text,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 036 connector_usage_events
create table public.connector_usage_events (
  id uuid default gen_random_uuid() not null,
  instance_id uuid not null,
  client_id uuid not null,
  tool_name text not null,
  tokens_input integer,
  tokens_output integer,
  latency_ms integer,
  success boolean default true not null,
  error_code text,
  created_at timestamp with time zone default now() not null
);

-- 037 contact_messages
create table public.contact_messages (
  id uuid default gen_random_uuid() not null,
  name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  created_at timestamp with time zone default now(),
  status text default 'nuevo'::text
);

-- 038 contact_requests
create table public.contact_requests (
  id uuid default gen_random_uuid() not null,
  nombre text not null,
  email text not null,
  telefono text,
  tipo_solicitud text not null,
  asunto text,
  mensaje text not null,
  estado text default 'pendiente'::text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 039 contacts
create table public.contacts (
  id uuid default gen_random_uuid() not null,
  name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  status text default 'new'::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 040 customers
create table public.customers (
  id uuid default gen_random_uuid() not null,
  company_id uuid not null,
  name text not null,
  email text,
  vat_id text,
  address jsonb,
  created_at timestamp with time zone default now()
);
