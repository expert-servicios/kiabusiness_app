import { getSupabaseAdmin } from '@/lib/integrations/supabase';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

const EMBEDDING_MODEL = 'text-embedding-3-small';
const DEFAULT_LIMIT = 3;
const SIMILARITY_THRESHOLD = 0.72;

export interface KiaMemory {
  id: string;
  content: string;
  memoryType: string;
  createdAt: string;
  similarity: number;
}

async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text.slice(0, 8000) }),
  });
  if (!response.ok) throw new Error(`Embedding API error: HTTP ${response.status}`);
  const data = await response.json() as { data?: Array<{ embedding?: number[] }> };
  const embedding = data?.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) throw new Error('Invalid embedding response');
  return embedding;
}

export async function retrieveKiaMemories(params: {
  query: string;
  clientId?: string | null;
  leadId?: string | null;
  phone?: string | null;
  limit?: number;
  openAiApiKey: string;
  supabase: AdminClient;
}): Promise<KiaMemory[]> {
  const embedding = await generateEmbedding(params.query, params.openAiApiKey);
  const embeddingString = `[${embedding.join(',')}]`;
  const limit = params.limit ?? DEFAULT_LIMIT;

  // Use Supabase RPC for pgvector similarity search
  const { data, error } = await params.supabase.rpc('kia_memories_search', {
    query_embedding: embeddingString,
    client_id_filter: params.clientId ?? null,
    lead_id_filter: params.leadId ?? null,
    phone_filter: params.phone ?? null,
    similarity_threshold: SIMILARITY_THRESHOLD,
    match_count: limit,
  });

  if (error || !data) return [];

  return (data as Array<{ id: string; content: string; memory_type: string; created_at: string; similarity: number }>)
    .map((row) => ({
      id: row.id,
      content: row.content,
      memoryType: row.memory_type,
      createdAt: row.created_at,
      similarity: row.similarity,
    }));
}

export function formatMemoriesForContext(memories: KiaMemory[]): string {
  if (!memories.length) return '';
  return [
    '<kia_long_term_memory>',
    'Conversaciones y hechos clave previos de este contacto (relevantes para el mensaje actual):',
    ...memories.map((m, i) => `[${i + 1}] ${m.content}`),
    '</kia_long_term_memory>',
  ].join('\n');
}
