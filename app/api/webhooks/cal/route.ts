import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { caseOpened, citaConfirmed } from '@/lib/email/templates';

// Cal.com sends X-Cal-Signature-256: sha256=<hmac> using CAL_WEBHOOK_SECRET
function verifySignature(body: string, header: string | null): boolean {
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const expected = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
  try {
    const a = Buffer.from(expected, 'utf8');
    const b = Buffer.from(header,   'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch { return false; }
}

interface CalAttendee { name: string; email: string; timeZone?: string }
interface CalPayload {
  uid            : string;
  title          : string;
  startTime      : string;
  endTime        : string;
  status         : string;
  attendees?     : CalAttendee[];
  videoCallUrl?  : string | null;
  cancellationReason?: string | null;
  rescheduled?   : boolean;
  previousStartTime?: string | null;
  eventType?     : { title?: string; slug?: string } | null;
  organizer?     : { email?: string } | null;
  responses?     : Record<string, { value?: unknown }> | null;
}

// Slug → human-readable service label
const SLUG_SERVICE: Record<string, { category: string; service: string }> = {
  onboarding: { category: 'onboarding', service: 'Sesión de onboarding' },
  formacion  : { category: 'formacion',  service: 'Formación Holded'     },
};

async function autoCreateCase(
  admin: ReturnType<typeof getSupabaseAdmin>,
  attendee: CalAttendee,
  payload: CalPayload,
) {
  try {
    // Look up the user by email
    const { data: authList } = await admin.auth.admin.listUsers();
    const authUser = authList?.users.find((u) => u.email === attendee.email);
    if (!authUser) return; // attendee has no account — skip case creation

    // Check if a case already exists for this slot (idempotent)
    const { data: existing } = await admin
      .from('cases')
      .select('id')
      .eq('client_id', authUser.id)
      .eq('service', SLUG_SERVICE[payload.eventType?.slug ?? '']?.service ?? payload.title)
      .gte('opened_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .maybeSingle();
    if (existing) return;

    const meta = SLUG_SERVICE[payload.eventType?.slug ?? ''] ?? {
      category: 'general',
      service : payload.eventType?.title ?? payload.title,
    };

    const { data: newCase, error } = await admin
      .from('cases')
      .insert({
        client_id : authUser.id,
        category  : meta.category,
        service   : meta.service,
        state     : 'nuevo',
        status    : 'nuevo',
        admin_note: `Expediente creado automáticamente desde reserva Cal.com (${payload.uid})`,
        opened_at : new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !newCase) {
      console.error('[cal/webhook] autoCreateCase insert error:', error?.message);
      return;
    }

    // Send welcome email with the open case
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', authUser.id)
      .single();

    const name = profile?.full_name ?? attendee.name;
    sendEmail({
      to        : attendee.email,
      eventType : 'case.opened',
      ...caseOpened(name, meta.service, null, ''),
      metadata  : { case_id: newCase.id, source: 'cal_booking' },
    }).catch((e: unknown) => console.error('[cal/webhook] case.opened email:', e));

    console.log(JSON.stringify({ webhook: 'cal', action: 'auto_case_created', case_id: newCase.id, uid: payload.uid }));
  } catch (err) {
    console.error('[cal/webhook] autoCreateCase:', err instanceof Error ? err.message : err);
  }
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

  if (triggerEvent === 'BOOKING_CREATED') {
    const attendee = payload.attendees?.[0];
    const slug     = payload.eventType?.slug ?? '';

    const meetingUrl = payload.videoCallUrl ?? null;
    const confirmedDate = payload.startTime.slice(0, 10);
    const confirmedTime = payload.startTime.slice(11, 16);

    await admin.from('appointments').upsert({
      cal_uid       : payload.uid,
      name          : attendee?.name ?? '',
      email         : attendee?.email ?? '',
      service       : payload.eventType?.title ?? payload.title,
      status        : 'confirmed',
      confirmed_date: confirmedDate,
      confirmed_time: confirmedTime,
      meeting_url   : meetingUrl,
      notes         : null,
      updated_at    : new Date().toISOString(),
    }, { onConflict: 'cal_uid' });

    // Auto-create case for onboarding/formacion bookings when the attendee
    // has an existing user account (no payment went through Stripe for this booking).
    if ((slug === 'onboarding' || slug === 'formacion') && attendee?.email) {
      await autoCreateCase(admin, attendee, payload);
    }

    // Send branded confirmation email for reunion / demo bookings.
    // Cal.com sends its own generic confirmation; ours adds brand and meeting link.
    if ((slug === 'reunion' || slug === 'demo') && attendee?.email) {
      const dateLabel = new Date(confirmedDate + 'T12:00:00').toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      });
      sendEmail({
        to       : attendee.email,
        eventType: 'cita.confirmed',
        ...citaConfirmed(attendee.name, payload.eventType?.title ?? payload.title, dateLabel, confirmedTime, meetingUrl),
        metadata : { cal_uid: payload.uid, slug },
      }).catch((e: unknown) => console.error('[cal/webhook] citaConfirmed email:', e));
    }

    console.log(JSON.stringify({ webhook: 'cal', event: 'BOOKING_CREATED', uid: payload.uid, slug, hasMeetingUrl: !!meetingUrl }));
  }

  if (triggerEvent === 'BOOKING_CANCELLED') {
    await admin
      .from('appointments')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('cal_uid', payload.uid);

    console.log(JSON.stringify({ webhook: 'cal', event: 'BOOKING_CANCELLED', uid: payload.uid }));
  }

  if (triggerEvent === 'BOOKING_RESCHEDULED') {
    await admin
      .from('appointments')
      .update({
        confirmed_date: payload.startTime.slice(0, 10),
        confirmed_time: payload.startTime.slice(11, 16),
        status        : 'confirmed',
        meeting_url   : payload.videoCallUrl ?? null,
        updated_at    : new Date().toISOString(),
      })
      .eq('cal_uid', payload.uid);

    console.log(JSON.stringify({ webhook: 'cal', event: 'BOOKING_RESCHEDULED', uid: payload.uid }));
  }

  return NextResponse.json({ ok: true });
}
