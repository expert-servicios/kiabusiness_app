import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

async function assertAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'owner'].includes(profile?.role ?? '')) return null;
  return user;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await assertAdmin(request)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const admin = getSupabaseAdmin();

    const [tenantResult, profilesResult] = await Promise.all([
      admin.from('tenants').select('*').eq('id', id).single(),
      admin.from('profiles').select('id, full_name, role, created_at').eq('tenant_id', id).order('created_at'),
    ]);

    if (tenantResult.error || !tenantResult.data) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    // Enrich profiles with auth email
    const users = await Promise.all(
      (profilesResult.data ?? []).map(async (profile) => {
        const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
        return {
          ...profile,
          email: authUser?.user?.email ?? null,
        };
      })
    );

    return NextResponse.json({ tenant: tenantResult.data, users });
  } catch (err) {
    console.error('[admin/tenants/[id] GET]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await assertAdmin(request)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json() as {
      name?: string;
      domain?: string | null;
      plan?: 'starter' | 'pro' | 'enterprise';
      active?: boolean;
      settings?: Record<string, unknown>;
    };

    const admin = getSupabaseAdmin();
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined)     update.name     = body.name.trim();
    if (body.domain !== undefined)   update.domain   = body.domain?.trim() || null;
    if (body.plan !== undefined)     update.plan     = body.plan;
    if (body.active !== undefined)   update.active   = body.active;
    if (body.settings !== undefined) update.settings = body.settings;

    const { data, error } = await admin
      .from('tenants')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tenant: data });
  } catch (err) {
    console.error('[admin/tenants/[id] PATCH]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
