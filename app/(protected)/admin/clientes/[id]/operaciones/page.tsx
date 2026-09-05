'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileText,
  FolderOpen,
  Plug,
  ReceiptText,
  RefreshCw,
  SquareArrowOutUpRight,
  ListTodo,
} from 'lucide-react';

type Payload = {
  client: { id: string; name: string; email: string; activeCompanyId: string | null; status: string };
  companies: { id: string; name: string; nif: string | null; status: string | null }[];
  summary: {
    openTasks: number;
    overdueTasks: number;
    openCases: number;
    activeSubscriptions: number;
    documents: number;
    pendingDocuments: number;
    obligations: number;
    activeIntegrations: number;
    stripeInvoices: number;
    localOrders: number;
  };
  tasks: Array<{ id: string; title: string; description: string | null; status: string; priority: string; due_date: string | null; case_id: string | null; source: string }>;
  cases: Array<{ id: string; service: string; category: string | null; state: string; status: string; priority: string | null; next_action: string | null; company_id: string | null; opened_at: string; updated_at: string }>;
  subscriptions: Array<{ id: string; plan_name: string; status: string; company_id: string | null; current_period_start: string | null; current_period_end: string | null; stripe_subscription_id: string; created_at: string }>;
  checkoutSessions: Array<{ id: string; stripe_session_id: string; status: string; company_id: string | null; created_at: string; metadata: Record<string, unknown> | null }>;
  orders: Array<{ id: string; amount_eur: number; currency: string; status: string; source: string | null; company_id: string | null; holded_invoice_id: string | null; holded_sync_error: string | null; created_at: string; service_slugs: string[] | null }>;
  obligations: Array<{ id: string; company_id: string; kind: string; due_date: string; status: string | null; attendees: string[] | null }>;
  integrations: Array<{ id: string; provider: string; status: string; sync_mode: string | null; company_id: string | null; last_success_at: string | null; last_error: string | null }>;
  documents: Array<{ id: string; company_id: string | null; case_id: string | null; kind: string | null; state: string | null; created_at: string }>;
  stripeInvoices: Array<{ id: string; companyId: string; companyName: string; number: string | null; status: string | null; amountDue: number; amountPaid: number; currency: string; createdAt: string; hostedInvoiceUrl: string | null; invoicePdf: string | null }>;
  stripeErrors: Array<{ companyId: string; message: string }>;
};

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'ok' | 'warn' | 'danger' }) {
  const cls = tone === 'ok'
    ? 'bg-emerald-100 text-emerald-800'
    : tone === 'warn'
      ? 'bg-amber-100 text-amber-800'
      : tone === 'danger'
        ? 'bg-red-100 text-red-800'
        : 'bg-slate-100 text-slate-700';
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>{children}</span>;
}

function companyName(data: Payload, id: string | null) {
  return data.companies.find((company) => company.id === id)?.name ?? (id ? 'Entidad vinculada' : 'Sin entidad');
}

