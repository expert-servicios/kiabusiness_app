import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const bodySchema = z.object({ subscriptionId: z.string().uuid() });

// Marks exactly one post-purchase onboarding as complete.
// The server re-validates the two canonical steps so the client UI cannot bypass them:
// 1) a non-cancelled onboarding appointment exists for the authenticated email;
// 2) Holded is connected either directly for the contracting company or through
//    the authorized connector/access-token flow for the authenticated user.
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user?.email) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'subscriptionId requerido' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: subscription, error: subscriptionError } = await admin
    .from('subscriptions')
    .select('id,company_id,status,post_purchase_onboarding_at')
    .eq('id', parsed.data.subscriptionId)
    .eq('client_id', user.id)
    .in('status', ['active', 'trialing'])
    .maybeSingle();

  if (subscriptionError) {
    console.error('[post-compra/complete] subscription lookup:', subscriptionError.message);
    return NextResponse.json({ error: 'No se pudo validar la suscripción' }, { status: 500 });
  }
  if (!subscription) {
    return NextResponse.json({ error: 'Suscripción activa no encontrada' }, { status: 404 });
  }
  if (subscription.post_purchase_onboarding_at) {
    return NextResponse.json({ ok: true, alreadyCompleted: true });
  }

  const { data: appointments, error: appointmentError } = await admin
    .from('appointments')
    .select('id,service,status')
    .eq('email', user.email)
    .neq('status', 'cancelled');

  if (appointmentError) {
    console.error('[post-compra/complete] appointments:', appointmentError.message);
    return NextResponse.json({ error: 'No se pudo validar la reunión de onboarding' }, { status: 500 });
  }

  const meetingScheduled = (appointments ?? []).some((appointment) =>
    String(appointment.service ?? '').toLowerCase().includes('onboarding')
  );
  if (!meetingScheduled) {
    return NextResponse.json(
      { error: 'Agenda la reunión de onboarding antes de finalizar el alta.', code: 'onboarding_meeting_required' },
      { status: 409 }
    );
  }

  let directHoldedConnected = false;
  if (subscription.company_id) {
    const { data: directIntegration, error: directError } = await admin
      .from('client_integrations')
      .select('id')
      .eq('provider', 'holded')
      .eq('company_id', subscription.company_id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();
    if (directError) {
      console.error('[post-compra/complete] direct Holded:', directError.message);
      return NextResponse.json({ error: 'No se pudo validar la conexión directa con Holded' }, { status: 500 });
    }
    directHoldedConnected = !!directIntegration;
  }

  const { data: authorizedConnection, error: authorizedError } = await admin
    .from('holded_mcp_connections')
    .select('id')
    .eq('supabase_user_id', user.id)
    .eq('channel', 'claude')
    .eq('status', 'connected')
    .limit(1)
    .maybeSingle();
  if (authorizedError) {
    console.error('[post-compra/complete] authorized Holded connection:', authorizedError.message);
    return NextResponse.json({ error: 'No se pudo validar la conexión autorizada con Holded' }, { status: 500 });
  }

  let authorizedHoldedConnected = !!authorizedConnection;
  if (!authorizedHoldedConnected) {
    const { data: authorizedEvent, error: eventError } = await admin
      .from('holded_mcp_events')
      .select('id')
      .eq('user_email', user.email)
      .in('event_type', ['user_connected', 'first_activity'])
      .eq('channel', 'claude')
      .order('detected_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (eventError) {
      console.error('[post-compra/complete] authorized Holded event:', eventError.message);
      return NextResponse.json({ error: 'No se pudo validar el token de acceso de Holded' }, { status: 500 });
    }
    authorizedHoldedConnected = !!authorizedEvent;
  }

  if (!directHoldedConnected && !authorizedHoldedConnected) {
    return NextResponse.json(
      { error: 'Conecta Holded antes de finalizar el alta.', code: 'holded_required' },
      { status: 409 }
    );
  }

  const { data: updated, error: updateError } = await admin
    .from('subscriptions')
    .update({ post_purchase_onboarding_at: new Date().toISOString() })
    .eq('id', subscription.id)
    .eq('client_id', user.id)
    .in('status', ['active', 'trialing'])
    .is('post_purchase_onboarding_at', null)
    .select('id')
    .maybeSingle();

  if (updateError) {
    console.error('[post-compra/complete]', updateError.message);
    return NextResponse.json({ error: 'No se pudo guardar la finalización del onboarding' }, { status: 500 });
  }
  if (!updated) {
    return NextResponse.json({ ok: true, alreadyCompleted: true });
  }

  return NextResponse.json({ ok: true });
}