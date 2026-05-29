/**
 * POST /api/integrations/holded/connector-event
 *
 * Receives operational events from the Holded MCP server (fire-and-forget).
 * Auth: x-expert-shared-secret header (HOLDED_MCP_SHARED_SECRET env var).
 *
 * Event types:
 *   first_activity        — first tool used after connecting
 *   invoice_draft_created — draft invoice created via Claude
 *   auth_failures_burst   — repeated auth failures (security alert)
 *   revoked_by_user       — user disconnected from Claude side
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { validateMcpSharedSecret } from '@/lib/integrations/holded-mcp/mcp-auth';

// ── Event schemas ─────────────────────────────────────────────────────────────

const baseSchema = z.object({
  userId      : z.string().optional(),
  tenantId    : z.string().optional(),
  userEmail   : z.string().email().optional(),
  channel     : z.enum(['dashboard', 'chatgpt', 'mobile', 'claude']),
  detectedAt  : z.string().datetime().optional(),
});

const eventSchema = z.discriminatedUnion('type', [
  baseSchema.extend({
    type    : z.literal('first_activity'),
    toolUsed: z.string().nullable().optional(),
  }),
  baseSchema.extend({
    type        : z.literal('invoice_draft_created'),
    draftId     : z.string().nullable().optional(),
    draftNumber : z.string().nullable().optional(),
    contactName : z.string().nullable().optional(),
    total       : z.number().nullable().optional(),
    currency    : z.string().nullable().optional(),
  }),
  baseSchema.extend({
    type          : z.literal('auth_failures_burst'),
    userName      : z.string().nullable().optional(),
    failureCount  : z.number(),
    windowMinutes : z.number(),
  }),
  baseSchema.extend({
    type: z.literal('revoked_by_user'),
  }),
]);

// ── Handler ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!validateMcpSharedSecret(request.headers.get('x-expert-shared-secret'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Evento inválido', details: parsed.error.flatten() }, { status: 400 });
  }

  const event = parsed.data;
  const admin  = getSupabaseAdmin();
  const now    = event.detectedAt ?? new Date().toISOString();

  // ── Log every event for admin auditability ────────────────────────────────
  await admin.from('holded_mcp_events').insert({
    event_type  : event.type,
    channel     : event.channel,
    user_id_mcp : event.userId ?? null,
    tenant_id   : event.tenantId ?? null,
    user_email  : event.userEmail ?? null,
    payload     : event as unknown as Record<string, unknown>,
    detected_at : now,
  }).then(() => null, () => null);

  // ── Per-event side effects ────────────────────────────────────────────────

  if (event.type === 'revoked_by_user' && event.userId) {
    // Mark their MCP connection as revoked in the registry
    await admin
      .from('holded_mcp_connections')
      .update({ status: 'revoked', revoked_at: now })
      .eq('mcp_user_id', event.userId)
      .eq('channel', event.channel)
      .then(() => null, () => null);
  }

  if (event.type === 'auth_failures_burst') {
    // Persist a security alert — admin dashboard picks these up
    await admin.from('security_alerts').insert({
      alert_type  : 'holded_mcp_auth_burst',
      user_email  : event.userEmail ?? null,
      detail      : {
        channel       : event.channel,
        failureCount  : event.failureCount,
        windowMinutes : event.windowMinutes,
        userName      : event.userName,
      },
      created_at  : now,
    }).then(() => null, () => null);
  }

  if (event.type === 'invoice_draft_created' && event.userId) {
    // Update last activity timestamp on the MCP connection
    await admin
      .from('holded_mcp_connections')
      .update({ last_activity_at: now, last_tool_used: 'create_invoice_draft' })
      .eq('mcp_user_id', event.userId)
      .then(() => null, () => null);
  }

  if (event.type === 'first_activity' && event.userId) {
    await admin
      .from('holded_mcp_connections')
      .update({ last_activity_at: now, last_tool_used: event.toolUsed ?? null })
      .eq('mcp_user_id', event.userId)
      .then(() => null, () => null);
  }

  return NextResponse.json({ ok: true });
}