export default function ClientRecurringOperationsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch(`/api/admin/clientes/${id}/operations`, { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudieron cargar las operaciones del cliente');
      setData(json);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const openTasks = useMemo(() => (data?.tasks ?? []).filter((task) => task.status === 'pendiente' || task.status === 'en_progreso'), [data]);
  const openCases = useMemo(() => (data?.cases ?? []).filter((item) => item.state !== 'finalizado'), [data]);
  const activeSubscriptions = useMemo(() => (data?.subscriptions ?? []).filter((sub) => sub.status === 'active' || sub.status === 'trialing'), [data]);
  const today = new Date().toISOString().slice(0, 10);

  if (loading && !data) {
    return <main className="min-h-screen bg-[#f8f4eb] p-10 text-center text-sm text-[#6b7280]"><RefreshCw className="mx-auto mb-3 h-5 w-5 animate-spin" />Cargando operaciones recurrentes…</main>;
  }

  return (
    <main className="min-h-screen bg-[#f8f4eb] px-6 py-7 text-[#07111d]">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c88b25]">Cliente 360 · Gestión recurrente</p>
            <h1 className="mt-1 font-serif text-3xl font-bold">Operaciones</h1>
            <p className="mt-1 text-sm text-[#52606d]">{data?.client.name} · {data?.client.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/clientes/${id}/documentos`} className="rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-xs font-bold">Documentación</Link>
            <Link href={`/admin/clientes/${id}/integraciones`} className="rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-xs font-bold">Integraciones</Link>
            <button type="button" onClick={() => void load()} className="rounded-xl border border-[#d8cbb5] bg-white p-2.5" title="Actualizar"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
          </div>
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {data && (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <div className={`rounded-2xl border p-4 ${data.summary.overdueTasks ? 'border-red-200 bg-red-50' : 'border-[#d8cbb5] bg-white'}`}><p className="flex items-center gap-1.5 text-xs text-[#6b7280]"><ListTodo className="h-4 w-4" />Tareas abiertas</p><p className="mt-1 font-serif text-3xl font-bold">{data.summary.openTasks}</p><p className="text-[11px] text-[#6b7280]">{data.summary.overdueTasks} vencidas</p></div>
              <div className="rounded-2xl border border-[#d8cbb5] bg-white p-4"><p className="flex items-center gap-1.5 text-xs text-[#6b7280]"><FolderOpen className="h-4 w-4" />Expedientes abiertos</p><p className="mt-1 font-serif text-3xl font-bold">{data.summary.openCases}</p></div>
              <div className="rounded-2xl border border-[#d8cbb5] bg-white p-4"><p className="flex items-center gap-1.5 text-xs text-[#6b7280]"><CreditCard className="h-4 w-4" />Suscripciones</p><p className="mt-1 font-serif text-3xl font-bold">{data.summary.activeSubscriptions}</p></div>
              <div className="rounded-2xl border border-[#d8cbb5] bg-white p-4"><p className="flex items-center gap-1.5 text-xs text-[#6b7280]"><FileText className="h-4 w-4" />Documentos</p><p className="mt-1 font-serif text-3xl font-bold">{data.summary.documents}</p><p className="text-[11px] text-[#6b7280]">{data.summary.pendingDocuments} pendientes</p></div>
              <div className="rounded-2xl border border-[#d8cbb5] bg-white p-4"><p className="flex items-center gap-1.5 text-xs text-[#6b7280]"><ReceiptText className="h-4 w-4" />Facturas Stripe</p><p className="mt-1 font-serif text-3xl font-bold">{data.summary.stripeInvoices}</p><p className="text-[11px] text-[#6b7280]">{data.summary.localOrders} registros EXPERT</p></div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
                <div className="flex items-center justify-between"><h2 className="font-serif text-lg font-bold">Tareas y próximos pasos</h2><Link href={`/admin/tareas?clientId=${id}`} className="text-xs font-bold text-[#c88b25]">Abrir tareas →</Link></div>
                <div className="mt-4 space-y-3">
                  {openTasks.length === 0 ? <p className="text-sm text-[#6b7280]">Sin tareas operativas abiertas.</p> : openTasks.slice(0, 8).map((task) => {
                    const overdue = Boolean(task.due_date && task.due_date < today);
                    return <div key={task.id} className="rounded-xl border border-[#eee6d8] p-3"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{task.title}</p><Badge tone={overdue ? 'danger' : task.priority === 'alta' || task.priority === 'critica' ? 'warn' : 'neutral'}>{task.priority}</Badge><Badge>{task.source}</Badge></div>{task.description && <p className="mt-1 text-xs leading-5 text-[#52606d]">{task.description}</p>}<p className={`mt-2 text-[11px] ${overdue ? 'font-bold text-red-700' : 'text-[#8a9aab]'}`}>{task.due_date ? `Vence ${new Date(`${task.due_date}T12:00:00`).toLocaleDateString('es-ES')}` : 'Sin fecha límite'}</p></div>;
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
                <div className="flex items-center justify-between"><h2 className="font-serif text-lg font-bold">Expedientes</h2><Link href={`/admin/expedientes?clientId=${id}`} className="text-xs font-bold text-[#c88b25]">Ver todos →</Link></div>
                <div className="mt-4 space-y-3">
                  {openCases.length === 0 ? <p className="text-sm text-[#6b7280]">Sin expedientes abiertos.</p> : openCases.slice(0, 8).map((item) => <Link key={item.id} href={`/admin/expedientes/${item.id}`} className="block rounded-xl border border-[#eee6d8] p-3 hover:border-[#c88b25]"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{item.service}</p><Badge>{item.state}</Badge><Badge tone={item.priority === 'alta' || item.priority === 'critica' ? 'warn' : 'neutral'}>{item.priority ?? 'media'}</Badge></div>{item.next_action && <p className="mt-1 text-xs text-[#52606d]">Siguiente: {item.next_action}</p>}<p className="mt-2 text-[11px] text-[#8a9aab]">{companyName(data, item.company_id)}</p></Link>)}
                </div>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
                <div className="flex items-center justify-between"><h2 className="font-serif text-lg font-bold">Stripe y cobros</h2><Link href={`/admin/suscripciones?clientId=${id}`} className="text-xs font-bold text-[#c88b25]">Suscripciones →</Link></div>
                <div className="mt-4 space-y-3">
                  {activeSubscriptions.map((sub) => <div key={sub.id} className="rounded-xl border border-emerald-200 bg-emerald-50 p-3"><div className="flex flex-wrap items-center gap-2"><CreditCard className="h-4 w-4" /><p className="font-semibold">{sub.plan_name}</p><Badge tone="ok">{sub.status}</Badge></div><p className="mt-2 text-xs text-[#52606d]">{companyName(data, sub.company_id)}{sub.current_period_end ? ` · próximo periodo hasta ${new Date(sub.current_period_end).toLocaleDateString('es-ES')}` : ''}</p></div>)}
                  {data.stripeInvoices.slice(0, 8).map((invoice) => <div key={invoice.id} className="rounded-xl border border-[#eee6d8] p-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><ReceiptText className="h-4 w-4" /><p className="font-semibold">{invoice.number ?? 'Factura Stripe'}</p><Badge tone={invoice.status === 'paid' ? 'ok' : invoice.status === 'open' ? 'warn' : 'neutral'}>{invoice.status ?? 'sin estado'}</Badge></div><p className="mt-1 text-xs text-[#52606d]">{invoice.companyName} · {invoice.amountPaid.toFixed(2)} {invoice.currency} pagados</p></div><div className="flex gap-2">{invoice.hostedInvoiceUrl && <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-[#d8cbb5] px-2.5 py-1.5 text-[11px] font-bold">Abrir <SquareArrowOutUpRight className="ml-1 inline h-3 w-3" /></a>}{invoice.invoicePdf && <a href={invoice.invoicePdf} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-[#d8cbb5] px-2.5 py-1.5 text-[11px] font-bold">PDF</a>}</div></div></div>)}
                  {!activeSubscriptions.length && !data.stripeInvoices.length && <p className="text-sm text-[#6b7280]">Sin suscripciones activas ni facturas Stripe todavía.</p>}
                  {data.stripeErrors.length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"><AlertTriangle className="mr-1 inline h-4 w-4" />No se pudo leer Stripe para {data.stripeErrors.length} entidad(es). Los registros locales siguen visibles.</div>}
                </div>
              </div>

              <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
                <h2 className="font-serif text-lg font-bold">Plazos y calendario</h2>
                <div className="mt-4 space-y-3">
                  {data.obligations.length === 0 ? <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"><CalendarClock className="mr-2 inline h-4 w-4" />No hay obligaciones configuradas en `obligations_calendar`. Hasta que se carguen, las fechas operativas se gestionan mediante Tareas.</div> : data.obligations.slice(0, 12).map((item) => <div key={item.id} className="rounded-xl border border-[#eee6d8] p-3"><div className="flex flex-wrap items-center gap-2"><CalendarClock className="h-4 w-4" /><p className="font-semibold">{item.kind}</p><Badge>{item.status ?? 'planned'}</Badge></div><p className="mt-1 text-xs text-[#52606d]">{companyName(data, item.company_id)} · {new Date(`${item.due_date}T12:00:00`).toLocaleDateString('es-ES')}</p></div>)}
                </div>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
                <div className="flex items-center justify-between"><h2 className="font-serif text-lg font-bold">Documentación</h2><Link href={`/admin/clientes/${id}/documentos`} className="text-xs font-bold text-[#c88b25]">Documentación 360º →</Link></div>
                <div className="mt-4 grid grid-cols-3 gap-3"><div className="rounded-xl bg-[#fbf8f2] p-3"><p className="text-[11px] text-[#6b7280]">Total</p><p className="text-2xl font-bold">{data.summary.documents}</p></div><div className="rounded-xl bg-[#fbf8f2] p-3"><p className="text-[11px] text-[#6b7280]">Pendientes</p><p className="text-2xl font-bold">{data.summary.pendingDocuments}</p></div><div className="rounded-xl bg-[#fbf8f2] p-3"><p className="text-[11px] text-[#6b7280]">Con Drive/Storage</p><p className="text-2xl font-bold">{data.documents.length}</p></div></div>
              </div>

              <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
                <div className="flex items-center justify-between"><h2 className="font-serif text-lg font-bold">Integraciones</h2><Link href={`/admin/clientes/${id}/integraciones`} className="text-xs font-bold text-[#c88b25]">Gestionar →</Link></div>
                <div className="mt-4 space-y-3">{data.integrations.length === 0 ? <p className="text-sm text-[#6b7280]">Sin integraciones registradas.</p> : data.integrations.map((integration) => <div key={integration.id} className="rounded-xl border border-[#eee6d8] p-3"><div className="flex flex-wrap items-center gap-2"><Plug className="h-4 w-4" /><p className="font-semibold capitalize">{integration.provider}</p><Badge tone={integration.status === 'active' ? 'ok' : integration.last_error ? 'danger' : 'neutral'}>{integration.status}</Badge></div><p className="mt-1 text-xs text-[#52606d]">{companyName(data, integration.company_id)}{integration.last_success_at ? ` · última OK ${new Date(integration.last_success_at).toLocaleString('es-ES')}` : ''}</p>{integration.last_error && <p className="mt-1 text-xs text-red-700">{integration.last_error}</p>}</div>)}</div>
              </div>
            </section>

            <div className="rounded-2xl border border-[#d8cbb5] bg-white p-4 text-xs text-[#52606d]">
              <Building2 className="mr-1 inline h-4 w-4" />Esta vista no modifica Stripe, Holded, documentos históricos ni obligaciones. Agrega fuentes existentes para gestión operativa del cliente.
            </div>
          </>
        )}
      </div>
    </main>
  );
}
