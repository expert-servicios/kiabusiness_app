-- Commercial benefits and included entities reuse the existing subscription_entitlements table.
-- This is operational/commercial metadata only: it never creates Stripe subscriptions or invoices.

alter table public.subscription_entitlements
  add column if not exists primary_company_id uuid references public.companies(id) on delete cascade,
  add column if not exists beneficiary_company_id uuid references public.companies(id) on delete cascade,
  add column if not exists checkout_session_id uuid references public.checkout_sessions(id) on delete set null,
  add column if not exists benefit_value numeric(12,2),
  add column if not exists coverage_scope text,
  add column if not exists excluded_services text[] not null default '{}';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'subscription_entitlements_benefit_value_check'
  ) then
    alter table public.subscription_entitlements
      add constraint subscription_entitlements_benefit_value_check
      check (benefit_value is null or benefit_value >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'subscription_entitlements_coverage_scope_check'
  ) then
    alter table public.subscription_entitlements
      add constraint subscription_entitlements_coverage_scope_check
      check (coverage_scope is null or coverage_scope in ('recurring_management','subscription_fee','custom'));
  end if;
end $$;

create index if not exists idx_entitlements_primary_company_active
  on public.subscription_entitlements (primary_company_id, active, feature_key)
  where primary_company_id is not null;

create index if not exists idx_entitlements_beneficiary_company_active
  on public.subscription_entitlements (beneficiary_company_id, active, feature_key)
  where beneficiary_company_id is not null;

create index if not exists idx_entitlements_checkout_session
  on public.subscription_entitlements (checkout_session_id)
  where checkout_session_id is not null;

create unique index if not exists subscription_entitlements_one_active_commercial_benefit
  on public.subscription_entitlements (
    client_id,
    primary_company_id,
    beneficiary_company_id,
    feature_key,
    coalesce(subscription_id, checkout_session_id)
  )
  where active = true
    and feature_key in ('included_entity','discount_percent','discount_amount','free_months')
    and primary_company_id is not null
    and beneficiary_company_id is not null
    and coalesce(subscription_id, checkout_session_id) is not null;

-- Stripe event ordering is not guaranteed. When EXPERT persists or refreshes the
-- real subscription after completing its Checkout, attach only benefits from a
-- recently completed Checkout for the same client and contracting company.
create or replace function public.link_pending_subscription_commercial_benefits()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.company_id is null then
    return new;
  end if;

  update public.subscription_entitlements e
     set subscription_id = new.id,
         updated_at = now()
    from public.checkout_sessions cs
   where e.checkout_session_id = cs.id
     and e.subscription_id is null
     and e.active = true
     and e.feature_key in ('included_entity','discount_percent','discount_amount','free_months')
     and e.client_id = new.client_id
     and e.primary_company_id = new.company_id
     and cs.user_id = new.client_id
     and cs.company_id = new.company_id
     and cs.status in ('completed','complete')
     and abs(extract(epoch from (new.updated_at - cs.updated_at))) <= 900;

  return new;
end;
$$;

drop trigger if exists link_pending_subscription_commercial_benefits_trg on public.subscriptions;
create trigger link_pending_subscription_commercial_benefits_trg
after insert or update of client_id, company_id, updated_at on public.subscriptions
for each row
execute function public.link_pending_subscription_commercial_benefits();
