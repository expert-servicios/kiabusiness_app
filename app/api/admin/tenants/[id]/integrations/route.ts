import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { encryptSecret, decryptSecret } from '@/lib/security/encryption';

async function assertAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'owner'].includes(profile?.role ?? '')) return null;
  return user;
}

// GET — returns integration status (key masked, not decrypted)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await assertAdmin(request)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id: tenantId } = await params;
    const admin = getSupabaseAdmin();

    const { data } = await admin
      .from('tenant_integration_secrets')
      .select('integration, meta, updated_at')
      .eq('tenant_id', tenantId);

    const integrations = (data ?? []).map((row) => ({
      integration: row.integration,
      configured: true,
      meta: row.meta,
      updated_at: row.updated_at,
    }));

    return NextResponse.json({ integrations });
  } catch (err) {
    console.error('[tenant integrations GET]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST — save or update an integration secret
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await assertAdmin(request)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id: tenantId } = await params;
    const body = await request.json() as {
      integration: string;
      secret: string;
      meta?: Record<string, unknown>;
    };

    if (!body.integration || !body.secret?.trim()) {
      return NextResponse.json({ error: 'integration y secret son obligatorios' }, { status: 400 });
    }

    const encrypted = encryptSecret(body.secret.trim());
    const admin = getSupabaseAdmin();

    const { error } = await admin
      .from('tenant_integration_secrets')
      .upsert(
        {
          tenant_id: tenantId,
          integration: body.integration,
          encrypted_secret: encrypted,
          meta: body.meta ?? {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,integration' }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[tenant integrations POST]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// DELETE — remove an integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await assertAdmin(request)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id: tenantId } = await params;
    const { searchParams } = new URL(request.url);
    const integration = searchParams.get('integration');
    if (!integration) return NextResponse.json({ error: 'integration requerido' }, { status: 400 });

    const admin = getSupabaseAdmin();
    await admin
      .from('tenant_integration_secrets')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('integration', integration);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[tenant integrations DELETE]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// Helper exported for internal use: decrypt a tenant integration secret
export async function getTenantSecret(
  tenantId: string,
  integration: string
): Promise<string | null> {
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from('tenant_integration_secrets')
      .select('encrypted_secret')
      .eq('tenant_id', tenantId)
      .eq('integration', integration)
      .single();
    if (!data) return null;
    return decryptSecret(data.encrypted_secret);
  } catch {
    return null;
  }
}
