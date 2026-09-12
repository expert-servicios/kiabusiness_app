-- Candidate current-schema baseline for issue #143.
-- Portable public functions 001-010 of 54, extracted with pg_get_functiondef.

CREATE OR REPLACE FUNCTION public._ensure_updated_trigger(tbl regclass, trig_name text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if not exists (
    select 1 from pg_trigger t where t.tgname = trig_name and t.tgrelid = tbl
  ) then
    execute format('create trigger %I before update on %s for each row execute function public.set_updated_at()', trig_name, tbl);
  end if;
end; $function$;

CREATE OR REPLACE FUNCTION public.auth_tenant_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'private', 'public', 'pg_temp'
AS $function$
begin
  if auth.uid() is null then
    return null;
  end if;
  return private.auth_tenant_id();
end;
$function$;

CREATE OR REPLACE FUNCTION public.claim_holded_contact_creation(p_company_id uuid, p_owner_token uuid, p_lease_seconds integer DEFAULT 120)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_row public.holded_contact_creation_claims%rowtype; v_lease interval;
begin
 if p_company_id is null or p_owner_token is null then raise exception 'invalid Holded contact claim arguments'; end if;
 v_lease:=make_interval(secs=>greatest(30,least(coalesce(p_lease_seconds,120),600)));
 begin
  insert into public.holded_contact_creation_claims(company_id,owner_token,state,lease_expires_at) values(p_company_id,p_owner_token,'claimed',now()+v_lease) returning * into v_row;
  return jsonb_build_object('acquired',true,'claim_id',v_row.id,'state',v_row.state,'holded_contact_id',v_row.holded_contact_id);
 exception when unique_violation then null; end;
 select * into v_row from public.holded_contact_creation_claims where company_id=p_company_id and state in ('claimed','creating','completed','manual_review') order by created_at desc limit 1 for update;
 if not found then return jsonb_build_object('acquired',false,'state','retry'); end if;
 if v_row.state='claimed' and v_row.lease_expires_at<=now() then
  update public.holded_contact_creation_claims set owner_token=p_owner_token,lease_expires_at=now()+v_lease,updated_at=now(),last_error=null where id=v_row.id returning * into v_row;
  return jsonb_build_object('acquired',true,'claim_id',v_row.id,'state',v_row.state,'holded_contact_id',v_row.holded_contact_id);
 end if;
 return jsonb_build_object('acquired',false,'claim_id',v_row.id,'state',v_row.state,'holded_contact_id',v_row.holded_contact_id);
end; $function$;

CREATE OR REPLACE FUNCTION public.claim_stripe_event(p_event_id text, p_event_type text, p_lease_seconds integer DEFAULT 300)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
end $function$;

CREATE OR REPLACE FUNCTION public.claim_subscription_checkout(p_user_id uuid, p_company_id uuid, p_intent_key text, p_owner_token uuid, p_lease_seconds integer DEFAULT 120)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare v_row public.subscription_checkout_claims%rowtype; v_lease interval;
begin
  if p_user_id is null or p_company_id is null or nullif(trim(p_intent_key), '') is null or p_owner_token is null then raise exception 'invalid subscription checkout claim arguments'; end if;
  v_lease := make_interval(secs => greatest(30, least(coalesce(p_lease_seconds, 120), 600)));
  begin
    insert into public.subscription_checkout_claims(user_id,company_id,intent_key,owner_token,state,lease_expires_at)
    values(p_user_id,p_company_id,trim(p_intent_key),p_owner_token,'claimed',now()+v_lease) returning * into v_row;
    return jsonb_build_object('acquired',true,'claim_id',v_row.id,'state',v_row.state,'stripe_session_id',v_row.stripe_session_id);
  exception when unique_violation then null; end;
  select * into v_row from public.subscription_checkout_claims
   where user_id=p_user_id and company_id=p_company_id and intent_key=trim(p_intent_key)
     and state in ('claimed','open','manual_review') order by created_at desc limit 1 for update;
  if not found then return jsonb_build_object('acquired',false,'state','retry'); end if;
  if v_row.state='claimed' and v_row.lease_expires_at <= now() then
    update public.subscription_checkout_claims set owner_token=p_owner_token,lease_expires_at=now()+v_lease,updated_at=now(),last_error=null where id=v_row.id returning * into v_row;
    return jsonb_build_object('acquired',true,'claim_id',v_row.id,'state',v_row.state,'stripe_session_id',v_row.stripe_session_id);
  end if;
  return jsonb_build_object('acquired',false,'claim_id',v_row.id,'state',v_row.state,'stripe_session_id',v_row.stripe_session_id);
end; $function$;

CREATE OR REPLACE FUNCTION public.complete_checkout_session_from_order()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_session_id text;
begin
  v_session_id := nullif(new.metadata -> 'checkout_session' ->> 'id', '');
  if v_session_id is not null then
    update public.checkout_sessions
    set status = 'completed', updated_at = now()
    where stripe_session_id = v_session_id
      and status in ('open', 'pending');
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.complete_holded_contact_creation(p_claim_id uuid, p_owner_token uuid, p_holded_contact_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$ begin update public.holded_contact_creation_claims set state='completed',holded_contact_id=p_holded_contact_id,updated_at=now(),last_error=null where id=p_claim_id and owner_token=p_owner_token and state='creating'; if not found then raise exception 'Holded contact claim ownership lost'; end if; end; $function$;

CREATE OR REPLACE FUNCTION public.complete_stripe_event(p_event_id text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  update public.stripe_processed_events
     set status = 'processed', processed_at = now(), last_error = null
   where event_id = p_event_id;
$function$;

CREATE OR REPLACE FUNCTION public.delete_user_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Delete from profiles
  DELETE FROM public.profiles WHERE id = OLD.id;
  -- Delete from client_companies
  DELETE FROM public.client_companies WHERE user_id = OLD.id;
  -- Delete from family_members
  DELETE FROM public.family_members WHERE user_id = OLD.id;
  -- Delete from support_tickets
  DELETE FROM public.support_tickets WHERE user_id = OLD.id;
  -- Delete from client_subscriptions
  DELETE FROM public.client_subscriptions WHERE user_id = OLD.id OR email = OLD.email;
   -- Delete from pagos_expert
  DELETE FROM public.pagos_expert WHERE user_id = OLD.id OR customer_email = OLD.email;
  
  -- Delete avatar from storage if exists
  IF OLD.raw_user_meta_data->>'avatar_url' IS NOT NULL THEN
    PERFORM storage.delete_object('avatars', SUBSTRING(OLD.raw_user_meta_data->>'avatar_url' FROM POSITION('/avatars/' IN OLD.raw_user_meta_data->>'avatar_url') + CHAR_LENGTH('/avatars/')));
  END IF;

  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_lead_campaign_marketing_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_segment text;
  v_allowed boolean;
begin
  select c.segment into v_segment
  from public.campaigns c
  where c.id = new.campaign_id;

  if v_segment = 'leads' then
    select exists (
      select 1
      from public.leads l
      where lower(trim(l.email)) = lower(trim(new.recipient_email))
        and l.marketing_status = 'consented'
    ) into v_allowed;

    if not coalesce(v_allowed, false) then
      raise exception 'Recipient is not consented for lead marketing campaigns';
    end if;
  end if;

  return new;
end;
$function$;
