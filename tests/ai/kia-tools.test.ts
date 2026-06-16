/**
 * Unit tests for the Kia dashboard tool calls:
 *   get_user_expedientes, get_user_companies, get_user_pending_docs
 *
 * The Supabase admin client and all external imports are mocked so these
 * tests run fast without network or DB access.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeKiaToolCall } from '@/lib/ai/kia/kia-tool-executor';
import type { KiaContext } from '@/lib/ai/kia/kia-context-builder';

// ── Mock external dependencies ────────────────────────────────────────────────

const mockFrom = vi.fn();

vi.mock('@/lib/integrations/supabase', () => ({
  getSupabaseAdmin: () => ({ from: mockFrom }),
}));

vi.mock('@/lib/utils/app-url', () => ({
  absoluteAppUrl: (p: string) => `https://app.test${p}`,
}));

vi.mock('@/lib/integrations/kia-contact-resolver', () => ({
  resolveKiaContactContext: vi.fn(),
}));

vi.mock('@/lib/services/service-registry', () => ({
  getService: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/data/service-readiness-checks', () => ({
  getReadinessCheck: vi.fn().mockReturnValue(null),
  calculateReadinessResult: vi.fn(),
}));

vi.mock('@/lib/integrations/holded/holded-auth', () => ({
  resolveHoldedAuth: vi.fn(),
  buildHoldedHeaders: vi.fn(),
}));

vi.mock('@/lib/reports/report-generator', () => ({
  generateCompanyReport: vi.fn(),
}));

vi.mock('@/lib/ai/kia/kia-ocr-extractor', () => ({
  extractInvoiceOcr: vi.fn(),
}));

vi.mock('@/lib/ai/kia/kia-redaction', () => ({
  redactJson: (x: unknown) => x as Record<string, unknown>,
  safeErrorMessage: (e: unknown) => String(e),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const CLIENT_ID = 'aaaaaaaa-0000-0000-0000-eeeeeeeeeeee';

function makeContext(clientId: string | null = CLIENT_ID): KiaContext {
  return {
    contact: {
      status: 'client',
      name: 'Test User',
      email: 'test@example.com',
      phone: null,
      clientId,
      leadId: null,
      language: 'es',
    },
    profile: null,
    company: null,
    service: null,
    cases: [],
    documents: { pendingCount: 0, recent: [] },
    accounting: {
      hasSnapshot: false,
      latestQuarter: null,
      anomalyCount: 0,
      criticalAnomalyCount: 0,
    },
    conversation: { recentMessages: [] },
    memories: [],
  };
}

/** Creates a fluent Supabase query-chain mock that resolves with the given data. */
function queryChain(response: { data: unknown; error: unknown }) {
  const chain = {
    select     : vi.fn().mockReturnThis(),
    eq         : vi.fn().mockReturnThis(),
    neq        : vi.fn().mockReturnThis(),
    not        : vi.fn().mockReturnThis(),
    in         : vi.fn().mockReturnThis(),
    order      : vi.fn().mockReturnThis(),
    limit      : vi.fn().mockResolvedValue(response),
    maybeSingle: vi.fn().mockResolvedValue(response),
  };
  return chain;
}

// ── get_user_expedientes ──────────────────────────────────────────────────────

describe('get_user_expedientes', () => {
  const TOOL = { name: 'get_user_expedientes', arguments: { status: 'activos', limit: 10 } };

  beforeEach(() => vi.clearAllMocks());

  it('devuelve expedientes del usuario autenticado', async () => {
    const rows = [
      { id: 'case-1', service: 'Declaracion IRPF', category: null, status: 'en_revision', priority: 'media', due_date: null, opened_at: '2026-01-15' },
      { id: 'case-2', service: 'Alta autonomo', category: 'autonomos', status: 'pendiente_cliente', priority: 'alta', due_date: null, opened_at: '2026-01-10' },
    ];
    mockFrom.mockReturnValue(queryChain({ data: rows, error: null }));

    const result = await executeKiaToolCall(TOOL, makeContext());

    expect(result.ok).toBe(true);
    expect(result.result?.count).toBe(2);
    type Exp = { id: string; servicio: string; estado: string; estado_raw: string; url: string };
    const expedientes = result.result?.expedientes as Exp[];
    expect(expedientes[0].id).toBe('case-1');
    expect(expedientes[0].servicio).toBe('Declaracion IRPF');
    expect(expedientes[0].estado_raw).toBe('en_revision');
    expect(expedientes[0].estado).toBe('En revisión');
    expect(expedientes[0].url).toMatch(/expedientes\/case-1/);
  });

  it('falla si clientId es null en el contexto', async () => {
    const result = await executeKiaToolCall(TOOL, makeContext(null));

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/usuario/i);
  });

  it('aplica filtro .eq(status, finalizado) cuando status es finalizados', async () => {
    const chain = queryChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await executeKiaToolCall(
      { name: 'get_user_expedientes', arguments: { status: 'finalizados', limit: 5 } },
      makeContext(),
    );

    expect(chain.eq).toHaveBeenCalledWith('status', 'finalizado');
  });

  it('aplica filtro .neq(status, finalizado) cuando status es activos', async () => {
    const chain = queryChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await executeKiaToolCall(TOOL, makeContext());

    expect(chain.neq).toHaveBeenCalledWith('status', 'finalizado');
  });

  it('devuelve count=0 si la consulta retorna lista vacía', async () => {
    mockFrom.mockReturnValue(queryChain({ data: [], error: null }));

    const result = await executeKiaToolCall(TOOL, makeContext());

    expect(result.ok).toBe(true);
    expect(result.result?.count).toBe(0);
  });

  it('falla si la consulta devuelve error de DB', async () => {
    mockFrom.mockReturnValue(queryChain({ data: null, error: new Error('connection refused') }));

    const result = await executeKiaToolCall(TOOL, makeContext());

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/expedientes/i);
  });
});

