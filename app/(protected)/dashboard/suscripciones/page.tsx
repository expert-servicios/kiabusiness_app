import Link from 'next/link';
import { cookies } from 'next/headers';
import { ArrowLeft, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { CustomerPortalButton } from '@/components/subscriptions/CustomerPortalButton';
import { SubscriptionCheckoutButton } from '@/components/subscriptions/SubscriptionCheckoutButton';

interface SubscriptionRecord {
  id: string;
  plan_name: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
  created_at: string;
}

const plans = [
  {
    name: 'Plan Básico',
    price: '€99/mes',
    envKey: 'STRIPE_PLAN_MONTHLY_99',
    features: ['Asesoría fiscal básica', 'Hasta 2 trámites/mes', 'Soporte por email']
  },
  {
    name: 'Plan Estándar',
    price: '€199/mes',
    envKey: 'STRIPE_PLAN_MONTHLY_199',
    features: ['Asesoría fiscal y laboral', 'Hasta 5 trámites/mes', 'Soporte prioritario']
  },
  {
    name: 'Plan Premium',
    price: '€349/mes',
    envKey: 'STRIPE_PLAN_MONTHLY_349',
    features: ['Asesoría integral', 'Trámites ilimitados', 'Gestor dedicado', 'WhatsApp directo']
  }
];

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  active: { label: 'Activa', icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-green-100 text-green-800' },
  trialing: { label: 'Prueba', icon: <RefreshCw className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
  past_due: { label: 'Pago pendiente', icon: <AlertCircle className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-800' },
  canceled: { label: 'Cancelada', icon: <AlertCircle className="h-4 w-4" />, color: 'bg-gray-100 text-gray-600' },
  unpaid: { label: 'Sin pagar', icon: <AlertCircle className="h-4 w-4" />, color: 'bg-red-100 text-red-800' }
};

async function getSubscriptions(): Promise<SubscriptionRecord[]> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/subscriptions`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store'
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data.subscriptions as SubscriptionRecord[];
}

export default async function SubscriptionsPage() {
  const subscriptions = await getSubscriptions();
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
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[#c88b25]">Suscripciones</p>
              <h1 className="mt-3 font-serif text-3xl font-bold text-[#07111d]">Tus suscripciones</h1>
            </div>
            {hasActive ? <CustomerPortalButton /> : null}
          </div>

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

          {!hasActive ? (
            <div>
              <p className="mb-8 text-[#29384a]">
                {subscriptions.length > 0
                  ? 'Tu suscripción ha finalizado. Elige un plan para retomar el servicio.'
                  : 'Elige un plan mensual y deja que nos ocupemos de tus trámites.'}
              </p>
              <div className="grid gap-6 md:grid-cols-3">
                {plans.map((plan) => {
                  const priceId = process.env[plan.envKey as keyof typeof process.env] ?? '';
                  return (
                    <div
                      key={plan.name}
                      className="flex flex-col rounded-3xl border border-[#d8cbb5] bg-[#f8f4eb] p-6"
                    >
                      <p className="text-sm uppercase tracking-[0.2em] text-[#c88b25]">{plan.name}</p>
                      <p className="mt-2 font-serif text-3xl font-bold text-[#07111d]">{plan.price}</p>
                      <ul className="mt-4 flex-1 space-y-2">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm text-[#29384a]">
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#c88b25]" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6">
                        {priceId ? (
                          <SubscriptionCheckoutButton priceId={priceId} label="Suscribirse" />
                        ) : (
                          <p className="text-xs text-[#29384a]">Plan no disponible aún</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
