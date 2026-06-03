import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

// Lightweight client list for use in selectors/dropdowns.
// Returns only id, name, email — much faster than /api/admin/clientes.
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

  // Fetch profiles + auth emails in parallel
  const [profilesRes, authRes] = await Promise.all([
    admin
      .from('profiles')
      .select('id, full_name, email, phone')
      .eq('role', 'client')
      .eq('status', 'active')
      .order('full_name', { ascending: true })
      .limit(200),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const authEmailById = new Map(
    (authRes.data?.users ?? []).map((u) => [u.id, u.email ?? ''])
  );

  const clients = (profilesRes.data ?? []).map((p) => ({
    id: p.id,
    name: p.full_name ?? null,
    email: p.email ?? authEmailById.get(p.id) ?? '',
    phone: p.phone ?? null,
  })).filter((c) => c.email);

  // Filter if query provided
  const filtered = q
    ? clients.filter((c) =>
        (c.name ?? '').toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      )
    : clients;

  return NextResponse.json({ clients: filtered.slice(0, 50) });
}
