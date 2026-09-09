import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildKiaCopilotArtifacts } from '@/lib/ai/kia/kia-copilot-artifacts';
import type { KiaToolResult } from '@/lib/ai/kia/kia-tool-definitions';

function result(toolName: string, payload: Record<string, unknown>): KiaToolResult {
  return { toolName, ok: true, result: payload };
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
      result('generate_profile_link', { url: '/dashboard/perfil', internalToken: 'secret' }),
    ]);

    expect(artifacts).toHaveLength(2);
    expect(artifacts[0]).toMatchObject({
      type: 'table',
      title: 'Expedientes activos (2)',
      columns: ['Servicio', 'Estado'],
    });
    expect(JSON.stringify(artifacts)).not.toContain('internal-id-1');
    expect(JSON.stringify(artifacts)).not.toContain('internalToken');
    expect(artifacts[1]).toMatchObject({ type: 'link', url: '/dashboard/perfil' });
  });

  it('rejects unsafe link schemes and ignores failed tool results', () => {
    const artifacts = buildKiaCopilotArtifacts([
      result('generate_profile_link', { url: 'javascript:alert(1)' }),
      { toolName: 'generate_checkout_gate_link', ok: false, error: 'failed' },
      result('generate_holded_connection_link', { url: 'https://expertconsulting.es/dashboard/integraciones/holded' }),
    ]);

    expect(artifacts).toHaveLength(1);
    expect(artifacts[0]).toMatchObject({
      type: 'link',
      url: 'https://expertconsulting.es/dashboard/integraciones/holded',
    });
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
    ]);

    expect(artifacts[0]?.type).toBe('table');
    if (artifacts[0]?.type === 'table') {
      expect(artifacts[0].rows).toHaveLength(20);
    }
  });
});

describe('canonical KIA widget artifact integration', () => {
  const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
  const api = source('app/api/ai/kia/route.ts');
  const widget = source('components/KiaCopilotWidget.tsx');
  const protectedLayout = source('app/(protected)/layout.tsx');
  const dashboardLayout = source('app/(protected)/dashboard/layout.tsx');

  it('derives artifacts only from already-authorized server tool results', () => {
    expect(api).toContain('buildKiaCopilotArtifacts(result.toolResults)');
    expect(api).toContain('artifacts,');
    expect(api).not.toContain('buildKiaCopilotArtifacts(parsed.data');
  });

  it('renders report/link/table artifacts inside the canonical avatar widget', () => {
    expect(widget).toContain("import type { KiaCopilotArtifact }");
    expect(widget).toContain('artifacts?: KiaCopilotArtifact[]');
    expect(widget).toContain('data.artifacts?.length');
    expect(widget).toContain('function KiaMessageArtifacts');
    expect(widget).toContain("artifact.type === 'table'");
    expect(widget).toContain('rel="noopener noreferrer"');
  });

  it('sends only bounded visible conversation history and keeps server scope authoritative', () => {
    expect(widget).toContain('.slice(-8)');
    expect(widget).toContain('text: message.text.slice(0, 1200)');
    expect(widget).toContain('history,');
    expect(api).toContain("history     : z.array(historyItemSchema).max(8).optional()");
    expect(api).toContain('syntheticRecentMessages,');
    expect(api).toContain(".eq('profile_id', user.id)");
    expect(api).toContain(".eq('company_id', resolvedCompanyId)");
  });

  it('documents the existing duplicate copilot surface until parity cutover', () => {
    expect(protectedLayout).toContain('<KiaCopilotWidget />');
    expect(dashboardLayout).toContain('<KiaCopilotPanel />');
  });
});
