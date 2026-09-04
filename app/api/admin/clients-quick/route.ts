import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin, listAllAuthUsers } from '@/lib/integrations/supabase';

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'owner') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toLowerCase() ?? '';

  const [profilesRes, authRes] = await Promise.all([
    admin
      .from('profiles')
      .select('id, full_name, email, phone')
      .eq('role', 'client')
      .eq('status', 'active')
      .order('full_name', { ascending: true })
      .limit(200),
    listAllAuthUsers(),
  ]);

  const authEmailById = new Map(authRes.map((u) => [u.id, u.email ?? '']));
  const baseClients = (profilesRes.data ?? []).map((p) => ({
    id: p.id,
    name: p.full_name ?? null,
    email: p.email ?? authEmailById.get(p.id) ?? '',
    phone: p.phone ?? null,
  })).filter((c) => c.email);

  const filtered = q
    ? baseClients.filter((c) =>
        (c.name ?? '').toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      )
    : baseClients;
  const visible = filtered.slice(0, 50);
  const visibleIds = visible.map((c) => c.id);

  const companiesByProfile = new Map<string, Array<{ id: string; name: string; taxId: string | null; formaJuridica: string }>>();
  if (visibleIds.length) {
    const { data: memberships, error: membershipsError } = await admin
      .from('profile_companies')
      .select('profile_id,company_id,company:companies(id,razon_social,cif_nif,forma_juridica)')
      .in('profile_id', visibleIds);

    if (membershipsError) {
      return NextResponse.json({ error: 'No se pudieron cargar las entidades de los clientes' }, { status: 500 });
    }

    for (const membership of memberships ?? []) {
      const raw = membership.company;
      const company = Array.isArray(raw) ? raw[0] : raw;
      if (!company) continue;
      const list = companiesByProfile.get(membership.profile_id) ?? [];
      list.push({
        id: membership.company_id,
        name: company.razon_social,
        taxId: company.cif_nif ?? null,
        formaJuridica: company.forma_juridica,
      });
      companiesByProfile.set(membership.profile_id, list);
    }
  }

  return NextResponse.json({
    clients: visible.map((client) => ({
      ...client,
      companies: companiesByProfile.get(client.id) ?? [],
    })),
  });
}