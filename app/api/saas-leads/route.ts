import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/send';
import { saasLeadAutoReply, saasLeadReceivedAdmin } from '@/lib/email/templates';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { saasLeadSchema } from '@/lib/schemas/saas-lead';
import { verifyRecaptchaToken } from '@/lib/utils/recaptcha';
import { checkSpam, checkRateLimit, getClientIp } from '@/lib/utils/spam-guard';

function parseRecipients(value: string) {
  return value
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (String(body.hp_url ?? '').trim()) {
      return NextResponse.json({ ok: true });
    }

    const ip = getClientIp(request.headers);
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Inténtalo más tarde.' }, { status: 429 });
    }

    const parsed = saasLeadSchema.safeParse(body);
    if (parsed.success) {
      const spam = checkSpam({
        name: parsed.data.name,
        email: parsed.data.email,
        message: parsed.data.operationalProblem
      });
      if (spam.isSpam) return NextResponse.json({ ok: true });
    }
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos invalidos.' },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const recaptcha = await verifyRecaptchaToken({
      token: String(body.recaptcha_token ?? ''),
      action: 'saas_lead'
    });
    if (!recaptcha.ok) {
      return NextResponse.json({ error: 'Verificación anti-spam fallida. Inténtalo de nuevo.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('saas_leads').insert({
      name: input.name,
      email: input.email,
      phone: input.phone,
      company_name: input.companyName,
      client_count_range: input.clientCountRange,
      current_tools: input.currentTools,
      operational_problem: input.operationalProblem,
      pilot_interest: input.pilotInterest,
      consent: input.consent,
      source: input.source,
      metadata: {
        user_agent: request.headers.get('user-agent'),
        referer: request.headers.get('referer')
      }
    });

    if (error) {
      console.error('[saas-leads] insert', error);
      return NextResponse.json({ error: 'No se pudo registrar la solicitud.' }, { status: 500 });
    }

    const adminRecipients = parseRecipients(process.env.ADMIN_EMAILS ?? 'soy@expertconsulting.es');
    await Promise.all([
      sendEmail({
        to: adminRecipients,
        eventType: 'saas_lead.received',
        ...saasLeadReceivedAdmin(input),
        metadata: { source: input.source, email: input.email, company_name: input.companyName }
      }),
      sendEmail({
        to: input.email,
        eventType: 'saas_lead.autoreply',
        ...saasLeadAutoReply(input.name),
        metadata: { source: input.source }
      })
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[saas-leads]', error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
