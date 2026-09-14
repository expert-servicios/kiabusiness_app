import type { KiaAuthoritativeCaseStatus } from './kia-authoritative-case-status';
import type { KiaDecision } from './kia-output-schema';
import type { KiaToolResult } from './kia-tool-definitions';
import type { KiaPresentationContext } from './kia-presentation-context';

function caseRowsFromToolResults(toolResults: KiaToolResult[]): Array<Record<string, unknown>> | null {
  for (const toolResult of toolResults) {
    if (toolResult.toolName !== 'get_case_status' || !toolResult.ok || !toolResult.result) continue;
    const cases = toolResult.result.cases;
    return Array.isArray(cases) ? cases.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object')) : [];
  }
  return null;
}

function hasSuccessfulCaseStatusResult(toolResults: KiaToolResult[]): boolean {
  return toolResults.some((toolResult) => toolResult.toolName === 'get_case_status' && toolResult.ok);
}

function assuranceFromToolResults(toolResults: KiaToolResult[]): KiaPresentationContext['assurance'] | undefined {
  const holdedStatus = toolResults.find((toolResult) => (
    toolResult.toolName === 'get_holded_connection_status' && toolResult.ok && toolResult.result
  ));
  if (holdedStatus?.result?.status === 'active') {
    return {
      kind: 'validated_status',
      source: 'holded',
    };
  }
  return undefined;
}

/**
 * Build presentation-only signals from server-authorized sources.
 *
 * The optional authoritative case snapshot is preferred because the normal KIA
 * conversational context intentionally excludes completed cases. Tool results
 * remain a conservative fallback for channels that already return a complete
 * case-status result. Fiscal risk is accepted only as an already-authorized
 * server signal; this builder never derives it from message text or model prose.
 */
export function buildKiaPresentationContext(
  toolResults: KiaToolResult[],
  authoritativeCases: readonly KiaAuthoritativeCaseStatus[] | null = null,
  authoritativeFiscalRisk: KiaPresentationContext['fiscalRisk'] | null = null,
): KiaPresentationContext | undefined {
  const context: KiaPresentationContext = {};

  if (authoritativeFiscalRisk) {
    context.fiscalRisk = authoritativeFiscalRisk;
  }

  const assurance = assuranceFromToolResults(toolResults);
  if (assurance) {
    context.assurance = assurance;
  }

  const cases: ReadonlyArray<Record<string, unknown> | KiaAuthoritativeCaseStatus> | null = authoritativeCases ?? caseRowsFromToolResults(toolResults);
  if (cases?.length === 1 && cases[0].status === 'finalizado') {
    context.milestone = {
      kind: 'case_completed',
      source: 'case',
    };
  }

  return context.fiscalRisk || context.assurance || context.milestone ? context : undefined;
}

/**
 * Prepare the decision used only by the avatar resolver.
 *
 * `backend_policy_override_case_status` is an internal routing marker rather
 * than a user-facing risk. It is removed only when case status was confirmed by
 * an authoritative server-side lookup or a successful server-side tool result.
 * The underlying KiaDecision, user reply and operational flow remain unchanged.
 */
export function buildKiaAvatarDecision(
  decision: KiaDecision,
  toolResults: KiaToolResult[],
  authoritativeCases: readonly KiaAuthoritativeCaseStatus[] | null = null,
): KiaDecision {
  if (decision.intent !== 'case_status') return decision;

  const caseStatusAuthorized = authoritativeCases !== null || hasSuccessfulCaseStatusResult(toolResults);
  if (!caseStatusAuthorized) return decision;

  const filteredWarnings = decision.warnings.filter((warning) => warning !== 'backend_policy_override_case_status');
  if (filteredWarnings.length === decision.warnings.length) return decision;

  return {
    ...decision,
    warnings: filteredWarnings,
  };
}
