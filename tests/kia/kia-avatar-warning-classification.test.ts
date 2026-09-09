import { describe, expect, it } from 'vitest';
import { resolveKiaAvatarState } from '@/lib/ai/kia/kia-avatar-state';
import type { KiaDecision } from '@/lib/ai/kia/kia-output-schema';

function decision(overrides: Partial<KiaDecision> = {}): KiaDecision {
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
    warnings: [],
    ...overrides,
  };
}

describe('KIA presentation warning classification', () => {
  it('keeps real case-status responses in seguimiento despite backend trace marker', () => {
    expect(resolveKiaAvatarState({
      decision: decision({
        intent: 'case_status',
        nextAction: 'get_case_status',
        warnings: ['backend_policy_override_case_status'],
      }),
    })).toBe('seguimiento');
  });

  it('keeps readiness/viability backend routing markers presentation-neutral', () => {
    expect(resolveKiaAvatarState({
      decision: decision({
        intent: 'readiness',
        nextAction: 'run_readiness',
        warnings: ['backend_policy_override_holded_readiness'],
      }),
    })).toBe('explicacion');

    expect(resolveKiaAvatarState({
      decision: decision({
        intent: 'viability',
        nextAction: 'run_viability',
        warnings: ['backend_policy_override_viability'],
      }),
    })).toBe('explicacion');
  });

  it('does not turn harmless response repairs into visual alarms', () => {
    expect(resolveKiaAvatarState({
      decision: decision({
        intent: 'greeting',
        warnings: [
          'user_message_language_repaired_by_backend',
          'extra_question_marks_repaired_by_backend',
          'taskType corrected by backend',
          'contactStatus corrected by backend',
          'Possible repeated phrasing detected (92%)',
        ],
      }),
    })).toBe('bienvenida');
  });

  it('keeps unknown, security, tax-review and execution warnings as aviso', () => {
    const warningCodes = [
      'unexpected backend warning',
      'backend_policy_override_api_key_channel',
      'backend_policy_override_tax_summary',
      'tool_loop_timeout',
      'judge_rejected:high:requires review',
    ];

    for (const warning of warningCodes) {
      expect(resolveKiaAvatarState({
        decision: decision({ warnings: [warning] }),
      })).toBe('aviso');
    }
  });
});
