import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

async function requireAdmin(request: NextRequest): Promise<string | null> {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (profile?.role === 'admin' || profile?.role === 'owner') ? user.id : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actorId = await requireAdmin(request);
    if (!actorId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id } = await params;
    const admin = getSupabaseAdmin();

    const { data: quote, error } = await admin
      .from('quotes')
      .select('id,title,description,amount_eur,status,created_at,expires_at,client_id,lead_id,stripe_checkout_id,docs_checklist')
      .eq('id', id)
      .single();

    if (error || !quote) return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 });

    // Fetch lead info
    let lead: { name: string | null; email: string | null } | null = null;
    if (quote.lead_id) {
      const { data } = await admin.from('leads').select('name,email').eq('id', quote.lead_id).single();
      lead = data ?? null;
    }

    // Fetch registered client info
    let client: { full_name: string | null; email: string | null } | null = null;
    if (quote.client_id) {
      const [profileResult, authResult] = await Promise.all([
        admin.from('profiles').select('full_name').eq('id', quote.client_id).single(),
        admin.auth.admin.getUserById(quote.client_id)
      ]);
      client = {
        full_name: profileResult.data?.full_name ?? null,
        email: authResult.data?.user?.email ?? null
      };
    }

    // Resolve Stripe checkout URL if session ID exists
    let stripeCheckoutUrl: string | null = null;
    if (quote.stripe_checkout_id) {
      try {
        const { getStripeClient } = await import('@/lib/integrations/stripe');
        const stripe = getStripeClient();
        const session = await stripe.checkout.sessions.retrieve(quote.stripe_checkout_id);
        stripeCheckoutUrl = session.url ?? null;
      } catch {
        // Session may have expired — don't fail the whole request
      }
    }

    return NextResponse.json({
      quote: {
        ...quote,
        lead,
        client,
        stripeCheckoutUrl
      }
    });
  } catch (err) {
    console.error('[admin/quotes/[id]] GET error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
