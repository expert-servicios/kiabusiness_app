import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { createTenant } from '@/lib/auth/tenant';

async function assertAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'owner'].includes(profile?.role ?? '')) return null;
  return user;
}

export async function GET(request: NextRequest) {
  try {
    if (!await assertAdmin(request)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const admin = getSupabaseAdmin();
    const { data: tenants, error } = await admin
      .from('tenants')
      .select('id, slug, name, domain, plan, active, created_at')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Count users per tenant
    const tenantIds = (tenants ?? []).map((t) => t.id);
    const userCounts: Record<string, number> = {};
    if (tenantIds.length > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('tenant_id')
        .in('tenant_id', tenantIds);
      for (const p of (profiles ?? [])) {
        if (p.tenant_id) userCounts[p.tenant_id] = (userCounts[p.tenant_id] ?? 0) + 1;
      }
    }

    const result = (tenants ?? []).map((t) => ({ ...t, user_count: userCounts[t.id] ?? 0 }));
    return NextResponse.json({ tenants: result });
  } catch (err) {
    console.error('[admin/tenants GET]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await assertAdmin(request)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json() as {
      name: string;
      slug: string;
      domain?: string;
      plan?: 'starter' | 'pro' | 'enterprise';
    };

    if (!body.name?.trim() || !body.slug?.trim()) {
      return NextResponse.json({ error: 'Nombre y slug son obligatorios' }, { status: 400 });
    }
    if (!/^[a-z0-9-]+$/.test(body.slug)) {
      return NextResponse.json(
        { error: 'El slug solo puede contener letras minúsculas, números y guiones' },
        { status: 400 }
      );
    }

    const { tenant, error } = await createTenant({
      slug: body.slug.trim(),
      name: body.name.trim(),
      domain: body.domain?.trim() || undefined,
      plan: body.plan ?? 'starter',
    });

    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json({ tenant }, { status: 201 });
  } catch (err) {
    console.error('[admin/tenants POST]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
