import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { z } from 'zod';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? admin : null;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const clientIdFilter = searchParams.get('clientId');

    let query = admin
      .from('cases')
      .select('id,category,service,state,opened_at,closed_at,client_id,admin_note,docs_checklist')
      .order('opened_at', { ascending: false });

    if (clientIdFilter) query = query.eq('client_id', clientIdFilter);

    const { data: cases, error } = await query;

    if (error) return NextResponse.json({ error: 'Error al obtener expedientes' }, { status: 500 });

    // Fetch client profiles in bulk
    const clientIds = [...new Set((cases ?? []).map((c) => c.client_id).filter(Boolean))];
    const profileMap: Record<string, { full_name: string | null; email: string }> = {};

    if (clientIds.length > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id,full_name')
        .in('id', clientIds);

      await Promise.all(
        clientIds.map(async (id) => {
          const { data: authUser } = await admin.auth.admin.getUserById(id);
          const prof = profiles?.find((p) => p.id === id);
          profileMap[id] = {
            full_name: prof?.full_name ?? null,
            email: authUser?.user?.email ?? ''
          };
        })
      );
    }

    const enriched = (cases ?? []).map((c) => ({
      ...c,
      client: profileMap[c.client_id] ?? { full_name: null, email: '' }
    }));

    return NextResponse.json({ cases: enriched });
  } catch (err) {
    console.error('[admin/cases GET]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

const createCaseSchema = z.object({
  client_id: z.string().uuid(),
  service:   z.string().min(1).max(200),
  category:  z.string().min(1).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const body = await request.json();
    const parsed = createCaseSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

    const { client_id, service, category } = parsed.data;

    const { data: newCase, error } = await admin
      .from('cases')
      .insert({ client_id, service, category, state: 'pendiente', opened_at: new Date().toISOString() })
      .select('id,service,state,category')
      .single();

    if (error) {
      console.error('[admin/cases POST]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ case: newCase }, { status: 201 });
  } catch (err) {
    console.error('[admin/cases POST]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
