-- RPC function for pgvector similarity search on kia_memories.

create or replace function public.kia_memories_search(
  query_embedding       extensions.vector(1536),
  client_id_filter      uuid default null,
  lead_id_filter        uuid default null,
  phone_filter          text default null,
  similarity_threshold  float default 0.72,
  match_count           int default 3
)
returns table (
  id          uuid,
  content     text,
  memory_type text,
  created_at  timestamptz,
  similarity  float
)
language sql
stable
as $$
  select
    m.id,
    m.content,
    m.memory_type,
    m.created_at,
    1 - (m.embedding <=> query_embedding) as similarity
  from public.kia_memories m
  where
    m.embedding is not null
    and (
      (client_id_filter is not null and m.client_id = client_id_filter)
      or (lead_id_filter is not null and m.lead_id = lead_id_filter)
      or (phone_filter is not null and m.phone = phone_filter)
    )
    and 1 - (m.embedding <=> query_embedding) >= similarity_threshold
  order by m.embedding <=> query_embedding
  limit match_count;
$$;

revoke all on function public.kia_memories_search(
  extensions.vector,
  uuid,
  uuid,
  text,
  double precision,
  integer
) from public;
revoke all on function public.kia_memories_search(
  extensions.vector,
  uuid,
  uuid,
  text,
  double precision,
  integer
) from anon;
revoke all on function public.kia_memories_search(
  extensions.vector,
  uuid,
  uuid,
  text,
  double precision,
  integer
) from authenticated;
grant execute on function public.kia_memories_search(
  extensions.vector,
  uuid,
  uuid,
  text,
  double precision,
  integer
) to service_role;

comment on function public.kia_memories_search is
  'Semantic similarity search over kia_memories using pgvector cosine distance. Used by Kia AI for RAG context enrichment.';
