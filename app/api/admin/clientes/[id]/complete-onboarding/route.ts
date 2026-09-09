import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmailOnce } from '@/lib/email/send';
import { onboardingReviewRequestEmail, responsibleClientWelcomeEmail } from '@/lib/email/onboarding-templates';
import { loadOnboardingAppointmentsForIdentity } from '@/lib/admin/onboarding-booking-identity';
import { completeOnboardingTask } from '@/lib/admin/onboarding-followup';

const bodySchema = z.object({ subscriptionId: z.string().uuid() });

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role,status').eq('id', user.id).single();
  if (profile?.status === 'inactive' || !['admin', 'owner'].includes(profile?.role ?? '')) return null;
  return { admin, actorId: user.id };
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { admin, actorId } = auth;
  const { id: clientId } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'subscriptionId requerido' }, { status: 400 });

  const { data: subscription, error: subscriptionError } = await admin
    .from('subscriptions')
    .select('id,client_id,company_id,status,plan_name,post_purchase_onboarding_at')
    .eq('id', parsed.data.subscriptionId)
    .eq('client_id', clientId)
    .in('status', ['active', 'trialing'])
    .maybeSingle();
  if (subscriptionError) return NextResponse.json({ error: 'No se pudo validar la suscripción' }, { status: 500 });
  if (!subscription) return NextResponse.json({ error: 'Suscripción activa no encontrada' }, { status: 404 });

  const [{ data: authUser }, { data: profile }, { data: company }] = await Promise.all([
    admin.auth.admin.getUserById(clientId),
    admin.from('profiles').select('full_name').eq('id', clientId).maybeSingle(),
    subscription.company_id
      ? admin.from('companies').select('razon_social').eq('id', subscription.company_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const clientEmail = authUser.user?.email ?? '';
  if (!clientEmail) return NextResponse.json({ error: 'El cliente no tiene email de acceso' }, { status: 409 });

  const now = new Date();
  let appointments;
  try {
    appointments = await loadOnboardingAppointmentsForIdentity(admin, clientId, subscription.company_id, clientEmail);
  } catch (appointmentError) {
    console.error('[admin complete onboarding] booking identity:', appointmentError);
    return NextResponse.json({ error: 'No se pudo validar la reunión de onboarding' }, { status: 500 });
  }

  const completedMeeting = appointments.find((appointment) => {
    const onboarding = String(appointment.appointment_type ?? '').toLowerCase() === 'onboarding'
      || String(appointment.service ?? '').toLowerCase().includes('onboarding');
    const meetingAt = appointment.appointment_date
      ? new Date(appointment.appointment_date)
      : appointment.confirmed_date
        ? new Date(`${appointment.confirmed_date}T${appointment.confirmed_time ?? '00:00'}:00`)
        : null;
    return onboarding && meetingAt && !Number.isNaN(meetingAt.getTime()) && meetingAt <= now;
  });
  if (!completedMeeting) {
    return NextResponse.json({ error: 'La reunión de onboarding debe haberse celebrado antes de cerrar el alta.', code: 'onboarding_meeting_not_completed' }, { status: 409 });
  }

  let holdedReady = false;
  if (subscription.company_id) {
    const { data: directIntegration, error: directError } = await admin
      .from('client_integrations')
      .select('id')
      .eq('provider', 'holded')
      .eq('client_id', clientId)
      .eq('company_id', subscription.company_id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();
    if (directError) return NextResponse.json({ error: 'No se pudo validar Holded' }, { status: 500 });
    holdedReady = Boolean(directIntegration);
  } else {
    const [{ data: authorizedConnection }, { data: authorizedEvent }] = await Promise.all([
      admin.from('holded_mcp_connections').select('id').eq('supabase_user_id', clientId).eq('channel', 'claude').eq('status', 'connected').limit(1).maybeSingle(),
      admin.from('holded_mcp_events').select('id').eq('user_email', clientEmail).in('event_type', ['user_connected', 'first_activity']).eq('channel', 'claude').order('detected_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    holdedReady = Boolean(authorizedConnection || authorizedEvent);
  }
  if (!holdedReady) {
    return NextResponse.json({ error: 'La conexión de Holded de esta entidad debe estar validada antes de cerrar el alta.', code: 'holded_required' }, { status: 409 });
  }

  let onboardingCaseQuery = admin
    .from('cases')
    .select('id')
    .eq('client_id', clientId)
    .in('service', ['Alta de usuario', 'Sesión de onboarding'])
    .neq('state', 'finalizado');
  onboardingCaseQuery = subscription.company_id
    ? onboardingCaseQuery.eq('company_id', subscription.company_id)
    : onboardingCaseQuery.is('company_id', null);
  const { data: onboardingCase } = await onboardingCaseQuery
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const completedAt = subscription.post_purchase_onboarding_at ?? now.toISOString();
  if (!subscription.post_purchase_onboarding_at) {
    const { data: updated, error: updateError } = await admin
      .from('subscriptions')
      .update({ post_purchase_onboarding_at: completedAt })
      .eq('id', subscription.id)
      .eq('client_id', clientId)
      .is('post_purchase_onboarding_at', null)
      .select('id')
      .maybeSingle();
    if (updateError) return NextResponse.json({ error: 'No se pudo guardar la finalización del onboarding' }, { status: 500 });
    if (!updated) return NextResponse.json({ error: 'El estado del onboarding cambió durante la operación. Actualiza la ficha.' }, { status: 409 });
  }

  try {
    await completeOnboardingTask(clientId, subscription.company_id);
  } catch (taskError) {
    console.error('[admin complete onboarding] task completion:', taskError instanceof Error ? taskError.message : taskError);
  }

  const clientName = profile?.full_name ?? clientEmail.split('@')[0];
  const companyName = company?.razon_social ?? 'tu entidad';
  const welcome = responsibleClientWelcomeEmail({ name: clientName, companyName, planName: subscription.plan_name });
  await sendEmailOnce({
    to: clientEmail,
    eventType: 'onboarding.completed.client',
    ...welcome,
    metadata: { subscription_id: subscription.id, client_id: clientId, company_id: subscription.company_id, actor_id: actorId, onboarding_phase: 'completed' },
    idempotencyKey: `onboarding/completed/client/${subscription.id}`,
  });

  let reviewSent = false;
  if (onboardingCase?.id) {
    let { data: reviewRequest } = await admin
      .from('review_requests')
      .select('id,token,expires_at')
      .eq('case_id', onboardingCase.id)
      .eq('client_id', clientId)
      .eq('status', 'pending')
      .not('token', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!reviewRequest?.token) {
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: createdRequest, error: reviewError } = await admin
        .from('review_requests')
        .insert({ case_id: onboardingCase.id, client_id: clientId, token, expires_at: expiresAt, status: 'pending', sent_at: new Date().toISOString() })
        .select('id,token,expires_at')
        .single();
      if (reviewError) console.error('[admin complete onboarding] review request:', reviewError.message);
      reviewRequest = createdRequest ?? null;
    }

    if (reviewRequest?.token) {
      const review = onboardingReviewRequestEmail({ name: clientName, token: reviewRequest.token });
      await sendEmailOnce({
        to: clientEmail,
        eventType: 'onboarding.review_request',
        ...review,
        metadata: { subscription_id: subscription.id, client_id: clientId, company_id: subscription.company_id, case_id: onboardingCase.id, onboarding_phase: 'review' },
        idempotencyKey: `onboarding/review/${subscription.id}`,
      });
      reviewSent = true;
    }
  }

  return NextResponse.json({ ok: true, completedAt, reviewSent });
}
