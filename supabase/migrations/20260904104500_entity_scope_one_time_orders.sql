-- Entity-scope future one-time orders without rewriting historical rows.
-- The checkout API persists stripe_session_id + company_id before redirecting to Stripe.
-- New catalog orders already store that Stripe Checkout Session id under
-- metadata.checkout_session.id, so the DB can inherit the contracting entity
-- atomically at insert time without relying on profile.active_company_id.

create or replace function public.inherit_checkout_company_to_order()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_session_id text;
  v_company_id uuid;
begin
  if new.company_id is null then
    v_session_id := nullif(new.metadata -> 'checkout_session' ->> 'id', '');
    if v_session_id is not null then
      select cs.company_id
        into v_company_id
        from public.checkout_sessions cs
       where cs.stripe_session_id = v_session_id;

      if v_company_id is not null then
        new.company_id := v_company_id;
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_orders_inherit_checkout_company on public.orders;
create trigger trg_orders_inherit_checkout_company
before insert on public.orders
for each row
execute function public.inherit_checkout_company_to_order();

create or replace function public.complete_checkout_session_from_order()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_session_id text;
begin
  v_session_id := nullif(new.metadata -> 'checkout_session' ->> 'id', '');
  if v_session_id is not null then
    update public.checkout_sessions
       set status = 'completed',
           updated_at = now()
     where stripe_session_id = v_session_id
       and status in ('open', 'pending');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_orders_complete_checkout_session on public.orders;
create trigger trg_orders_complete_checkout_session
after insert on public.orders
for each row
execute function public.complete_checkout_session_from_order();

comment on function public.inherit_checkout_company_to_order() is
  'For new orders only, inherit contracting company_id from persisted Stripe checkout context.';
comment on function public.complete_checkout_session_from_order() is
  'For new orders only, mark the matching persisted Stripe checkout session completed.';
