import type { KiaToolResult } from './kia-tool-definitions';
import type { KiaPresentationContext } from './kia-presentation-context';

/**
 * Build presentation-only signals from server-authorized tool results.
 *
 * This helper is intentionally conservative. It never consumes browser input,
 * model prose or model confidence. A positive milestone is emitted only when
 * the case-status tool returned exactly one company-scoped case and that case
 * is already persisted as `finalizado` by the backend.
 */
export function buildKiaPresentationContext(
  toolResults: KiaToolResult[],
): KiaPresentationContext | undefined {
  for (const toolResult of toolResults) {
    if (toolResult.toolName !== 'get_case_status' || !toolResult.ok || !toolResult.result) {
      continue;
    }

    const cases = toolResult.result.cases;
    if (!Array.isArray(cases) || cases.length !== 1) continue;

    const caseRow = cases[0];
    if (!caseRow || typeof caseRow !== 'object') continue;

    const status = (caseRow as Record<string, unknown>).status;
    if (status === 'finalizado') {
      return {
        milestone: {
          kind: 'case_completed',
          source: 'case',
        },
      };
    }
  }

  return undefined;
}
