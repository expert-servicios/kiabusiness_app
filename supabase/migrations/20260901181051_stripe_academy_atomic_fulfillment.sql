-- Stripe/Academy fulfillment must be one database transaction. The webhook
-- may be delivered concurrently and may be retried after any network failure.

alter table public.stripe_processed_events
  add column if not exists status text not null default 'processed'
    check (status in ('processing', 'processed')),
  add column if not exists claimed_at timestamptz,
  add column if not exists last_error text;

create or replace function public.claim_stripe_event(
  p_event_id text,
  p_event_type text,
  p_lease_seconds integer default 300
) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_claimed boolean := false;
begin
  insert into public.stripe_processed_events(event_id, event_type, status, claimed_at, processed_at)
  values (p_event_id, p_event_type, 'processing', now(), now())
  on conflict (event_id) do update
    set status = 'processing', claimed_at = now(), last_error = null
    where stripe_processed_events.status <> 'processed'
      and coalesce(stripe_processed_events.claimed_at, '-infinity'::timestamptz)
          < now() - make_interval(secs => greatest(p_lease_seconds, 30))
  returning true into v_claimed;
  return coalesce(v_claimed, false);
end $$;

create or replace function public.complete_stripe_event(p_event_id text)
returns void language sql security definer set search_path = public as $$
  update public.stripe_processed_events
     set status = 'processed', processed_at = now(), last_error = null
   where event_id = p_event_id;
$$;

create or replace function public.fail_stripe_event(p_event_id text, p_error text)
returns void language sql security definer set search_path = public as $$
  update public.stripe_processed_events
     set status = 'processing', claimed_at = null, last_error = left(p_error, 1000)
   where event_id = p_event_id and status <> 'processed';
$$;

create or replace function public.fulfill_academy_program_payment(
  p_payment_id text, p_session_id text, p_client_id uuid,
  p_customer_email text, p_program_slug text, p_program_name text,
  p_amount_eur numeric, p_currency text
) returns table(order_id uuid, enrollment_id uuid, created boolean)
language plpgsql security definer set search_path = public as $$
declare v_order public.orders%rowtype; v_enrollment public.academy_enrollments%rowtype;
begin
  if nullif(trim(p_payment_id), '') is null or nullif(trim(p_program_slug), '') is null then
    raise exception 'payment_id and program_slug are required';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_payment_id, 0));
  if p_client_id is not null and not exists(select 1 from public.profiles where id=p_client_id) then
    raise exception 'Academy client does not exist';
  end if;

  select * into v_order from public.orders where stripe_payment_id=p_payment_id for update;
  if found and (v_order.source <> 'academy' or v_order.service_slugs is distinct from p_program_slug
      or (v_order.client_id is not null and v_order.client_id is distinct from p_client_id)) then
    raise exception 'Payment is already owned by another order';
  end if;
  if not found then
    -- `pack_name` and `amount` are legacy NOT NULL columns still enforced by
    -- production. Write both the current and legacy representations so Academy
    -- remains compatible while the historical schema is still in service.
    insert into public.orders(
      source,client_id,stripe_payment_id,amount_eur,amount,currency,status,
      service_slugs,pack_name,metadata
    )
    values(
      'academy',p_client_id,p_payment_id,p_amount_eur,p_amount_eur,
      upper(coalesce(p_currency,'EUR')),'paid',p_program_slug,
      coalesce(nullif(trim(p_program_name),''),p_program_slug),
      jsonb_build_object(
        'checkout_session',jsonb_build_object('id',p_session_id,'payment_intent',p_payment_id,'customer_email',p_customer_email,'product_type','academy_program'),
        'academy',jsonb_build_object('program_name',p_program_name))
    )
    returning * into v_order;
    created := true;
  else created := false;
  end if;

  if p_client_id is not null then
    select * into v_enrollment from public.academy_enrollments where stripe_payment_id=p_payment_id for update;
    if found and (v_enrollment.client_id <> p_client_id or v_enrollment.program_slug <> p_program_slug) then
      raise exception 'Payment enrollment is owned by another client or program';
    end if;
    if not found then
      insert into public.academy_enrollments(client_id,program_slug,program_name,amount_eur,stripe_payment_id,status)
      values(p_client_id,p_program_slug,p_program_name,p_amount_eur,p_payment_id,'active') returning * into v_enrollment;
    end if;
  end if;
  order_id := v_order.id; enrollment_id := v_enrollment.id; return next;
end $$;

