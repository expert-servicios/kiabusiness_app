import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import type { KiaContext } from './kia-context-builder';
import type { KiaChannel, KiaDecision } from './kia-output-schema';
import type { KiaProviderResult } from './kia-provider-router';
import type { KiaToolCall, KiaToolResult } from './kia-tool-definitions';
import { redactJson, safeErrorMessage, stableHash } from './kia-redaction';

export async function saveKiaDecisionLog(input: {
  decision: KiaDecision;
  channel: KiaChannel;
  context: KiaContext;
  providerResult?: KiaProviderResult;
  toolCalls?: KiaToolCall[];
  toolResults?: KiaToolResult[];
  rawInput?: unknown;
  error?: unknown;
}): Promise<void> {
  if (process.env.KIA_AI_DECISION_LOGS_ENABLED?.toLowerCase() === 'false') return;

  try {
    const admin = getSupabaseAdmin();
    await admin.from('kia_decision_logs').insert({
      provider: input.providerResult?.provider ?? null,
      model: input.providerResult?.model ?? null,
      task_type: input.decision.taskType,
      channel: input.channel,
      contact_status: input.decision.contactStatus,
      client_id: input.context.contact.clientId,
      lead_id: input.context.contact.leadId,
      case_id: null,
      company_id: input.context.company?.id ?? null,
      input_hash: input.rawInput ? stableHash(input.rawInput) : null,
      output_json: redactJson(input.decision),
      decision_summary: input.decision.decisionSummary,
      rules_applied: input.decision.rulesApplied,
      confidence: input.decision.confidence,
      requires_meeting: input.decision.requiresMeeting,
      requires_manual_review: input.decision.requiresManualReview,
      tool_calls: redactJson(input.toolCalls ?? []),
      tool_results_summary: redactJson(input.toolResults ?? []),
      error: input.error ? safeErrorMessage(input.error) : input.providerResult?.error ?? null,
    });
  } catch (error) {
    console.error('[Kia decision log] insert failed', safeErrorMessage(error));
  }
}
