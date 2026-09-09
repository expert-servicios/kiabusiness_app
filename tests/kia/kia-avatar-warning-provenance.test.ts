import { describe, expect, it } from 'vitest';
import { resolveKiaAvatarState } from '@/lib/ai/kia/kia-avatar-state';
import type { KiaDecision } from '@/lib/ai/kia/kia-output-schema';

function decision(warning: string): KiaDecision {
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
    confidence: 1,
    requiresMeeting: false,
    requiresManualReview: false,
    decisionSummary: 'test warning provenance',
    rulesApplied: ['test'],
    missingData: [],
    warnings: [warning],
  };
}

describe('KIA warning provenance safety', () => {
  it.each([
    'backend_policy_override_case_status',
    'backend_policy_override_viability',
    'backend_policy_override_holded_readiness',
    'user_message_language_repaired_by_backend',
    'extra_question_marks_repaired_by_backend',
    'taskType corrected by backend',
    'contactStatus corrected by backend',
    'Possible repeated phrasing detected in response',
  ])('does not suppress a warning merely because its text looks like a backend marker: %s', (warning) => {
    expect(resolveKiaAvatarState({
      decision: decision(warning),
      presentationContext: {
        assurance: { kind: 'validated_status', source: 'case' },
        milestone: { kind: 'case_completed', source: 'case' },
      },
    })).toBe('aviso');
  });
});
