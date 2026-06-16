import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';

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
  cancellationReason?: string | null;
  rescheduled?   : boolean;
  previousStartTime?: string | null;
  eventType?     : { title?: string; slug?: string } | null;
  organizer?     : { email?: string } | null;
  responses?     : Record<string, { value?: unknown }> | null;
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
    await admin.from('appointments').upsert({
      cal_uid      : payload.uid,
      name         : attendee?.name ?? '',
      email        : attendee?.email ?? '',
      service      : payload.eventType?.title ?? payload.title,
      status       : 'confirmed',
      confirmed_date: payload.startTime.slice(0, 10),
      confirmed_time: payload.startTime.slice(11, 16),
      meeting_url  : null,
      notes        : null,
      updated_at   : new Date().toISOString(),
    }, { onConflict: 'cal_uid' });

    console.log(JSON.stringify({ webhook: 'cal', event: 'BOOKING_CREATED', uid: payload.uid }));
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
        updated_at    : new Date().toISOString(),
      })
      .eq('cal_uid', payload.uid);

    console.log(JSON.stringify({ webhook: 'cal', event: 'BOOKING_RESCHEDULED', uid: payload.uid }));
  }

  return NextResponse.json({ ok: true });
}
