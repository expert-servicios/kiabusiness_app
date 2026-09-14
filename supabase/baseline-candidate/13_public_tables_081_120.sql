-- Candidate current-schema baseline for issue #143.
-- Tables 081-120, extracted from production catalog on 2026-09-11.
-- Constraints, indexes, RLS, functions, triggers and grants are layered separately.

-- 081 kia_health_runs
create table public.kia_health_runs (
  id uuid default gen_random_uuid() not null,
  run_type text not null,
  status text not null,
  score numeric(5,4) default 0 not null,
  total_checks integer default 0 not null,
  passed_checks integer default 0 not null,
  failed_checks integer default 0 not null,
  warning_checks integer default 0 not null,
  provider text,
  model text,
  started_at timestamp with time zone not null,
  finished_at timestamp with time zone not null,
  duration_ms integer default 0 not null,
  summary text not null,
  created_by uuid,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now()
);

-- 082 kia_memories
create table public.kia_memories (
  id uuid default gen_random_uuid() not null,
  client_id uuid,
  lead_id uuid,
  phone text,
  content text not null,
  embedding vector(1536),
  memory_type text default 'conversation_summary'::text not null,
  channel text default 'waba'::text not null,
  created_at timestamp with time zone default now() not null,
  metadata jsonb default '{}'::jsonb not null
);

