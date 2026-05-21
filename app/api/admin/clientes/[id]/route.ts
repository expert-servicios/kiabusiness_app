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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id } = await params;

    const [profileRes, authRes, casesRes, subsRes, quotesRes, waRes, companiesRes] = await Promise.all([
      admin.from('profiles').select('id,full_name,phone,whatsapp_number,role,status,created_at').eq('id', id).single(),
      admin.auth.admin.getUserById(id),
      admin.from('cases').select('id,service,category,state,opened_at,closed_at,admin_note').eq('client_id', id).order('opened_at', { ascending: false }),
      admin.from('subscriptions').select('id,plan_name,status,current_period_end,stripe_subscription_id').eq('client_id', id).order('created_at', { ascending: false }),
      admin.from('quotes').select('id,title,status,amount_eur,created_at').eq('client_id', id).order('created_at', { ascending: false }).limit(10),
      admin.from('whatsapp_conversations').select('id,direction,body,created_at,needs_review,ai_responded,media_type').eq('client_id', id).order('created_at', { ascending: false }).limit(8),
      admin.from('profile_companies').select('company:companies(id,razon_social,cif_nif,direccion)').eq('profile_id', id).limit(3),
    ]);

    if (profileRes.error || !profileRes.data) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      profile:   { ...profileRes.data, email: authRes.data.user?.email ?? '' },
      cases:     casesRes.data    ?? [],
      subs:      (subsRes.data ?? []).map((sub) => ({ ...sub, plan: sub.plan_name })),
      quotes:    (quotesRes.data ?? []).map((quote) => ({ ...quote, service: quote.title })),
      messages:  waRes.data       ?? [],
      companies: (companiesRes.data ?? []).flatMap((row) => {
        const company = Array.isArray(row.company) ? row.company[0] : row.company;
        return company ? [{
          id: company.id,
          name: company.razon_social,
          nif: company.cif_nif,
          address: company.direccion
        }] : [];
      }),
    });
  } catch (err) {
    console.error('[admin/clientes/[id]]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = createServerSupabaseClient(_request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const adminClient = getSupabaseAdmin();
    const { data: me } = await adminClient.from('profiles').select('role').eq('id', user.id).single();
    if (me?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id } = await params;

    // Guard: do not delete other admins
    const { data: target } = await adminClient.from('profiles').select('role').eq('id', id).single();
    if (target?.role === 'admin') {
      return NextResponse.json({ error: 'No puedes eliminar un administrador' }, { status: 403 });
    }

    // Soft-delete: set status to inactive and clear sensitive fields
    const { error } = await adminClient
      .from('profiles')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/clientes/[id] DELETE]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();

    const allowed = ['full_name', 'phone', 'whatsapp_number', 'status'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Sin campos a actualizar' }, { status: 400 });
    }

    const { data, error } = await admin.from('profiles').update(update).eq('id', id).select('id,full_name,phone,whatsapp_number,status').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ profile: data });
  } catch (err) {
    console.error('[admin/clientes/[id] PATCH]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
