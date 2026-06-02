import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getStripeClient } from '@/lib/integrations/stripe';

// ── Auth guard ────────────────────────────────────────────────────────────────

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'owner'].includes(profile?.role ?? '')) return null;
  return user;
}

// ── Stats type ────────────────────────────────────────────────────────────────

interface SyncStats {
  customers  : { total: number; linked: number; lead_created: number; skipped: number; errors: number };
  invoices   : { total: number; created: number; skipped: number; errors: number };
  subs       : { total: number; created: number; updated: number; skipped: number; errors: number };
}

// ── GET — status: how many Stripe records vs EXPERT ──────────────────────────

export async function GET(request: NextRequest) {
  const user = await requireAdmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const stripe = getStripeClient();
    const admin  = getSupabaseAdmin();

    const [stripeCustomers, expertProfiles, expertOrders, expertSubs] = await Promise.all([
      stripe.customers.list({ limit: 1 }),
      admin.from('profiles').select('id', { count: 'exact', head: true }),
      admin.from('orders').select('id', { count: 'exact', head: true }),
      admin.from('subscriptions').select('id', { count: 'exact', head: true }),
    ]);

    const { count: linkedProfilesCount } = await admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .not('stripe_customer_id', 'is', null);

    return NextResponse.json({
      stripe: {
        total_customers: stripeCustomers.data.length > 0 ? '≥1 (use sync to get full count)' : 0,
      },
      expert: {
        profiles       : expertProfiles.count ?? 0,
        profiles_linked: linkedProfilesCount ?? 0,
        orders         : expertOrders.count ?? 0,
        subscriptions  : expertSubs.count ?? 0,
      },
    });
  } catch (err) {
    console.error('[stripe sync GET]', err);
    return NextResponse.json({ error: 'Error al obtener estado' }, { status: 500 });
  }
}

// ── POST — run sync ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const user = await requireAdmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const body = await request.json() as { dryRun?: boolean; limit?: number };
  const dryRun     = body.dryRun !== false; // default true — must explicitly pass false
  const maxCustomers = body.limit ?? 500;

  const stripe  = getStripeClient();
  const admin   = getSupabaseAdmin();

  const stats: SyncStats = {
    customers: { total: 0, linked: 0, lead_created: 0, skipped: 0, errors: 0 },
    invoices : { total: 0, created: 0, skipped: 0, errors: 0 },
    subs     : { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 },
  };

  // ── Cache auth users for email matching ──────────────────────────────────
  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const emailToProfileId = new Map<string, string>();
  if (authData?.users) {
    const ids = authData.users.map((u) => u.id);
    const { data: profiles } = await admin.from('profiles').select('id').in('id', ids);
    const profileIds = new Set((profiles ?? []).map((p) => p.id));
    for (const u of authData.users) {
      if (u.email && profileIds.has(u.id)) {
        emailToProfileId.set(u.email.toLowerCase(), u.id);
      }
    }
  }

  // ── Iterate customers ────────────────────────────────────────────────────
  let processed = 0;

  for await (const customer of stripe.customers.list({ limit: 100 })) {
    if (processed++ >= maxCustomers) break;
    stats.customers.total++;

    let profileId: string | null = null;

    // 1. metadata.user_id
    if (customer.metadata?.user_id) {
      const { data } = await admin.from('profiles').select('id').eq('id', customer.metadata.user_id).maybeSingle();
      if (data) profileId = data.id;
    }
    // 2. email match
    if (!profileId && customer.email) {
      profileId = emailToProfileId.get(customer.email.toLowerCase()) ?? null;
    }

    if (profileId) {
      stats.customers.linked++;
      if (!dryRun) {
        await admin.from('profiles').update({ stripe_customer_id: customer.id }).eq('id', profileId);
      }
    } else if (customer.email) {
      stats.customers.lead_created++;
      if (!dryRun) {
        await admin.from('leads').upsert(
          {
            phone : customer.phone ?? null,
            name  : customer.name ?? customer.email.split('@')[0],
            email : customer.email,
            source: 'stripe_import',
            notes : `Importado desde Stripe customer ${customer.id}`,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        );
      }
    } else {
      stats.customers.skipped++;
    }

    // ── Paid invoices ──────────────────────────────────────────────────────
    for await (const invoice of stripe.invoices.list({ customer: customer.id, limit: 100, status: 'paid' })) {
      stats.invoices.total++;
      const pi = (invoice as unknown as { payment_intent?: string | Stripe.PaymentIntent | null }).payment_intent;
      const paymentId = typeof pi === 'string' ? pi : ((pi as Stripe.PaymentIntent | null)?.id ?? invoice.id);

      const { data: existing } = await admin.from('orders').select('id').eq('stripe_payment_id', paymentId).maybeSingle();
      if (existing) { stats.invoices.skipped++; continue; }

      stats.invoices.created++;
      if (!dryRun) {
        const amountEur = (invoice.amount_paid ?? 0) / 100;
        const description = invoice.lines.data[0]?.description ?? invoice.description ?? 'Factura Stripe importada';
        await admin.from('orders').insert({
          client_id        : profileId ?? null,
          stripe_payment_id: paymentId,
          amount_eur       : amountEur,
          currency         : (invoice.currency ?? 'eur').toUpperCase(),
          status           : 'paid',
          source           : 'stripe_import',
          metadata         : { stripe_invoice_id: invoice.id, stripe_customer_id: customer.id, description, imported_at: new Date().toISOString() },
        });
      }
    }

    // ── Subscriptions ──────────────────────────────────────────────────────
    for await (const sub of stripe.subscriptions.list({ customer: customer.id, limit: 100 })) {
      stats.subs.total++;
      const priceId  = sub.items.data[0]?.price.id ?? '';
      const status   = (['active','canceled','past_due','unpaid','trialing'] as const).find((s) => s === sub.status) ?? 'active';
      const planName = sub.metadata?.plan_name ?? sub.items.data[0]?.price.nickname ?? 'Suscripción EXPERT';
      const periodEnd   = sub.items.data[0]?.current_period_end   ? new Date(sub.items.data[0].current_period_end   * 1000).toISOString() : null;
      const periodStart = sub.items.data[0]?.current_period_start ? new Date(sub.items.data[0].current_period_start * 1000).toISOString() : null;

      const { data: existingSub } = await admin.from('subscriptions').select('id').eq('stripe_subscription_id', sub.id).maybeSingle();

      if (existingSub) {
        stats.subs.updated++;
        if (!dryRun) {
          await admin.from('subscriptions').update({ status, current_period_start: periodStart, current_period_end: periodEnd, updated_at: new Date().toISOString() }).eq('stripe_subscription_id', sub.id);
        }
      } else {
        stats.subs.created++;
        if (!dryRun) {
          await admin.from('subscriptions').upsert(
            { client_id: profileId ?? null, stripe_subscription_id: sub.id, stripe_customer_id: customer.id, stripe_price_id: priceId, plan_name: planName, status, current_period_start: periodStart, current_period_end: periodEnd, updated_at: new Date().toISOString() },
            { onConflict: 'stripe_subscription_id' }
          );
        }
      }
    }
  }

  return NextResponse.json({ dryRun, stats });
}
