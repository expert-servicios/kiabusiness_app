import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { resolveCompanyData, adminFrom } = vi.hoisted(() => ({
  resolveCompanyData: vi.fn(),
  adminFrom: vi.fn(),
}));

vi.mock('@/lib/integrations/company-data-resolver', () => ({
  resolveCompanyData,
  validateSpanishTaxIdFormat: vi.fn(() => ({
    valid: true,
    normalized: 'B99286320',
    type: 'cif',
  })),
}));

vi.mock('@/lib/integrations/supabase', () => ({
  createServerSupabaseClient: vi.fn(() => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'user-1' } } })) },
  })),
  getSupabaseAdmin: vi.fn(() => ({ from: adminFrom })),
}));

vi.mock('@/lib/utils/rate-limit', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, resetAt: Date.now() + 60_000 })),
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

import { PATCH, POST } from '@/app/api/company/resolve/route';

const suggestion = (name: string) => ({
  name,
  source: 'boe_borme' as const,
  retrievedAt: '2026-09-01T00:00:00.000Z',
  confidence: 'medium' as const,
  warnings: [],
});

describe('/api/company/resolve', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps suggestion IDs aligned when an audit insert fails', async () => {
    const suggestions = [suggestion('FIRST SL'), suggestion('SECOND SL')];
    resolveCompanyData.mockResolvedValue({
      suggestions,
      bestSuggestion: suggestions[0],
      requiresUserConfirmation: true,
    });
    const insertResults = [
      { data: null, error: { message: 'insert failed' } },
      { data: { id: '22222222-2222-4222-8222-222222222222' }, error: null },
    ];
    adminFrom.mockImplementation((table: string) => {
      if (table === 'company_data_suggestions') {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({ single: vi.fn(async () => insertResults.shift()) })),
          })),
        };
      }
      return { insert: vi.fn(() => Promise.resolve({ error: null })) };
    });

    const response = await POST(new NextRequest('http://localhost/api/company/resolve', {
      method: 'POST',
      body: JSON.stringify({ name: 'Demo', country: 'ES' }),
      headers: { 'content-type': 'application/json' },
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      suggestionIds: [null, '22222222-2222-4222-8222-222222222222'],
    });
  });

  it('rejects unsupported countries before resolving', async () => {
    const response = await POST(new NextRequest('http://localhost/api/company/resolve', {
      method: 'POST',
      body: JSON.stringify({ name: 'Demo Ltd', country: 'GB' }),
      headers: { 'content-type': 'application/json' },
    }));
    expect(response.status).toBe(400);
    expect(resolveCompanyData).not.toHaveBeenCalled();
  });

  it('validates UUIDs and reports when no owned row was updated', async () => {
    const invalid = await PATCH(new NextRequest('http://localhost/api/company/resolve', {
      method: 'PATCH',
      body: JSON.stringify({ suggestionId: 'not-a-uuid' }),
      headers: { 'content-type': 'application/json' },
    }));
    expect(invalid.status).toBe(400);

    const query = {
      update: vi.fn(),
      eq: vi.fn(),
      select: vi.fn(),
      maybeSingle: vi.fn(async () => ({ data: null, error: null })),
    };
    query.update.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.select.mockReturnValue(query);
    adminFrom.mockReturnValue(query);

    const missing = await PATCH(new NextRequest('http://localhost/api/company/resolve', {
      method: 'PATCH',
      body: JSON.stringify({ suggestionId: '11111111-1111-4111-8111-111111111111' }),
      headers: { 'content-type': 'application/json' },
    }));
    expect(missing.status).toBe(404);
    expect(query.eq).toHaveBeenCalledWith('profile_id', 'user-1');
  });
});
