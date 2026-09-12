-- S3 fix: orders.quote_id NOT NULL blocks catalog service payments.
-- The Stripe webhook only creates orders when a quote_id is found
-- (presupuesto flow). Direct catalog checkouts from /api/services/checkout
-- never have a quote_id, so no order record was created after payment.
--
-- Changes:
--   1. Make quote_id nullable (keep FK + set null on cascade).
--   2. Add source column to distinguish presupuesto vs catalog payments.
--   3. Add service_slugs for catalog multi-item orders.
--   4. Keep existing quote flow fully compatible.

-- 1. Drop the NOT NULL constraint and make quote_id nullable.
--    The FK still exists; ON DELETE SET NULL is already correct behavior.
alter table public.orders
  alter column quote_id drop not null;

-- Re-declare the FK without NOT NULL (altering nullability drops the constraint in some PG versions;
-- re-add to be safe).
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'orders_quote_id_fkey'
      and table_schema = 'public'
      and table_name   = 'orders'
  ) then
    alter table public.orders
      add constraint orders_quote_id_fkey
      foreign key (quote_id) references public.quotes(id) on delete set null;
  end if;
end $$;

-- 2. Add source column (default 'quote' for backward compat).
alter table public.orders
  add column if not exists source text not null default 'quote'
    check (source in ('quote', 'catalog', 'waba'));

-- 3. Add service_slugs for catalog orders (comma-separated, mirrors Stripe metadata).
alter table public.orders
  add column if not exists service_slugs text;

-- Update existing quote-linked rows so source is consistent.
update public.orders set source = 'quote' where quote_id is not null and source = 'quote';

create index if not exists orders_source_idx on public.orders (source);
create index if not exists orders_client_created_idx on public.orders (client_id, created_at desc);
