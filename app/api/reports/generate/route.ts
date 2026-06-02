/**
 * POST /api/reports/generate
 * Generates a company status report for the current user.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { generateCompanyReport } from '@/lib/reports/report-generator';

const bodySchema = z.object({
  period     : z.string().max(20).optional(),
  lang       : z.enum(['es', 'ru']).default('es'),
  generatedBy: z.enum(['kia', 'admin', 'user']).default('user'),
  clientId   : z.string().uuid().optional(), // admin override
});

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { body = {}; }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const { period, lang, generatedBy, clientId: adminClientId } = parsed.data;
  const admin    = getSupabaseAdmin();

  if (adminClientId && adminClientId !== user.id) {
    const { data: actorProfile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (actorProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
  }

  const clientId = adminClientId ?? user.id;

  // Resolve company
  const { data: profile } = await admin
    .from('profiles').select('active_company_id').eq('id', clientId).single();
  const companyId = profile?.active_company_id ?? null;

  // Find active Holded integration
  let query = admin
    .from('client_integrations')
    .select('id')
    .eq('provider', 'holded')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1);
  query = companyId ? query.eq('company_id', companyId) : query.eq('client_id', clientId);
  const { data: intRow } = await query.maybeSingle();

  if (!intRow?.id) {
    return NextResponse.json(
      { error: 'Holded no está conectado. Conecta Holded para generar informes.', code: 'holded_not_connected' },
      { status: 422 }
    );
  }

  try {
    const result = await generateCompanyReport({
      clientId,
      companyId,
      integrationId: intRow.id,
      period,
      lang,
      generatedBy,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[reports/generate]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Error generando el informe' }, { status: 500 });
  }
}
