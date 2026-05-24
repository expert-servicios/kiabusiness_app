import { kiaDecisionSchema, type KiaDecision } from './kia-output-schema';

export interface KiaEvalFixture {
  name: string;
  message: string;
  expected: {
    intent?: KiaDecision['intent'];
    nextAction?: KiaDecision['nextAction'];
    forbidsNeedsReview?: boolean;
    requiresRulesApplied?: boolean;
    forbidsApiKeyRequest?: boolean;
  };
  decision: KiaDecision;
}

export function evaluateKiaFixture(fixture: KiaEvalFixture): string[] {
  const errors: string[] = [];
  const parsed = kiaDecisionSchema.safeParse(fixture.decision);
  if (!parsed.success) {
    errors.push(`invalid_json:${parsed.error.message}`);
    return errors;
  }

  const decision = parsed.data;
  if (fixture.expected.intent && decision.intent !== fixture.expected.intent) {
    errors.push(`intent expected ${fixture.expected.intent} got ${decision.intent}`);
  }
  if (fixture.expected.nextAction && decision.nextAction !== fixture.expected.nextAction) {
    errors.push(`nextAction expected ${fixture.expected.nextAction} got ${decision.nextAction}`);
  }
  if (fixture.expected.forbidsNeedsReview && decision.nextAction === 'needs_review') {
    errors.push('needs_review not allowed for this fixture');
  }
  if (fixture.expected.requiresRulesApplied && decision.rulesApplied.length === 0) {
    errors.push('rulesApplied is empty');
  }
  if (fixture.expected.forbidsApiKeyRequest && /api key|clave api|token/i.test(decision.userMessage)) {
    errors.push('userMessage asks for API key or token');
  }
  if (!decision.decisionSummary.trim()) errors.push('decisionSummary is empty');
  if (decision.confidence < 0 || decision.confidence > 1) errors.push('confidence out of range');
  return errors;
}
