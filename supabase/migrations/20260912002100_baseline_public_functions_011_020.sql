-- Candidate current-schema baseline for issue #143.
-- Portable public functions 011-020 of 54, extracted with pg_get_functiondef.

CREATE OR REPLACE FUNCTION public.expire_subscription_checkout_claim(p_claim_id uuid, p_owner_token uuid, p_error text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
 update public.subscription_checkout_claims set state='expired',lease_expires_at=now(),updated_at=now(),last_error=left(p_error,500) where id=p_claim_id and owner_token=p_owner_token and state='claimed';
 if not found then raise exception 'subscription checkout claim ownership lost'; end if;
end; $function$;

CREATE OR REPLACE FUNCTION public.fail_stripe_event(p_event_id text, p_error text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  update public.stripe_processed_events
     set status = 'processing', claimed_at = null, last_error = left(p_error, 1000)
   where event_id = p_event_id and status <> 'processed';
$function$;

CREATE OR REPLACE FUNCTION public.finalize_subscription_checkout_claim(p_claim_id uuid, p_owner_token uuid, p_stripe_session_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
 update public.subscription_checkout_claims set state='open',stripe_session_id=p_stripe_session_id,lease_expires_at=now(),updated_at=now(),last_error=null where id=p_claim_id and owner_token=p_owner_token and state='claimed';
 if not found then raise exception 'subscription checkout claim ownership lost'; end if;
end; $function$;

CREATE OR REPLACE FUNCTION public.flag_holded_contact_creation_review(p_claim_id uuid, p_owner_token uuid, p_error text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$ begin update public.holded_contact_creation_claims set state='manual_review',lease_expires_at=now(),updated_at=now(),last_error=left(p_error,500) where id=p_claim_id and owner_token=p_owner_token and state in ('claimed','creating'); if not found then raise exception 'Holded contact claim ownership lost'; end if; end; $function$;

CREATE OR REPLACE FUNCTION public.flag_subscription_checkout_claim_review(p_claim_id uuid, p_owner_token uuid, p_error text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
 update public.subscription_checkout_claims set state='manual_review',lease_expires_at=now(),updated_at=now(),last_error=left(p_error,500) where id=p_claim_id and owner_token=p_owner_token and state='claimed';
 if not found then raise exception 'subscription checkout claim ownership lost'; end if;
end; $function$;

CREATE OR REPLACE FUNCTION public.fn_check_asiento_cuadrado()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_debe numeric(14,2); v_haber numeric(14,2);
begin
  if new.estado = 'confirmado' then
    select coalesce(sum(a.debe),0), coalesce(sum(a.haber),0)
      into v_debe, v_haber
    from public.apuntes a where a.asiento_id = new.id;
    if v_debe <> v_haber then
      raise exception 'El asiento % no cuadra: debe=%, haber=%', new.id, v_debe, v_haber;
    end if;
  end if;
  return new;
end; $function$;

CREATE OR REPLACE FUNCTION public.fn_handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  -- Asegura fila en public.usuarios
  insert into public.usuarios (id, email, roles, estado, kyc_estado)
  values (new.id, new.email, '[]'::jsonb, 'activo', 'pendiente')
  on conflict (id) do update
     set email = excluded.email;

  -- Asegura fila en public.profiles
  insert into public.profiles (id, full_name, address, avatar_url, updated_at)
  values (
    new.id,
    coalesce( (new.raw_user_meta_data->>'name'), '' ),
    null, null, now()
  )
  on conflict (id) do update
     set updated_at = now();

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.fulfill_academy_certification_payment(p_payment_id text, p_session_id text, p_enrollment_id uuid, p_client_id uuid, p_customer_email text, p_program_slug text, p_amount_eur numeric, p_currency text)
 RETURNS TABLE(order_id uuid, created boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
end $function$;

CREATE OR REPLACE FUNCTION public.fulfill_academy_program_payment(p_payment_id text, p_session_id text, p_client_id uuid, p_customer_email text, p_program_slug text, p_program_name text, p_amount_eur numeric, p_currency text)
 RETURNS TABLE(order_id uuid, enrollment_id uuid, created boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
end $function$;

CREATE OR REPLACE FUNCTION public.guard_stripe_subscription_ownership()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if old.stripe_subscription_id is not null
     and new.stripe_subscription_id = old.stripe_subscription_id
     and (
       new.client_id is distinct from old.client_id
       or new.company_id is distinct from old.company_id
       or new.stripe_customer_id is distinct from old.stripe_customer_id
     ) then
    raise exception 'Stripe subscription ownership conflict; manual review required';
  end if;
  return new;
end;
$function$;
