import Link from 'next/link';
import { cookies } from 'next/headers';
import { AlertCircle, CheckCircle2, Clock3, CreditCard, ExternalLink, XCircle } from 'lucide-react';
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
  company_id: string | null;
  client: { name: string | null; email: string; phone: string | null; whatsapp_number: string | null } | null;
}

type CheckoutAttempt = {
  id: string;
  stripe_session_id: string;
  status: string;
  company_id: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
};

type Client360 = {
  profile: { id: string; full_name: string | null; email: string };
  checkoutSessions: CheckoutAttempt[];
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  active: { label: 'Activa', icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-green-50 text-green-700' },
  trialing: { label: 'Prueba', icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-blue-50 text-blue-700' },
  past_due: { label: 'Pago pendiente', icon: <AlertCircle className="h-4 w-4" />, color: 'bg-yellow-50 text-yellow-700' },
  canceled: { label: 'Cancelada', icon: <XCircle className="h-4 w-4" />, color: 'bg-gray-100 text-gray-500' },
  unpaid: { label: 'Sin pagar', icon: <AlertCircle className="h-4 w-4" />, color: 'bg-red-50 text-red-700' },
};

async function authHeaders() {
  const cookieStore = await cookies();
  return { cookie: cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ') };
}

async function getAdminSubscriptions(): Promise<Subscription[]> {
  try {
    const response = await fetch(absoluteAppUrl('/api/admin/subscriptions'), { headers: await authHeaders(), cache: 'no-store' });
    if (!response.ok) return [];
    const data = await response.json();
    return data.subscriptions as Subscription[];
  } catch { return []; }
}

async function getClient360(clientId?: string): Promise<Client360 | null> {
  if (!clientId) return null;
  try {
    const response = await fetch(absoluteAppUrl(`/api/admin/clientes/${clientId}`), { headers: await authHeaders(), cache: 'no-store' });
    if (!response.ok) return null;
    return await response.json() as Client360;
  } catch { return null; }
}

function metadataText(metadata: Record<string, unknown> | null, key: string) {
  const value = metadata?.[key];
  return typeof value === 'string' ? value : null;
}

function metadataNumber(metadata: Record<string, unknown> | null, key: string) {
  const value = metadata?.[key];
  return typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : null;
}

export default async function AdminSubscriptionsPage({ searchParams }: { searchParams: Promise<{ clientId?: string; companyId?: string }> }) {
  const params = await searchParams;
  const [allSubscriptions, client360] = await Promise.all([getAdminSubscriptions(), getClient360(params.clientId)]);
  const subscriptions = allSubscriptions.filter((sub) => {
    if (params.clientId && sub.client_id !== params.clientId) return false;
    if (params.companyId && sub.company_id !== params.companyId) return false;
    return true;
  });
  const checkouts = (client360?.checkoutSessions ?? []).filter((checkout) => !params.companyId || checkout.company_id === params.companyId);
  const active = subscriptions.filter((s) => s.status === 'active' || s.status === 'trialing');
  const contextual = Boolean(params.clientId || params.companyId);

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-12">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-8 flex items-center gap-3 text-sm font-semibold text-[#061321]">
          <CreditCard className="h-4 w-4" />
          <Link href={params.clientId ? `/admin/clientes/${params.clientId}` : '/admin'} className="underline underline-offset-4">{params.clientId ? 'Volver al Cliente 360' : 'Volver al panel'}</Link>
        </div>

        <div className="rounded-3xl border border-[#d8cbb5] bg-white p-8 shadow-lg">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-[#c88b25]">Facturación recurrente</p>
              <h1 className="mt-3 font-serif text-3xl font-bold text-[#07111d]">{contextual ? 'Stripe y suscripciones del cliente' : 'Suscripciones'}</h1>
              {contextual && <p className="mt-2 text-xs text-[#6b7280]">{client360?.profile.full_name || client360?.profile.email || 'Cliente'}{params.companyId ? ` · empresa ${params.companyId.slice(0, 8)}…` : ''}</p>}
            </div>
            <div className="flex gap-6 text-sm text-[#29384a]">
              <span><strong className="font-serif text-2xl text-[#07111d]">{active.length}</strong> activas</span>
              {contextual && <span><strong className="font-serif text-2xl text-[#07111d]">{checkouts.length}</strong> checkout(s)</span>}
              <span><strong className="font-serif text-2xl text-[#07111d]">{subscriptions.length}</strong> suscripción(es)</span>
            </div>
          </div>

          {contextual && (
            <section className="mb-8 rounded-2xl border border-[#e6dfd2] bg-[#faf8f2] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#c88b25]">Intentos de Checkout</p><p className="mt-1 text-sm text-[#29384a]">Historial registrado en EXPERT. No se crea, cancela ni modifica ninguna sesión desde esta lista.</p></div>{params.clientId && <Link href={`/admin/suscripciones/generar?clientId=${params.clientId}`} className="rounded-xl bg-[#07111d] px-4 py-2 text-xs font-bold text-white">Contratación / Checkout</Link>}</div>
              {checkouts.length === 0 ? <p className="mt-4 text-sm text-[#6b7280]">No hay Checkout registrados para este contexto.</p> : <div className="mt-4 space-y-3">{checkouts.map((checkout) => {
                const plan = metadataText(checkout.metadata, 'plan_name') ?? 'Suscripción EXPERT';
                const amount = metadataNumber(checkout.metadata, 'amount_eur');
                const emailSent = checkout.metadata?.email_sent === true;
                const isOpen = checkout.status === 'open';
                return <div key={checkout.id} className="rounded-xl border border-[#d8cbb5] bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#c88b25]" /><p className="text-sm font-bold text-[#07111d]">{plan}{amount ? ` · ${amount} €/mes + IVA` : ''}</p></div><p className="mt-1 font-mono text-[10px] text-[#6b7280]">{checkout.stripe_session_id}</p><p className="mt-1 text-xs text-[#6b7280]">Creado {new Date(checkout.created_at).toLocaleString('es-ES')} · Email EXPERT: {emailSent ? 'registrado' : 'sin registro'}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${isOpen ? 'bg-amber-100 text-amber-800' : checkout.status === 'complete' || checkout.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{checkout.status}</span></div>{isOpen && params.clientId && <div className="mt-3 flex flex-wrap gap-2"><Link href={`/admin/suscripciones/generar?clientId=${params.clientId}`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] px-3 py-2 text-xs font-bold text-[#29384a]"><ExternalLink className="h-3.5 w-3.5" />Gestionar Checkout abierto</Link><Link href={`/admin/clientes/${params.clientId}/comunicaciones`} className="rounded-lg border border-[#d8cbb5] px-3 py-2 text-xs font-bold text-[#29384a]">Revisar comunicaciones</Link></div>}</div>;
              })}</div>}
            </section>
          )}

          <h2 className="mb-4 font-serif text-xl font-bold text-[#07111d]">Suscripciones</h2>
          {subscriptions.length === 0 ? (
            <div className="rounded-3xl border border-[#d8cbb5] bg-[#f8f4eb] p-10 text-center text-[#29384a]">
              <p>No hay suscripciones registradas para este contexto.</p>
              {params.clientId && checkouts.length === 0 && <Link href={`/admin/suscripciones/generar?clientId=${params.clientId}`} className="mt-4 inline-block rounded-xl bg-[#07111d] px-4 py-2 text-xs font-bold text-white">Preparar contratación</Link>}
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => {
                const cfg = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.canceled;
                return <div key={sub.id} className="rounded-3xl border border-[#d8cbb5] bg-[#f8f4eb] p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-[#07111d]">{sub.plan_name}</p><p className="mt-1 text-xs text-[#29384a]">{sub.client?.name || sub.client?.email || sub.client_id.slice(0, 8)} · Desde {new Date(sub.created_at).toLocaleDateString('es-ES')}</p>{sub.client?.email && <p className="mt-1 text-xs text-[#8a9aab]">{sub.client.email}</p>}</div><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${cfg.color}`}>{cfg.icon} {cfg.label}</span></div>{sub.current_period_end && <p className="mt-3 text-xs text-[#29384a]">Próxima renovación: <strong>{new Date(sub.current_period_end).toLocaleDateString('es-ES')}</strong></p>}{sub.canceled_at && <p className="mt-2 text-xs text-gray-500">Cancelada el {new Date(sub.canceled_at).toLocaleDateString('es-ES')}</p>}<div className="mt-4"><Link href={`/admin/clientes/${sub.client_id}`} className="text-xs font-bold text-[#9a6a17]">Abrir Cliente 360 →</Link></div></div>;
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