create or replace function public.fulfill_academy_certification_payment(
  p_payment_id text, p_session_id text, p_enrollment_id uuid, p_client_id uuid,
  p_customer_email text, p_program_slug text, p_amount_eur numeric, p_currency text
) returns table(order_id uuid, created boolean)
language plpgsql security definer set search_path = public as $$
declare v_enrollment public.academy_enrollments%rowtype; v_order public.orders%rowtype; v_slug text;
begin
  if p_client_id is null then raise exception 'Certification payment client is required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_payment_id, 0));
  select * into v_enrollment from public.academy_enrollments where id=p_enrollment_id for update;
  if not found then raise exception 'Academy enrollment does not exist'; end if;
  if v_enrollment.client_id <> p_client_id then
    raise exception 'Certification payment client does not own enrollment';
  end if;
  if v_enrollment.certification_status not in ('approved','paid') then
    raise exception 'Academy certification is not approved for payment';
  end if;
  v_slug := coalesce(nullif(p_program_slug,''),v_enrollment.program_slug) || '-certification';
  select * into v_order from public.orders where stripe_payment_id=p_payment_id for update;
  if found and (v_order.source <> 'academy' or v_order.service_slugs is distinct from v_slug) then
    raise exception 'Payment is already owned by another order';
  end if;
  if not found then
    insert into public.orders(
      source,client_id,stripe_payment_id,amount_eur,amount,currency,status,
      service_slugs,pack_name,metadata
    )
    values(
      'academy',v_enrollment.client_id,p_payment_id,p_amount_eur,p_amount_eur,
      upper(coalesce(p_currency,'EUR')),'paid',v_slug,
      coalesce(nullif(trim(v_enrollment.program_name),''),v_enrollment.program_slug) || ' - Certificación',
      jsonb_build_object('checkout_session',jsonb_build_object('id',p_session_id,'payment_intent',p_payment_id,'customer_email',p_customer_email,'product_type','academy_certification'))
    )
    returning * into v_order; created := true;
  else created := false;
  end if;
  update public.academy_enrollments set certification_status='paid',updated_at=now() where id=p_enrollment_id;
  order_id := v_order.id; return next;
end $$;

create or replace function public.link_academy_order(p_order_id uuid, p_client_id uuid)
returns table(enrollment_id uuid, created boolean)
language plpgsql security definer set search_path = public as $$
declare v_order public.orders%rowtype; v_profile public.profiles%rowtype; v_enrollment public.academy_enrollments%rowtype;
  v_email text; v_program_name text;
begin
  select * into v_order from public.orders where id=p_order_id and source='academy' for update;
  if not found then raise exception 'Academy order does not exist'; end if;
  if v_order.client_id is not null and v_order.client_id <> p_client_id then raise exception 'Order already belongs to another client'; end if;
  select * into v_profile from public.profiles where id=p_client_id;
  if not found then raise exception 'Client does not exist'; end if;
  v_email := v_order.metadata #>> '{checkout_session,customer_email}';
  if v_email is null or v_profile.email is null or lower(trim(v_email)) <> lower(trim(v_profile.email)) then
    raise exception 'Checkout email does not match client account';
  end if;
  if v_order.service_slugs like '%-certification' then raise exception 'Certification orders cannot create enrollments'; end if;
  select * into v_enrollment from public.academy_enrollments where stripe_payment_id=v_order.stripe_payment_id for update;
  if found and (v_enrollment.client_id <> p_client_id or v_enrollment.program_slug <> v_order.service_slugs) then
    raise exception 'Enrollment already belongs to another client or program';
  end if;
  if not found then
    v_program_name := coalesce(v_order.metadata #>> '{academy,program_name}', v_order.service_slugs);
    insert into public.academy_enrollments(client_id,program_slug,program_name,amount_eur,stripe_payment_id,status)
    values(p_client_id,v_order.service_slugs,v_program_name,coalesce(v_order.amount_eur,v_order.amount),v_order.stripe_payment_id,'active')
    returning * into v_enrollment; created := true;
  else created := false;
  end if;
  update public.orders set client_id=p_client_id where id=p_order_id;
  enrollment_id := v_enrollment.id; return next;
end $$;

revoke all on function public.claim_stripe_event(text,text,integer) from public, anon, authenticated;
revoke all on function public.complete_stripe_event(text) from public, anon, authenticated;
revoke all on function public.fail_stripe_event(text,text) from public, anon, authenticated;
revoke all on function public.fulfill_academy_program_payment(text,text,uuid,text,text,text,numeric,text) from public, anon, authenticated;
revoke all on function public.fulfill_academy_certification_payment(text,text,uuid,uuid,text,text,numeric,text) from public, anon, authenticated;
revoke all on function public.link_academy_order(uuid,uuid) from public, anon, authenticated;
grant execute on function public.claim_stripe_event(text,text,integer), public.complete_stripe_event(text), public.fail_stripe_event(text,text),
  public.fulfill_academy_program_payment(text,text,uuid,text,text,text,numeric,text),
  public.fulfill_academy_certification_payment(text,text,uuid,uuid,text,text,numeric,text), public.link_academy_order(uuid,uuid) to service_role;
