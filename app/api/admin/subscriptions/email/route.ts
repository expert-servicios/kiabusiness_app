import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getStripeClient } from '@/lib/integrations/stripe';
import { isStaffRole } from '@/lib/auth/roles';
import { runKiaProviderRequest } from '@/lib/ai/kia/kia-provider-router';
import { sendEmailOnce } from '@/lib/email/send';
import { customSubscriptionInvite } from '@/lib/email/subscription-custom-template';

const payloadSchema = z.object({
  action: z.enum(['compose', 'send']),
  sessionId: z.string().min(10),
  subject: z.string().min(3).max(180),
  body: z.string().min(20).max(6000),
});

async function requireStaff(request: NextRequest): Promise<string | null> {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role,status').eq('id', user.id).single();
  if (profile?.status === 'inactive') return null;
  return isStaffRole(profile?.role) ? user.id : null;
}

async function loadCheckout(sessionId: string) {
  const admin = getSupabaseAdmin();
  const { data: local, error } = await admin
    .from('checkout_sessions')
    .select('stripe_session_id,user_id,company_id,status,metadata')
    .eq('stripe_session_id', sessionId)
    .single();
  if (error || !local) return { error: 'Checkout no encontrado en EXPERT', status: 404 as const };
  if (local.status !== 'open') return { error: 'El Checkout ya no está abierto', status: 409 as const };

  const metadata = (local.metadata ?? {}) as Record<string, unknown>;
  if (metadata.product_type !== 'subscription') {
    return { error: 'La sesión no corresponde a una suscripción', status: 400 as const };
  }

  const [{ data: profile }, authUserResult, { data: company }, { data: activeSubscription }] = await Promise.all([
    admin.from('profiles').select('full_name,email').eq('id', local.user_id).single(),
    admin.auth.admin.getUserById(local.user_id),
    admin.from('companies').select('razon_social').eq('id', local.company_id).single(),
    admin.from('subscriptions')
      .select('id,status')
      .eq('client_id', local.user_id)
      .eq('company_id', local.company_id)
      .in('status', ['active', 'trialing'])
      .limit(1)
      .maybeSingle(),
  ]);

  const clientEmail = authUserResult.data.user?.email ?? profile?.email ?? null;
  if (!clientEmail) return { error: 'No se pudo resolver el email canónico del cliente', status: 500 as const };
  if (activeSubscription) return { error: 'La entidad ya tiene una suscripción activa/trialing', status: 409 as const };

  const stripe = getStripeClient();
  const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
  if (stripeSession.status !== 'open' || !stripeSession.url) {
    return { error: 'La sesión Stripe ya no está disponible', status: 409 as const };
  }
  if (stripeSession.client_reference_id !== local.user_id) {
    return { error: 'La sesión Stripe no corresponde al cliente esperado', status: 409 as const };
  }
  if (stripeSession.metadata?.company_id !== local.company_id) {
    return { error: 'La sesión Stripe no corresponde a la entidad esperada', status: 409 as const };
  }

  const planName = typeof metadata.plan_name === 'string' ? metadata.plan_name : stripeSession.metadata?.plan_name ?? 'Plan EXPERT';
  const amountEur = typeof metadata.amount_eur === 'number' ? metadata.amount_eur : Number(metadata.amount_eur ?? 0);
  if (!Number.isFinite(amountEur) || amountEur <= 0) {
    return { error: 'No se pudo validar el importe del plan', status: 500 as const };
  }

  return { admin, local, metadata, profile, clientEmail, company, stripeSession, planName, amountEur };
}

