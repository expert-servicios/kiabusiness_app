import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const patchSchema = z.object({
  status: z.enum(['pending', 'active', 'failed', 'revoked', 'disabled']).optional(),
  sync_mode: z.enum(['read_only', 'read_write']).optional(),
}).refine((data) => data.status !== undefined || data.sync_mode !== undefined, {
  message: 'Sin campos a actualizar',
});

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? admin : null;
}

async function integrationBelongsToClient(admin: ReturnType<typeof getSupabaseAdmin>, clientId: string, integrationId: string) {
  const { data: integration, error } = await admin
    .from('client_integrations')
    .select('id, client_id, company_id')
    .eq('id', integrationId)
    .eq('provider', 'holded')
    .maybeSingle();

  if (error || !integration) return false;
  if (integration.client_id === clientId) return true;
  if (!integration.company_id) return false;

  const { data: link } = await admin
    .from('profile_companies')
    .select('profile_id')
    .eq('profile_id', clientId)
    .eq('company_id', integration.company_id)
    .maybeSingle();

  return Boolean(link);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; integrationId: string }> },
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id, integrationId } = await params;
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
    }

    const belongs = await integrationBelongsToClient(admin, id, integrationId);
    if (!belongs) return NextResponse.json({ error: 'Integración no vinculada a este cliente' }, { status: 404 });

    const now = new Date().toISOString();
    const update: Record<string, unknown> = { ...parsed.data, updated_at: now };
    if (parsed.data.status === 'active') {
      update.disconnected_at = null;
      update.last_error = null;
    }
    if (parsed.data.status === 'disabled' || parsed.data.status === 'revoked') {
      update.disconnected_at = now;
    }
    const { data, error } = await admin
      .from('client_integrations')
      .update(update)
      .eq('id', integrationId)
      .eq('provider', 'holded')
      .select('id,provider,status,sync_mode,last_error,updated_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, integration: data });
  } catch (error) {
    console.error('[admin/clientes/integrations PATCH]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; integrationId: string }> },
) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id, integrationId } = await params;
    const belongs = await integrationBelongsToClient(admin, id, integrationId);
    if (!belongs) return NextResponse.json({ error: 'Integración no vinculada a este cliente' }, { status: 404 });

    const { error } = await admin
      .from('client_integrations')
      .update({ status: 'disabled', disconnected_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', integrationId)
      .eq('provider', 'holded');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[admin/clientes/integrations DELETE]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
