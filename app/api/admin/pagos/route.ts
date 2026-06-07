import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getStripeClient } from '@/lib/integrations/stripe';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (profile?.role === 'admin' || profile?.role === 'owner') ? admin : null;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { data, error } = await admin
      .from('pagos_expert')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ pagos: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const stripe = getStripeClient();
    const since2026 = Math.floor(new Date('2026-01-01T00:00:00Z').getTime() / 1000);

    // Fetch all 2026+ payment intents with customer expanded
    const allPIs: Stripe.PaymentIntent[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const batch = await stripe.paymentIntents.list({
        created: { gte: since2026 },
        limit: 100,
        expand: ['data.customer'],
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });
      allPIs.push(...batch.data);
      hasMore = batch.has_more;
      if (batch.data.length > 0) startingAfter = batch.data[batch.data.length - 1].id;
    }

    // Get existing payment_intent_ids to decide insert vs update
    const { data: existing } = await admin
      .from('pagos_expert')
      .select('payment_intent_id');
    const existingIds = new Set((existing ?? []).map((r: { payment_intent_id: string }) => r.payment_intent_id));

    // Build profile email→id map for linking
    const { data: profilesData } = await admin
      .from('profiles')
      .select('id, email, stripe_customer_id');
    const profileByEmail = new Map<string, { id: string; stripe_customer_id: string | null }>(
      (profilesData ?? [])
        .filter((p: { id: string; email: string | null; stripe_customer_id: string | null }) => p.email)
        .map((p: { id: string; email: string; stripe_customer_id: string | null }) => [p.email.toLowerCase(), { id: p.id, stripe_customer_id: p.stripe_customer_id }])
    );

    let synced = 0;
    let profilesLinked = 0;

    for (const pi of allPIs) {
      const raw = pi.customer;
      let customerEmail: string | null = null;
      let customerName: string | null = null;
      let customerId: string | null = null;

      if (raw && typeof raw === 'object') {
        const cus = raw as Stripe.Customer | Stripe.DeletedCustomer;
        customerId = cus.id;
        if (!('deleted' in cus)) {
          customerEmail = cus.email ?? null;
          customerName = cus.name ?? null;
        }
      } else if (typeof raw === 'string') {
        customerId = raw;
      }

      const emailKey = customerEmail?.toLowerCase();
      const profile = emailKey ? profileByEmail.get(emailKey) : undefined;
      const userId = profile?.id ?? null;

      // Update stripe_customer_id on profile if not already set
      if (profile && customerId && !profile.stripe_customer_id) {
        await admin
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', profile.id);
        profile.stripe_customer_id = customerId;
        profilesLinked++;
      }

      const row = {
        payment_intent_id: pi.id,
        user_id: userId,
        customer_email: customerEmail,
        amount: pi.amount,
        currency: pi.currency,
        status: pi.status,
        metadata: {
          customer_name: customerName,
          customer_id: customerId,
          description: pi.description,
          ...(pi.metadata ?? {}),
        },
        stripe_session_id: null,
        created_at: new Date(pi.created * 1000).toISOString(),
      };

      if (existingIds.has(pi.id)) {
        await admin
          .from('pagos_expert')
          .update({ status: pi.status, user_id: userId, customer_email: customerEmail, metadata: row.metadata })
          .eq('payment_intent_id', pi.id);
      } else {
        await admin.from('pagos_expert').insert(row);
      }
      synced++;
    }

    return NextResponse.json({ ok: true, synced, profilesLinked });
  } catch (err) {
    console.error('[stripe/sync] error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
