import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildKiaCopilotArtifacts } from '@/lib/ai/kia/kia-copilot-artifacts';
import type { KiaDecision } from '@/lib/ai/kia/kia-output-schema';
import type { KiaToolResult } from '@/lib/ai/kia/kia-tool-definitions';

function result(toolName: string, payload: Record<string, unknown>): KiaToolResult {
  return { toolName, ok: true, result: payload };
}

function decision(overrides: Partial<KiaDecision> = {}): KiaDecision {
  return {
    version: '1.0',
    taskType: 'waba_reply',
    contactStatus: 'client',
    intent: 'unknown',
    userMessage: 'Respuesta',
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

describe('KIA copilot artifact builder', () => {
  it('builds small presentation-safe artifacts from authorized tool results', () => {
    const artifacts = buildKiaCopilotArtifacts([
      result('get_user_expedientes', {
        expedientes: [
          { id: 'internal-id-1', servicio: 'Migración Holded', estado: 'en_revision' },
          { id: 'internal-id-2', servicio: 'Formación', estado: 'pendiente' },
        ],
      }),
      result('generate_profile_link', { url: '/auth/login?next=/dashboard/perfil', internalToken: 'secret' }),
    ], decision({ nextAction: 'send_profile_link' }));

    expect(artifacts).toHaveLength(2);
    expect(artifacts[0]).toMatchObject({
      type: 'table',
      title: 'Expedientes (2)',
      columns: ['Servicio', 'Estado'],
    });
    expect(JSON.stringify(artifacts)).not.toContain('internal-id-1');
    expect(JSON.stringify(artifacts)).not.toContain('internalToken');
    expect(artifacts[1]).toMatchObject({ type: 'link', url: '/dashboard/perfil' });
  });

  it('rejects unsafe and protocol-relative checkout URLs', () => {
    const unsafe = buildKiaCopilotArtifacts([
      result('generate_checkout_gate_link', { url: 'javascript:alert(1)' }),
      result('generate_checkout_gate_link', { url: '//evil.example/phish' }),
    ], decision({ nextAction: 'send_checkout_link' }));

    expect(unsafe).toHaveLength(0);

    const safe = buildKiaCopilotArtifacts([
      result('generate_checkout_gate_link', { url: 'https://expertconsulting.es/contratar?service=test' }),
    ], decision({ nextAction: 'send_checkout_link' }));

    expect(safe).toHaveLength(1);
  });

  it('caps table rows before returning them to the browser', () => {
    const documents = Array.from({ length: 35 }, (_, index) => ({
      number: `EXP-${index}`,
      contact: `Cliente ${index}`,
      total: index,
      status: 'paid',
    }));

    const artifacts = buildKiaCopilotArtifacts([
      result('get_holded_invoices', { documents }),
    ], decision());

    expect(artifacts[0]?.type).toBe('table');
    if (artifacts[0]?.type === 'table') {
      expect(artifacts[0].rows).toHaveLength(20);
    }
  });

  it('never lets a stale action tool result bypass the final validated decision', () => {
    const checkoutResult = result('generate_checkout_gate_link', {
      url: 'https://expertconsulting.es/contratar?service=test',
    });

    expect(buildKiaCopilotArtifacts([checkoutResult], decision({ nextAction: 'reply_only' }))).toEqual([]);
    expect(buildKiaCopilotArtifacts([
      result('get_user_expedientes', { expedientes: [{ servicio: 'Servicio', estado: 'pendiente' }] }),
    ], decision({ requiresManualReview: true, nextAction: 'needs_review' }))).toEqual([]);
  });

  it('uses direct authenticated destinations for Holded and profile actions', () => {
    expect(buildKiaCopilotArtifacts([
      result('generate_holded_connection_link', { url: '/auth/login?next=/dashboard/integraciones/holded' }),
    ], decision({ nextAction: 'send_holded_connect_link' }))).toEqual([
      expect.objectContaining({ url: '/dashboard/integraciones/holded' }),
    ]);

    expect(buildKiaCopilotArtifacts([
      result('generate_profile_link', { url: '/auth/login?next=/dashboard/perfil' }),
    ], decision({ nextAction: 'send_profile_link' }))).toEqual([
      expect.objectContaining({ url: '/dashboard/perfil' }),
    ]);
  });
});

describe('canonical KIA widget artifact integration', () => {
  const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
  const api = source('app/api/ai/kia/route.ts');
  const widget = source('components/KiaCopilotWidget.tsx');
  const companySwitcher = source('components/dashboard/CompanySwitcher.tsx');
  const protectedLayout = source('app/(protected)/layout.tsx');
  const dashboardLayout = source('app/(protected)/dashboard/layout.tsx');

  it('derives artifacts from authorized results and the final validated decision', () => {
    expect(api).toContain('buildKiaCopilotArtifacts(result.toolResults, result.decision)');
    expect(api).toContain('artifacts,');
    expect(api).not.toContain('buildKiaCopilotArtifacts(parsed.data');
  });

  it('uses the copilot-specific tool gate on the canonical endpoint', () => {
    expect(api).toContain("forceToolExecution: process.env.KIA_COPILOT_TOOLS_ENABLED?.toLowerCase() !== 'false'");
  });

  it('renders report/link/table artifacts inside the canonical avatar widget', () => {
    expect(widget).toContain("import type { KiaCopilotArtifact }");
    expect(widget).toContain('artifacts?: KiaCopilotArtifact[]');
    expect(widget).toContain('data.artifacts?.length');
    expect(widget).toContain('function KiaMessageArtifacts');
    expect(widget).toContain("artifact.type === 'table'");
    expect(widget).toContain('rel="noopener noreferrer"');
  });

  it('sends only bounded visible history and binds sessions to the active company server-side', () => {
    expect(widget).toContain('.slice(-8)');
    expect(widget).toContain('text: message.text.slice(0, 1200)');
    expect(widget).toContain('history,');
    expect(api).toContain("history     : z.array(historyItemSchema).max(8).optional()");
    expect(api).toContain('syntheticRecentMessages,');
    expect(api).toContain(".eq('profile_id', user.id)");
    expect(api).toContain(".eq('company_id', resolvedCompanyId)");
    expect(api).toContain('sessionCompanyId(existingSession.data) !== companyScope');
    expect(api).toContain('effectiveHistory = []');
    expect(api).toContain('company_id  : companyScope');
  });

  it('clears visible KIA history when CompanySwitcher changes the active entity', () => {
    expect(companySwitcher).toContain("window.dispatchEvent(new CustomEvent('expert:active-company-changed'");
    expect(widget).toContain("window.addEventListener('expert:active-company-changed', handleCompanyChanged)");
    expect(widget).toContain('setSessionId(undefined)');
  });

  it('documents the existing duplicate copilot surface until parity cutover', () => {
    expect(protectedLayout).toContain('<KiaCopilotWidget />');
    expect(dashboardLayout).toContain('<KiaCopilotPanel />');
  });
});
