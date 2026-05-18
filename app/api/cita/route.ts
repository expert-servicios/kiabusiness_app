import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { citaRequested, citaRequestAdmin } from '@/lib/email/templates';
import { verifyRecaptchaToken } from '@/lib/utils/recaptcha';
import { checkSpam, checkRateLimit, getClientIp } from '@/lib/utils/spam-guard';
import { notifyAdmins } from '@/lib/integrations/push';

const SERVICES = [
  'Consulta fiscal',
  'Declaración de la renta (IRPF)',
  'Asesoría de empresa',
  'Extranjería y residencia',
  'Constitución de sociedad',
  'Gestión de Holded',
  'Otro / Sin definir'
] as const;

const TIME_SLOTS = ['Mañana (9h–13h)', 'Tarde (15h–19h)', 'Indiferente'] as const;

const schema = z.object({
  hp_url:         z.string().optional(),
  name:           z.string().min(2).max(100),
  email:          z.string().email(),
  phone:          z.string().min(6).max(25).optional(),
  service:        z.string().min(2).max(120),
  preferred_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  preferred_time: z.string().min(1).max(60),
  notes:          z.string().max(600).optional(),
  recaptcha_token: z.string().optional()
});

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

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' },
        { status: 400 }
      );
    }

    const d = parsed.data;

    const spam = checkSpam({ name: d.name, email: d.email, message: d.notes });
    if (spam.isSpam) return NextResponse.json({ ok: true });

    const recaptcha = await verifyRecaptchaToken({
      token: String(d.recaptcha_token ?? ''),
      action: 'booking'
    });
    if (!recaptcha.ok) {
      return NextResponse.json({ error: 'Verificación anti-spam fallida. Inténtalo de nuevo.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: appt, error } = await supabase
      .from('appointments')
      .insert({
        name: d.name,
        email: d.email,
        phone: d.phone ?? null,
        service: d.service,
        appointment_type: d.service,
        preferred_date: d.preferred_date,
        preferred_time: d.preferred_time,
        notes: d.notes ?? null,
        status: 'pending'
      })
      .select('id')
      .single();

    if (error || !appt) {
      console.error('[cita] insert:', error);
      return NextResponse.json({ error: 'No se pudo registrar la solicitud.' }, { status: 500 });
    }

    const preferredDateFormatted = new Date(d.preferred_date + 'T12:00:00').toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    const adminEmails = (process.env.ADMIN_EMAILS ?? 'soy@expertconsulting.es')
      .split(',').map((e) => e.trim()).filter(Boolean);

    await Promise.all([
      sendEmail({
        to: d.email,
        eventType: 'cita.requested',
        ...citaRequested(d.name, d.service, preferredDateFormatted, d.preferred_time),
        metadata: { appointment_id: appt.id }
      }),
      sendEmail({
        to: adminEmails,
        eventType: 'cita.request.admin',
        ...citaRequestAdmin({
          name: d.name,
          email: d.email,
          phone: d.phone,
          service: d.service,
          preferredDate: preferredDateFormatted,
          preferredTime: d.preferred_time,
          notes: d.notes,
          appointmentId: appt.id
        }),
        metadata: { appointment_id: appt.id }
      })
    ]);

    notifyAdmins({
      title: `📅 Nueva cita: ${d.name}`,
      body: `${d.service} · ${preferredDateFormatted} ${d.preferred_time}`,
      url: '/admin/citas',
      tag: `cita-${appt.id}`,
    }).catch(() => {});

    return NextResponse.json({ ok: true, id: appt.id });
  } catch (err) {
    console.error('[cita]', err);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}

export { SERVICES, TIME_SLOTS };
