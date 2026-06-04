import { getSupabaseAdmin } from '@/lib/integrations/supabase';

const EMBEDDING_MODEL = 'text-embedding-3-small';

export type KiaMemoryType = 'conversation_summary' | 'key_fact' | 'preference' | 'service_interest';

export interface KiaMemoryInput {
  content: string;
  memoryType: KiaMemoryType;
  channel: string;
  clientId?: string | null;
  leadId?: string | null;
  phone?: string | null;
  metadata?: Record<string, unknown>;
  openAiApiKey: string;
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

export async function storeKiaMemory(input: KiaMemoryInput): Promise<void> {
  if (!input.content.trim()) return;
  const embedding = await generateEmbedding(input.content, input.openAiApiKey);
  const admin = getSupabaseAdmin();
  await admin.from('kia_memories').insert({
    client_id:   input.clientId ?? null,
    lead_id:     input.leadId ?? null,
    phone:       input.phone ?? null,
    content:     input.content.slice(0, 2000),
    embedding:   `[${embedding.join(',')}]`,
    memory_type: input.memoryType,
    channel:     input.channel,
    metadata:    input.metadata ?? {},
  });
}

export async function buildMemorySummary(params: {
  userMessage: string;
  kiaReply: string;
  intent: string;
  nextAction: string;
}): Promise<string> {
  return [
    `Intent: ${params.intent}`,
    `UserMsg: ${params.userMessage.slice(0, 300)}`,
    `KiaReply: ${params.kiaReply.slice(0, 300)}`,
    `Action: ${params.nextAction}`,
  ].join(' | ');
}
