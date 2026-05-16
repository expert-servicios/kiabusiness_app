import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { presupuestoAvanzadoRequested, presupuestoAvanzadoAdmin } from '@/lib/email/templates';
import { verifyRecaptchaToken } from '@/lib/utils/recaptcha';
import { checkSpam, checkRateLimit, getClientIp } from '@/lib/utils/spam-guard';

const schema = z.object({
  hp_url: z.string().optional(),
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(6).max(25),
  company_name: z.string().min(2).max(200),
  company_type: z.string().max(80).optional(),
  tax_id: z.string().max(20).optional(),
  employees: z.string().max(40).optional(),
  annual_billing: z.string().max(60).optional(),
  current_software: z.string().max(80).optional(),
  urgency: z.string().max(80).optional(),
  services: z.array(z.string().max(60)).min(1, 'Selecciona al menos un servicio'),
  message: z.string().max(2000).optional(),
  recaptcha_token: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Honeypot
    if (String(body.hp_url ?? '').trim()) {
      return NextResponse.json({ ok: true });
    }

    // Rate limit
    const ip = getClientIp(request.headers);
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Inténtalo más tarde.' }, { status: 429 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' },
        { status: 400 }
      );
    }

    const d = parsed.data;

    // Spam check
    const spam = checkSpam({ name: d.name, email: d.email, message: d.message });
    if (spam.isSpam) return NextResponse.json({ ok: true });

    const recaptcha = await verifyRecaptchaToken({
      token: String(d.recaptcha_token ?? ''),
      action: 'advanced_quote'
    });
    if (!recaptcha.ok) {
      return NextResponse.json({ error: 'Verificación anti-spam fallida. Inténtalo de nuevo.' }, { status: 400 });
    }

    // Build message summary for leads table
    const servicesSummary = d.services.join(', ');
    const fullMessage = [
      `Servicios: ${servicesSummary}`,
      d.employees ? `Empleados: ${d.employees}` : null,
      d.annual_billing ? `Facturación: ${d.annual_billing}` : null,
      d.current_software ? `Software actual: ${d.current_software}` : null,
      d.urgency ? `Urgencia: ${d.urgency}` : null,
      d.message ? `Mensaje: ${d.message}` : null
    ].filter(Boolean).join('\n');

    // Save to leads table
    const supabase = getSupabaseAdmin();
    const { data: lead, error: leadErr } = await supabase
      .from('leads')
      .insert({
        name: d.name,
        email: d.email,
        phone: d.phone,
        client_type: d.company_type ?? 'empresa',
        category: 'presupuesto_avanzado',
        service: servicesSummary.slice(0, 200),
        message: fullMessage,
        state: 'new'
      })
      .select('id')
      .single();

    if (leadErr || !lead) {
      console.error('[presupuesto-avanzado] lead insert:', leadErr);
      return NextResponse.json({ error: 'No se pudo registrar la solicitud.' }, { status: 500 });
    }

    // Send emails
    const adminEmails = (process.env.ADMIN_EMAILS ?? 'soy@expertconsulting.es')
      .split(',').map((e) => e.trim()).filter(Boolean);

    await Promise.all([
      sendEmail({
        to: d.email,
        eventType: 'presupuesto_avanzado.requested',
        ...presupuestoAvanzadoRequested(d.name, d.company_name),
        metadata: { lead_id: lead.id }
      }),
      sendEmail({
        to: adminEmails,
        eventType: 'presupuesto_avanzado.admin',
        ...presupuestoAvanzadoAdmin({
          name: d.name,
          email: d.email,
          phone: d.phone,
          companyName: d.company_name,
          companyType: d.company_type,
          taxId: d.tax_id,
          employees: d.employees,
          annualBilling: d.annual_billing,
          currentSoftware: d.current_software,
          urgency: d.urgency,
          services: d.services,
          message: d.message
        }),
        metadata: { lead_id: lead.id }
      })
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[presupuesto-avanzado]', err);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
