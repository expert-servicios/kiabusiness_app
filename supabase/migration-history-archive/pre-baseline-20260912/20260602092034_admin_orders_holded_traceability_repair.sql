-- Admin CRM order traceability repair.
--
-- The admin client detail view and Stripe webhook expect orders to keep
-- Stripe/Holded traceability even when invoice sync fails. These additions are
-- idempotent and do not modify existing order data.

alter table public.orders
  add column if not exists company_id uuid references public.companies(id) on delete set null,
  add column if not exists holded_invoice_id text,
  add column if not exists holded_sync_event_id text,
  add column if not exists holded_sync_error text,
  add column if not exists holded_synced_at timestamptz;

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('pending', 'paid', 'failed', 'paid_invoice_error'));

create index if not exists orders_company_idx
  on public.orders (company_id)
  where company_id is not null;

create index if not exists orders_holded_invoice_idx
  on public.orders (holded_invoice_id)
  where holded_invoice_id is not null;
