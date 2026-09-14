-- Candidate current-schema baseline for issue #143.
-- Portable public functions from ordinal range 042-058.
-- Function 041 (notify_admin_on_service_request) is environment-bound and is
-- isolated under baseline-candidate/environment-bound/.

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

CREATE OR REPLACE FUNCTION public.set_kia_session_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at_sra()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.sync_checkout_subscription_admin_followup()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_case_id uuid;
  v_plan text;
  v_now timestamptz := now();
begin
  if coalesce(new.metadata->>'product_type','') <> 'subscription' or new.user_id is null then return new; end if;
  v_plan := coalesce(new.metadata->>'plan_name','Plan EXPERT');
  begin
    v_case_id := nullif(new.metadata->>'onboarding_case_id','')::uuid;
  exception when invalid_text_representation then
    v_case_id := null;
  end;
  if v_case_id is null then
    select c.id into v_case_id from public.cases c
     where c.client_id = new.user_id and c.service = 'Alta de usuario' and c.state <> 'finalizado'
     order by c.opened_at desc nulls last limit 1;
  end if;
  if new.status = 'open' then
    insert into public.internal_tasks (title, description, status, priority, case_id, client_id, due_date, source)
    values ('Formalizar contratación de suscripción','Checkout abierto para ' || v_plan || '. Verificar formalización del pago. No generar otro Checkout mientras éste siga abierto.','pendiente','alta',v_case_id,new.user_id,current_date + 2,'system')
    on conflict (client_id)
      where source = 'system' and title = 'Formalizar contratación de suscripción' and status in ('pendiente','en_progreso')
    do update set description = excluded.description, case_id = coalesce(excluded.case_id, public.internal_tasks.case_id), due_date = least(coalesce(public.internal_tasks.due_date, excluded.due_date), excluded.due_date), priority = 'alta', updated_at = v_now;
  elsif new.status in ('completed','expired') then
    update public.internal_tasks set status='completada',completed_at=coalesce(completed_at,v_now),updated_at=v_now
     where client_id=new.user_id and source='system' and title='Formalizar contratación de suscripción' and status in ('pendiente','en_progreso');
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.sync_fiscal_obligation_task()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_task_id uuid;
  v_task_title text;
  v_task_description text;
  v_task_status text;
begin
  v_task_title := case
    when nullif(trim(new.model_code), '') is not null then 'Obligación fiscal · Modelo ' || trim(new.model_code) || ' · ' || coalesce(nullif(trim(new.title), ''), new.kind)
    else 'Obligación fiscal · ' || coalesce(nullif(trim(new.title), ''), new.kind)
  end;
  v_task_description := concat_ws(E'\n',
    case when nullif(trim(new.period_key), '') is not null then 'Periodo: ' || trim(new.period_key) end,
    case when nullif(trim(new.notes), '') is not null then trim(new.notes) end,
    'Vencimiento fiscal confirmado por Admin.'
  );
  if new.status in ('planned', 'in_progress') then
    v_task_status := case when new.status = 'in_progress' then 'en_progreso' else 'pendiente' end;
    if new.task_id is not null then
      update public.internal_tasks
      set title=v_task_title,description=v_task_description,status=v_task_status,priority='alta',client_id=new.client_id,company_id=new.company_id,due_date=new.due_date,source='fiscal_calendar',metadata=jsonb_build_object('obligation_id',new.id,'model_code',new.model_code,'period_key',new.period_key),completed_at=null,updated_at=now()
      where id=new.task_id;
      if found then return new; end if;
    end if;
    insert into public.internal_tasks (title,description,status,priority,client_id,company_id,due_date,source,metadata)
    values (v_task_title,v_task_description,v_task_status,'alta',new.client_id,new.company_id,new.due_date,'fiscal_calendar',jsonb_build_object('obligation_id',new.id,'model_code',new.model_code,'period_key',new.period_key))
    returning id into v_task_id;
    update public.obligations_calendar set task_id=v_task_id,updated_at=now() where id=new.id;
  elsif new.status = 'completed' then
    if new.task_id is not null then
      update public.internal_tasks set status='completada',completed_at=coalesce(completed_at,now()),updated_at=now() where id=new.task_id;
    end if;
    if new.completed_at is null then
      update public.obligations_calendar set completed_at=now(),updated_at=now() where id=new.id;
    end if;
  elsif new.status = 'cancelled' then
    if new.task_id is not null then
      update public.internal_tasks set status='cancelada',completed_at=null,updated_at=now() where id=new.task_id;
    end if;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.sync_subscription_checkout_claim_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if new.status is distinct from old.status and new.status in ('completed', 'expired') then
    update public.subscription_checkout_claims
       set state=new.status,updated_at=now(),lease_expires_at=now()
     where stripe_session_id=new.stripe_session_id and state in ('claimed','open');
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.sync_subscription_onboarding_admin_followup()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_case_id uuid;
  v_now timestamptz := now();
begin
  if new.status not in ('active','trialing') then return new; end if;
  select c.id into v_case_id from public.cases c
   where c.client_id=new.client_id and c.service in ('Alta de usuario','Sesión de onboarding') and c.state <> 'finalizado'
   order by c.opened_at desc nulls last limit 1;
  if new.post_purchase_onboarding_at is null then
    insert into public.internal_tasks (title,description,status,priority,case_id,client_id,due_date,source)
    values ('Completar alta tras suscripción','Suscripción ' || coalesce(new.plan_name,'EXPERT') || ' activa. Verificar reserva de onboarding, conexión Holded y finalizar el alta del cliente.','pendiente','alta',v_case_id,new.client_id,current_date + 2,'system')
    on conflict (client_id)
      where source='system' and title='Completar alta tras suscripción' and status in ('pendiente','en_progreso')
    do update set description=excluded.description,case_id=coalesce(excluded.case_id,public.internal_tasks.case_id),due_date=least(coalesce(public.internal_tasks.due_date,excluded.due_date),excluded.due_date),priority='alta',updated_at=v_now;
    if v_case_id is not null then
      update public.cases set next_action='Agendar onboarding y verificar conexión Holded para finalizar el alta',updated_at=v_now where id=v_case_id;
    end if;
  else
    update public.internal_tasks set status='completada',completed_at=coalesce(completed_at,v_now),updated_at=v_now
     where client_id=new.client_id and source='system' and title='Completar alta tras suscripción' and status in ('pendiente','en_progreso');
    if v_case_id is not null then
      update public.cases set state='finalizado',status='finalizado',next_action=null,closed_at=coalesce(closed_at,v_now),updated_at=v_now where id=v_case_id;
    end if;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_admin_users_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$;

CREATE OR REPLACE FUNCTION public.update_companies_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$;

CREATE OR REPLACE FUNCTION public.update_connector_instances_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$;

CREATE OR REPLACE FUNCTION public.update_entitlements_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$;

CREATE OR REPLACE FUNCTION public.update_subscription_trials_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$;

CREATE OR REPLACE FUNCTION public.whoami()
 RETURNS json
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select current_setting('request.jwt.claims', true)::json;
$function$;
