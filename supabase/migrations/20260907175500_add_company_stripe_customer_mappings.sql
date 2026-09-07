create table public.company_stripe_customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id),
  stripe_customer_id text not null,
  is_primary boolean not null default false,
  status text not null default 'active'
    check (status in ('active','historical','revoked')),
  source text not null default 'manual_review',
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, stripe_customer_id)
);

create index company_stripe_customers_company_idx
  on public.company_stripe_customers (company_id, status);

create unique index company_stripe_customers_one_primary_active_idx
  on public.company_stripe_customers (company_id)
  where is_primary and status = 'active';

alter table public.company_stripe_customers enable row level security;

revoke all on public.company_stripe_customers from public, anon, authenticated;
grant select, insert, update, delete on public.company_stripe_customers to service_role;

comment on table public.company_stripe_customers is
  'Explicit many-to-one mapping from Stripe customer objects to an EXPERT company. Email is not an identity key; multiple historical Stripe customers may map to one company.';
comment on column public.company_stripe_customers.is_primary is
  'Preferred active Stripe customer for new company-scoped operations. Historical mappings remain preserved.';
comment on column public.company_stripe_customers.status is
  'Mapping lifecycle. active is usable, historical is preserved for reads, revoked is excluded from normal reads.';
