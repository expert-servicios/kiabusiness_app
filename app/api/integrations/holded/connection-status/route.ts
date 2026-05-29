/**
 * GET /api/integrations/holded/connection-status
 *
 * Called by the Holded MCP server to check if a user has an active
 * Claude connection. Server-to-server — not exposed to the public.
 *
 * Query params:
 *   userId   — the MCP server's internal user ID (mcp_user_id in our DB)
 *   channel  — always 'claude' from the MCP server
 *
 * Returns: { ok: true, active: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { validateMcpSharedSecret } from '@/lib/integrations/holded-mcp/mcp-auth';

export async function GET(request: NextRequest) {
  if (!validateMcpSharedSecret(request.headers.get('x-expert-shared-secret'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId  = searchParams.get('userId');
  const channel = searchParams.get('channel') ?? 'claude';

  if (!userId) {
    return NextResponse.json({ ok: false, error: 'userId requerido' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data } = await admin
    .from('holded_mcp_connections')
    .select('id, status')
    .eq('mcp_user_id', userId)
    .eq('channel', channel)
    .neq('status', 'revoked')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const active = data?.status === 'connected';
  return NextResponse.json({ ok: true, active });
}
