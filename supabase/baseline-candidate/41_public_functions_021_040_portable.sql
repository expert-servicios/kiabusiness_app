-- Candidate current-schema baseline for issue #143.
-- Portable public functions from ordinal range 021-040.
-- Environment-bound network functions 022, 039 and 040 are isolated under
-- baseline-candidate/environment-bound/ and are intentionally not included here.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.user_profiles_ext (id, email, full_name, avatar_url, google_id)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'provider_id')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles_ext.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles_ext.avatar_url),
    google_id = COALESCE(EXCLUDED.google_id, user_profiles_ext.google_id);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare assigned_role text := 'client';
begin
  if new.email = 'soy@kseniailicheva.com' then assigned_role := 'admin'; end if;
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), assigned_role)
  on conflict (id) do nothing;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user_to_usuarios()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE user_full_name TEXT;
BEGIN
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name');
  INSERT INTO public.usuarios (id, email, nombre, roles, estado, kyc_estado)
  VALUES (NEW.id, NEW.email, user_full_name, '{"cliente"}', 'activo', 'pendiente')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.clientes (id) VALUES (NEW.id) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_helpful_count(review_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE public.service_reviews SET helpful_count = COALESCE(helpful_count, 0) + 1 WHERE id = review_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.inherit_checkout_company_to_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_session_id text; v_company_id uuid;
begin
  if new.company_id is null then
    v_session_id := nullif(new.metadata -> 'checkout_session' ->> 'id', '');
    if v_session_id is not null then
      select cs.company_id into v_company_id from public.checkout_sessions cs where cs.stripe_session_id = v_session_id;
      if v_company_id is not null then new.company_id := v_company_id; end if;
    end if;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.inherit_quote_company_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare resolved_company_id uuid;
begin
  if new.quote_id is not null and new.company_id is null then
    select q.company_id into resolved_company_id from public.quotes q where q.id = new.quote_id;
    new.company_id := resolved_company_id;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'private', 'public', 'pg_temp'
AS $function$
begin
  if auth.uid() is null then return false; end if;
  return private.is_admin();
end;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_email()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select coalesce(lower(auth.jwt() ->> 'email') in ('expertestudiospro@gmail.com', 'soy@kseniailicheva.com'), false)
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_or_gestor()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select public.is_admin() or public.is_gestor();
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select coalesce(lower(auth.jwt() ->> 'email') in ('expertestudiospro@gmail.com', 'soy@kseniailicheva.com'), false)
$function$;

CREATE OR REPLACE FUNCTION public.is_gestor()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists(select 1 from public.usuarios u where u.id = auth.uid() and (u.roles ? 'gestor'));
$function$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'private', 'public', 'pg_temp'
AS $function$
begin
  if auth.uid() is null then return false; end if;
  return private.is_tenant_admin();
end;
$function$;

CREATE OR REPLACE FUNCTION public.kia_memories_search(query_embedding vector, client_id_filter uuid DEFAULT NULL::uuid, lead_id_filter uuid DEFAULT NULL::uuid, phone_filter text DEFAULT NULL::text, similarity_threshold double precision DEFAULT 0.72, match_count integer DEFAULT 3)
 RETURNS TABLE(id uuid, content text, memory_type text, created_at timestamp with time zone, similarity double precision)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
  select m.id, m.content, m.memory_type, m.created_at, 1 - (m.embedding <=> query_embedding) as similarity
  from public.kia_memories m
  where ((client_id_filter is not null and m.client_id = client_id_filter)
      or (lead_id_filter is not null and m.lead_id = lead_id_filter)
      or (phone_filter is not null and m.phone = phone_filter))
    and 1 - (m.embedding <=> query_embedding) >= similarity_threshold
  order by m.embedding <=> query_embedding
  limit match_count;
$function$;

CREATE OR REPLACE FUNCTION public.kia_reports_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin new.updated_at := now(); return new; end;
$function$;

CREATE OR REPLACE FUNCTION public.link_academy_order(p_order_id uuid, p_client_id uuid)
 RETURNS TABLE(enrollment_id uuid, created boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_order public.orders%rowtype; v_profile public.profiles%rowtype; v_enrollment public.academy_enrollments%rowtype; v_email text; v_program_name text;
begin
  select * into v_order from public.orders where id=p_order_id and source='academy' for update;
  if not found then raise exception 'Academy order does not exist'; end if;
  if v_order.client_id is not null and v_order.client_id <> p_client_id then raise exception 'Order already belongs to another client'; end if;
  select * into v_profile from public.profiles where id=p_client_id;
  if not found then raise exception 'Client does not exist'; end if;
  v_email := v_order.metadata #>> '{checkout_session,customer_email}';
  if v_email is null or v_profile.email is null or lower(trim(v_email)) <> lower(trim(v_profile.email)) then raise exception 'Checkout email does not match client account'; end if;
  if v_order.service_slugs like '%-certification' then raise exception 'Certification orders cannot create enrollments'; end if;
  select * into v_enrollment from public.academy_enrollments where stripe_payment_id=v_order.stripe_payment_id for update;
  if found and (v_enrollment.client_id <> p_client_id or v_enrollment.program_slug <> v_order.service_slugs) then raise exception 'Enrollment already belongs to another client or program'; end if;
  if not found then
    v_program_name := coalesce(v_order.metadata #>> '{academy,program_name}', v_order.service_slugs);
    insert into public.academy_enrollments(client_id,program_slug,program_name,amount_eur,stripe_payment_id,status)
    values(p_client_id,v_order.service_slugs,v_program_name,coalesce(v_order.amount_eur,v_order.amount),v_order.stripe_payment_id,'active') returning * into v_enrollment;
    created := true;
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
  if new.company_id is null then return new; end if;
  update public.subscription_entitlements e
     set subscription_id = new.id, updated_at = now()
    from public.checkout_sessions cs
   where e.checkout_session_id = cs.id and e.subscription_id is null and e.active = true
     and e.feature_key in ('included_entity','discount_percent','discount_amount','free_months')
     and e.client_id = new.client_id and e.primary_company_id = new.company_id
     and cs.user_id = new.client_id and cs.company_id = new.company_id
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
