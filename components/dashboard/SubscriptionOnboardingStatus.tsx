import Link from 'next/link';
import { Calendar, CheckCircle2, Plug, ArrowRight } from 'lucide-react';
import { fetchWithCookies } from '@/lib/utils/server-fetch';

interface SubscriptionRecord {
  status: string;
  plan_name: string;
  post_purchase_onboarding_at: string | null;
}

interface Appointment {
  service: string;
  status: string;
}

interface ConnectionStatus {
  connected: boolean;
}

export async function SubscriptionOnboardingStatus() {
  const subsData = await fetchWithCookies('/api/subscriptions');
  const subscriptions: SubscriptionRecord[] = subsData?.subscriptions ?? [];
  const activePlan = subscriptions.find((s) => s.status === 'active' || s.status === 'trialing');

  if (!activePlan || activePlan.post_purchase_onboarding_at) return null;

  const [appointmentsData, directData, authorizedData] = await Promise.all([
    fetchWithCookies('/api/dashboard/citas'),
    fetchWithCookies('/api/integrations/holded/status'),
    fetchWithCookies('/api/integrations/holded/mcp-status'),
  ]);

  const appointments: Appointment[] = appointmentsData?.appointments ?? [];
  const meetingScheduled = appointments.some((appointment) =>
    appointment.status !== 'cancelled' && appointment.service.toLowerCase().includes('onboarding')
  );
  const holdedConnected =
    !!(directData as ConnectionStatus | null)?.connected ||
    !!(authorizedData as ConnectionStatus | null)?.connected;

  const completeCount = Number(meetingScheduled) + Number(holdedConnected);
  const nextLabel = !meetingScheduled
    ? 'Siguiente: agenda tu reunión de onboarding'
    : !holdedConnected
      ? 'Siguiente: conecta Holded'
      : 'Revisa y finaliza el onboarding';

  return (
    <div className="border-b border-[#d8cbb5] bg-[#fffaf0] px-4 py-3 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#a86f16]">
            Alta de {activePlan.plan_name} · {completeCount}/2 pasos
          </div>
          <p className="mt-1 text-sm font-semibold text-[#07111d]">{nextLabel}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#6f6254]">
            <span className="inline-flex items-center gap-1.5">
              {meetingScheduled ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Calendar className="h-3.5 w-3.5 text-[#c88b25]" />}
              Reunión {meetingScheduled ? 'reservada' : 'pendiente'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              {holdedConnected ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Plug className="h-3.5 w-3.5 text-[#c88b25]" />}
              Holded {holdedConnected ? 'conectado' : 'pendiente'}
            </span>
          </div>
        </div>
        <Link
          href="/dashboard/post-compra"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#07111d] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2e45]"
        >
          Continuar alta
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
