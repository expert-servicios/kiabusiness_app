-- Keep active subscription checkout claims from blocking future attempts once
-- the persisted Stripe checkout reaches a terminal state.

create or replace function public.sync_subscription_checkout_claim_status()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.status is distinct from old.status and new.status in ('completed', 'expired') then
    update public.subscription_checkout_claims
       set state = new.status,
           updated_at = now(),
           lease_expires_at = now()
     where stripe_session_id = new.stripe_session_id
       and state in ('claimed', 'open');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_checkout_sessions_sync_subscription_claim on public.checkout_sessions;
create trigger trg_checkout_sessions_sync_subscription_claim
after update of status on public.checkout_sessions
for each row
execute function public.sync_subscription_checkout_claim_status();

comment on function public.sync_subscription_checkout_claim_status() is
  'Synchronizes terminal checkout_sessions status into subscription checkout claims; forward-only, no historical backfill.';
