import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { absoluteAppUrl } from '@/lib/utils/app-url';

async function assertAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await getSupabaseAdmin()
    .from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? user : null;
}

// GET /api/admin/team — list all users with profiles
export async function GET(request: NextRequest) {
  const admin = await assertAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { data: users, error } = await getSupabaseAdmin().auth.admin.listUsers();
  if (error) return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });

  const ids = users.users.map((u) => u.id);
  const { data: profiles } = await getSupabaseAdmin()
    .from('profiles')
    .select('id,full_name,role,avatar_url,created_at')
    .in('id', ids);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const members = users.users.map((u) => ({
    id: u.id,
    email: u.email,
    provider: u.app_metadata?.provider ?? 'email',
    created_at: u.created_at,
    full_name: profileMap[u.id]?.full_name ?? null,
    role: profileMap[u.id]?.role ?? null,
    avatar_url: profileMap[u.id]?.avatar_url ?? null
  }));

  return NextResponse.json({ members });
}

// PATCH /api/admin/team — update role for a user
export async function PATCH(request: NextRequest) {
  const admin = await assertAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { userId, role } = await request.json();
  if (!userId || !['admin', 'collaborator', 'client'].includes(role)) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from('profiles')
    .upsert({ id: userId, role, updated_at: new Date().toISOString() }, { onConflict: 'id' });

  if (error) return NextResponse.json({ error: 'Error al actualizar rol' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// POST /api/admin/team — invite a new user by email
export async function POST(request: NextRequest) {
  const admin = await assertAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { email, role } = await request.json();
  if (!email) return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
  const safeRole = ['admin', 'collaborator', 'client'].includes(role) ? role : 'collaborator';

  const { data: invited, error } = await getSupabaseAdmin().auth.admin.inviteUserByEmail(email, {
    redirectTo: absoluteAppUrl('/dashboard')
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await getSupabaseAdmin()
    .from('profiles')
    .upsert({ id: invited.user.id, role: safeRole, updated_at: new Date().toISOString() }, { onConflict: 'id' });

  return NextResponse.json({ ok: true, userId: invited.user.id });
}
