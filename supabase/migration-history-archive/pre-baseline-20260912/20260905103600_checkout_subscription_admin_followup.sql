create unique index if not exists internal_tasks_one_open_checkout_followup_per_client
  on public.internal_tasks (client_id)
  where source = 'system'
    and title = 'Formalizar contratación de suscripción'
    and status in ('pendiente','en_progreso');

create or replace function public.sync_checkout_subscription_admin_followup()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_case_id uuid;
  v_plan text;
  v_now timestamptz := now();
begin
  if coalesce(new.metadata->>'product_type','') <> 'subscription' or new.user_id is null then
    return new;
  end if;

  v_plan := coalesce(new.metadata->>'plan_name','Plan EXPERT');
  begin
    v_case_id := nullif(new.metadata->>'onboarding_case_id','')::uuid;
  exception when invalid_text_representation then
    v_case_id := null;
  end;

  if v_case_id is null then
    select c.id into v_case_id
      from public.cases c
     where c.client_id = new.user_id
       and c.service = 'Alta de usuario'
       and c.state <> 'finalizado'
     order by c.opened_at desc nulls last
     limit 1;
  end if;

  if new.status = 'open' then
    insert into public.internal_tasks (
      title, description, status, priority, case_id, client_id, due_date, source
    ) values (
      'Formalizar contratación de suscripción',
      'Checkout abierto para ' || v_plan || '. Verificar formalización del pago. No generar otro Checkout mientras éste siga abierto.',
      'pendiente',
      'alta',
      v_case_id,
      new.user_id,
      current_date + 2,
      'system'
    )
    on conflict (client_id)
      where source = 'system'
        and title = 'Formalizar contratación de suscripción'
        and status in ('pendiente','en_progreso')
    do update set
      description = excluded.description,
      case_id = coalesce(excluded.case_id, public.internal_tasks.case_id),
      due_date = least(coalesce(public.internal_tasks.due_date, excluded.due_date), excluded.due_date),
      priority = 'alta',
      updated_at = v_now;
  elsif new.status in ('completed','expired') then
    update public.internal_tasks
       set status = 'completada',
           completed_at = coalesce(completed_at, v_now),
           updated_at = v_now
     where client_id = new.user_id
       and source = 'system'
       and title = 'Formalizar contratación de suscripción'
       and status in ('pendiente','en_progreso');
  end if;

  return new;
end;
$$;

drop trigger if exists checkout_subscription_admin_followup on public.checkout_sessions;
create trigger checkout_subscription_admin_followup
after insert or update of status
on public.checkout_sessions
for each row
execute function public.sync_checkout_subscription_admin_followup();

insert into public.internal_tasks (
  title, description, status, priority, case_id, client_id, due_date, source
)
select
  'Formalizar contratación de suscripción',
  'Checkout abierto para ' || coalesce(cs.metadata->>'plan_name','Plan EXPERT') || '. Verificar formalización del pago. No generar otro Checkout mientras éste siga abierto.',
  'pendiente',
  'alta',
  coalesce(
    case when coalesce(cs.metadata->>'onboarding_case_id','') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then (cs.metadata->>'onboarding_case_id')::uuid else null end,
    (select c.id from public.cases c where c.client_id=cs.user_id and c.service='Alta de usuario' and c.state <> 'finalizado' order by c.opened_at desc nulls last limit 1)
  ),
  cs.user_id,
  current_date + 2,
  'system'
from public.checkout_sessions cs
where cs.status='open'
  and coalesce(cs.metadata->>'product_type','')='subscription'
  and cs.user_id is not null
on conflict (client_id)
  where source='system' and title='Formalizar contratación de suscripción' and status in ('pendiente','en_progreso')
do update set
  description=excluded.description,
  case_id=coalesce(excluded.case_id, public.internal_tasks.case_id),
  due_date=least(coalesce(public.internal_tasks.due_date, excluded.due_date), excluded.due_date),
  priority='alta',
  updated_at=now();
