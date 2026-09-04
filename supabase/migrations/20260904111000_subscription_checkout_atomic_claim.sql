-- Prevent concurrent subscription Checkout creation for the same contracting
-- entity + plan intent. Forward-only: no historical financial rows are changed.

create table if not exists public.subscription_checkout_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  intent_key text not null,
  owner_token uuid not null,
  state text not null default 'claimed' check (state in ('claimed','open','expired','manual_review')),
  stripe_session_id text null,
  lease_expires_at timestamptz not null default (now() + interval '2 minutes'),
  last_error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscription_checkout_claims_active_intent_uidx
  on public.subscription_checkout_claims(user_id, company_id, intent_key)
  where state in ('claimed','open','manual_review');

create unique index if not exists subscription_checkout_claims_session_uidx
  on public.subscription_checkout_claims(stripe_session_id)
  where stripe_session_id is not null;

create index if not exists subscription_checkout_claims_lease_idx
  on public.subscription_checkout_claims(lease_expires_at)
  where state = 'claimed';

alter table public.subscription_checkout_claims enable row level security;
revoke all on table public.subscription_checkout_claims from public, anon, authenticated;
grant all on table public.subscription_checkout_claims to service_role;

create or replace function public.claim_subscription_checkout(
  p_user_id uuid,
  p_company_id uuid,
  p_intent_key text,
  p_owner_token uuid,
  p_lease_seconds integer default 120
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.subscription_checkout_claims%rowtype;
  v_lease interval;
begin
  if p_user_id is null or p_company_id is null or nullif(trim(p_intent_key), '') is null or p_owner_token is null then
    raise exception 'invalid subscription checkout claim arguments';
  end if;

  v_lease := make_interval(secs => greatest(30, least(coalesce(p_lease_seconds, 120), 600)));

  begin
    insert into public.subscription_checkout_claims(
      user_id, company_id, intent_key, owner_token, state, lease_expires_at
    ) values (
      p_user_id, p_company_id, trim(p_intent_key), p_owner_token, 'claimed', now() + v_lease
    )
    returning * into v_row;

    return jsonb_build_object(
      'acquired', true,
      'claim_id', v_row.id,
      'state', v_row.state,
      'stripe_session_id', v_row.stripe_session_id
    );
  exception when unique_violation then
    null;
  end;

  select * into v_row
    from public.subscription_checkout_claims
   where user_id = p_user_id
     and company_id = p_company_id
     and intent_key = trim(p_intent_key)
     and state in ('claimed','open','manual_review')
   order by created_at desc
   limit 1
   for update;

  if not found then
    -- The conflicting row may have transitioned to expired between the unique
    -- check and this lock. Let the caller retry instead of guessing.
    return jsonb_build_object('acquired', false, 'state', 'retry');
  end if;

  if v_row.state = 'claimed' and v_row.lease_expires_at <= now() then
    update public.subscription_checkout_claims
       set owner_token = p_owner_token,
           lease_expires_at = now() + v_lease,
           updated_at = now(),
           last_error = null
     where id = v_row.id
     returning * into v_row;

    return jsonb_build_object(
      'acquired', true,
      'claim_id', v_row.id,
      'state', v_row.state,
      'stripe_session_id', v_row.stripe_session_id
    );
  end if;

  return jsonb_build_object(
    'acquired', false,
    'claim_id', v_row.id,
    'state', v_row.state,
    'stripe_session_id', v_row.stripe_session_id
  );
end;
$$;

create or replace function public.finalize_subscription_checkout_claim(
  p_claim_id uuid,
  p_owner_token uuid,
  p_stripe_session_id text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.subscription_checkout_claims
     set state = 'open',
         stripe_session_id = p_stripe_session_id,
         lease_expires_at = now(),
         updated_at = now(),
         last_error = null
   where id = p_claim_id
     and owner_token = p_owner_token
     and state = 'claimed';

  if not found then
    raise exception 'subscription checkout claim ownership lost';
  end if;
end;
$$;

create or replace function public.expire_subscription_checkout_claim(
  p_claim_id uuid,
  p_owner_token uuid,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.subscription_checkout_claims
     set state = 'expired',
         lease_expires_at = now(),
         updated_at = now(),
         last_error = left(p_error, 500)
   where id = p_claim_id
     and owner_token = p_owner_token
     and state = 'claimed';

  if not found then
    raise exception 'subscription checkout claim ownership lost';
  end if;
end;
$$;

create or replace function public.flag_subscription_checkout_claim_review(
  p_claim_id uuid,
  p_owner_token uuid,
  p_error text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.subscription_checkout_claims
     set state = 'manual_review',
         lease_expires_at = now(),
         updated_at = now(),
         last_error = left(p_error, 500)
   where id = p_claim_id
     and owner_token = p_owner_token
     and state = 'claimed';

  if not found then
    raise exception 'subscription checkout claim ownership lost';
  end if;
end;
$$;

revoke all on function public.claim_subscription_checkout(uuid,uuid,text,uuid,integer) from public, anon, authenticated;
revoke all on function public.finalize_subscription_checkout_claim(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.expire_subscription_checkout_claim(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.flag_subscription_checkout_claim_review(uuid,uuid,text) from public, anon, authenticated;

grant execute on function public.claim_subscription_checkout(uuid,uuid,text,uuid,integer) to service_role;
grant execute on function public.finalize_subscription_checkout_claim(uuid,uuid,text) to service_role;
grant execute on function public.expire_subscription_checkout_claim(uuid,uuid,text) to service_role;
grant execute on function public.flag_subscription_checkout_claim_review(uuid,uuid,text) to service_role;

comment on table public.subscription_checkout_claims is
  'Atomic pre-Stripe claims for subscription checkout creation. No historical billing data is stored or rewritten here.';
