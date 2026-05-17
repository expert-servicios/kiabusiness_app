import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? admin : null;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    // Fetch all client profiles
    const { data: profiles, error: profErr } = await admin
      .from('profiles')
      .select('id,full_name,phone,whatsapp_number,role,status,created_at')
      .eq('role', 'client')
      .order('created_at', { ascending: false });

    if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });

    const clientIds = (profiles ?? []).map((p) => p.id);
    const authUsers = await admin.auth.admin.listUsers({ perPage: 1000 });
    const emailById = new Map(
      (authUsers.data?.users ?? []).map((u) => [u.id, u.email ?? ''])
    );

    // Parallel: cases count, subscriptions, last WA message
    const [casesRes, subsRes, waRes] = await Promise.all([
      clientIds.length
        ? admin
            .from('cases')
            .select('client_id,state')
            .in('client_id', clientIds)
        : Promise.resolve({ data: [] }),
      clientIds.length
        ? admin
            .from('subscriptions')
            .select('client_id,plan_name,status')
            .in('client_id', clientIds)
            .eq('status', 'active')
        : Promise.resolve({ data: [] }),
      clientIds.length
        ? admin
            .from('whatsapp_conversations')
            .select('client_id,created_at,direction')
            .in('client_id', clientIds)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);

    const casesData   = casesRes.data ?? [];
    const subsData    = subsRes.data  ?? [];
    const waData      = waRes.data    ?? [];

    // Build lookup maps
    const casesByClient  = new Map<string, { total: number; active: number }>();
    for (const c of casesData) {
      const id = c.client_id as string;
      const prev = casesByClient.get(id) ?? { total: 0, active: 0 };
      casesByClient.set(id, {
        total: prev.total + 1,
        active: prev.active + (c.state !== 'cerrado' ? 1 : 0),
      });
    }

    const subByClient = new Map<string, string>(); // user_id → plan
    for (const s of subsData) subByClient.set(s.client_id as string, s.plan_name as string);

    const lastWaByClient = new Map<string, string>(); // user_id → created_at
    for (const w of waData) {
      const id = w.client_id as string;
      if (!lastWaByClient.has(id)) lastWaByClient.set(id, w.created_at as string);
    }

    const clients = (profiles ?? []).map((p) => ({
      id:           p.id,
      full_name:    p.full_name,
      email:        emailById.get(p.id) ?? '',
      phone:        p.phone,
      whatsapp_number: p.whatsapp_number,
      status:       p.status ?? 'active',
      created_at:   p.created_at,
      totalCases:   casesByClient.get(p.id)?.total  ?? 0,
      activeCases:  casesByClient.get(p.id)?.active ?? 0,
      plan:         subByClient.get(p.id) ?? null,
      lastWhatsApp: lastWaByClient.get(p.id) ?? null,
    }));

    return NextResponse.json({ clients });
  } catch (err) {
    console.error('[admin/clientes]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
