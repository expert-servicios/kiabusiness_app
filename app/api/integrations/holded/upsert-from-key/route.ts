/**
 * POST /api/integrations/holded/upsert-from-key
 *
 * Called by the Holded MCP consent screen when the user submits their
 * email + Holded API key (standalone mode, no OAuth bridge).
 *
 * Flow:
 *   1. Validate shared secret
 *   2. Validate Holded API key (probe Holded API)
 *   3. Find existing Supabase user by email (or note as unregistered)
 *   4. Encrypt and store API key in holded_mcp_connections
 *   5. Record legal acceptance timestamp
 *   6. Return { ok, userId, tenantId, connectionId, status, legalAcceptedAt }
 *
 * Auth: x-expert-shared-secret header
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { validateMcpSharedSecret } from '@/lib/integrations/holded-mcp/mcp-auth';
import { encryptSecret } from '@/lib/security/encryption';
import { isEncryptionConfigured, createHoldedClientFromRawKey } from '@/lib/integrations/holded/holded-client';
import { holdedErrorMessage } from '@/lib/integrations/holded/holded-errors';

const bodySchema = z.object({
  personalEmail  : z.string().email().max(320),
  holdedApiKey   : z.string().min(8).max(256).trim(),
  channel        : z.enum(['claude', 'chatgpt', 'dashboard', 'mobile']).default('claude'),
  source         : z.string().max(100).optional(),
  acceptedTerms  : z.boolean(),
  acceptedPrivacy: z.boolean(),
});

export async function POST(request: NextRequest) {
  if (!validateMcpSharedSecret(request.headers.get('x-expert-shared-secret'))) {
    return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
  }

  if (!isEncryptionConfigured()) {
    return NextResponse.json({ ok: false, reason: 'persist_failed', detail: 'Encryption not configured' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_input' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: 'invalid_input', detail: parsed.error.flatten() }, { status: 400 });
  }

  const { personalEmail, holdedApiKey, channel, source, acceptedTerms, acceptedPrivacy } = parsed.data;

  // Legal acceptance is required
  if (!acceptedTerms || !acceptedPrivacy) {
    return NextResponse.json({ ok: false, reason: 'legal_acceptance_required' }, { status: 422 });
  }

  // ── 1. Probe Holded API key ───────────────────────────────────────────────
  const client = createHoldedClientFromRawKey(holdedApiKey);
  try {
    const testResult = await client.testConnection();
    if (!testResult.ok) {
      return NextResponse.json({ ok: false, reason: 'invalid_api_key' }, { status: 422 });
    }
  } catch (err) {
    const msg = holdedErrorMessage(err);
    return NextResponse.json({ ok: false, reason: 'probe_failed', detail: msg }, { status: 502 });
  }

  const admin          = getSupabaseAdmin();
  const now            = new Date().toISOString();
  const encryptedKey   = encryptSecret(holdedApiKey);

  // ── 2. Find existing Supabase user by email ──────────────────────────────
  // Supabase admin API doesn't expose getUserByEmail — use listUsers + filter.
  // Users not yet registered on EXPERT get supabaseUserId=null; linked on first login.
  let supabaseUserId: string | null = null;
  try {
    const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const found = listData?.users?.find(u => u.email === personalEmail);
    supabaseUserId = found?.id ?? null;
  } catch {
    // Non-fatal — connection still saved, user linked on first EXPERT login
  }

  // ── 3. Upsert holded_mcp_connections ─────────────────────────────────────
  const existingRow = await admin
    .from('holded_mcp_connections')
    .select('id, mcp_user_id')
    .eq('email', personalEmail)
    .eq('channel', channel)
    .maybeSingle();

  const mcpUserId = existingRow.data?.mcp_user_id ?? crypto.randomUUID();

  const connectionPayload = {
    mcp_user_id        : mcpUserId,
    supabase_user_id   : supabaseUserId,
    email              : personalEmail,
    channel,
    source             : source ?? null,
    encrypted_api_key  : encryptedKey,
    status             : 'connected' as const,
    legal_accepted_at  : now,
    terms_accepted     : acceptedTerms,
    privacy_accepted   : acceptedPrivacy,
    last_activity_at   : now,
    updated_at         : now,
  };

  let connectionId: string;

  if (existingRow.data?.id) {
    connectionId = existingRow.data.id;
    const { error } = await admin
      .from('holded_mcp_connections')
      .update({ ...connectionPayload })
      .eq('id', connectionId);

    if (error) {
      console.error('[upsert-from-key] update error:', error.message);
      return NextResponse.json({ ok: false, reason: 'persist_failed' }, { status: 500 });
    }
  } else {
    const { data: inserted, error } = await admin
      .from('holded_mcp_connections')
      .insert({ ...connectionPayload, created_at: now })
      .select('id')
      .single();

    if (error || !inserted) {
      console.error('[upsert-from-key] insert error:', error?.message);
      return NextResponse.json({ ok: false, reason: 'persist_failed' }, { status: 500 });
    }
    connectionId = inserted.id;
  }

  // ── 4. Also update client_integrations if user exists in Supabase ─────────
  if (supabaseUserId) {
    await admin.from('client_integrations').upsert({
      provider         : 'holded',
      mode             : 'client_account',
      channel          : channel,
      client_id        : supabaseUserId,
      status           : 'active',
      sync_mode        : 'read_only',
      last_success_at  : now,
      connected_by     : supabaseUserId,
      updated_at       : now,
      consent_at       : now,
      consent_version  : '1.0',
    }, { onConflict: 'provider,client_id' }).then(() => null, () => null);
  }

  return NextResponse.json({
    ok            : true,
    userId        : mcpUserId,
    tenantId      : supabaseUserId ?? mcpUserId,
    connectionId,
    status        : 'connected',
    legalAcceptedAt: now,
  });
}
