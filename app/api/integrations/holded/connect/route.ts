import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { encryptSecret, keyLast4 } from '@/lib/security/encryption';
import { isEncryptionConfigured, createHoldedClientFromRawKey, type HoldedPermissions } from '@/lib/integrations/holded/holded-client';
import { holdedErrorMessage } from '@/lib/integrations/holded/holded-errors';

const bodySchema = z.object({
  apiKey    : z.string().min(8).max(256).trim(),
  companyId : z.string().uuid().optional(),
});

const SAFE_COLUMNS = 'id,provider,mode,api_key_last4,permissions_detected,status,sync_mode,last_sync_at,last_success_at,last_error,created_at,updated_at';

export async function POST(request: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // ── Encryption guard ──────────────────────────────────────────────────────
    if (!isEncryptionConfigured()) {
      console.error('[holded/connect] SECRET_ENCRYPTION_KEY not configured — refusing connection');
      return NextResponse.json(
        { error: 'El servidor no está configurado para almacenar claves de forma segura. Contacta con el administrador.' },
        { status: 503 }
      );
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'API key inválida' }, { status: 400 });
    }

    const { apiKey, companyId: bodyCompanyId } = parsed.data;

    // ── Resolve company ───────────────────────────────────────────────────────
    const { data: profile } = await getSupabaseAdmin()
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    const companyId = bodyCompanyId ?? profile?.active_company_id ?? null;

    // Verify the user belongs to this company (if company-scoped)
    if (companyId) {
      const { data: membership } = await getSupabaseAdmin()
        .from('profile_companies')
        .select('role')
        .eq('company_id', companyId)
        .eq('profile_id', user.id)
        .single();

      if (!membership) {
        return NextResponse.json({ error: 'No tienes acceso a esta empresa' }, { status: 403 });
      }
    }

    // ── Test connection before saving ─────────────────────────────────────────
    const client = createHoldedClientFromRawKey(apiKey);
    let testResult: { ok: boolean; permissions: HoldedPermissions; warnings: string[] };
    try {
      testResult = await client.testConnection();
    } catch (err) {
      return NextResponse.json(
        { error: `No se pudo conectar con Holded: ${holdedErrorMessage(err)}` },
        { status: 502 }
      );
    }

    if (!testResult.ok) {
      return NextResponse.json(
        { error: 'La API key de Holded no es válida o no tiene permisos suficientes', warnings: testResult.warnings },
        { status: 422 }
      );
    }

    // ── Encrypt and persist ───────────────────────────────────────────────────
    const encryptedApiKey = encryptSecret(apiKey);
    const last4 = keyLast4(apiKey);

    const admin = getSupabaseAdmin();

    // Upsert: one active integration per (company|client, provider)
    const existing = await admin
      .from('client_integrations')
      .select('id')
      .eq('provider', 'holded')
      .neq('status', 'revoked')
      .eq(companyId ? 'company_id' : 'client_id', companyId ?? user.id)
      .maybeSingle();

    const now = new Date().toISOString();
    const upsertPayload = {
      provider            : 'holded',
      mode                : 'client_account',
      encrypted_api_key   : encryptedApiKey,
      api_key_last4       : last4,
      permissions_detected: testResult.permissions,
      status              : 'active',
      sync_mode           : 'read_only',
      last_success_at     : now,
      last_error          : null,
      connected_by        : user.id,
      disconnected_at     : null,
      updated_at          : now,
      ...(companyId ? { company_id: companyId } : { client_id: user.id }),
    };

    if (existing.data?.id) {
      const { data: updated, error: updateError } = await admin
        .from('client_integrations')
        .update(upsertPayload)
        .eq('id', existing.data.id)
        .select(SAFE_COLUMNS)
        .single();

      if (updateError || !updated) {
        console.error('[holded/connect] update error:', updateError?.message);
        return NextResponse.json({ error: 'Error actualizando integración' }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        integration: updated,
        warnings: testResult.warnings,
      });
    } else {
      const { data: inserted, error: insertError } = await admin
        .from('client_integrations')
        .insert({ ...upsertPayload, created_at: now })
        .select(SAFE_COLUMNS)
        .single();

      if (insertError || !inserted) {
        console.error('[holded/connect] insert error:', insertError?.message);
        return NextResponse.json({ error: 'Error guardando integración' }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        integration: inserted,
        warnings: testResult.warnings,
      });
    }
  } catch (err) {
    console.error('[holded/connect] unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
