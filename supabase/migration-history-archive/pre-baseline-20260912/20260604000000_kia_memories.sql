-- F5: Kia long-term memory - pgvector embeddings for RAG.
-- Stores conversation summaries and key facts per contact for future retrieval.

create schema if not exists extensions;
create extension if not exists vector schema extensions;

create table if not exists public.kia_memories (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references public.profiles(id) on delete cascade,
  lead_id     uuid references public.leads(id) on delete cascade,
  phone       text,
  content     text not null,
  embedding   extensions.vector(1536),
  memory_type text not null default 'conversation_summary'
              check (memory_type in ('conversation_summary', 'key_fact', 'preference', 'service_interest')),
  channel     text not null default 'waba',
  created_at  timestamptz not null default now(),
  metadata    jsonb not null default '{}'::jsonb
);

create index if not exists kia_memories_embedding_idx
  on public.kia_memories using ivfflat (embedding extensions.vector_cosine_ops)
  with (lists = 50);

create index if not exists kia_memories_client_id_idx
  on public.kia_memories (client_id)
  where client_id is not null;

create index if not exists kia_memories_lead_id_idx
  on public.kia_memories (lead_id)
  where lead_id is not null;

create index if not exists kia_memories_phone_idx
  on public.kia_memories (phone)
  where phone is not null;

create index if not exists kia_memories_created_at_idx
  on public.kia_memories (created_at desc);

alter table public.kia_memories enable row level security;

revoke all on public.kia_memories from anon;
revoke all on public.kia_memories from authenticated;
grant select, insert, update, delete on public.kia_memories to service_role;

comment on table public.kia_memories is
  'Kia AI long-term memory: conversation summaries and key facts stored as 1536-dim embeddings for RAG retrieval. No personal secrets stored.';
