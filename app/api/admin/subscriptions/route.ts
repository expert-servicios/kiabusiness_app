import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabaseClient, getSupabaseAdmin, listAllAuthUsers } from '@/lib/integrations/supabase';
import { getStripeClient } from '@/lib/integrations/stripe';

type ClientSummary = {
  name: string | null;
  email: string;
  phone: string | null;
  whatsapp_number: string | null;
};

function stripeCustomerSummary(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): ClientSummary | null {
  if (!customer || typeof customer === 'string' || customer.deleted) return null;
  return {
    name: customer.name ?? customer.business_name ?? null,
    email: customer.email ?? '',
    phone: customer.phone ?? null,
    whatsapp_number: null,
  };
}

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
    const warnings: string[] = [];

    // Resolve client names and emails in bulk for subscriptions already linked in EXPERT.
    const clientIds = [...new Set(rows.map((s) => s.client_id).filter(Boolean))] as string[];
    const clientMap = new Map<string, ClientSummary>();

    if (clientIds.length > 0) {
      const [profilesRes, authRes] = await Promise.all([
        adminSupabase.from('profiles').select('id, full_name, email, phone, whatsapp_number').in('id', clientIds),
        listAllAuthUsers(),
      ]);
      const authEmailById = new Map(authRes.map((u) => [u.id, u.email ?? '']));
      for (const p of profilesRes.data ?? []) {
        clientMap.set(p.id, {
          name: p.full_name ?? null,
          email: p.email ?? authEmailById.get(p.id) ?? '',
          phone: p.phone ?? null,
          whatsapp_number: p.whatsapp_number ?? null,
        });
      }
    }

    const enrichedLocal = rows.map((s) => ({
      ...s,
      source: 'expert' as const,
      requires_linking: false,
      client: s.client_id ? (clientMap.get(s.client_id) ?? null) : null,
    }));

    // Admin visibility must not depend on a historical backfill. Stripe-only
    // subscriptions are surfaced read-only and clearly marked for manual linking.
    // No local subscription/order/company record is created or modified here.
    let stripeOnly: Array<Record<string, unknown>> = [];
    try {
      const stripe = getStripeClient();
      const localStripeIds = new Set(rows.map((row) => row.stripe_subscription_id).filter(Boolean));
      const remote: Stripe.Subscription[] = [];
      for await (const sub of stripe.subscriptions.list({ status: 'all', limit: 100, expand: ['data.customer'] })) {
        remote.push(sub);
        if (remote.length >= 500) {
          warnings.push('Stripe: se alcanzó el límite de 500 suscripciones; revisar paginación antes de asumir cobertura completa.');
          break;
        }
      }

      stripeOnly = remote
        .filter((sub) => !localStripeIds.has(sub.id))
        .map((sub) => {
          const firstItem = sub.items.data[0];
          const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? '';
          const customer = stripeCustomerSummary(sub.customer);
          return {
            id: `stripe:${sub.id}`,
            plan_name: sub.metadata?.plan_name ?? firstItem?.price.nickname ?? 'Suscripción Stripe',
            status: sub.status,
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            stripe_price_id: firstItem?.price.id ?? '',
            current_period_start: firstItem?.current_period_start ? new Date(firstItem.current_period_start * 1000).toISOString() : null,
            current_period_end: firstItem?.current_period_end ? new Date(firstItem.current_period_end * 1000).toISOString() : null,
            canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
            created_at: new Date(sub.created * 1000).toISOString(),
            client_id: null,
            company_id: null,
            source: 'stripe_only' as const,
            requires_linking: true,
            client: customer,
          };
        });
    } catch (stripeError) {
      console.error('Admin subscriptions Stripe visibility error:', stripeError);
      warnings.push('No se pudo consultar Stripe en tiempo real; se muestran únicamente las suscripciones registradas en EXPERT.');
    }

    const combined = [...enrichedLocal, ...stripeOnly].sort((a, b) =>
      String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')),
    );

    return NextResponse.json({ subscriptions: combined, warnings });
  } catch (error) {
    console.error('Admin subscriptions GET error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
