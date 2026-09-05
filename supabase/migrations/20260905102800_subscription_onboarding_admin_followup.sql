create unique index if not exists internal_tasks_one_open_subscription_onboarding_per_client
  on public.internal_tasks (client_id)
  where source = 'system'
    and title = 'Completar alta tras suscripción'
    and status in ('pendiente','en_progreso');

create or replace function public.sync_subscription_onboarding_admin_followup()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_case_id uuid;
  v_now timestamptz := now();
begin
  if new.status not in ('active','trialing') then
    return new;
  end if;

  select c.id
    into v_case_id
    from public.cases c
   where c.client_id = new.client_id
     and c.service in ('Alta de usuario','Sesión de onboarding')
     and c.state <> 'finalizado'
   order by c.opened_at desc nulls last
   limit 1;

  if new.post_purchase_onboarding_at is null then
    insert into public.internal_tasks (
      title, description, status, priority, case_id, client_id, due_date, source
    ) values (
      'Completar alta tras suscripción',
      'Suscripción ' || coalesce(new.plan_name, 'EXPERT') || ' activa. Verificar reserva de onboarding, conexión Holded y finalizar el alta del cliente.',
      'pendiente',
      'alta',
      v_case_id,
      new.client_id,
      current_date + 2,
      'system'
    )
    on conflict (client_id)
      where source = 'system'
        and title = 'Completar alta tras suscripción'
        and status in ('pendiente','en_progreso')
    do update set
      description = excluded.description,
      case_id = coalesce(excluded.case_id, public.internal_tasks.case_id),
      due_date = least(coalesce(public.internal_tasks.due_date, excluded.due_date), excluded.due_date),
      priority = 'alta',
      updated_at = v_now;

    if v_case_id is not null then
      update public.cases
         set next_action = 'Agendar onboarding y verificar conexión Holded para finalizar el alta',
             updated_at = v_now
       where id = v_case_id;
    end if;
  else
    update public.internal_tasks
       set status = 'completada',
           completed_at = coalesce(completed_at, v_now),
           updated_at = v_now
     where client_id = new.client_id
       and source = 'system'
       and title = 'Completar alta tras suscripción'
       and status in ('pendiente','en_progreso');

    if v_case_id is not null then
      update public.cases
         set state = 'finalizado',
             status = 'finalizado',
             next_action = null,
             closed_at = coalesce(closed_at, v_now),
             updated_at = v_now
       where id = v_case_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists subscriptions_onboarding_admin_followup on public.subscriptions;
create trigger subscriptions_onboarding_admin_followup
after insert or update of status, post_purchase_onboarding_at
on public.subscriptions
for each row
execute function public.sync_subscription_onboarding_admin_followup();
