import { getSupabaseAdmin } from '@/lib/integrations/supabase';

export interface KiaFewShotExample {
  userMessage: string;
  kiaReply: string;
  intent: string;
}

const MAX_EXAMPLES = 3;

/**
 * Retrieves recent positive-rated Kia responses for a given task type.
 * Used to inject few-shot examples into the system prompt.
 */
export async function getKiaFewShotExamples(params: {
  taskType?: string;
  limit?: number;
}): Promise<KiaFewShotExample[]> {
  const admin = getSupabaseAdmin();
  const limit = params.limit ?? MAX_EXAMPLES;

  const query = admin
    .from('kia_feedback')
    .select('user_message, kia_reply, intent')
    .eq('rating', 'positive')
    .not('kia_reply', 'is', null)
    .not('user_message', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (params.taskType) {
    query.eq('task_type', params.taskType);
  }

  const { data } = await query;
  if (!data?.length) return [];

  return data
    .filter((row: { kia_reply?: string; user_message?: string; intent?: string }) => row.kia_reply && row.user_message)
    .map((row: { kia_reply?: string; user_message?: string; intent?: string }) => ({
      userMessage: String(row.user_message ?? '').slice(0, 200),
      kiaReply:    String(row.kia_reply    ?? '').slice(0, 400),
      intent:      String(row.intent       ?? 'unknown'),
    }));
}

export function formatFewShotExamples(examples: KiaFewShotExample[]): string {
  if (!examples.length) return '';
  return [
    '<few_shot_positive_examples>',
    'Ejemplos de respuestas valoradas positivamente por usuarios (úsalos como referencia de tono y estructura):',
    ...examples.map((ex, i) =>
      `[Ejemplo ${i + 1}]\nUsuario: ${ex.userMessage}\nKia: ${ex.kiaReply}`
    ),
    '</few_shot_positive_examples>',
  ].join('\n');
}
