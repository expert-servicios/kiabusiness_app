-- Explicit legal-entity attribution for Stripe invoices.
--
-- A Stripe Customer may be reused across legal entities over time. Therefore
-- Customer-level mapping is not sufficient for accounting history. This table
-- records the legal company that owns a specific immutable Stripe invoice.
-- Corrections revoke an attribution and create a new one; rows are not deleted.

create table public.stripe_invoice_company_attributions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  company_id uuid not null references public.companies(id),
  stripe_invoice_id text not null,
  stripe_customer_id text not null,
  invoice_tax_id text,
  source text not null check (source in ('invoice_tax_id', 'manual_review')),
  status text not null default 'active' check (status in ('active', 'revoked')),
  evidence jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_by uuid references public.profiles(id) on delete set null,
  revoked_at timestamptz,
  revocation_reason text,
  constraint stripe_invoice_company_attributions_invoice_id_nonempty
    check (btrim(stripe_invoice_id) <> ''),
  constraint stripe_invoice_company_attributions_customer_id_nonempty
    check (btrim(stripe_customer_id) <> ''),
  constraint stripe_invoice_company_attributions_revocation_consistency
    check (
      (status = 'active' and revoked_at is null and revoked_by is null and revocation_reason is null)
      or
      (status = 'revoked' and revoked_at is not null and revocation_reason is not null)
    )
);

create unique index stripe_invoice_company_attributions_one_active_idx
  on public.stripe_invoice_company_attributions (tenant_id, stripe_invoice_id)
  where status = 'active';

create index stripe_invoice_company_attributions_company_idx
  on public.stripe_invoice_company_attributions (company_id, status, created_at desc);

create index stripe_invoice_company_attributions_customer_idx
  on public.stripe_invoice_company_attributions (stripe_customer_id, status, created_at desc);

alter table public.stripe_invoice_company_attributions enable row level security;

revoke all on table public.stripe_invoice_company_attributions from public;
revoke all on table public.stripe_invoice_company_attributions from anon;
revoke all on table public.stripe_invoice_company_attributions from authenticated;
revoke all on table public.stripe_invoice_company_attributions from service_role;
grant select, insert, update on table public.stripe_invoice_company_attributions to service_role;

comment on table public.stripe_invoice_company_attributions is
  'Explicit legal-entity ownership of immutable Stripe invoices. Corrections revoke rows; application service_role has no DELETE privilege.';
