import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { generateFiscalObligations, type ClientType } from '@/lib/utils/fiscal-calendar';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (profile?.role === 'admin' || profile?.role === 'owner') ? admin : null;
}

// GET /api/admin/fiscal-calendar?userId=...&year=2025
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()), 10);

  let query = admin
    .from('fiscal_obligations')
    .select('*')
    .eq('year', year)
    .order('deadline');

  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Error al obtener obligaciones' }, { status: 500 });

  return NextResponse.json({ obligations: data ?? [] });
}

// POST /api/admin/fiscal-calendar — generate obligations for a user/company
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { userId, companyId, clientType, year } = await request.json() as {
    userId: string;
    companyId?: string;
    clientType: ClientType;
    year?: number;
  };

  if (!userId || !clientType) {
    return NextResponse.json({ error: 'userId y clientType requeridos' }, { status: 400 });
  }

  const targetYear = year ?? new Date().getFullYear();
  const obligations = generateFiscalObligations(clientType, targetYear);

  const rows = obligations.map((o) => ({
    user_id: userId,
    company_id: companyId ?? null,
    year: targetYear,
    obligation_key: o.obligation_key,
    modelo: o.modelo,
    description: o.description,
    period_label: o.period_label,
    deadline: o.deadline,
    status: 'pending',
  }));

  const { error } = await admin
    .from('fiscal_obligations')
    .upsert(rows, { onConflict: 'user_id,company_id,year,obligation_key', ignoreDuplicates: true });

  if (error) return NextResponse.json({ error: 'Error al generar obligaciones' }, { status: 500 });

  return NextResponse.json({ ok: true, count: rows.length });
}

// PATCH /api/admin/fiscal-calendar — update single obligation status/notes
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id, status, notes } = await request.json();
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status) updates.status = status;
  if (notes !== undefined) updates.notes = notes;

  const { error } = await admin.from('fiscal_obligations').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
