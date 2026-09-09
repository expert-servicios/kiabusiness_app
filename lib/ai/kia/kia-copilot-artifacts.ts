import type { KiaToolResult } from './kia-tool-definitions';

export type KiaCopilotArtifact =
  | { type: 'report'; title: string; url: string; period?: string; cta: string }
  | { type: 'table'; title: string; columns: string[]; rows: Array<Record<string, unknown>> }
  | { type: 'link'; title: string; url: string; cta: string; tone?: 'warning' | 'info' };

const MAX_TABLE_ROWS = 20;
const MAX_CELL_TEXT = 80;

function safeText(value: unknown): string {
  return String(value ?? '').slice(0, MAX_CELL_TEXT);
}

/**
 * Tool results are already server-authorized, but URLs still receive a final
 * presentation-layer scheme check before being returned to the browser.
 */
function safeArtifactUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const url = value.trim();
  if (!url) return null;
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  if (/^https:\/\//i.test(url)) return url;
  return null;
}

/**
 * Convert already-authorized KIA tool results into deliberately small UI
 * artifacts. This function never queries data, executes tools or accepts raw
 * browser identifiers; it only selects presentation-safe fields from results
 * produced by the authenticated server-side tool loop.
 */
export function buildKiaCopilotArtifacts(toolResults: KiaToolResult[]): KiaCopilotArtifact[] {
  const artifacts: KiaCopilotArtifact[] = [];

  for (const toolResult of toolResults) {
    if (!toolResult.ok || !toolResult.result) continue;
    const result = toolResult.result;

    if (toolResult.toolName === 'generate_company_report') {
      const url = safeArtifactUrl(result.reportUrl);
      if (url) {
        artifacts.push({
          type: 'report',
          title: typeof result.title === 'string' ? safeText(result.title) : 'Informe visual de empresa',
          url,
          period: typeof result.period === 'string' ? safeText(result.period) : undefined,
          cta: 'Abrir informe visual',
        });
      }
    }

    if (toolResult.toolName === 'get_holded_bank_balance' && Array.isArray(result.accounts)) {
      artifacts.push({
        type: 'table',
        title: 'Saldos bancarios en Holded',
        columns: ['Cuenta', 'Saldo', 'Moneda'],
        rows: result.accounts.slice(0, MAX_TABLE_ROWS).map((account) => {
          const row = account as Record<string, unknown>;
          return {
            Cuenta: safeText(row.name),
            Saldo: typeof row.balance === 'number' ? row.balance : safeText(row.balance ?? 0),
            Moneda: safeText(row.currency ?? 'EUR'),
          };
        }),
      });
    }

    if (toolResult.toolName === 'get_holded_invoices' && Array.isArray(result.documents)) {
      artifacts.push({
        type: 'table',
        title: 'Documentos recientes en Holded',
        columns: ['Número', 'Contacto', 'Total', 'Estado'],
        rows: result.documents.slice(0, MAX_TABLE_ROWS).map((document) => {
          const row = document as Record<string, unknown>;
          return {
            Número: safeText(row.number),
            Contacto: safeText(row.contact),
            Total: typeof row.total === 'number' ? row.total : safeText(row.total ?? 0),
            Estado: safeText(row.status),
          };
        }),
      });
    }

    if (toolResult.toolName === 'get_user_expedientes' && Array.isArray(result.expedientes) && result.expedientes.length > 0) {
      const rows = result.expedientes.slice(0, MAX_TABLE_ROWS) as Array<Record<string, unknown>>;
      artifacts.push({
        type: 'table',
        title: `Expedientes activos (${result.expedientes.length})`,
        columns: ['Servicio', 'Estado'],
        rows: rows.map((row) => ({
          Servicio: safeText(row.servicio),
          Estado: safeText(row.estado),
        })),
      });
    }

    if (toolResult.toolName === 'get_user_companies' && Array.isArray(result.empresas) && result.empresas.length > 0) {
      const rows = result.empresas.slice(0, MAX_TABLE_ROWS) as Array<Record<string, unknown>>;
      artifacts.push({
        type: 'table',
        title: `Mis empresas (${result.empresas.length})`,
        columns: ['Nombre', 'CIF/NIF', 'Forma'],
        rows: rows.map((row) => ({
          Nombre: safeText(row.nombre),
          'CIF/NIF': safeText(row.cif_nif ?? '—'),
          Forma: safeText(row.forma_juridica ?? '—'),
        })),
      });
    }

    if (toolResult.toolName === 'generate_holded_connection_link') {
      const url = safeArtifactUrl(result.url);
      if (url) artifacts.push({ type: 'link', title: 'Conectar con Holded', url, cta: 'Ir a integraciones', tone: 'info' });
    }

    if (toolResult.toolName === 'generate_profile_link') {
      const url = safeArtifactUrl(result.url);
      if (url) artifacts.push({ type: 'link', title: 'Completar perfil', url, cta: 'Ir a mi perfil', tone: 'info' });
    }

    if (toolResult.toolName === 'generate_checkout_gate_link') {
      const url = safeArtifactUrl(result.url);
      if (url) artifacts.push({ type: 'link', title: 'Contratar servicio', url, cta: 'Ver opciones', tone: 'info' });
    }
  }

  return artifacts.slice(0, 8);
}
