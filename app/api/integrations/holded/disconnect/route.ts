import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const bodySchema = z.object({
  integrationId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'integrationId requerido' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Load the integration and verify ownership
    const { data: integration, error: fetchError } = await admin
      .from('client_integrations')
      .select('id,client_id,company_id,status')
      .eq('id', parsed.data.integrationId)
      .single();

    if (fetchError || !integration) {
      return NextResponse.json({ error: 'Integración no encontrada' }, { status: 404 });
    }

    if (integration.status === 'revoked') {
      return NextResponse.json({ ok: true, message: 'Ya estaba desconectada' });
    }

    // Verify the authenticated user owns or belongs to the company
    const ownedByUser = integration.client_id === user.id;
    let ownedByCompany = false;

    if (!ownedByUser && integration.company_id) {
      const { data: membership } = await admin
        .from('profile_companies')
        .select('role')
        .eq('company_id', integration.company_id)
        .eq('profile_id', user.id)
        .single();

      ownedByCompany = !!membership;
    }

    // Also allow admins
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';

    if (!ownedByUser && !ownedByCompany && !isAdmin) {
      return NextResponse.json({ error: 'Sin acceso a esta integración' }, { status: 403 });
    }

    // Delete the secret first (IMP-002: secret lives in a separate table)
    await admin
      .from('client_integration_secrets')
      .delete()
      .eq('integration_id', parsed.data.integrationId);

    // Revoke: mark as revoked (encrypted_api_key column no longer exists)
    const { error: updateError } = await admin
      .from('client_integrations')
      .update({
        status          : 'revoked',
        disconnected_at : new Date().toISOString(),
        updated_at      : new Date().toISOString(),
      })
      .eq('id', parsed.data.integrationId);

    if (updateError) {
      console.error('[holded/disconnect] update error:', updateError.message);
      return NextResponse.json({ error: 'Error al desconectar' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[holded/disconnect] unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
