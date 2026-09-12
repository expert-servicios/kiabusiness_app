-- Client 360 fiscal obligations foundation.
-- Conservative by design: no obligation is inferred from legal form or plan.
-- Admin confirms each applicable obligation; the database then keeps its task in sync.

alter table public.internal_tasks
  add column if not exists company_id uuid references public.companies(id) on delete set null,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.internal_tasks
  drop constraint if exists internal_tasks_source_check;

alter table public.internal_tasks
  add constraint internal_tasks_source_check
  check (source = any (array[
    'manual'::text,
    'kia'::text,
    'system'::text,
    'fiscal_calendar'::text,
    'document'::text,
    'anomaly'::text
  ]));

alter table public.obligations_calendar
  add column if not exists client_id uuid references public.profiles(id) on delete set null,
  add column if not exists model_code text,
  add column if not exists title text,
  add column if not exists period_key text,
  add column if not exists notes text,
  add column if not exists task_id uuid references public.internal_tasks(id) on delete set null,
  add column if not exists google_event_id text,
  add column if not exists source text not null default 'manual',
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists completed_at timestamptz;

alter table public.obligations_calendar
  drop constraint if exists obligations_calendar_status_check;

alter table public.obligations_calendar
  add constraint obligations_calendar_status_check
  check (status = any (array[
    'planned'::text,
    'in_progress'::text,
    'completed'::text,
    'cancelled'::text
  ]));

alter table public.obligations_calendar
  drop constraint if exists obligations_calendar_source_check;

alter table public.obligations_calendar
  add constraint obligations_calendar_source_check
  check (source = any (array['manual'::text, 'system'::text]));

create index if not exists obligations_calendar_client_due_idx
  on public.obligations_calendar (client_id, due_date);

create index if not exists obligations_calendar_company_due_idx
  on public.obligations_calendar (company_id, due_date);

create unique index if not exists obligations_calendar_unique_model_period_due
  on public.obligations_calendar (company_id, model_code, coalesce(period_key, ''), due_date)
  where model_code is not null and status <> 'cancelled';

create index if not exists internal_tasks_company_due_idx
  on public.internal_tasks (company_id, due_date)
  where company_id is not null;

alter table public.obligations_calendar enable row level security;

drop policy if exists obligations_calendar_admin_all on public.obligations_calendar;
create policy obligations_calendar_admin_all
on public.obligations_calendar
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'owner')
      and coalesce(p.status, 'active') <> 'inactive'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'owner')
      and coalesce(p.status, 'active') <> 'inactive'
  )
);

create or replace function public.sync_fiscal_obligation_task()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_task_id uuid;
  v_task_title text;
  v_task_description text;
  v_task_status text;
begin
  v_task_title := case
    when nullif(trim(new.model_code), '') is not null
      then 'Obligación fiscal · Modelo ' || trim(new.model_code) || ' · ' || coalesce(nullif(trim(new.title), ''), new.kind)
    else 'Obligación fiscal · ' || coalesce(nullif(trim(new.title), ''), new.kind)
  end;

  v_task_description := concat_ws(
    E'\n',
    case when nullif(trim(new.period_key), '') is not null then 'Periodo: ' || trim(new.period_key) end,
    case when nullif(trim(new.notes), '') is not null then trim(new.notes) end,
    'Vencimiento fiscal confirmado por Admin.'
  );

  if new.status in ('planned', 'in_progress') then
    v_task_status := case when new.status = 'in_progress' then 'en_progreso' else 'pendiente' end;

    if new.task_id is not null then
      update public.internal_tasks
      set title = v_task_title,
          description = v_task_description,
          status = v_task_status,
          priority = 'alta',
          client_id = new.client_id,
          company_id = new.company_id,
          due_date = new.due_date,
          source = 'fiscal_calendar',
          metadata = jsonb_build_object(
            'obligation_id', new.id,
            'model_code', new.model_code,
            'period_key', new.period_key
          ),
          completed_at = null,
          updated_at = now()
      where id = new.task_id;

      if found then
        return new;
      end if;
    end if;

    insert into public.internal_tasks (
      title,
      description,
      status,
      priority,
      client_id,
      company_id,
      due_date,
      source,
      metadata
    ) values (
      v_task_title,
      v_task_description,
      v_task_status,
      'alta',
      new.client_id,
      new.company_id,
      new.due_date,
      'fiscal_calendar',
      jsonb_build_object(
        'obligation_id', new.id,
        'model_code', new.model_code,
        'period_key', new.period_key
      )
    )
    returning id into v_task_id;

    update public.obligations_calendar
    set task_id = v_task_id,
        updated_at = now()
    where id = new.id;

  elsif new.status = 'completed' then
    if new.task_id is not null then
      update public.internal_tasks
      set status = 'completada',
          completed_at = coalesce(completed_at, now()),
          updated_at = now()
      where id = new.task_id;
    end if;

    if new.completed_at is null then
      update public.obligations_calendar
      set completed_at = now(),
          updated_at = now()
      where id = new.id;
    end if;

  elsif new.status = 'cancelled' then
    if new.task_id is not null then
      update public.internal_tasks
      set status = 'cancelada',
          completed_at = null,
          updated_at = now()
      where id = new.task_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists obligations_calendar_sync_task on public.obligations_calendar;
create trigger obligations_calendar_sync_task
after insert or update of status, title, kind, due_date, client_id, company_id, model_code, period_key, notes
on public.obligations_calendar
for each row
execute function public.sync_fiscal_obligation_task();
