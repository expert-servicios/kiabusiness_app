import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin, listAllAuthUsers } from '@/lib/integrations/supabase';
import { getStripeClient, toStripeAscii } from '@/lib/integrations/stripe';
import { sendEmail } from '@/lib/email/send';
import { subscriptionInvite } from '@/lib/email/templates';
import { getRandomFunFact } from '@/lib/utils/fun-facts';
import { generateContractHtml, contractToBuffer } from '@/lib/utils/contract';
import { getPublicAppUrl } from '@/lib/utils/app-url';
import { isStaffRole } from '@/lib/auth/roles';

const STRIPE_PRICE_ALLOWLIST: Record<string, string | undefined> = {
  STRIPE_PLAN_MONTHLY_49:  process.env.STRIPE_PLAN_MONTHLY_49,
  STRIPE_PLAN_MONTHLY_99:  process.env.STRIPE_PLAN_MONTHLY_99,
  STRIPE_PLAN_MONTHLY_199: process.env.STRIPE_PLAN_MONTHLY_199,
};

const schema = z.object({
  clientEmail: z.string().email('Email de cliente inválido'),
  planName: z.string().min(2),
  amountEur: z.number().positive(),
  stripePriceEnvKey: z.enum(['STRIPE_PLAN_MONTHLY_49', 'STRIPE_PLAN_MONTHLY_99', 'STRIPE_PLAN_MONTHLY_199'])
});

async function requireAdmin(request: NextRequest): Promise<string | null> {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles').select('role,status').eq('id', user.id).single();
  if (profile?.status === 'inactive') return null;
  return isStaffRole(profile?.role) ? user.id : null;
}

export async function POST(request: NextRequest) {
  try {
    const actorId = await requireAdmin(request);
    if (!actorId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
    }

    const { clientEmail, planName, amountEur, stripePriceEnvKey } = parsed.data;

    const configuredPriceId = STRIPE_PRICE_ALLOWLIST[stripePriceEnvKey];

    const adminSupabase = getSupabaseAdmin();

    // Resolve client
    const listData = await listAllAuthUsers();
    const authUser = listData.find((u) => u.email === clientEmail);
    if (!authUser) {
      return NextResponse.json({ error: 'No existe ningún usuario con ese email. Crea el usuario primero.' }, { status: 404 });
    }
    const clientId = authUser.id;

    const { data: clientProfile } = await adminSupabase
      .from('profiles')
      .select('full_name,company,tax_id,address,city,postal_code')
      .eq('id', clientId)
      .single();

    const clientName = clientProfile?.full_name ?? clientEmail.split('@')[0];
    const appUrl = getPublicAppUrl();

    // Create Stripe subscription checkout session
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      client_reference_id: clientId,
      customer_email: clientEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(amountEur * 100),
            recurring: { interval: 'month' },
            product_data: {
              name: toStripeAscii(planName),
              metadata: {
                configured_price_key: stripePriceEnvKey,
                configured_price_id: configuredPriceId ?? '',
              },
            },
          },
        },
      ],
      metadata: { user_id: clientId, plan_name: planName, product_type: 'suscripcion' },
      subscription_data: {
        metadata: {
          user_id: clientId,
          plan_name: planName,
          configured_price_key: stripePriceEnvKey,
          configured_price_id: configuredPriceId ?? '',
        }
      },
      success_url: `${appUrl}/dashboard/suscripciones?activada=ok`,
      cancel_url: `${appUrl}/dashboard?suscripcion=cancelada`
    });

    // Generate contract
    const contractDate = new Date().toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    const contractHtml = generateContractHtml({
      clientName,
      clientEmail,
      clientCompany: clientProfile?.company ?? null,
      clientTaxId: clientProfile?.tax_id ?? null,
      clientAddress: clientProfile?.city
        ? `${clientProfile.address ?? ''}, ${clientProfile.city}`.trim().replace(/^,\s*/, '')
        : clientProfile?.address ?? null,
      serviceTitle: planName,
      serviceDescription: `Suscripción mensual al ${planName} de EXPERT Estudios Profesionales. Gestión fiscal, contable y administrativa continua.`,
      amountEur,
      contractDate,
      contractType: 'subscription',
      planName
    });
    const contractBase64 = contractToBuffer(contractHtml);

    // Send invitation email with contract attached
    const funFact = getRandomFunFact();
    const tpl = subscriptionInvite(clientName, planName, amountEur, session.url!, funFact);

    await sendEmail({
      to: clientEmail,
      eventType: 'subscription.invite_sent',
      ...tpl,
      metadata: { client_id: clientId, plan_name: planName, session_id: session.id },
      attachments: [
        {
          filename: `Contrato_Suscripcion_${planName.replace(/\s+/g, '_')}.html`,
          content: contractBase64,
          type: 'text/html'
        }
      ]
    });

    await adminSupabase.from('audit_logs').insert({
      actor_id: actorId,
      action: 'subscription.invite_sent',
      entity: 'profiles',
      entity_id: clientId,
      metadata: { client_email: clientEmail, plan_name: planName, session_id: session.id }
    }).then(() => {});

    return NextResponse.json({ ok: true, stripeUrl: session.url });
  } catch (err) {
    console.error('[admin/subscriptions/send-link] error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
