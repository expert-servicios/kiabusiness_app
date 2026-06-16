import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin, listAllAuthUsers } from '@/lib/integrations/supabase';

async function getAdminContext(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  }

  const adminSupabase = getSupabaseAdmin();
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'owner') {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 403 }) };
  }

  return { adminSupabase, user };
}

async function countLinkedRows(
  adminSupabase: ReturnType<typeof getSupabaseAdmin>,
  table: string,
  column: string,
  userId: string
) {
  const { count, error } = await adminSupabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(column, userId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function GET(request: NextRequest) {
  try {
    const context = await getAdminContext(request);
    if (context.error) return context.error;
    const { adminSupabase } = context;

    const { data: profiles, error } = await adminSupabase
      .from('profiles')
      .select('id,full_name,phone,role,status,whatsapp_number,whatsapp_consent,created_at')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
    }

    // Enrich with auth email + quote/case counts + companies in parallel
    const [authUsers, quotesResult, casesResult, membershipsResult] = await Promise.all([
      listAllAuthUsers(),
      adminSupabase.from('quotes').select('client_id'),
      adminSupabase.from('cases').select('client_id,state'),
      adminSupabase.from('profile_companies').select('profile_id,role,company:companies(id,razon_social,cif_nif)')
    ]);

    const emailMap = new Map(authUsers.map((u) => [u.id, u.email ?? '']));
    const quoteCounts = new Map<string, number>();
    for (const q of quotesResult.data ?? []) {
      quoteCounts.set(q.client_id, (quoteCounts.get(q.client_id) ?? 0) + 1);
    }
    const caseCounts = new Map<string, number>();
    const activeCaseCounts = new Map<string, number>();
    for (const c of casesResult.data ?? []) {
      caseCounts.set(c.client_id, (caseCounts.get(c.client_id) ?? 0) + 1);
      if (c.state !== 'finalizado') {
        activeCaseCounts.set(c.client_id, (activeCaseCounts.get(c.client_id) ?? 0) + 1);
      }
    }
    const companiesMap = new Map<string, Array<{ id: string; razon_social: string; cif_nif: string | null; role: string }>>();
    for (const m of membershipsResult.data ?? []) {
      const co = (m.company as unknown) as { id: string; razon_social: string; cif_nif: string | null } | null;
      if (!co) continue;
      const list = companiesMap.get(m.profile_id) ?? [];
      list.push({ id: co.id, razon_social: co.razon_social, cif_nif: co.cif_nif, role: m.role });
      companiesMap.set(m.profile_id, list);
    }

    const users = (profiles ?? []).map((p) => ({
      ...p,
      email: emailMap.get(p.id) ?? '',
      totalQuotes: quoteCounts.get(p.id) ?? 0,
      totalCases: caseCounts.get(p.id) ?? 0,
      activeCases: activeCaseCounts.get(p.id) ?? 0,
      companies: companiesMap.get(p.id) ?? []
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const context = await getAdminContext(request);
    if (context.error) return context.error;
    const { adminSupabase, user } = context;

    const body = await request.json();
    const { userId, action } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
    }

    // ── update_role ────────────────────────────────────────────────────────
    if (action === 'update_role' || (!action && body.role)) {
      const role = body.role;
      if (!['admin', 'client'].includes(role)) {
        return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
      }
      const { error } = await adminSupabase
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) return NextResponse.json({ error: 'Error al actualizar rol' }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    // ── update_profile ─────────────────────────────────────────────────────
    if (action === 'update_profile') {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.full_name !== undefined) updates.full_name = body.full_name || null;
      if (body.phone !== undefined) updates.phone = body.phone || null;
      if (body.whatsapp_number !== undefined) updates.whatsapp_number = body.whatsapp_number || null;
      if (Object.keys(updates).length === 1) {
        return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
      }
      const { error } = await adminSupabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
      if (error) return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    // ── toggle_status ──────────────────────────────────────────────────────
    if (action === 'toggle_status') {
      if (userId === user.id) {
        return NextResponse.json({ error: 'No puedes desactivar tu propia cuenta' }, { status: 400 });
      }
      const { data: profile } = await adminSupabase
        .from('profiles').select('status').eq('id', userId).single();
      const newStatus = profile?.status === 'inactive' ? 'active' : 'inactive';
      const { error } = await adminSupabase
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) return NextResponse.json({ error: 'Error al cambiar estado' }, { status: 500 });
      return NextResponse.json({ ok: true, status: newStatus });
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
  } catch (error) {
    console.error('Admin users PATCH error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const context = await getAdminContext(request);
    if (context.error) return context.error;
    const { adminSupabase, user } = context;

    const { userId } = await request.json();
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Usuario no válido' }, { status: 400 });
    }

    if (userId === user.id) {
      return NextResponse.json({ error: 'No puedes eliminar tu propio usuario admin.' }, { status: 400 });
    }

    const { data: targetProfile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id,role,full_name')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: 'No se pudo comprobar el usuario' }, { status: 500 });
    }

    if (!targetProfile) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (targetProfile.role === 'admin') {
      return NextResponse.json(
        { error: 'No se puede eliminar un admin desde esta acción. Cambia primero su rol si procede.' },
        { status: 400 }
      );
    }

    const linkedChecks = await Promise.all([
      countLinkedRows(adminSupabase, 'quotes', 'client_id', userId),
      countLinkedRows(adminSupabase, 'cases', 'client_id', userId),
      countLinkedRows(adminSupabase, 'documents', 'client_id', userId),
      countLinkedRows(adminSupabase, 'review_requests', 'client_id', userId),
      countLinkedRows(adminSupabase, 'reviews', 'client_id', userId),
      countLinkedRows(adminSupabase, 'orders', 'client_id', userId),
      countLinkedRows(adminSupabase, 'subscriptions', 'client_id', userId),
      countLinkedRows(adminSupabase, 'messages', 'sender_id', userId),
      countLinkedRows(adminSupabase, 'profile_companies', 'profile_id', userId),
      countLinkedRows(adminSupabase, 'companies', 'created_by', userId)
    ]);

    const linkedTotal = linkedChecks.reduce((total, count) => total + count, 0);
    if (linkedTotal > 0) {
      return NextResponse.json(
        {
          error:
            'Este usuario tiene datos operativos asociados. Por seguridad no se elimina desde limpieza rápida.'
        },
        { status: 409 }
      );
    }

    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('Admin users DELETE auth error:', deleteError);
      return NextResponse.json({ error: 'No se pudo eliminar el usuario en Auth' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Admin users DELETE error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
