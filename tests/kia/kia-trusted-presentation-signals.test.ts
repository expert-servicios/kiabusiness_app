import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  appendKiaFiscalNotice,
  loadKiaAuthoritativeFiscalSignal,
  shouldLoadKiaFiscalSignal,
} from '@/lib/ai/kia/kia-authoritative-fiscal-signal';
import { resolveKiaAvatarState } from '@/lib/ai/kia/kia-avatar-state';
import { buildKiaPresentationContext } from '@/lib/ai/kia/kia-presentation-context-builder';
import type { KiaDecision } from '@/lib/ai/kia/kia-output-schema';
import type { KiaToolResult } from '@/lib/ai/kia/kia-tool-definitions';

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
    confidence: 0.99,
    requiresMeeting: false,
    requiresManualReview: false,
    decisionSummary: 'test',
    rulesApplied: ['test'],
    missingData: [],
    warnings: [],
    ...overrides,
  };
}

function fiscalAdmin(rows: unknown[]) {
  const calls: Array<[string, string, string]> = [];
  const query = {
    select: () => query,
    eq: (column: string, value: string) => {
      calls.push(['eq', column, value]);
      return query;
    },
    not: (column: string, operator: string, value: null) => {
      calls.push(['not', column, `${operator}:${String(value)}`]);
      return query;
    },
    lte: (column: string, value: string) => {
      calls.push(['lte', column, value]);
      return query;
    },
    order: () => query,
    limit: async () => ({ data: rows, error: null }),
  };
  return {
    admin: { from: () => query } as unknown as Parameters<typeof loadKiaAuthoritativeFiscalSignal>[0],
    calls,
  };
}

describe('KIA trusted presentation signals', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('activates confianza from a successful company-scoped Holded status result', () => {
    const toolResults: KiaToolResult[] = [{
      toolName: 'get_holded_connection_status',
      ok: true,
      result: { status: 'active', permissions: {} },
    }];
    const context = buildKiaPresentationContext(toolResults);

    expect(context?.assurance).toEqual({ kind: 'validated_status', source: 'holded' });
    expect(resolveKiaAvatarState({ decision: decision(), presentationContext: context })).toBe('confianza');
  });

  it('does not activate confianza from model confidence or a missing Holded connection', () => {
    const context = buildKiaPresentationContext([{
      toolName: 'get_holded_connection_status',
      ok: true,
      result: { status: 'missing', permissions: {} },
    }]);

    expect(context).toBeUndefined();
    expect(resolveKiaAvatarState({ decision: decision({ confidence: 1 }) })).toBe('ayuda');
  });

  it('uses fiscal wording only as a retrieval gate, never as the risk itself', () => {
    expect(shouldLoadKiaFiscalSignal({
      message: '¿Cuándo vence mi modelo 303?',
      intent: 'unknown',
    })).toBe(true);
    expect(shouldLoadKiaFiscalSignal({
      message: '¿Cuál es el plazo de mi expediente?',
      intent: 'case_status',
    })).toBe(false);
    expect(shouldLoadKiaFiscalSignal({
      message: '¿Cómo conecto Holded?',
      intent: 'connect_holded',
    })).toBe(false);

    expect(resolveKiaAvatarState({
      decision: decision(),
      userMessage: 'Tengo un plazo fiscal y una posible sanción.',
    })).not.toBe('alerta_fiscal');
  });

  it('fails closed without an active validated company', async () => {
    const admin = {
      from: () => {
        throw new Error('query should not run without company scope');
      },
    } as unknown as Parameters<typeof loadKiaAuthoritativeFiscalSignal>[0];

    await expect(loadKiaAuthoritativeFiscalSignal(admin, 'user-1', null)).resolves.toBeNull();
  });

  it('creates a critical fiscal signal only from a pending overdue company-scoped confirmed obligation', async () => {
    const { admin, calls } = fiscalAdmin([{
      id: 'ob-1',
      modelo: '303',
      description: 'IVA trimestral · 2T 2026',
      period_label: '2T 2026',
      deadline: '2026-09-08',
      status: 'pending',
      template_code: '303_quarterly',
    }]);

    const signal = await loadKiaAuthoritativeFiscalSignal(admin, 'user-1', 'company-1');

    expect(signal?.risk).toEqual({
      severity: 'critical',
      code: 'filing_overdue',
      source: 'fiscal_calendar',
    });
    expect(calls).toContainEqual(['eq', 'user_id', 'user-1']);
    expect(calls).toContainEqual(['eq', 'company_id', 'company-1']);
    expect(calls).toContainEqual(['eq', 'status', 'pending']);
    expect(calls).toContainEqual(['not', 'template_code', 'is:null']);
    expect(resolveKiaAvatarState({
      decision: decision(),
      presentationContext: { fiscalRisk: signal!.risk },
    })).toBe('alerta_fiscal');
  });

  it('ignores legacy or inferred obligations without confirmed template provenance', async () => {
    const { admin } = fiscalAdmin([{
      id: 'legacy-1',
      modelo: '303',
      description: 'Legacy obligation',
      period_label: '2T 2026',
      deadline: '2026-09-08',
      status: 'pending',
      template_code: null,
    }]);

    await expect(loadKiaAuthoritativeFiscalSignal(admin, 'user-1', 'company-1')).resolves.toBeNull();
  });

  it('creates a high fiscal signal for a verified obligation due within seven days', async () => {
    const { admin } = fiscalAdmin([{
      id: 'ob-2',
      modelo: '111',
      description: 'Retenciones · 3T 2026',
      period_label: '3T 2026',
      deadline: '2026-09-12',
      status: 'pending',
      template_code: '111_quarterly',
    }]);

    const signal = await loadKiaAuthoritativeFiscalSignal(admin, 'user-1', 'company-1');
    expect(signal?.risk).toEqual({
      severity: 'high',
      code: 'deadline_risk',
      source: 'fiscal_calendar',
    });
  });

  it('does not treat unverified future-year nominal dates as authoritative alerts', async () => {
    vi.setSystemTime(new Date('2027-01-05T10:00:00Z'));
    const { admin } = fiscalAdmin([{
      id: 'ob-3',
      modelo: '303',
      description: 'IVA trimestral · 4T 2026',
      period_label: '4T 2026',
      deadline: '2027-01-10',
      status: 'pending',
      template_code: '303_quarterly',
    }]);

    await expect(loadKiaAuthoritativeFiscalSignal(admin, 'user-1', 'company-1')).resolves.toBeNull();
  });

  it('keeps manual review above fiscal presentation and appends a factual verified notice', () => {
    const signal = {
      risk: {
        severity: 'high' as const,
        code: 'deadline_risk' as const,
        source: 'fiscal_calendar' as const,
      },
      obligation: {
        id: 'ob-4',
        modelo: '115',
        description: 'Retenciones de arrendamientos',
        periodLabel: '3T 2026',
        deadline: '2026-09-12',
      },
    };

    expect(resolveKiaAvatarState({
      decision: decision({ requiresManualReview: true }),
      presentationContext: { fiscalRisk: signal.risk },
    })).toBe('aviso');

    expect(appendKiaFiscalNotice('He revisado tu consulta.', signal)).toContain(
      'Aviso fiscal verificado: modelo 115 · 3T 2026 figura pendiente y vence el 2026-09-12.',
    );
  });
});
