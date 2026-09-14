-- Candidate current-schema baseline for issue #143.
-- Portable public functions 031-040 of 54, extracted with pg_get_functiondef.

CREATE OR REPLACE FUNCTION public.is_gestor()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists(
    select 1 from public.usuarios u
    where u.id = auth.uid() and (u.roles ? 'gestor')
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'private', 'public', 'pg_temp'
AS $function$
begin
  if auth.uid() is null then
    return false;
  end if;
  return private.is_tenant_admin();
end;
$function$;

CREATE OR REPLACE FUNCTION public.kia_memories_search(query_embedding vector, client_id_filter uuid DEFAULT NULL::uuid, lead_id_filter uuid DEFAULT NULL::uuid, phone_filter text DEFAULT NULL::text, similarity_threshold double precision DEFAULT 0.72, match_count integer DEFAULT 3)
 RETURNS TABLE(id uuid, content text, memory_type text, created_at timestamp with time zone, similarity double precision)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
  select
    m.id,
    m.content,
    m.memory_type,
    m.created_at,
    1 - (m.embedding <=> query_embedding) as similarity
  from public.kia_memories m
  where
    (
      (client_id_filter is not null and m.client_id = client_id_filter)
      or (lead_id_filter is not null and m.lead_id = lead_id_filter)
      or (phone_filter is not null and m.phone = phone_filter)
    )
    and 1 - (m.embedding <=> query_embedding) >= similarity_threshold
  order by m.embedding <=> query_embedding
  limit match_count;
$function$;

CREATE OR REPLACE FUNCTION public.kia_reports_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.link_academy_order(p_order_id uuid, p_client_id uuid)
 RETURNS TABLE(enrollment_id uuid, created boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
end $function$;

CREATE OR REPLACE FUNCTION public.link_pending_subscription_commercial_benefits()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if new.company_id is null then
    return new;
  end if;

  update public.subscription_entitlements e
     set subscription_id = new.id,
         updated_at = now()
    from public.checkout_sessions cs
   where e.checkout_session_id = cs.id
     and e.subscription_id is null
     and e.active = true
     and e.feature_key in ('included_entity','discount_percent','discount_amount','free_months')
     and e.client_id = new.client_id
     and e.primary_company_id = new.company_id
     and cs.user_id = new.client_id
     and cs.company_id = new.company_id
     and cs.status in ('completed','complete')
     and abs(extract(epoch from (new.updated_at - cs.updated_at))) <= 900;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.mark_holded_contact_creation_started(p_claim_id uuid, p_owner_token uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$ begin update public.holded_contact_creation_claims set state='creating',lease_expires_at=now(),updated_at=now() where id=p_claim_id and owner_token=p_owner_token and state='claimed'; if not found then raise exception 'Holded contact claim ownership lost'; end if; end; $function$;

CREATE OR REPLACE FUNCTION public.release_holded_contact_creation_claim(p_claim_id uuid, p_owner_token uuid, p_error text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$ begin update public.holded_contact_creation_claims set state='released',lease_expires_at=now(),updated_at=now(),last_error=left(p_error,500) where id=p_claim_id and owner_token=p_owner_token and state='claimed'; if not found then raise exception 'Holded contact claim ownership lost'; end if; end; $function$;

CREATE OR REPLACE FUNCTION public.set_email_queue_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$;

CREATE OR REPLACE FUNCTION public.set_fiscal_obligations_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin new.updated_at = now(); return new; end;
$function$;
