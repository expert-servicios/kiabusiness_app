-- Fase 6: WhatsApp y AI

-- WhatsApp fields on profiles
alter table public.profiles
  add column if not exists whatsapp_number text,
  add column if not exists whatsapp_consent boolean not null default false;

-- AI logs
create table public.ai_logs (
  id            bigint generated always as identity primary key,
  event_type    text        not null,
  client_id     uuid        references public.profiles(id) on delete set null,
  input         jsonb,
  output        jsonb,
  model         text,
  latency_ms    integer,
  error         text,
  created_at    timestamptz not null default now()
);

alter table public.ai_logs enable row level security;

create policy "Admin read ai_logs" on public.ai_logs
  for select using (is_admin());

-- WhatsApp conversations log
create table public.whatsapp_conversations (
  id                   uuid        primary key default gen_random_uuid(),
  client_id            uuid        references public.profiles(id) on delete set null,
  phone_number         text        not null,
  direction            text        not null check (direction in ('inbound', 'outbound')),
  body                 text        not null,
  whatsapp_message_id  text,
  created_at           timestamptz not null default now()
);

alter table public.whatsapp_conversations enable row level security;

create policy "Admin manage whatsapp_conversations" on public.whatsapp_conversations
  for all using (is_admin());

create policy "Client read own whatsapp_conversations" on public.whatsapp_conversations
  for select using (client_id = auth.uid());
