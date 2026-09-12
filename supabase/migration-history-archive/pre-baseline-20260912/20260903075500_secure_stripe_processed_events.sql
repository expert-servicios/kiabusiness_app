-- Stripe event idempotency state is server-only infrastructure.
-- Browser/client roles must never read or mutate processed event claims.
alter table public.stripe_processed_events enable row level security;

revoke all privileges on table public.stripe_processed_events from public;
revoke all privileges on table public.stripe_processed_events from anon;
revoke all privileges on table public.stripe_processed_events from authenticated;

-- The webhook calls service-role-only SECURITY DEFINER RPCs. service_role has
-- BYPASSRLS, so enabling RLS does not interrupt event claim/complete/fail.
grant select, insert, update, delete on table public.stripe_processed_events to service_role;
