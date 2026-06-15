import Link from 'next/link';
import { cookies } from 'next/headers';
import { CreditCard, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { absoluteAppUrl } from '@/lib/utils/app-url';

export interface Subscription {
  id: string;
  plan_name: string;
  status: string;
  stripe_customer_id: string;
  current_period_end: string | null;
  canceled_at: string | null;
  created_at: string;
  client_id: string;
  client: {
    name: string | null;
    email: string;
    phone: string | null;
    whatsapp_number: string | null;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  active: { label: 'Activa', icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-green-50 text-green-700' },
  trialing: { label: 'Prueba', icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-blue-50 text-blue-700' },
  past_due: { label: 'Pago pendiente', icon: <AlertCircle className="h-4 w-4" />, color: 'bg-yellow-50 text-yellow-700' },
  canceled: { label: 'Cancelada', icon: <XCircle className="h-4 w-4" />, color: 'bg-gray-100 text-gray-500' },
  unpaid: { label: 'Sin pagar', icon: <AlertCircle className="h-4 w-4" />, color: 'bg-red-50 text-red-700' }
};

async function getAdminSubscriptions(): Promise<Subscription[]> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
    const response = await fetch(absoluteAppUrl('/api/admin/subscriptions'), {
      headers: { cookie: cookieHeader },
      cache: 'no-store'
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.subscriptions as Subscription[];
  } catch {
    return [];
  }
}

export default async function AdminSubscriptionsPage() {
  const subscriptions = await getAdminSubscriptions();
  const active = subscriptions.filter((s) => s.status === 'active' || s.status === 'trialing');
  const revenue = active.length;

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-12">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-8 flex items-center gap-3 text-sm font-semibold text-[#061321]">
          <CreditCard className="h-4 w-4" />
          <Link href="/admin" className="underline underline-offset-4">Volver al panel</Link>
        </div>

        <div className="rounded-3xl border border-[#d8cbb5] bg-white p-8 shadow-lg">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[#c88b25]">Facturación recurrente</p>
              <h1 className="mt-3 font-serif text-3xl font-bold text-[#07111d]">Suscripciones</h1>
            </div>
            <div className="flex gap-6 text-sm text-[#29384a]">
              <span><strong className="text-[#07111d] font-serif text-2xl">{revenue}</strong> activas</span>
              <span><strong className="text-[#07111d] font-serif text-2xl">{subscriptions.length}</strong> total</span>
            </div>
          </div>

          {subscriptions.length === 0 ? (
            <div className="rounded-3xl border border-[#d8cbb5] bg-[#f8f4eb] p-10 text-center text-[#29384a]">
              No hay suscripciones registradas todavía.
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => {
                const cfg = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.canceled;
                return (
                  <div key={sub.id} className="rounded-3xl border border-[#d8cbb5] bg-[#f8f4eb] p-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-[#07111d]">{sub.plan_name}</p>
                        <p className="mt-1 text-xs text-[#29384a]">
                          Cliente: <code className="rounded bg-white px-1">{sub.client_id.slice(0, 8)}…</code>
                          {' · '}Desde {new Date(sub.created_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                    </div>
                    {sub.current_period_end ? (
                      <p className="mt-3 text-xs text-[#29384a]">
                        Próxima renovación: <strong>{new Date(sub.current_period_end).toLocaleDateString('es-ES')}</strong>
                      </p>
                    ) : null}
                    {sub.canceled_at ? (
                      <p className="mt-2 text-xs text-gray-500">
                        Cancelada el {new Date(sub.canceled_at).toLocaleDateString('es-ES')}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
