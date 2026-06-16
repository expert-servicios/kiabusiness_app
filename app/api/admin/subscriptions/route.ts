import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin, listAllAuthUsers } from '@/lib/integrations/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const adminSupabase = getSupabaseAdmin();
    const { data: profile } = await adminSupabase
      .from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin' && profile?.role !== 'owner') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { data: subscriptions, error } = await adminSupabase
      .from('subscriptions')
      .select('id,plan_name,status,stripe_customer_id,stripe_subscription_id,stripe_price_id,current_period_start,current_period_end,canceled_at,created_at,client_id,company_id')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Error al obtener suscripciones' }, { status: 500 });
    }

    const rows = subscriptions ?? [];

    // Resolve client names and emails in bulk
    const clientIds = [...new Set(rows.map((s) => s.client_id).filter(Boolean))] as string[];
    const clientMap = new Map<string, { name: string | null; email: string; phone: string | null; whatsapp_number: string | null }>();

    if (clientIds.length > 0) {
      const [profilesRes, authRes] = await Promise.all([
        adminSupabase.from('profiles').select('id, full_name, phone, whatsapp_number').in('id', clientIds),
        listAllAuthUsers(),
      ]);
      const authEmailById = new Map(authRes.map((u) => [u.id, u.email ?? '']));
      for (const p of profilesRes.data ?? []) {
        clientMap.set(p.id, {
          name: p.full_name ?? null,
          email: authEmailById.get(p.id) ?? '',
          phone: p.phone ?? null,
          whatsapp_number: p.whatsapp_number ?? null,
        });
      }
    }

    const enriched = rows.map((s) => ({
      ...s,
      client: s.client_id ? (clientMap.get(s.client_id) ?? null) : null,
    }));

    return NextResponse.json({ subscriptions: enriched });
  } catch (error) {
    console.error('Admin subscriptions GET error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
