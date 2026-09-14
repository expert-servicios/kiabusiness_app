import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildKiaAvatarDecision,
  buildKiaPresentationContext,
} from '@/lib/ai/kia/kia-presentation-context-builder';
import type { KiaAuthoritativeCaseStatus } from '@/lib/ai/kia/kia-authoritative-case-status';
import type { KiaDecision } from '@/lib/ai/kia/kia-output-schema';
import type { KiaToolResult } from '@/lib/ai/kia/kia-tool-definitions';

function caseStatusResult(cases: Array<Record<string, unknown>>): KiaToolResult {
  return {
    toolName: 'get_case_status',
    ok: true,
    result: { cases },
  };
}

function authoritativeCase(status: string, id = 'case-1'): KiaAuthoritativeCaseStatus {
  return {
    id,
    serviceName: 'Servicio',
    status,
    nextAction: null,
  };
}

function decision(overrides: Partial<KiaDecision> = {}): KiaDecision {
  return {
    version: '1.0',
    taskType: 'waba_reply',
    contactStatus: 'client',
    intent: 'case_status',
    userMessage: 'Estado del expediente',
    nextAction: 'get_case_status',
    quickReplies: [],
    toolRequests: [],
    dataToSave: {},
    confidence: 0.9,
    requiresMeeting: false,
    requiresManualReview: false,
    decisionSummary: 'test',
    rulesApplied: ['client_flow', 'case_status_context'],
    missingData: [],
    warnings: ['backend_policy_override_case_status'],
    ...overrides,
  };
}

describe('KIA trusted presentation context builder', () => {
  it('emits case_completed from one authoritative company-scoped finalizado case', () => {
    expect(buildKiaPresentationContext([], [authoritativeCase('finalizado')])).toEqual({
      milestone: {
        kind: 'case_completed',
        source: 'case',
      },
    });
  });

  it('does not celebrate an authoritative active case', () => {
    expect(buildKiaPresentationContext([], [authoritativeCase('en_revision')])).toBeUndefined();
  });

  it('does not celebrate an ambiguous authoritative multi-case result', () => {
    expect(buildKiaPresentationContext([], [
      authoritativeCase('finalizado', 'case-1'),
      authoritativeCase('en_revision', 'case-2'),
    ])).toBeUndefined();
  });

  it('keeps a conservative tool-result fallback when a complete server result is available', () => {
    expect(buildKiaPresentationContext([
      caseStatusResult([{ id: 'case-1', serviceName: 'Servicio', status: 'finalizado', nextAction: null }]),
    ])).toEqual({
      milestone: {
        kind: 'case_completed',
        source: 'case',
      },
    });
  });

  it('ignores failed case-status and truly unrelated tool results', () => {
    expect(buildKiaPresentationContext([
      { toolName: 'get_case_status', ok: false, error: 'failed' },
      { toolName: 'get_user_companies', ok: true, result: { count: 1, empresas: [] } },
    ])).toBeUndefined();
  });
});

describe('KIA case-status warning provenance', () => {
  it('removes only the internal case-status routing marker after authoritative lookup succeeds', () => {
    const avatarDecision = buildKiaAvatarDecision(
      decision({ warnings: ['backend_policy_override_case_status', 'real_warning'] }),
      [],
      [authoritativeCase('finalizado')],
    );

    expect(avatarDecision.warnings).toEqual(['real_warning']);
  });

  it('treats an authoritative empty result as a valid lookup but does not invent a milestone', () => {
    const avatarDecision = buildKiaAvatarDecision(decision(), [], []);
    expect(avatarDecision.warnings).toEqual([]);
    expect(buildKiaPresentationContext([], [])).toBeUndefined();
  });

  it('retains the routing marker when authoritative lookup failed and the tool did not succeed', () => {
    const original = decision();
    expect(buildKiaAvatarDecision(original, [
      { toolName: 'get_case_status', ok: false, error: 'failed' },
    ], null)).toBe(original);
  });

  it('allows a successful server-side case-status tool to establish provenance as a fallback', () => {
    const avatarDecision = buildKiaAvatarDecision(
      decision(),
      [caseStatusResult([{ id: 'case-1', status: 'en_revision' }])],
      null,
    );
    expect(avatarDecision.warnings).toEqual([]);
  });

  it('does not sanitize the marker for unrelated intents', () => {
    const original = decision({ intent: 'readiness' });
    expect(buildKiaAvatarDecision(original, [], [authoritativeCase('finalizado')])).toBe(original);
  });
});

describe('KIA authoritative case-status wiring', () => {
  const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
  const loader = source('lib/ai/kia/kia-authoritative-case-status.ts');
  const route = source('app/api/ai/kia/route.ts');

  it('fails closed without both client and company scope and scopes the DB query to both', () => {
    expect(loader).toContain('if (!clientId || !companyId) return null');
    expect(loader).toContain(".eq('client_id', clientId)");
    expect(loader).toContain(".eq('company_id', companyId)");
    expect(loader).toContain("status: row.status ?? row.state ?? 'desconocido'");
  });

  it('loads the authoritative snapshot only for case-status presentation and never from browser state', () => {
    expect(route).toContain("result.decision.intent === 'case_status'");
    expect(route).toContain('loadKiaAuthoritativeCaseStatuses(admin, user.id, companyScope)');
    expect(route).toContain('buildKiaAvatarDecision(');
    expect(route).toContain('decision: avatarDecision');
    expect(route).not.toContain('authoritativeCaseStatuses: parsed.data');
  });
});
