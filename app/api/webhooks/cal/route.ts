import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { getSupabaseAdmin, listAllAuthUsers } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { caseOpened, citaConfirmed } from '@/lib/email/templates';
import { deleteCalendarEventSA, hasCalendarSA, upsertCalendarEventSA } from '@/lib/integrations/google-calendar';
import { ensureOnboardingTask, findOpenOnboardingCase, getAdminEmails } from '@/lib/admin/onboarding-followup';

function verifySignature(body: string, header: string | null): boolean {
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const expected = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
  try {
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(header, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch { return false; }
}

interface CalAttendee { name: string; email: string; timeZone?: string }
interface CalPayload {
  uid: string;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
  attendees?: CalAttendee[];
  videoCallUrl?: string | null;
  cancellationReason?: string | null;
  rescheduled?: boolean;
  previousStartTime?: string | null;
  eventType?: { title?: string; slug?: string } | null;
  organizer?: { email?: string } | null;
  responses?: Record<string, { value?: unknown }> | null;
}

const SLUG_SERVICE: Record<string, { category: string; service: string }> = {
  onboarding: { category: 'onboarding', service: 'Sesión de onboarding' },
  formacion: { category: 'formacion', service: 'Formación Holded' },
};

function responseString(payload: CalPayload, keys: string[]): string {
  const responses = payload.responses ?? {};
  for (const key of keys) {
    const value = responses[key]?.value;
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

async function resolveAuthUser(email: string) {
  const normalized = email.trim().toLowerCase();
  const authUsers = await listAllAuthUsers();
  return authUsers.find((user) => (user.email ?? '').trim().toLowerCase() === normalized) ?? null;
}

async function ensureCaseForBooking(
  admin: ReturnType<typeof getSupabaseAdmin>,
  attendee: CalAttendee,
  payload: CalPayload,
): Promise<{ clientId: string; caseId: string } | null> {
  try {
    const authUser = await resolveAuthUser(attendee.email);
    if (!authUser) return null;
    const slug = payload.eventType?.slug ?? '';
    const meta = SLUG_SERVICE[slug] ?? { category: 'general', service: payload.eventType?.title ?? payload.title };

    if (slug === 'onboarding') {
      const existingOnboarding = await findOpenOnboardingCase(authUser.id);
      if (existingOnboarding) {
        await admin.from('cases').update({
          next_action: `Onboarding reservado para ${payload.startTime}. Verificar Holded y finalizar el alta.`,
          updated_at: new Date().toISOString(),
        }).eq('id', existingOnboarding.id);
        return { clientId: authUser.id, caseId: existingOnboarding.id };
      }
    }

    const { data: existing } = await admin
      .from('cases')
      .select('id')
      .eq('client_id', authUser.id)
      .eq('service', meta.service)
      .neq('state', 'finalizado')
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) return { clientId: authUser.id, caseId: existing.id };

    const { data: newCase, error } = await admin
      .from('cases')
      .insert({
        client_id: authUser.id,
        category: meta.category,
        service: meta.service,
        state: 'en_proceso',
        status: 'nuevo',
        next_action: slug === 'onboarding' ? 'Verificar Holded y finalizar el alta' : null,
        admin_note: `Expediente creado automáticamente desde reserva Cal.com (${payload.uid})`,
        opened_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !newCase) {
      console.error('[cal/webhook] ensureCaseForBooking insert:', error?.message);
      return null;
    }

    const { data: profile } = await admin.from('profiles').select('full_name').eq('id', authUser.id).single();
    const name = profile?.full_name ?? attendee.name;
    sendEmail({
      to: attendee.email,
      eventType: 'case.opened',
      ...caseOpened(name, meta.service, null, ''),
      metadata: { case_id: newCase.id, source: 'cal_booking', cal_uid: payload.uid },
      idempotencyKey: `cal/case-opened/${payload.uid}`,
    }).catch((e: unknown) => console.error('[cal/webhook] case.opened email:', e));

    return { clientId: authUser.id, caseId: newCase.id };
  } catch (err) {
    console.error('[cal/webhook] ensureCaseForBooking:', err instanceof Error ? err.message : err);
    return null;
  }
}

async function notifyAdminBooking(attendee: CalAttendee, payload: CalPayload, slug: string) {
  const adminEmails = getAdminEmails();
  if (!adminEmails.length) return;
  const service = payload.eventType?.title ?? payload.title;
  const meeting = payload.videoCallUrl ? `<p><strong>Reunión:</strong> ${payload.videoCallUrl}</p>` : '';
  await sendEmail({
    to: adminEmails,
    eventType: 'onboarding.booking.admin',
    subject: `Reserva ${service} — ${attendee.name}`,
    html: `<p>Nueva reserva administrativa registrada en EXPERT.</p><p><strong>Cliente:</strong> ${attendee.name} (${attendee.email})</p><p><strong>Servicio:</strong> ${service}</p><p><strong>Inicio:</strong> ${payload.startTime}</p>${meeting}`,
    metadata: { cal_uid: payload.uid, slug, client_email: attendee.email },
    idempotencyKey: `cal/admin-booking/${payload.uid}`,
  });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!verifySignature(rawBody, request.headers.get('x-cal-signature-256'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: { triggerEvent: string; payload: CalPayload };
  try { event = JSON.parse(rawBody); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { triggerEvent, payload } = event;
  const admin = getSupabaseAdmin();

  try {
    if (triggerEvent === 'BOOKING_CREATED') {
      const attendee = payload.attendees?.[0];
      const slug = payload.eventType?.slug ?? '';
      const meetingUrl = payload.videoCallUrl ?? null;
      const confirmedDate = payload.startTime.slice(0, 10);
      const confirmedTime = payload.startTime.slice(11, 16);
      const phone = responseString(payload, ['phone', 'telefono', 'teléfono', 'mobile']);

      const { data: appointment, error: upsertError } = await admin.from('appointments').upsert({
        cal_uid: payload.uid,
        name: attendee?.name ?? '',
        email: attendee?.email ?? '',
        phone,
        appointment_type: slug || 'cal_booking',
        appointment_date: payload.startTime,
        service: payload.eventType?.title ?? payload.title,
        status: 'confirmed',
        confirmed_date: confirmedDate,
        confirmed_time: confirmedTime,
        meeting_url: meetingUrl,
        notes: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'cal_uid' }).select('id,google_event_id').single();

      if (upsertError || !appointment) {
        console.error('[cal/webhook] BOOKING_CREATED appointments upsert failed:', upsertError?.message, 'uid:', payload.uid);
      }

      let caseContext: { clientId: string; caseId: string } | null = null;
      if ((slug === 'onboarding' || slug === 'formacion') && attendee?.email) {
        caseContext = await ensureCaseForBooking(admin, attendee, payload);
      }

      if (slug === 'onboarding' && caseContext) {
        const { data: activeSubscription } = await admin
          .from('subscriptions')
          .select('id')
          .eq('client_id', caseContext.clientId)
          .in('status', ['active', 'trialing'])
          .is('post_purchase_onboarding_at', null)
          .limit(1)
          .maybeSingle();
        if (activeSubscription) {
          await ensureOnboardingTask({
            clientId: caseContext.clientId,
            caseId: caseContext.caseId,
            dueDate: confirmedDate,
            priority: 'alta',
            description: `Onboarding reservado para ${confirmedDate} ${confirmedTime}. Verificar conexión Holded y finalizar el alta después de la sesión.`,
          });
        }
      }

      if ((slug === 'onboarding' || slug === 'formacion') && appointment && hasCalendarSA()) {
        const eventId = await upsertCalendarEventSA({
          summary: `${slug === 'onboarding' ? 'Onboarding' : 'Formación'} — ${attendee?.name ?? 'Cliente'}`,
          description: `Cliente: ${attendee?.name ?? ''} (${attendee?.email ?? ''})\nServicio: ${payload.eventType?.title ?? payload.title}${meetingUrl ? `\nReunión: ${meetingUrl}` : ''}`,
          date: confirmedDate,
          startTime: confirmedTime,
          endTime: payload.endTime.slice(11, 16),
          reminderMinutesBefore: [1440, 60],
        }, appointment.google_event_id ?? undefined);
        if (eventId) await admin.from('appointments').update({ google_event_id: eventId }).eq('id', appointment.id);
      }

      if (attendee?.email && ['reunion', 'demo', 'academy-admision', 'onboarding', 'formacion'].includes(slug)) {
        const dateLabel = new Date(`${confirmedDate}T12:00:00`).toLocaleDateString('es-ES', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        });
        sendEmail({
          to: attendee.email,
          eventType: slug === 'onboarding' ? 'onboarding.booking.confirmed' : 'cita.confirmed',
          ...citaConfirmed(attendee.name, payload.eventType?.title ?? payload.title, dateLabel, confirmedTime, meetingUrl),
          metadata: { cal_uid: payload.uid, slug },
          idempotencyKey: `cal/client-confirmation/${payload.uid}`,
        }).catch((e: unknown) => console.error('[cal/webhook] citaConfirmed email:', e));
      }

      if ((slug === 'onboarding' || slug === 'formacion') && attendee) {
        notifyAdminBooking(attendee, payload, slug).catch((e) => console.error('[cal/webhook] admin booking email:', e));
      }

      console.log(JSON.stringify({ webhook: 'cal', event: 'BOOKING_CREATED', uid: payload.uid, slug, hasMeetingUrl: !!meetingUrl }));
    }

    if (triggerEvent === 'BOOKING_CANCELLED') {
      const { data: appointment } = await admin.from('appointments').select('id,google_event_id').eq('cal_uid', payload.uid).maybeSingle();
      const { error: cancelError } = await admin
        .from('appointments')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('cal_uid', payload.uid);
      if (cancelError) console.error('[cal/webhook] BOOKING_CANCELLED update failed:', cancelError.message, 'uid:', payload.uid);
      if (appointment?.google_event_id && hasCalendarSA()) {
        deleteCalendarEventSA(appointment.google_event_id).catch((e) => console.error('[cal/webhook] calendar delete:', e));
      }
      console.log(JSON.stringify({ webhook: 'cal', event: 'BOOKING_CANCELLED', uid: payload.uid }));
    }

    if (triggerEvent === 'BOOKING_RESCHEDULED') {
      const confirmedDate = payload.startTime.slice(0, 10);
      const confirmedTime = payload.startTime.slice(11, 16);
      const { data: appointment, error: rescheduleError } = await admin
        .from('appointments')
        .update({
          appointment_date: payload.startTime,
          confirmed_date: confirmedDate,
          confirmed_time: confirmedTime,
          status: 'confirmed',
          meeting_url: payload.videoCallUrl ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('cal_uid', payload.uid)
        .select('id,name,email,service,google_event_id')
        .maybeSingle();
      if (rescheduleError) console.error('[cal/webhook] BOOKING_RESCHEDULED update failed:', rescheduleError.message, 'uid:', payload.uid);
      if (appointment?.google_event_id && hasCalendarSA()) {
        const eventId = await upsertCalendarEventSA({
          summary: `Onboarding / cita — ${appointment.name}`,
          description: `Cliente: ${appointment.name} (${appointment.email})\nServicio: ${appointment.service ?? ''}${payload.videoCallUrl ? `\nReunión: ${payload.videoCallUrl}` : ''}`,
          date: confirmedDate,
          startTime: confirmedTime,
          endTime: payload.endTime.slice(11, 16),
          reminderMinutesBefore: [1440, 60],
        }, appointment.google_event_id);
        if (eventId) await admin.from('appointments').update({ google_event_id: eventId }).eq('id', appointment.id);
      }
      console.log(JSON.stringify({ webhook: 'cal', event: 'BOOKING_RESCHEDULED', uid: payload.uid }));
    }
  } catch (err) {
    console.error('[cal/webhook] unhandled error processing', triggerEvent, payload.uid, err instanceof Error ? err.message : err);
  }

  return NextResponse.json({ ok: true });
}
