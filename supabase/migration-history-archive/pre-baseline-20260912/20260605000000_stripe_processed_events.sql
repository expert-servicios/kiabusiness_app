-- IMP-004: Event-level idempotency for Stripe webhooks
--
-- Problem: the existing per-payment idempotency checks (stripe_payment_id uniqueness
-- in the orders table) protect against duplicate orders but NOT against duplicate
-- event processing. If Stripe retries the same event.id, subscription emails and
-- Holded syncs fire again.
--
-- Fix: record every processed event.id BEFORE processing. On conflict (duplicate
-- event), return 200 immediately without re-processing.

create table if not exists public.stripe_processed_events (
  event_id     text        primary key,
  event_type   text        not null,
  processed_at timestamptz not null default now()
);

-- Index for cleanup queries (prune events older than 90 days)
create index if not exists stripe_processed_events_processed_at_idx
  on public.stripe_processed_events (processed_at);

-- Only service_role needs access (webhook handler uses getSupabaseAdmin)
grant select, insert on public.stripe_processed_events to service_role;

-- Enable RLS — no policies needed; authenticated role has no grant
alter table public.stripe_processed_events enable row level security;

-- Admin can inspect processed events
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'stripe_processed_events'
      and policyname = 'admin read stripe_processed_events'
  ) then
    execute '
      create policy "admin read stripe_processed_events" on public.stripe_processed_events
        for select using (public.is_admin())
    ';
  end if;
end $$;
