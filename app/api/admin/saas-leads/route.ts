import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return null;
  return admin;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = Number(url.searchParams.get('limit') ?? '100');

    let query = admin
      .from('saas_leads')
      .select('id,name,email,phone,company_name,client_count_range,current_tools,operational_problem,pilot_interest,status,source,created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ leads: data ?? [] });
  } catch (error) {
    console.error('[admin/saas-leads] GET error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const body = await request.json();
    const allowed = ['new', 'contacted', 'qualified', 'rejected'];
    if (!allowed.includes(body.status)) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
    }

    const { error } = await admin
      .from('saas_leads')
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[admin/saas-leads] PATCH error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
