-- Candidate current-schema baseline for issue #143.
-- Portable public functions 021-030 of 54, extracted with pg_get_functiondef.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.user_profiles_ext (id, email, full_name, avatar_url, google_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'provider_id'
  )
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
declare
  assigned_role text := 'client';
begin
  if new.email = 'soy@kseniailicheva.com' then
    assigned_role := 'admin';
  end if;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    assigned_role
  )
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
DECLARE
  user_full_name TEXT;
BEGIN
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name'
  );

  INSERT INTO public.usuarios (id, email, nombre, roles, estado, kyc_estado)
  VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    '{"cliente"}',
    'activo',
    'pendiente'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.clientes (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_helpful_count(review_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE public.service_reviews
  SET helpful_count = COALESCE(helpful_count, 0) + 1
  WHERE id = review_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.inherit_checkout_company_to_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_session_id text;
  v_company_id uuid;
begin
  if new.company_id is null then
    v_session_id := nullif(new.metadata -> 'checkout_session' ->> 'id', '');
    if v_session_id is not null then
      select cs.company_id into v_company_id
      from public.checkout_sessions cs
      where cs.stripe_session_id = v_session_id;
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
declare
  resolved_company_id uuid;
begin
  if new.quote_id is not null and new.company_id is null then
    select q.company_id into resolved_company_id
    from public.quotes q
    where q.id = new.quote_id;
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
  if auth.uid() is null then
    return false;
  end if;
  return private.is_admin();
end;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_email()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select coalesce(
    lower(auth.jwt() ->> 'email') in ('expertestudiospro@gmail.com', 'soy@kseniailicheva.com'),
    false
  )
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
  select coalesce(
    lower(auth.jwt() ->> 'email') in ('expertestudiospro@gmail.com', 'soy@kseniailicheva.com'),
    false
  )
$function$;
