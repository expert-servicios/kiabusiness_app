-- Canonical billing entity model: public.companies + public.profile_companies.
-- This migration is schema-only. It does not rewrite or merge historical data.

-- profiles.active_company_id was accidentally wired to expert_companies, while
-- the dashboard, Admin and Holded flows use public.companies.
alter table public.profiles
  drop constraint if exists profiles_active_company_id_fkey;

alter table public.profiles
  add constraint profiles_active_company_id_fkey
  foreign key (active_company_id)
  references public.companies(id)
  on delete set null;

-- Stripe customer identity belongs to the contracting entity. Keep the legacy
-- profiles.stripe_customer_id for backward compatibility with older checkouts.
alter table public.companies
  add column if not exists stripe_customer_id text;

create unique index if not exists companies_stripe_customer_id_unique
  on public.companies(stripe_customer_id)
  where stripe_customer_id is not null;

-- Persist subscription checkouts immediately so abandoned/expired checkouts
-- are visible before a subscription exists.
alter table public.checkout_sessions
  add column if not exists company_id uuid;

alter table public.checkout_sessions
  drop constraint if exists checkout_sessions_company_id_fkey;

alter table public.checkout_sessions
  add constraint checkout_sessions_company_id_fkey
  foreign key (company_id)
  references public.companies(id)
  on delete set null;

create index if not exists checkout_sessions_company_id_idx
  on public.checkout_sessions(company_id);

create index if not exists checkout_sessions_user_status_idx
  on public.checkout_sessions(user_id, status, created_at desc);

-- subscriptions.company_id already exists; add the missing referential guard.
alter table public.subscriptions
  drop constraint if exists subscriptions_company_id_fkey;

alter table public.subscriptions
  add constraint subscriptions_company_id_fkey
  foreign key (company_id)
  references public.companies(id)
  on delete restrict;

create index if not exists subscriptions_company_id_idx
  on public.subscriptions(company_id);
