import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getStripeClient } from '@/lib/integrations/stripe';
import Stripe from 'stripe';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: p } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (p?.role === 'admin' || p?.role === 'owner') ? admin : null;
}

// POST /api/admin/subscriptions/[id]/retry
// Retries payment for the latest unpaid invoice of a past_due/unpaid subscription
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;

  // Get the subscription from DB
  const { data: sub } = await admin
    .from('subscriptions')
    .select('id, status, stripe_subscription_id, stripe_customer_id, client_id')
    .eq('id', id)
    .single();

  if (!sub) return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 });
  if (!sub.stripe_subscription_id) {
    return NextResponse.json({ error: 'Sin Stripe subscription ID — no se puede reintentar' }, { status: 400 });
  }
  if (!['past_due', 'unpaid'].includes(sub.status)) {
    return NextResponse.json({ error: `Estado "${sub.status}" no requiere reintento` }, { status: 400 });
  }

  try {
    const stripe = getStripeClient();

    // Retrieve subscription with latest invoice
    const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id, {
      expand: ['latest_invoice'],
    });

    const latestInvoice = stripeSub.latest_invoice as Stripe.Invoice | null;
    if (!latestInvoice || typeof latestInvoice === 'string') {
      return NextResponse.json({ error: 'No se encontró factura pendiente en Stripe' }, { status: 400 });
    }

    if (latestInvoice.status === 'paid') {
      return NextResponse.json({ error: 'La factura más reciente ya está pagada' }, { status: 400 });
    }

    // Retry payment
    const paid = await stripe.invoices.pay(latestInvoice.id);

    // Update subscription status in DB if successful
    if (paid.status === 'paid') {
      await admin
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('id', id);
    }

    return NextResponse.json({
      ok: true,
      invoiceId: paid.id,
      status: paid.status,
      newSubStatus: paid.status === 'paid' ? 'active' : sub.status,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[subscriptions/retry]', msg);
    // Stripe declines are user-facing errors
    return NextResponse.json({ error: msg }, { status: 402 });
  }
}
