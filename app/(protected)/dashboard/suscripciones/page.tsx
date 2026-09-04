import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, Building2 } from 'lucide-react';
import { CustomerPortalButton } from '@/components/subscriptions/CustomerPortalButton';
import { SubscriptionPlanCards } from '@/components/subscriptions/SubscriptionPlanCards';
import { fetchWithCookies } from '@/lib/utils/server-fetch';

interface SubscriptionRecord {
  id: string;
  plan_name: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
  created_at: string;
}

interface CompanyContext {
  id: string;
  razon_social: string;
  forma_juridica: string;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  active: { label: 'Activa', icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-green-100 text-green-800' },
  trialing: { label: 'Prueba', icon: <RefreshCw className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
  past_due: { label: 'Pago pendiente', icon: <AlertCircle className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-800' },
  canceled: { label: 'Cancelada', icon: <AlertCircle className="h-4 w-4" />, color: 'bg-gray-100 text-gray-600' },
  unpaid: { label: 'Sin pagar', icon: <AlertCircle className="h-4 w-4" />, color: 'bg-red-100 text-red-800' }
};

async function getSubscriptions(): Promise<{ subscriptions: SubscriptionRecord[]; company: CompanyContext | null }> {
  const data = await fetchWithCookies<{ subscriptions: SubscriptionRecord[]; company: CompanyContext | null }>('/api/subscriptions');
  return { subscriptions: data?.subscriptions ?? [], company: data?.company ?? null };
}

interface PageProps {
  searchParams: Promise<{ billing?: string; plan?: string }>;
}

export default async function SubscriptionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialBilling: 'mensual' | 'anual' = params.billing === 'anual' ? 'anual' : 'mensual';

  const { subscriptions, company } = await getSubscriptions();
  const activeSubscriptions = subscriptions.filter((s) => s.status === 'active' || s.status === 'trialing');
  const hasActive = activeSubscriptions.length > 0;

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-12">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-8 flex items-center gap-3 text-sm font-semibold text-[#061321]">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/dashboard" className="underline underline-offset-4">Volver a mi panel</Link>
        </div>

        <div className="rounded-3xl border border-[#d8cbb5] bg-white p-8 shadow-lg">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[#c88b25]">Suscripciones</p>
              <h1 className="mt-3 font-serif text-3xl font-bold text-[#07111d]">Tus suscripciones</h1>
            </div>
            {hasActive ? <CustomerPortalButton /> : null}
          </div>

          {company ? (
            <div className="mb-8 flex items-center gap-3 rounded-2xl border border-[#e7dcc7] bg-[#f8f4eb] px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d7a33a]/15 text-[#a86f16]">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#8a7963]">Entidad activa</p>
                <p className="text-sm font-semibold text-[#07111d]">{company.razon_social}</p>
                <p className="text-xs text-[#6f6254]">
                  {company.forma_juridica === 'autonomo' ? 'Empresario individual / autónomo' : 'Sociedad / entidad'}
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Selecciona o crea una entidad fiscal antes de contratar una suscripción.
            </div>
          )}

          {subscriptions.length > 0 ? (
            <div className="mb-10 space-y-4">
              {subscriptions.map((sub: SubscriptionRecord) => {
                const cfg = statusConfig[sub.status] ?? statusConfig.canceled;
                return (
                  <div key={sub.id} className="rounded-3xl border border-[#d8cbb5] bg-[#f8f4eb] p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-[#07111d]">{sub.plan_name}</p>
                        <p className="mt-1 text-xs text-[#29384a]">
                          Desde {new Date(sub.created_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${cfg.color}`}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </div>
                    {sub.current_period_end ? (
                      <p className="mt-3 text-sm text-[#29384a]">
                        Próxima renovación:{' '}
                        <strong>{new Date(sub.current_period_end).toLocaleDateString('es-ES')}</strong>
                      </p>
                    ) : null}
                    {sub.canceled_at ? (
                      <p className="mt-3 text-sm text-red-600">
                        Cancelada el {new Date(sub.canceled_at).toLocaleDateString('es-ES')}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}

          {!hasActive && company ? (
            <div>
              <p className="mb-8 text-[#29384a]">
                {subscriptions.length > 0
                  ? 'La suscripción de esta entidad ha finalizado. Elige un plan para retomar el servicio.'
                  : `Elige el plan que contratará ${company.razon_social}.`}
              </p>
              <SubscriptionPlanCards
                planSupervisionMonthlyId={process.env.STRIPE_PLAN_MONTHLY_49 ?? ''}
                planAvanzadoMonthlyId={process.env.STRIPE_PLAN_MONTHLY_99 ?? ''}
                planColaborativoMonthlyId={process.env.STRIPE_PLAN_MONTHLY_199 ?? ''}
                planSupervisionAnnualId={process.env.STRIPE_PLAN_ANNUAL_49 ?? ''}
                planAvanzadoAnnualId={process.env.STRIPE_PLAN_ANNUAL_99 ?? ''}
                planColaborativoAnnualId={process.env.STRIPE_PLAN_ANNUAL_199 ?? ''}
                initialBilling={initialBilling}
              />
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
