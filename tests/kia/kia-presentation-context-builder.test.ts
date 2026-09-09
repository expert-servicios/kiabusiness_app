import { describe, expect, it } from 'vitest';
import { buildKiaPresentationContext } from '@/lib/ai/kia/kia-presentation-context-builder';
import type { KiaToolResult } from '@/lib/ai/kia/kia-tool-definitions';

function caseStatusResult(cases: Array<Record<string, unknown>>): KiaToolResult {
  return {
    toolName: 'get_case_status',
    ok: true,
    result: { cases },
  };
}

describe('KIA trusted presentation context builder', () => {
  it('emits case_completed only when one server-authorized case is finalizado', () => {
    expect(buildKiaPresentationContext([
      caseStatusResult([{ id: 'case-1', serviceName: 'Servicio', status: 'finalizado', nextAction: null }]),
    ])).toEqual({
      milestone: {
        kind: 'case_completed',
        source: 'case',
      },
    });
  });

  it('does not celebrate an active case', () => {
    expect(buildKiaPresentationContext([
      caseStatusResult([{ id: 'case-1', serviceName: 'Servicio', status: 'en_revision', nextAction: null }]),
    ])).toBeUndefined();
  });

  it('does not celebrate an ambiguous multi-case result even if one case is complete', () => {
    expect(buildKiaPresentationContext([
      caseStatusResult([
        { id: 'case-1', serviceName: 'Servicio A', status: 'finalizado', nextAction: null },
        { id: 'case-2', serviceName: 'Servicio B', status: 'en_revision', nextAction: null },
      ]),
    ])).toBeUndefined();
  });

  it('ignores failed and unrelated tool results', () => {
    expect(buildKiaPresentationContext([
      { toolName: 'get_case_status', ok: false, error: 'failed' },
      { toolName: 'get_holded_connection_status', ok: true, result: { status: 'active' } },
    ])).toBeUndefined();
  });
});
