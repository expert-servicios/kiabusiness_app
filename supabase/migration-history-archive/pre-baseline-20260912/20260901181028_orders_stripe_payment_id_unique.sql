-- Closes a TOCTOU race in the Stripe webhook: checkout.session.completed and
-- checkout.session.async_payment_succeeded are different Stripe event IDs
-- for the same session, so the event-level dedup guard (stripe_processed_events)
-- does not prevent both from being processed for the same payment. Every
-- "idempotency" check against orders.stripe_payment_id is a select followed
-- by a conditional insert, not atomic — if both events arrive close together,
-- both can pass the check before either inserts, producing a duplicate order
-- and duplicate confirmation/admin emails for a single payment.
--
-- academy_enrollments.stripe_payment_id already has this protection
-- (20260721000001_academy_enrollments.sql); this brings orders in line.
--
-- Partial index (excludes NULLs) because stripe_payment_id is nullable for
-- non-Stripe order sources.
-- Abort with an actionable report instead of silently deleting financially
-- relevant rows. Duplicates require a reviewed reconciliation because orders
-- may have different Holded trace/status metadata.
do $$
declare duplicate_list text;
begin
  select string_agg(stripe_payment_id || ' (' || copies || ')', ', ' order by stripe_payment_id)
    into duplicate_list
    from (select stripe_payment_id, count(*) copies from public.orders
          where stripe_payment_id is not null group by stripe_payment_id having count(*) > 1) d;
  if duplicate_list is not null then
    raise exception 'Cannot enforce orders.stripe_payment_id uniqueness. Reconcile duplicates first: %', duplicate_list;
  end if;
end $$;

-- Production already uses this canonical index name. Reusing it makes the
-- migration a no-op where protection already exists and avoids maintaining two
-- equivalent unique indexes on the same financial identifier.
create unique index if not exists orders_stripe_payment_id_idx
  on public.orders (stripe_payment_id) where stripe_payment_id is not null;
