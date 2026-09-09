import { describe, expect, it } from 'vitest';
import { resolveKiaAvatarState } from '@/lib/ai/kia/kia-avatar-state';
import type { KiaDecision } from '@/lib/ai/kia/kia-output-schema';

function decision(warnings: string[]): KiaDecision {
  return {
    version: '1.0',
    taskType: 'waba_reply',
    contactStatus: 'client',
    intent: 'unknown',
    userMessage: '',
    nextAction: 'reply_only',
    quickReplies: [],
    toolRequests: [],
    dataToSave: {},
    confidence: 0.9,
    requiresMeeting: false,
    requiresManualReview: false,
    decisionSummary: 'test',
    rulesApplied: ['test'],
    missingData: [],
    warnings,
  };
}

describe('KIA presentation warning classification', () => {
  it('treats every unprovenanced KiaDecision warning as aviso', () => {
    const warningCodes = [
      'backend_policy_override_case_status',
      'backend_policy_override_holded_readiness',
      'backend_policy_override_viability',
      'user_message_language_repaired_by_backend',
      'extra_question_marks_repaired_by_backend',
      'taskType corrected by backend',
      'contactStatus corrected by backend',
      'Possible repeated phrasing detected (92%)',
      'unexpected backend warning',
      'backend_policy_override_api_key_channel',
      'backend_policy_override_tax_summary',
      'tool_loop_timeout',
      'judge_rejected:high:requires review',
    ];

    for (const warning of warningCodes) {
      expect(resolveKiaAvatarState({
        decision: decision([warning]),
      })).toBe('aviso');
    }
  });

  it('allows a verified fiscal-risk signal to be more specific than a generic warning', () => {
    expect(resolveKiaAvatarState({
      decision: decision(['generic warning']),
      presentationContext: {
        fiscalRisk: { severity: 'critical', code: 'material_tax_anomaly', source: 'accounting' },
      },
    })).toBe('alerta_fiscal');
  });
});
