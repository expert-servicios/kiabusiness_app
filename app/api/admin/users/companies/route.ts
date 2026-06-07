import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (profile?.role === 'admin' || profile?.role === 'owner') ? admin : null;
}

// GET /api/admin/users/companies — list all companies (for the assign modal)
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { data, error } = await admin
    .from('companies')
    .select('id,razon_social,cif_nif,forma_juridica,ciudad')
    .order('razon_social');

  if (error) return NextResponse.json({ error: 'Error al obtener empresas' }, { status: 500 });
  return NextResponse.json({ companies: data ?? [] });
}

// POST /api/admin/users/companies — assign company to user
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { userId, companyId, role = 'owner' } = await request.json();
  if (!userId || !companyId) {
    return NextResponse.json({ error: 'userId y companyId requeridos' }, { status: 400 });
  }

  const { error } = await admin
    .from('profile_companies')
    .upsert({ profile_id: userId, company_id: companyId, role }, { onConflict: 'profile_id,company_id' });

  if (error) return NextResponse.json({ error: 'Error al asignar empresa' }, { status: 500 });

  // Set as active company if user has none
  const { data: prof } = await admin.from('profiles').select('active_company_id').eq('id', userId).single();
  if (!prof?.active_company_id) {
    await admin.from('profiles').update({ active_company_id: companyId }).eq('id', userId);
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/users/companies — remove company from user
export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { userId, companyId } = await request.json();
  if (!userId || !companyId) {
    return NextResponse.json({ error: 'userId y companyId requeridos' }, { status: 400 });
  }

  const { error } = await admin
    .from('profile_companies')
    .delete()
    .eq('profile_id', userId)
    .eq('company_id', companyId);

  if (error) return NextResponse.json({ error: 'Error al quitar empresa' }, { status: 500 });

  // Clear active_company_id if it was this company
  const { data: prof } = await admin.from('profiles').select('active_company_id').eq('id', userId).single();
  if (prof?.active_company_id === companyId) {
    const { data: remaining } = await admin
      .from('profile_companies').select('company_id').eq('profile_id', userId).limit(1);
    await admin.from('profiles')
      .update({ active_company_id: remaining?.[0]?.company_id ?? null })
      .eq('id', userId);
  }

  return NextResponse.json({ ok: true });
}