-- 083 kia_reports
create table public.kia_reports (
  id uuid default gen_random_uuid() not null,
  phone_number text not null,
  lead_id uuid,
  client_id uuid,
  service_id text not null,
  service_label text not null,
  service_area text,
  viabilidad text,
  documentos jsonb default '[]'::jsonb not null,
  riesgo text,
  precio_catalogo numeric(10,2),
  siguientes_pasos text,
  precal_data jsonb default '{}'::jsonb not null,
  perfil_data jsonb default '{}'::jsonb not null,
  generated_by text default 'kia'::text not null,
  lang text default 'es'::text not null,
  viewed_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 084 kia_sessions
create table public.kia_sessions (
  id uuid default gen_random_uuid() not null,
  phone_number text not null,
  client_id uuid,
  lang text default 'es'::text not null,
  flow text default 'welcome'::text not null,
  step text default 'init'::text not null,
  service_id text,
  precal_step integer default 0 not null,
  data jsonb default '{}'::jsonb not null,
  name text,
  email text,
  priority text default 'normal'::text not null,
  escalated boolean default false not null,
  last_activity timestamp with time zone default now() not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 085 lead_stripe_customers
create table public.lead_stripe_customers (
  id uuid default gen_random_uuid() not null,
  lead_id uuid not null,
  tenant_id uuid not null,
  stripe_customer_id text not null,
  stripe_email text not null,
  stripe_name text,
  stripe_phone text,
  stripe_customer_created_at timestamp with time zone,
  activity_status text default 'no_activity'::text not null,
  has_active_subscription boolean default false not null,
  successful_charges integer default 0 not null,
  succeeded_payment_intents integer default 0 not null,
  paid_invoices integer default 0 not null,
  paid_checkouts integer default 0 not null,
  first_activity_at timestamp with time zone,
  last_activity_at timestamp with time zone,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 086 leads
create table public.leads (
  id uuid default gen_random_uuid() not null,
  name text not null,
  email text,
  phone text,
  client_type text,
  category text,
  service text,
  country text,
  urgency text,
  message text,
  state text default 'new'::text not null,
  owner_id uuid,
  created_at timestamp with time zone default now() not null,
  source text,
  notes text,
  updated_at timestamp with time zone,
  tenant_id uuid,
  marketing_status text default 'unknown'::text not null,
  marketing_consent_at timestamp with time zone,
  marketing_source text,
  lifecycle_stage text default 'lead'::text not null,
  stripe_activity text default 'no_activity'::text not null,
  first_stripe_activity_at timestamp with time zone,
  last_stripe_activity_at timestamp with time zone,
  source_key text,
  metadata jsonb default '{}'::jsonb not null
);

-- 087 manual_payments
create table public.manual_payments (
  id uuid default gen_random_uuid() not null,
  client_id uuid,
  case_id uuid,
  amount_eur numeric(12,2) not null,
  currency text default 'EUR'::text not null,
  payment_method text default 'transferencia'::text not null,
  description text,
  paid_at timestamp with time zone default now() not null,
  reference text,
  holded_invoice_id text,
  notes text,
  created_by uuid,
  created_at timestamp with time zone default now() not null
);

-- 088 memberships
create table public.memberships (
  user_id uuid not null,
  company_id uuid not null,
  role text not null,
  created_at timestamp with time zone default now()
);

-- 089 messages
create table public.messages (
  id uuid default gen_random_uuid() not null,
  case_id uuid not null,
  sender_id uuid not null,
  sender_role text not null,
  body text not null,
  created_at timestamp with time zone default now() not null,
  read_by_client boolean default false not null,
  read_by_admin boolean default false not null
);

-- 090 migration_requests
create table public.migration_requests (
  id uuid default gen_random_uuid() not null,
  name text not null,
  email text not null,
  phone text,
  company_name text,
  current_software text,
  target_software text,
  migration_scope text not null,
  additional_details text,
  created_at timestamp with time zone default now()
);

-- 091 ms365_tokens
create table public.ms365_tokens (
  id text default 'admin'::text not null,
  access_token text not null,
  refresh_token text not null,
  expires_at bigint not null,
  email text,
  updated_at timestamp with time zone default now()
);

-- 092 newsletter_subscribers
create table public.newsletter_subscribers (
  id uuid default gen_random_uuid() not null,
  email text not null,
  name text,
  source text default 'website'::text not null,
  confirmed boolean default false not null,
  unsubscribed_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

-- 093 next_best_actions
create table public.next_best_actions (
  id uuid default gen_random_uuid() not null,
  action_type text not null,
  priority text default 'media'::text not null,
  status text default 'open'::text not null,
  title text not null,
  description text,
  client_id uuid,
  lead_id uuid,
  case_id uuid,
  due_at timestamp with time zone,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now() not null,
  resolved_at timestamp with time zone,
  resolved_by uuid
);

-- 094 obligations_calendar
create table public.obligations_calendar (
  id uuid default gen_random_uuid() not null,
  company_id uuid not null,
  kind text not null,
  due_date date not null,
  status text default 'planned'::text,
  attendees text[],
  created_at timestamp with time zone default now(),
  client_id uuid,
  model_code text,
  title text,
  period_key text,
  notes text,
  task_id uuid,
  google_event_id text,
  source text default 'manual'::text not null,
  metadata jsonb default '{}'::jsonb not null,
  created_by uuid,
  updated_at timestamp with time zone default now() not null,
  completed_at timestamp with time zone
);

-- 095 orders
create table public.orders (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  pack_name text not null,
  amount numeric(10,2) not null,
  currency text default 'EUR'::text,
  status text default 'pending'::text,
  stripe_session_id text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  quote_id uuid,
  client_id uuid,
  stripe_payment_id text,
  amount_eur numeric(10,2),
  metadata jsonb default '{}'::jsonb not null,
  source text default 'quote'::text not null,
  service_slugs text,
  company_id uuid,
  holded_invoice_id text,
  holded_sync_event_id text,
  holded_sync_error text,
  holded_synced_at timestamp with time zone,
  case_id uuid,
  tenant_id uuid
);

-- 096 pagos_expert
create table public.pagos_expert (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  customer_email text,
  payment_intent_id text,
  amount bigint,
  currency text,
  status text,
  metadata jsonb,
  created_at timestamp with time zone default now(),
  stripe_session_id text
);

-- 097 presupuestos_solicitados
create table public.presupuestos_solicitados (
  id uuid default gen_random_uuid() not null,
  nombre text not null,
  email text not null,
  telefono text,
  cif text,
  razon_social text,
  domicilio text,
  observaciones text,
  resumen jsonb,
  subtotal numeric,
  total numeric,
  creado_en timestamp with time zone default now(),
  acepta_terminos boolean default false not null,
  acepta_marketing boolean default false not null,
  estado text default 'pendiente'::text,
  token_aceptacion uuid default gen_random_uuid()
);

-- 098 profile_companies
create table public.profile_companies (
  id uuid default gen_random_uuid() not null,
  profile_id uuid not null,
  company_id uuid not null,
  role text default 'member'::text not null,
  created_at timestamp with time zone default now() not null
);

-- 099 profiles
create table public.profiles (
  id uuid not null,
  full_name text,
  avatar_url text,
  company text,
  phone text,
  address text,
  city text,
  postal_code text,
  country text,
  plan text default 'Plan Starter'::text,
  status text default 'active'::text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  role text default 'client'::text not null,
  stripe_customer_id text,
  whatsapp_number text,
  whatsapp_consent boolean default false not null,
  welcome_email_sent boolean default false not null,
  active_company_id uuid,
  tax_id text,
  email text,
  profile_completed boolean default false not null,
  billing_ready boolean default false not null,
  has_monthly_plan boolean default false not null,
  billing_name text,
  billing_nif text,
  billing_address text,
  tenant_id uuid,
  client_type text,
  province text,
  billing_country text default 'ES'::text not null,
  habitual_address text,
  habitual_city text,
  habitual_postal_code text,
  habitual_province text,
  habitual_country text default 'ES'::text not null,
  habitual_address_ready boolean default false not null,
  profile_completed_at timestamp with time zone,
  billing_ready_at timestamp with time zone,
  onboarding_completed_at timestamp with time zone
);

-- 100 proyectos
create table public.proyectos (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  company_id uuid,
  name text not null,
  status text default 'active'::text,
  start_date date,
  end_date date,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 101 public_support_tickets
create table public.public_support_tickets (
  id uuid default gen_random_uuid() not null,
  name text not null,
  email text not null,
  subject text,
  description text not null,
  status text default 'open'::text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 102 push_subscriptions
create table public.push_subscriptions (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone default now()
);

-- 103 quote_templates
create table public.quote_templates (
  id uuid default gen_random_uuid() not null,
  name text not null,
  title text not null,
  description text not null,
  amount_eur numeric(10,2),
  expires_in_days integer default 14 not null,
  docs_checklist text[] default '{}'::text[] not null,
  created_by uuid,
  created_at timestamp with time zone default now() not null
);

-- 104 quotes
create table public.quotes (
  id uuid default gen_random_uuid() not null,
  lead_id uuid not null,
  client_id uuid,
  title text not null,
  description text not null,
  amount_eur numeric(10,2) default 0 not null,
  status text default 'sent'::text not null,
  stripe_checkout_id text,
  expires_at timestamp with time zone,
  created_by uuid not null,
  created_at timestamp with time zone default now() not null,
  docs_checklist jsonb default '[]'::jsonb not null,
  tenant_id uuid,
  company_id uuid
);

-- 105 representatives
create table public.representatives (
  id uuid default gen_random_uuid() not null,
  company_id uuid not null,
  full_name text not null,
  nif text,
  role text,
  data jsonb,
  created_at timestamp with time zone default now()
);

-- 106 resources
create table public.resources (
  id uuid default gen_random_uuid() not null,
  title text not null,
  description text,
  category text not null,
  type text not null,
  file_url text,
  image_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 107 review_requests
create table public.review_requests (
  id uuid default gen_random_uuid() not null,
  case_id uuid,
  client_id uuid,
  sent_at timestamp with time zone default now() not null,
  status text default 'pending'::text not null,
  created_at timestamp with time zone default now() not null,
  token text,
  expires_at timestamp with time zone
);

-- 108 reviews
create table public.reviews (
  id uuid default gen_random_uuid() not null,
  case_id uuid,
  client_id uuid,
  rating smallint not null,
  comment text,
  published boolean default false not null,
  created_at timestamp with time zone default now() not null,
  service_name text,
  allow_publish boolean default false not null,
  status text default 'pending'::text not null,
  featured boolean default false not null
);

-- 109 role_permissions
create table public.role_permissions (
  id uuid default gen_random_uuid() not null,
  role_id uuid,
  permission_name text not null,
  description text,
  created_at timestamp with time zone default now()
);

-- 110 saas_leads
create table public.saas_leads (
  id uuid default gen_random_uuid() not null,
  name text not null,
  email text not null,
  phone text,
  company_name text not null,
  client_count_range text not null,
  current_tools text,
  operational_problem text not null,
  pilot_interest text not null,
  consent boolean default false not null,
  source text default 'para-asesorias'::text not null,
  status text default 'new'::text not null,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 111 security_alerts
create table public.security_alerts (
  id uuid default gen_random_uuid() not null,
  alert_type text not null,
  user_email text,
  detail jsonb default '{}'::jsonb not null,
  resolved boolean default false not null,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

-- 112 service_metrics
create table public.service_metrics (
  id uuid default gen_random_uuid() not null,
  service_id uuid,
  total_orders integer default 0,
  total_reviews integer default 0,
  average_rating numeric(3,2) default 0,
  customer_satisfaction integer default 0,
  updated_at timestamp with time zone default now()
);

-- 113 service_profitability_events
create table public.service_profitability_events (
  id uuid default gen_random_uuid() not null,
  case_id uuid,
  client_id uuid,
  service_id text not null,
  event_type text not null,
  estimated_minutes integer not null,
  source text default 'auto'::text not null,
  operator text,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now() not null
);

-- 114 service_profitability_snapshots
create table public.service_profitability_snapshots (
  id uuid default gen_random_uuid() not null,
  service_id text not null,
  period text not null,
  scope text default 'monthly'::text not null,
  case_id uuid,
  total_revenue_eur numeric(10,2) default 0 not null,
  total_minutes integer default 0 not null,
  total_cost_eur numeric(10,2) default 0 not null,
  margin_eur numeric(10,2) generated always as ((total_revenue_eur - total_cost_eur)) stored,
  margin_pct numeric(5,2) generated always as (
CASE
    WHEN (total_revenue_eur = (0)::numeric) THEN (0)::numeric
    ELSE round((((total_revenue_eur - total_cost_eur) / total_revenue_eur) * (100)::numeric), 2)
END) stored,
  margin_status text default 'revisar_precio'::text not null,
  generated_at timestamp with time zone default now() not null
);

-- 115 service_readiness_assessments
create table public.service_readiness_assessments (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  lead_id uuid,
  phone text,
  email text,
  service_slug text not null,
  category text,
  answers jsonb default '{}'::jsonb not null,
  result text not null,
  recommended_action text not null,
  source text default 'web'::text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 116 service_review_responses
create table public.service_review_responses (
  id uuid default gen_random_uuid() not null,
  review_id uuid,
  response_text text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 117 service_reviews
create table public.service_reviews (
  id uuid default gen_random_uuid() not null,
  service_id text not null,
  service_name text,
  user_id uuid,
  rating smallint not null,
  comment text,
  reviewer_name text,
  reviewer_company text,
  is_approved boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'pending'::text,
  title text,
  order_id text,
  verified_purchase boolean default false,
  helpful_count integer default 0
);

-- 118 services
create table public.services (
  id uuid default gen_random_uuid() not null,
  category_id uuid,
  name text not null,
  slug text not null,
  short_desc text,
  long_desc text,
  what_is text,
  what_includes text,
  requirements text,
  deliverables text,
  duration_estimate text,
  price_from numeric,
  price_display text,
  stripe_product_id text,
  stripe_price_id text,
  stripe_checkout_url text,
  is_featured boolean default false,
  needs_review_recommended boolean default false,
  status text default 'active'::text,
  "order" integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  category_slug text,
  type text default 'tramite'::text,
  urgency text default 'normal'::text
);

-- 119 servicios_cliente
create table public.servicios_cliente (
  id uuid default gen_random_uuid() not null,
  email text not null,
  servicio text,
  activo boolean default true,
  fecha_inicio timestamp with time zone default now(),
  factura_url text
);

-- 120 sesiones
create table public.sesiones (
  id uuid default gen_random_uuid() not null,
  proyecto_id uuid,
  user_id uuid,
  title text,
  date timestamp with time zone not null,
  duration integer,
  notes text,
  status text default 'scheduled'::text,
  meeting_link text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
