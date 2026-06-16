import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin, listAllAuthUsers } from '@/lib/integrations/supabase';
import { assignTenantToUser } from '@/lib/auth/tenant';

async function assertAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'owner'].includes(profile?.role ?? '')) return null;
  return user;
}

// Assign an existing user to this tenant and set role = tenant_admin
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await assertAdmin(request)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id: tenantId } = await params;
    const body = await request.json() as { email: string };

    if (!body.email?.trim()) {
      return NextResponse.json({ error: 'Email es obligatorio' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Find user by email in auth
    const users = await listAllAuthUsers();
    const authUser = users.find((u) => u.email?.toLowerCase() === body.email.trim().toLowerCase());
    if (!authUser) {
      return NextResponse.json(
        { error: 'No existe ningún usuario con ese email. Invítalo primero desde /admin/equipo.' },
        { status: 404 }
      );
    }

    const { error: assignErr } = await assignTenantToUser(authUser.id, tenantId);
    if (assignErr) return NextResponse.json({ error: assignErr }, { status: 400 });

    // Set role to tenant_admin
    await admin.from('profiles').update({ role: 'tenant_admin' }).eq('id', authUser.id);

    return NextResponse.json({ ok: true, userId: authUser.id });
  } catch (err) {
    console.error('[admin/tenants/[id]/users POST]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// Remove a user from this tenant (set tenant_id = null, revert to client role)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await assertAdmin(request)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id: tenantId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId es obligatorio' }, { status: 400 });

    const admin = getSupabaseAdmin();

    // Verify the user belongs to this tenant before removing
    const { data: profile } = await admin
      .from('profiles')
      .select('tenant_id')
      .eq('id', userId)
      .single();

    if (profile?.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'El usuario no pertenece a este tenant' }, { status: 400 });
    }

    await admin
      .from('profiles')
      .update({ tenant_id: null, role: 'client' })
      .eq('id', userId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/tenants/[id]/users DELETE]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
