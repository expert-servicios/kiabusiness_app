/**
 * GET /api/reports — lists the current user's reports (last 10)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: reports } = await getSupabaseAdmin()
    .from('kia_financial_reports')
    .select('id, report_type, period, title, generated_by, viewed_at, created_at')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return NextResponse.json({ reports: reports ?? [] });
}
