import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { isStaffRole } from '@/lib/auth/roles';
import { loadOnboardingAppointmentsForIdentity } from '@/lib/admin/onboarding-booking-identity';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: actor } = await admin.from('profiles').select('role,status').eq('id', user.id).single();
  if (actor?.status === 'inactive' || !isStaffRole(actor?.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id: clientId } = await params;
  const [{ data: subscriptions, error }, { data: authUser }] = await Promise.all([
    admin.from('subscriptions').select('id,status,company_id,post_purchase_onboarding_at,created_at').eq('client_id', clientId).order('created_at', { ascending: false }),
    admin.auth.admin.getUserById(clientId),
  ]);

  if (error) {
    console.error('[admin/clientes/onboarding-state]', error.message);
    return NextResponse.json({ error: 'No se pudo cargar el estado de onboarding' }, { status: 500 });
  }

  const active = (subscriptions ?? []).find((sub) => sub.status === 'active' || sub.status === 'trialing') ?? null;
  const email = authUser.user?.email ?? '';
  let meetingScheduled = false;
  let meetingOccurred = false;
  let meetingDate: string | null = null;

  try {
    const appointments = await loadOnboardingAppointmentsForIdentity(admin, clientId, active?.company_id, email);
    const onboarding = appointments.find((appointment) =>
      String(appointment.appointment_type ?? '').toLowerCase() === 'onboarding'
      || String(appointment.service ?? '').toLowerCase().includes('onboarding')
    );
    if (onboarding) {
      meetingScheduled = true;
      meetingDate = onboarding.appointment_date ?? (onboarding.confirmed_date ? `${onboarding.confirmed_date}T${onboarding.confirmed_time ?? '00:00'}:00` : null);
      if (meetingDate) {
        const parsed = new Date(meetingDate);
        meetingOccurred = !Number.isNaN(parsed.getTime()) && parsed <= new Date();
      }
    }
  } catch (appointmentError) {
    console.error('[admin/clientes/onboarding-state] booking identity:', appointmentError);
    return NextResponse.json({ error: 'No se pudo validar la reunión de onboarding' }, { status: 500 });
  }

  let holdedConnected = false;
  if (active?.company_id) {
    const { data: integration } = await admin
      .from('client_integrations')
      .select('id')
      .eq('provider', 'holded')
      .eq('company_id', active.company_id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();
    holdedConnected = Boolean(integration);
  }
  if (!holdedConnected) {
    const [{ data: connection }, { data: holdedEvent }] = await Promise.all([
      admin.from('holded_mcp_connections').select('id').eq('supabase_user_id', clientId).eq('channel', 'claude').eq('status', 'connected').limit(1).maybeSingle(),
      email ? admin.from('holded_mcp_events').select('id').eq('user_email', email).in('event_type', ['user_connected', 'first_activity']).eq('channel', 'claude').limit(1).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    holdedConnected = Boolean(connection || holdedEvent);
  }

  return NextResponse.json({
    activeSubscriptionId: active?.id ?? null,
    companyId: active?.company_id ?? null,
    completedAt: active?.post_purchase_onboarding_at ?? null,
    completed: Boolean(active?.post_purchase_onboarding_at),
    meetingScheduled,
    meetingOccurred,
    meetingDate,
    holdedConnected,
    canAdminComplete: Boolean(active && !active.post_purchase_onboarding_at && meetingOccurred && holdedConnected),
  });
}
