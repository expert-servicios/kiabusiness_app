import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getViabilityCheck } from '@/lib/data/viability-checks';
import { evaluateViability } from '@/lib/integrations/ai';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getResendClient } from '@/lib/integrations/resend';
import { getCatalogService } from '@/lib/utils/catalog';

const bodySchema = z.object({
  serviceSlug: z.string().min(1),
  clientName: z.string().min(1).max(120),
  clientEmail: z.string().email(),
  clientPhone: z.string().optional(),
  gdprConsent: z.boolean(),
  answers: z.record(z.string(), z.union([z.string(), z.boolean()])),
  docStatus: z.record(z.string(), z.enum(['have', 'missing', 'need_help']))
});

export async function POST(request: NextRequest) {
  try {
    const body = bodySchema.parse(await request.json());

    if (!body.gdprConsent) {
      return NextResponse.json({ error: 'Se requiere consentimiento GDPR.' }, { status: 400 });
    }

    const check = getViabilityCheck(body.serviceSlug);

    // Evaluate with AI
    const viability = await evaluateViability({
      serviceSlug: body.serviceSlug,
      serviceName: check.serviceName,
      aiCriteria: check.aiCriteria,
      answers: body.answers,
      docStatus: body.docStatus,
      clientName: body.clientName
    });

    // Resolve priceId if viable (frontend will call checkout API)
    let stripePriceId: string | null = null;
    if (viability.result !== 'no_viable') {
      const catalogService = getCatalogService(body.serviceSlug);
      stripePriceId = catalogService?.stripePriceId ?? null;
    }

    // Persist to DB
    const supabase = getSupabaseAdmin();
    const { data: assessment } = await supabase
      .from('viability_assessments')
      .insert({
        service_slug: body.serviceSlug,
        service_name: check.serviceName,
        client_name: body.clientName,
        client_email: body.clientEmail,
        client_phone: body.clientPhone ?? null,
        gdpr_consent: true,
        gdpr_consent_at: new Date().toISOString(),
        answers: body.answers,
        doc_status: body.docStatus,
        ai_result: viability.result,
        ai_emoji: viability.emoji,
        ai_summary: viability.summary,
        ai_met: viability.met,
        ai_missing: viability.missing,
        ai_recommendations: viability.recommendations,
        ai_next_steps: viability.nextSteps,
        ai_escalate: viability.escalate,
        checkout_url: stripePriceId ? `stripe:${stripePriceId}` : null
      })
      .select('id')
      .single();

    // Send email report
    let emailSent = false;
    try {
      const resend = getResendClient();
      const resultLabel =
        viability.result === 'viable' ? '🟢 VIABLE' :
        viability.result === 'parcial' ? '🟡 VIABLE PARCIAL' :
        '🔴 NO VIABLE';

      await resend.emails.send({
        from: 'EXPERT Consultoría <noreply@expertconsulting.es>',
        to: body.clientEmail,
        subject: `Tu evaluación de viabilidad — ${check.serviceName}`,
        html: buildEmailHtml({
          clientName: body.clientName,
          serviceName: check.serviceName,
          resultLabel,
          summary: viability.summary,
          met: viability.met,
          missing: viability.missing,
          recommendations: viability.recommendations,
          nextSteps: viability.nextSteps,
          checkoutUrl: stripePriceId ? 'https://expertconsulting.es/servicios' : null,
          escalate: viability.escalate
        })
      });
      emailSent = true;

      if (assessment?.id) {
        await supabase
          .from('viability_assessments')
          .update({ email_sent: true })
          .eq('id', assessment.id);
      }
    } catch (emailErr) {
      console.error('[viabilidad] email error:', emailErr);
    }

    return NextResponse.json({
      result: viability.result,
      emoji: viability.emoji,
      summary: viability.summary,
      met: viability.met,
      missing: viability.missing,
      recommendations: viability.recommendations,
      nextSteps: viability.nextSteps,
      escalate: viability.escalate,
      stripePriceId,
      emailSent,
      assessmentId: assessment?.id ?? null
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos incorrectos.', details: err.issues }, { status: 400 });
    }
    console.error('[viabilidad] error:', err);
    return NextResponse.json({ error: 'Error al evaluar la viabilidad.' }, { status: 500 });
  }
}

function buildEmailHtml(p: {
  clientName: string;
  serviceName: string;
  resultLabel: string;
  summary: string;
  met: string[];
  missing: string[];
  recommendations: string[];
  nextSteps: string[];
  checkoutUrl: string | null;
  escalate: boolean;
}): string {
  const metHtml = p.met.length
    ? `<ul>${p.met.map(m => `<li style="color:#166534;">✓ ${m}</li>`).join('')}</ul>`
    : '';
  const missingHtml = p.missing.length
    ? `<ul>${p.missing.map(m => `<li style="color:#991b1b;">✗ ${m}</li>`).join('')}</ul>`
    : '';
  const recHtml = p.recommendations.length
    ? `<ul>${p.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>`
    : '';
  const nextHtml = p.nextSteps.length
    ? `<ul>${p.nextSteps.map(s => `<li>${s}</li>`).join('')}</ul>`
    : '';
  const ctaBtn = p.checkoutUrl
    ? `<a href="${p.checkoutUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#D4A017;color:#0D1B2A;font-weight:700;border-radius:8px;text-decoration:none;">Contratar servicio</a>`
    : p.escalate
    ? `<a href="https://expertconsulting.es/contacto" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#0D1B2A;color:#fff;font-weight:700;border-radius:8px;text-decoration:none;">Hablar con un asesor</a>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Evaluación de viabilidad</title></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;">
  <img src="https://expertconsulting.es/logo.png" alt="EXPERT" style="height:40px;margin-bottom:24px;" />
  <h1 style="font-size:20px;margin-bottom:4px;">Evaluación de viabilidad</h1>
  <p style="color:#555;margin-top:0;">${p.serviceName}</p>

  <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin:20px 0;">
    <p style="font-size:22px;font-weight:700;margin:0 0 8px;">${p.resultLabel}</p>
    <p style="margin:0;color:#444;">${p.summary}</p>
  </div>

  ${p.met.length ? `<h2 style="font-size:16px;">Requisitos cumplidos</h2>${metHtml}` : ''}
  ${p.missing.length ? `<h2 style="font-size:16px;">Requisitos pendientes o no cumplidos</h2>${missingHtml}` : ''}
  ${p.recommendations.length ? `<h2 style="font-size:16px;">Recomendaciones</h2>${recHtml}` : ''}
  ${p.nextSteps.length ? `<h2 style="font-size:16px;">Próximos pasos</h2>${nextHtml}` : ''}

  ${ctaBtn}

  <hr style="margin:32px 0;border:none;border-top:1px solid #eee;" />
  <p style="font-size:11px;color:#888;">
    Este informe es orientativo y no constituye asesoramiento legal vinculante.<br />
    EXPERT ESTUDIOS PROFESIONALES · expertconsulting.es<br />
    Has recibido este correo porque solicitaste una evaluación de viabilidad. Tus datos se tratan conforme al RGPD.
  </p>
</body>
</html>`;
}