// ── get_user_companies ────────────────────────────────────────────────────────

describe('get_user_companies', () => {
  const TOOL = { name: 'get_user_companies', arguments: { limit: 5 } };

  beforeEach(() => vi.clearAllMocks());

  it('devuelve empresas del usuario con sus datos básicos', async () => {
    const rows = [
      {
        role: 'owner',
        company: {
          id: 'co-1',
          razon_social: 'Empresa SL',
          nombre_comercial: 'Empresa',
          cif_nif: 'B12345678',
          forma_juridica: 'sl',
        },
      },
    ];
    mockFrom.mockReturnValue(queryChain({ data: rows, error: null }));

    const result = await executeKiaToolCall(TOOL, makeContext());

    expect(result.ok).toBe(true);
    expect(result.result?.count).toBe(1);
    const empresas = result.result?.empresas as Array<{ nombre: string; cif_nif: string; rol: string }>;
    expect(empresas[0].cif_nif).toBe('B12345678');
    expect(empresas[0].nombre).toBe('Empresa'); // nombre_comercial takes priority
    expect(empresas[0].rol).toBe('owner');
  });

  it('usa razon_social cuando nombre_comercial es null', async () => {
    const rows = [
      {
        role: 'member',
        company: { id: 'co-2', razon_social: 'Mi Empresa SA', nombre_comercial: null, cif_nif: 'A87654321', forma_juridica: 'sa' },
      },
    ];
    mockFrom.mockReturnValue(queryChain({ data: rows, error: null }));

    const result = await executeKiaToolCall(TOOL, makeContext());
    const empresas = result.result?.empresas as Array<{ nombre: string }>;
    expect(empresas[0].nombre).toBe('Mi Empresa SA');
  });

  it('falla si clientId es null', async () => {
    const result = await executeKiaToolCall(TOOL, makeContext(null));

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/usuario/i);
  });

  it('falla si la consulta devuelve error de DB', async () => {
    mockFrom.mockReturnValue(queryChain({ data: null, error: new Error('timeout') }));

    const result = await executeKiaToolCall(TOOL, makeContext());

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/empresas/i);
  });
});

// ── get_user_pending_docs ─────────────────────────────────────────────────────

describe('get_user_pending_docs', () => {
  const TOOL = { name: 'get_user_pending_docs', arguments: {} };

  beforeEach(() => vi.clearAllMocks());

  it('devuelve documentos pendientes del usuario', async () => {
    const rows = [
      { id: 'doc-1', original_name: 'factura.pdf', state: 'pendiente', case_id: 'case-1', created_at: '2026-01-01' },
      { id: 'doc-2', original_name: 'dni.jpg',     state: 'pendiente', case_id: null,     created_at: '2026-01-02' },
    ];
    mockFrom.mockReturnValue(queryChain({ data: rows, error: null }));

    const result = await executeKiaToolCall(TOOL, makeContext());

    expect(result.ok).toBe(true);
    expect(result.result?.pending_count).toBe(2);
    const docs = result.result?.documentos as Array<{ nombre: string; expediente_id: string | null }>;
    expect(docs[0].nombre).toBe('factura.pdf');
    expect(docs[0].expediente_id).toBe('case-1');
    expect(docs[1].expediente_id).toBeNull();
  });

  it('falla si clientId es null', async () => {
    const result = await executeKiaToolCall(TOOL, makeContext(null));

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/usuario/i);
  });

  it('añade filtro eq(case_id) cuando se proporciona caseId', async () => {
    const chain = queryChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const CASE_UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
    await executeKiaToolCall(
      { name: 'get_user_pending_docs', arguments: { caseId: CASE_UUID } },
      makeContext(),
    );

    const eqCalls = chain.eq.mock.calls as [string, string][];
    expect(eqCalls.some(([col, val]) => col === 'case_id' && val === CASE_UUID)).toBe(true);
  });

  it('no añade filtro case_id cuando no se proporciona caseId', async () => {
    const chain = queryChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    await executeKiaToolCall(TOOL, makeContext());

    const eqCalls = chain.eq.mock.calls as [string, string][];
    expect(eqCalls.every(([col]) => col !== 'case_id')).toBe(true);
  });

  it('devuelve pending_count=0 si no hay documentos', async () => {
    mockFrom.mockReturnValue(queryChain({ data: [], error: null }));

    const result = await executeKiaToolCall(TOOL, makeContext());

    expect(result.ok).toBe(true);
    expect(result.result?.pending_count).toBe(0);
  });

  it('falla si la consulta devuelve error de DB', async () => {
    mockFrom.mockReturnValue(queryChain({ data: null, error: new Error('db error') }));

    const result = await executeKiaToolCall(TOOL, makeContext());

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/documentos/i);
  });
});
