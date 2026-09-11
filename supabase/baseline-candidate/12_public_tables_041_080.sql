-- Candidate current-schema baseline for issue #143.
-- Tables 041-080, extracted from production catalog on 2026-09-11.
-- Constraints, indexes, RLS, functions, triggers and grants are layered separately.

-- 041 demo_requests
create table public.demo_requests (
  id uuid default gen_random_uuid() not null,
  name text not null,
  email text not null,
  company_name text,
  created_at timestamp with time zone default now()
);

-- 042 doc_templates
create table public.doc_templates (
  id uuid default gen_random_uuid() not null,
  company_id uuid not null,
  kind text not null,
  name text,
  content jsonb,
  created_at timestamp with time zone default now()
);

-- 043 document_classifications
create table public.document_classifications (
  id uuid default gen_random_uuid() not null,
  client_id uuid,
  case_id uuid,
  file_id uuid,
  source text default 'portal'::text not null,
  detected_type text not null,
  detected_subtype text,
  confidence numeric(4,3) default 0 not null,
  extracted_data jsonb default '{}'::jsonb not null,
  status text default 'classified'::text not null,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 044 documents
create table public.documents (
  id uuid default gen_random_uuid() not null,
  company_id uuid not null,
  owner_type text not null,
  owner_id uuid not null,
  kind text not null,
  drive_file_id text,
  mime_type text,
  title text,
  created_at timestamp with time zone default now(),
  doc_type text,
  content_text text,
  case_id uuid,
  client_id uuid,
  file_path text,
  original_name text,
  state text default 'pendiente'::text not null,
  uploaded_by_role text default 'client'::text not null
);

-- 045 email_attachment_documents
create table public.email_attachment_documents (
  id uuid default gen_random_uuid() not null,
  provider text not null,
  account_email text not null,
  message_id text not null,
  attachment_id text not null,
  document_id uuid not null,
  client_id uuid not null,
  case_id uuid not null,
  company_id uuid not null,
  original_name text not null,
  mime_type text,
  size_bytes bigint not null,
  created_at timestamp with time zone default now() not null,
  conversation_id text,
  subject text,
  from_email text,
  message_date timestamp with time zone
);

-- 046 email_events
create table public.email_events (
  id bigint generated always as identity not null,
  event_type text not null,
  recipient_email text not null,
  subject text not null,
  resend_id text,
  status text default 'sent'::text not null,
  metadata jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  last_error text,
  resent_from_id bigint,
  html text
);

-- 047 email_inbox_cache
create table public.email_inbox_cache (
  thread_id text not null,
  provider text default 'gmail'::text not null,
  subject text default ''::text not null,
  from_name text default ''::text not null,
  from_email text default ''::text not null,
  snippet text default ''::text not null,
  date timestamp with time zone not null,
  unread boolean default false not null,
  has_attachment boolean default false not null,
  case_id uuid,
  synced_at timestamp with time zone default now() not null
);

-- 048 email_queue
create table public.email_queue (
  id uuid default gen_random_uuid() not null,
  to_email text not null,
  subject text not null,
  html text not null,
  event_type text,
  metadata jsonb,
  status text default 'pending'::text not null,
  attempts integer default 0 not null,
  error text,
  scheduled_at timestamp with time zone default now() not null,
  sent_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  max_attempts integer default 3 not null
);

-- 049 email_threads
create table public.email_threads (
  id uuid default gen_random_uuid() not null,
  thread_id text not null,
  case_id uuid,
  subject text,
  client_email text,
  snippet text,
  last_message_at timestamp with time zone,
  unread boolean default true,
  created_at timestamp with time zone default now()
);

-- 050 establishments
create table public.establishments (
  id uuid default gen_random_uuid() not null,
  company_id uuid not null,
  address jsonb,
  data jsonb,
  created_at timestamp with time zone default now()
);

-- 051 expert_companies
create table public.expert_companies (
  id uuid default gen_random_uuid() not null,
  razon_social text not null,
  nombre_comercial text,
  cif_nif text,
  forma_juridica text default 'autonomo'::text not null,
  direccion text,
  ciudad text,
  provincia text,
  codigo_postal text,
  pais text default 'ES'::text not null,
  telefono text,
  email text,
  web text,
  stripe_customer_id text,
  created_by uuid not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 052 expert_orders
create table public.expert_orders (
  id uuid default gen_random_uuid() not null,
  quote_id uuid not null,
  client_id uuid,
  company_id uuid,
  stripe_payment_id text,
  amount_eur numeric(10,2) not null,
  currency text default 'EUR'::text not null,
  status text default 'paid'::text not null,
  metadata jsonb,
  created_at timestamp with time zone default now() not null
);

-- 053 expert_profile_companies
create table public.expert_profile_companies (
  profile_id uuid not null,
  company_id uuid not null,
  role text default 'owner'::text not null,
  created_at timestamp with time zone default now() not null
);

-- 054 express_consultations
create table public.express_consultations (
  id uuid default gen_random_uuid() not null,
  name text not null,
  email text not null,
  phone text not null,
  contact_method text not null,
  additional_attendees text,
  status text default 'pending'::text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 055 external_mappings
create table public.external_mappings (
  id uuid default gen_random_uuid() not null,
  provider text not null,
  local_entity text not null,
  local_id text not null,
  external_entity text not null,
  external_id text not null,
  tenant_id uuid,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  company_id uuid
);

-- 056 faq_submissions
create table public.faq_submissions (
  id uuid default gen_random_uuid() not null,
  question text not null,
  user_email text,
  status text default 'new'::text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 057 faqs
create table public.faqs (
  id uuid default gen_random_uuid() not null,
  question text not null,
  answer text not null,
  category text default 'General'::text,
  is_visible boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 058 files
create table public.files (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  file_name text not null,
  file_size bigint,
  file_type text,
  file_url text not null,
  category text default 'general'::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 059 fiscal_obligations
create table public.fiscal_obligations (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  company_id uuid,
  year integer not null,
  obligation_key text not null,
  modelo text not null,
  description text not null,
  period_label text,
  deadline date not null,
  status text default 'pending'::text not null,
  google_event_id text,
  reminded_30d_at timestamp with time zone,
  reminded_7d_at timestamp with time zone,
  reminded_1d_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  template_code text,
  obligations_calendar_id uuid
);

-- 060 free_trial_requests
create table public.free_trial_requests (
  id uuid default gen_random_uuid() not null,
  full_name text not null,
  email text not null,
  phone text,
  company_name text not null,
  employees_count text not null,
  industry text not null,
  message text,
  accepts_communication boolean default true,
  status text default 'pending'::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 061 gmail_tokens
create table public.gmail_tokens (
  id text default 'admin'::text not null,
  access_token text not null,
  refresh_token text not null,
  expiry_date bigint not null,
  email text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 062 google_tokens
create table public.google_tokens (
  user_id uuid not null,
  access_token text not null,
  refresh_token text not null,
  expiry_date bigint not null,
  scope text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 063 holded_contact_creation_claims
create table public.holded_contact_creation_claims (
  id uuid default gen_random_uuid() not null,
  company_id uuid not null,
  owner_token uuid not null,
  state text default 'claimed'::text not null,
  holded_contact_id text,
  lease_expires_at timestamp with time zone default (now() + '00:02:00'::interval) not null,
  last_error text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 064 holded_demos
create table public.holded_demos (
  id uuid default gen_random_uuid() not null,
  name text not null,
  email text not null,
  phone text,
  company_name text not null,
  company_type text,
  employees_count text,
  current_software text,
  needs text,
  status text default 'pending'::text not null,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 065 holded_mcp_connections
create table public.holded_mcp_connections (
  id uuid default gen_random_uuid() not null,
  mcp_user_id text not null,
  supabase_user_id uuid,
  email text not null,
  channel text default 'claude'::text not null,
  source text,
  encrypted_api_key text not null,
  status text default 'connected'::text not null,
  legal_accepted_at timestamp with time zone,
  terms_accepted boolean default false not null,
  privacy_accepted boolean default false not null,
  last_activity_at timestamp with time zone,
  last_tool_used text,
  revoked_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 066 holded_mcp_events
create table public.holded_mcp_events (
  id uuid default gen_random_uuid() not null,
  event_type text not null,
  channel text default 'claude'::text not null,
  user_id_mcp text,
  tenant_id text,
  user_email text,
  payload jsonb default '{}'::jsonb not null,
  detected_at timestamp with time zone default now() not null,
  created_at timestamp with time zone default now() not null
);

-- 067 holded_sync_jobs
create table public.holded_sync_jobs (
  id uuid default gen_random_uuid() not null,
  integration_id uuid,
  company_id uuid,
  client_id uuid,
  job_type text not null,
  status text default 'queued'::text not null,
  period_year integer,
  period_quarter integer,
  cursor text,
  attempts integer default 0 not null,
  next_run_at timestamp with time zone,
  started_at timestamp with time zone,
  finished_at timestamp with time zone,
  error text,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- 068 implementation_projects
create table public.implementation_projects (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  project_name text,
  status text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 069 integration_sync_events
create table public.integration_sync_events (
  id uuid default gen_random_uuid() not null,
  provider text not null,
  direction text not null,
  operation text not null,
  local_entity text,
  local_id text,
  external_entity text,
  external_id text,
  status text default 'pending'::text not null,
  attempt_count integer default 1 not null,
  request_payload jsonb,
  response_payload jsonb,
  error text,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  company_id uuid,
  client_id uuid,
  integration_id uuid
);

-- 070 internal_tasks
create table public.internal_tasks (
  id uuid default gen_random_uuid() not null,
  title text not null,
  description text,
  status text default 'pendiente'::text not null,
  priority text default 'media'::text not null,
  assigned_to uuid,
  case_id uuid,
  client_id uuid,
  lead_id uuid,
  due_date date,
  source text default 'manual'::text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  completed_at timestamp with time zone,
  company_id uuid,
  metadata jsonb default '{}'::jsonb not null
);

-- 071 invoice_lines
create table public.invoice_lines (
  id bigint default nextval('invoice_lines_id_seq'::regclass) not null,
  invoice_id uuid,
  description text,
  qty numeric default 1 not null,
  unit_price numeric not null,
  tax_rate numeric default 21 not null,
  total_line numeric generated always as (((qty * unit_price) * ((1)::numeric + (tax_rate / (100)::numeric))) stored
);

-- 072 invoices
create table public.invoices (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  invoice_number text not null,
  concept text,
  amount numeric(10,2),
  status text,
  date timestamp with time zone,
  due_date timestamp with time zone,
  pdf_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 073 kia_auditor_reviews
create table public.kia_auditor_reviews (
  id uuid default gen_random_uuid() not null,
  source_type text not null,
  source_id uuid,
  conversation_id uuid,
  decision_log_id uuid,
  client_id uuid,
  lead_id uuid,
  case_id uuid,
  channel text,
  overall_status text not null,
  score numeric(5,2) not null,
  summary text not null,
  findings jsonb default '[]'::jsonb not null,
  rules_passed jsonb default '[]'::jsonb not null,
  rules_failed jsonb default '[]'::jsonb not null,
  recommendations jsonb default '[]'::jsonb not null,
  reviewer_provider text,
  reviewer_model text,
  acknowledged boolean default false not null,
  acknowledged_at timestamp with time zone,
  acknowledged_by uuid,
  created_at timestamp with time zone default now()
);

-- 074 kia_auditor_rule_results
create table public.kia_auditor_rule_results (
  id uuid default gen_random_uuid() not null,
  review_id uuid not null,
  rule_id text not null,
  category text not null,
  severity text not null,
  status text not null,
  expected text,
  actual text,
  explanation text,
  created_at timestamp with time zone default now()
);

-- 075 kia_behavior_anomalies
create table public.kia_behavior_anomalies (
  id uuid default gen_random_uuid() not null,
  source text not null,
  severity text not null,
  anomaly_type text not null,
  title text not null,
  description text not null,
  related_decision_log_id uuid,
  related_conversation_id uuid,
  resolved boolean default false not null,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default now(),
  status text default 'open'::text not null,
  updated_at timestamp with time zone default now() not null
);

-- 076 kia_cart_items
create table public.kia_cart_items (
  id uuid default gen_random_uuid() not null,
  phone_number text not null,
  lead_id uuid,
  client_id uuid,
  service_id text not null,
  service_label text not null,
  service_area text,
  stripe_price_id text,
  expires_at timestamp with time zone default (now() + '48:00:00'::interval) not null,
  created_at timestamp with time zone default now() not null
);

-- 077 kia_decision_logs
create table public.kia_decision_logs (
  id uuid default gen_random_uuid() not null,
  provider text,
  model text,
  task_type text not null,
  channel text not null,
  contact_status text,
  client_id uuid,
  lead_id uuid,
  case_id uuid,
  company_id uuid,
  input_hash text,
  output_json jsonb,
  decision_summary text,
  rules_applied text[],
  confidence numeric(4,3),
  requires_meeting boolean,
  requires_manual_review boolean,
  tool_calls jsonb,
  tool_results_summary jsonb,
  error text,
  created_at timestamp with time zone default now(),
  tokens_in integer,
  tokens_out integer,
  estimated_cost_usd numeric(10,6),
  loop_iterations smallint default 0
);

-- 078 kia_feedback
create table public.kia_feedback (
  id uuid default gen_random_uuid() not null,
  decision_log_id uuid,
  phone text not null,
  client_id uuid,
  lead_id uuid,
  rating text not null,
  channel text default 'waba'::text not null,
  kia_reply text,
  user_message text,
  intent text,
  next_action text,
  task_type text,
  created_at timestamp with time zone default now() not null
);

-- 079 kia_financial_reports
create table public.kia_financial_reports (
  id uuid default gen_random_uuid() not null,
  client_id uuid,
  company_id uuid,
  report_type text default 'empresa_status'::text not null,
  period text,
  title text not null,
  ai_summary text,
  data jsonb default '{}'::jsonb not null,
  generated_by text default 'kia'::text not null,
  viewed_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

-- 080 kia_health_check_results
create table public.kia_health_check_results (
  id uuid default gen_random_uuid() not null,
  run_id uuid not null,
  check_id text not null,
  category text not null,
  severity text not null,
  status text not null,
  input_message text,
  expected jsonb default '{}'::jsonb not null,
  actual jsonb default '{}'::jsonb not null,
  provider text,
  model text,
  latency_ms integer,
  tokens_input integer,
  tokens_output integer,
  cost_estimate numeric(10,6),
  error text,
  created_at timestamp with time zone default now(),
  decision_log_id uuid
);