export async function GET(request: NextRequest) {
  try {
    const actorId = await requireStaff(request);
    if (!actorId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    const sessionId = new URL(request.url).searchParams.get('sessionId');
    if (!sessionId || sessionId.length < 10) return NextResponse.json({ error: 'sessionId requerido' }, { status: 400 });
    const checkout = await loadCheckout(sessionId);
    if ('error' in checkout) return NextResponse.json({ error: checkout.error }, { status: checkout.status });
    return NextResponse.json({
      ok: true,
      sessionId: checkout.local.stripe_session_id,
      stripeUrl: checkout.stripeSession.url,
      clientId: checkout.local.user_id,
      companyId: checkout.local.company_id,
      recipient: checkout.clientEmail,
      clientName: checkout.profile?.full_name ?? checkout.clientEmail.split('@')[0],
      companyName: checkout.company?.razon_social ?? null,
      planName: checkout.planName,
      amountEur: checkout.amountEur,
      emailSent: checkout.metadata.email_sent === true,
      emailSentAt: typeof checkout.metadata.email_sent_at === 'string' ? checkout.metadata.email_sent_at : null,
      emailSource: typeof checkout.metadata.email_source === 'string' ? checkout.metadata.email_source : null,
      leadId: typeof checkout.metadata.lead_id === 'string' ? checkout.metadata.lead_id : null,
      quoteId: typeof checkout.metadata.quote_id === 'string' ? checkout.metadata.quote_id : null,
      onboardingCaseId: typeof checkout.metadata.onboarding_case_id === 'string' ? checkout.metadata.onboarding_case_id : null,
    });
  } catch (error) {
    console.error('[admin/subscriptions/email GET] error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actorId = await requireStaff(request);
    if (!actorId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const parsed = payloadSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });

    const checkout = await loadCheckout(parsed.data.sessionId);
    if ('error' in checkout) return NextResponse.json({ error: checkout.error }, { status: checkout.status });

    const clientName = checkout.profile?.full_name ?? checkout.clientEmail.split('@')[0];
    const companyName = checkout.company?.razon_social ?? 'la entidad seleccionada';

    if (parsed.data.action === 'compose') {
      const responseSchema = {
        type: 'object',
        additionalProperties: false,
        required: ['subject', 'body'],
        properties: { subject: { type: 'string' }, body: { type: 'string' } },
      } as const;
      const result = await runKiaProviderRequest({
        taskType: 'admin_ai_compose', effort: 'medium', maxTokens: 900, temperature: 0.2, responseSchema,
        systemPrompt: [
          'Eres KIA, editor profesional de comunicaciones de EXPERT.',
          'Reescribe un correo de contratación de suscripción en español claro, breve y profesional.',
          'No inventes condiciones comerciales, importes, fechas, servicios ni obligaciones.',
          'No incluyas URLs, markdown, botones, HTML ni placeholders de enlaces.',
          'El botón de pago lo añadirá EXPERT de forma protegida fuera del texto.',
          'Mantén cualquier condición comercial específica que ya aparezca en el borrador.',
          'Devuelve únicamente subject y body según el schema.',
        ].join('\n'),
        messages: [{ role: 'user', content: [
          `Cliente: ${clientName}`,
          `Entidad: ${companyName}`,
          `Plan: ${checkout.planName}`,
          `Cuota: ${checkout.amountEur} €/mes + IVA`,
          `Asunto actual: ${parsed.data.subject}`,
          'Cuerpo actual:',
          parsed.data.body,
        ].join('\n') }],
      });
      if (result.error || !result.parsedJson || typeof result.parsedJson !== 'object') {
        return NextResponse.json({ error: 'KIA no pudo mejorar el correo en este momento' }, { status: 502 });
      }
      const ai = result.parsedJson as { subject?: unknown; body?: unknown };
      if (typeof ai.subject !== 'string' || typeof ai.body !== 'string') {
        return NextResponse.json({ error: 'KIA devolvió una respuesta inválida' }, { status: 502 });
      }
      await checkout.admin.from('audit_logs').insert({
        actor_id: actorId,
        action: 'subscription.email_ai_composed',
        entity: 'companies',
        entity_id: checkout.local.company_id,
        metadata: { client_id: checkout.local.user_id, session_id: parsed.data.sessionId, provider: result.provider, model: result.model },
      }).then(() => {});
      return NextResponse.json({ ok: true, subject: ai.subject.trim(), body: ai.body.trim() });
    }

    const tpl = customSubscriptionInvite({
      subject: parsed.data.subject,
      body: parsed.data.body,
      planName: checkout.planName,
      amountEur: checkout.amountEur,
      checkoutUrl: checkout.stripeSession.url!,
    });
    const idempotencyKey = `subscription/invite/${checkout.local.stripe_session_id}`;
    const delivery = await sendEmailOnce({
      to: checkout.clientEmail,
      eventType: 'subscription.invite_sent',
      subject: tpl.subject,
      html: tpl.html,
      idempotencyKey,
      metadata: {
        client_id: checkout.local.user_id,
        company_id: checkout.local.company_id,
        plan_name: checkout.planName,
        session_id: checkout.local.stripe_session_id,
        quote_id: checkout.metadata.quote_id ?? null,
        case_id: checkout.metadata.onboarding_case_id ?? null,
        lead_id: checkout.metadata.lead_id ?? null,
        source: 'admin_subscription_composer_v2',
      },
    });

    const nextMetadata = {
      ...checkout.metadata,
      email_sent: true,
      email_sent_at: new Date().toISOString(),
      email_source: 'admin_subscription_composer_v2',
    };
    await Promise.all([
      checkout.admin.from('checkout_sessions').update({ metadata: nextMetadata, updated_at: new Date().toISOString() }).eq('stripe_session_id', checkout.local.stripe_session_id),
      checkout.metadata.quote_id
        ? checkout.admin.from('quotes').update({ status: 'sent' }).eq('id', String(checkout.metadata.quote_id))
        : Promise.resolve({ error: null }),
      checkout.admin.from('email_events')
        .update({ html: tpl.html, updated_at: new Date().toISOString() })
        .contains('metadata', { idempotency_key: idempotencyKey }),
    ]);

    await checkout.admin.from('audit_logs').insert({
      actor_id: actorId,
      action: 'subscription.invite_sent',
      entity: 'companies',
      entity_id: checkout.local.company_id,
      metadata: {
        client_id: checkout.local.user_id,
        client_email: checkout.clientEmail,
        company_id: checkout.local.company_id,
        plan_name: checkout.planName,
        session_id: checkout.local.stripe_session_id,
        lead_id: checkout.metadata.lead_id ?? null,
        quote_id: checkout.metadata.quote_id ?? null,
        onboarding_case_id: checkout.metadata.onboarding_case_id ?? null,
        email_sent: delivery.sent,
        resend_id: delivery.resendId,
        source: 'admin_subscription_composer_v2',
      },
    }).then(() => {});

    return NextResponse.json({ ok: true, sent: delivery.sent, resendId: delivery.resendId, recipient: checkout.clientEmail });
  } catch (error) {
    console.error('[admin/subscriptions/email] error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
