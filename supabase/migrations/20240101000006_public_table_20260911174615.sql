-- Candidate current-schema baseline delta for issue #143.
-- Production migration snapshot: 20260911174615_client_accounting_records.
-- Constraints, indexes and RLS are layered separately.

create table public.client_accounting_records (
  id uuid default gen_random_uuid() not null,
  integration_id uuid not null,
  company_id uuid not null,
  record_type text not null,
  external_id text not null,
  record_date date,
  amount numeric,
  currency text default 'EUR'::text,
  status text,
  data jsonb not null,
  synced_at timestamp with time zone default now() not null
);
