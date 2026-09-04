import { redirect } from 'next/navigation';
import { fetchWithCookies } from '@/lib/utils/server-fetch';
import PostCompraWizard from '@/components/dashboard/PostCompraWizard';
import PostCompraWaiting from '@/components/dashboard/PostCompraWaiting';
import { getCalOnboardingUrl } from '@/lib/utils/cal';

interface SubscriptionRecord {
  id: string;
  plan_name: string;
  status: string;
  post_purchase_onboarding_at: string | null;
}

interface Appointment {
  service: string;
  status: string;
}

interface HoldedStatus {
  connected: boolean;
}

export default async function PostCompraPage() {
  const [subsData, appointmentsData, holdedData] = await Promise.all([
    fetchWithCookies('/api/subscriptions'),
    fetchWithCookies('/api/dashboard/citas'),
    fetchWithCookies('/api/integrations/holded/status'),
  ]);

  const subscriptions: SubscriptionRecord[] = subsData?.subscriptions ?? [];
  const pendingSub = subscriptions.find(
    (s) => (s.status === 'active' || s.status === 'trialing') && !s.post_purchase_onboarding_at
  );
  const hasActiveSub = subscriptions.some(
    (s) => s.status === 'active' || s.status === 'trialing'
  );

  if (hasActiveSub && !pendingSub) redirect('/dashboard');
  if (!hasActiveSub) return <PostCompraWaiting />;

  const appointments: Appointment[] = appointmentsData?.appointments ?? [];
  const onboardingMeetingScheduled = appointments.some((appointment) =>
    appointment.status !== 'cancelled' && appointment.service.toLowerCase().includes('onboarding')
  );
  const holdedConnected = !!(holdedData as HoldedStatus | null)?.connected;

  return (
    <PostCompraWizard
      planName={pendingSub!.plan_name}
      onboardingMeetingScheduled={onboardingMeetingScheduled}
      onboardingUrl={getCalOnboardingUrl() ?? '/cita'}
      holdedConnected={holdedConnected}
    />
  );
}
