alter table public.leads
  add column tenant_id uuid references public.tenants(id),
  add column marketing_status text not null default 'unknown'
    check (marketing_status in ('unknown','consented','unsubscribed','blocked')),
  add column marketing_consent_at timestamptz,
  add column marketing_source text,
  add column lifecycle_stage text not null default 'lead'
    check (lifecycle_stage in ('lead','prospect','customer','former_customer')),
  add column stripe_activity text not null default 'no_activity'
    check (stripe_activity in ('no_activity','abandoned','paid','subscribed')),
  add column first_stripe_activity_at timestamptz,
  add column last_stripe_activity_at timestamptz,
  add column source_key text,
  add column metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object');

create unique index leads_source_key_unique_idx
  on public.leads (
    coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid),
    source,
    source_key
  )
  where source_key is not null;

create index leads_lifecycle_stage_idx
  on public.leads (lifecycle_stage, stripe_activity);

create index leads_marketing_status_idx
  on public.leads (marketing_status);

create index leads_tenant_idx
  on public.leads (tenant_id)
  where tenant_id is not null;

create table public.lead_stripe_customers (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id),
  stripe_customer_id text not null,
  stripe_email text not null,
  stripe_name text,
  stripe_phone text,
  stripe_customer_created_at timestamptz,
  activity_status text not null default 'no_activity'
    check (activity_status in ('no_activity','abandoned','paid','subscribed')),
  has_active_subscription boolean not null default false,
  successful_charges integer not null default 0 check (successful_charges >= 0),
  succeeded_payment_intents integer not null default 0 check (succeeded_payment_intents >= 0),
  paid_invoices integer not null default 0 check (paid_invoices >= 0),
  paid_checkouts integer not null default 0 check (paid_checkouts >= 0),
  first_activity_at timestamptz,
  last_activity_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, stripe_customer_id)
);

create index lead_stripe_customers_lead_idx
  on public.lead_stripe_customers (lead_id);

create index lead_stripe_customers_email_idx
  on public.lead_stripe_customers (lower(stripe_email));

create index lead_stripe_customers_activity_idx
  on public.lead_stripe_customers (activity_status, has_active_subscription);

alter table public.lead_stripe_customers enable row level security;

create policy "admin all lead_stripe_customers"
  on public.lead_stripe_customers
  for all
  using (public.is_admin())
  with check (public.is_admin());

revoke all on public.lead_stripe_customers from anon, authenticated;
grant select on public.lead_stripe_customers to authenticated;
grant select, insert, update, delete on public.lead_stripe_customers to service_role;

comment on column public.leads.marketing_status is
  'Marketing eligibility state. Stripe imports default to unknown and must not be treated as consent.';
comment on column public.leads.source_key is
  'Idempotent source-scoped key. Stripe Sync Engine imports use normalized email.';
comment on table public.lead_stripe_customers is
  'Many-to-one mapping of Stripe customer objects to a canonical EXPERT lead. Preserves duplicate historical Stripe customer IDs without merging Stripe history.';
