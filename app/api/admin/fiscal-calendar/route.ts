import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role,status').eq('id', user.id).single();
  return profile?.status !== 'inactive' && (profile?.role === 'admin' || profile?.role === 'owner') ? admin : null;
}

// GET /api/admin/fiscal-calendar?userId=...&year=2026
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

// Legacy inferred generation is intentionally retired.
// New obligations must come from an Admin-confirmed company fiscal template.
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  return NextResponse.json({
    error: 'La generación por tipo fiscal se ha retirado. Activa plantillas confirmadas desde Cliente 360 · Fiscal.',
    code: 'confirmed_fiscal_template_required',
  }, { status: 410 });
}

// PATCH /api/admin/fiscal-calendar — update single obligation status/notes
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id, status, notes } = await request.json();
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 });
  if (status && !['pending', 'submitted', 'exempt', 'skipped'].includes(status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
  }

  const { data: existing } = await admin
    .from('fiscal_obligations')
    .select('id,obligations_calendar_id')
    .eq('id', id)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: 'Obligación no encontrada' }, { status: 404 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status) updates.status = status;
  if (notes !== undefined) updates.notes = notes;

  const { error } = await admin.from('fiscal_obligations').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });

  if (existing.obligations_calendar_id && status) {
    const operationalStatus = status === 'submitted'
      ? 'completed'
      : status === 'pending'
        ? 'planned'
        : 'cancelled';
    await admin
      .from('obligations_calendar')
      .update({ status: operationalStatus, updated_at: new Date().toISOString() })
      .eq('id', existing.obligations_calendar_id);
  }

  return NextResponse.json({ ok: true });
}
