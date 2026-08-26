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
create unique index if not exists orders_stripe_payment_id_unique
  on public.orders (stripe_payment_id)
  where stripe_payment_id is not null;
