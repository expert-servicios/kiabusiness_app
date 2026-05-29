/**
 * GET /api/reports/[id] — returns a single report (ownership enforced)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const admin  = getSupabaseAdmin();

  const { data: report } = await admin
    .from('kia_financial_reports')
    .select('*')
    .eq('id', id)
    .eq('client_id', user.id)
    .single();

  if (!report) return NextResponse.json({ error: 'Informe no encontrado' }, { status: 404 });

  // Mark as viewed
  if (!report.viewed_at) {
    await admin
      .from('kia_financial_reports')
      .update({ viewed_at: new Date().toISOString() })
      .eq('id', id)
      .then(() => null, () => null);
  }

  return NextResponse.json({ report });
}
