-- Cola de emails durable con reintentos.
-- Sustituye el patrón fire-and-forget en notificaciones tenant_admin.
-- El worker /api/cron/email-queue procesa filas 'pending' en lotes.

create table if not exists public.email_queue (
  id           uuid        primary key default gen_random_uuid(),
  to_email     text        not null,
  subject      text        not null,
  html         text        not null,
  event_type   text        not null,
  status       text        not null default 'pending'
               check (status in ('pending', 'sent', 'failed')),
  attempts     int         not null default 0,
  max_attempts int         not null default 3,
  scheduled_at timestamptz not null default now(),
  sent_at      timestamptz,
  error        text,
  metadata     jsonb       not null default '{}',
  created_at   timestamptz not null default now()
);

comment on table public.email_queue is
  'Cola durable de emails salientes. Procesada por /api/cron/email-queue.';

-- Índice parcial: solo filas pendientes, ordenadas por fecha de envío programado.
create index if not exists email_queue_pending_idx
  on public.email_queue (scheduled_at)
  where status = 'pending';

-- Solo service_role puede acceder (worker usa admin client)
alter table public.email_queue enable row level security;
grant select, insert, update on public.email_queue to service_role;

-- Limpieza automática de emails enviados con >30 días de antigüedad
-- (ejecutar manualmente o vía pg_cron si está disponible)
-- delete from public.email_queue where status = 'sent' and sent_at < now() - interval '30 days';
