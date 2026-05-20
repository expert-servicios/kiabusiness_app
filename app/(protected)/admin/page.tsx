import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  AlertCircle, ArrowRight, CheckCircle2, CreditCard,
  FileText, FolderOpen, Mail, MessageCircle,
  TrendingUp, UserCheck, Users, Zap
} from 'lucide-react';
import { InstallPwaPrompt } from '@/components/InstallPwaPrompt';
import { CASE_ACTION_GROUPS, countCaseStates } from '@/lib/utils/case-states';
import {
  RevenueChart,
  CasesDonut,
  QuotesFunnel,
  EmailDeliveryBar
} from '@/components/admin/AdminDashboardCharts';

interface AdminStats {
  totalUsers: number;
  pendingQuotes: number;
  activeCases: number;
  totalRevenue: number;
}

interface AdminReports {
  totalRevenue: number;
  revenueByMonth: { month: string; revenue: number }[];
  casesByState: Record<string, number>;
  quotesByStatus: Record<string, number>;
  emailStats: { total: number; delivered: number; bounced: number; failed: number };
  subsByPlan: Record<string, number>;
  activeSubs: number;
  paymentIssuesCount: number;
  clientMessagesAwaitingResponse: number;
  leadsCount?: number;
  newsletterCount?: number;
}

async function fetchAdmin<T>(path: string, fallback: T): Promise<T> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${path}`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store'
    });
    if (!res.ok) return fallback;
    return res.json();
  } catch {
    return fallback;
  }
}

function StatCard({
  icon: Icon,
  value,
  label,
  sub,
  href,
  accent = false
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  sub?: string;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex flex-col justify-between rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
        accent
          ? 'border-[#d7a33a]/40 bg-gradient-to-br from-[#07111d] to-[#0d1f35] text-white'
          : 'border-[#d8cbb5] bg-white'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-2.5 ${accent ? 'bg-[#d7a33a]/20 text-[#d7a33a]' : 'bg-[#c88b25]/10 text-[#c88b25]'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className={`font-serif text-3xl font-bold tabular-nums ${accent ? 'text-[#d7a33a]' : 'text-[#07111d]'}`}>
          {value}
        </p>
      </div>
      <div className="mt-4">
        <p className={`text-sm font-semibold ${accent ? 'text-[#f8f4eb]' : 'text-[#07111d]'}`}>{label}</p>
        {sub && (
          <p className={`mt-0.5 text-xs ${accent ? 'text-[#9CA3AF]' : 'text-[#29384a]'}`}>{sub}</p>
        )}
        <p className={`mt-2 text-xs font-bold transition group-hover:translate-x-0.5 ${accent ? 'text-[#d7a33a]' : 'text-[#c88b25]'}`}>
          Ver detalle →
        </p>
      </div>
    </Link>
  );
}

export default async function AdminPage() {
  const [stats, reports] = await Promise.all([
    fetchAdmin<AdminStats>('/api/admin/stats', {
      totalUsers: 0, pendingQuotes: 0, activeCases: 0, totalRevenue: 0
    }),
    fetchAdmin<AdminReports>('/api/admin/reports', {
      totalRevenue: 0,
      revenueByMonth: [],
      casesByState: {},
      quotesByStatus: {},
      emailStats: { total: 0, delivered: 0, bounced: 0, failed: 0 },
      subsByPlan: {},
      activeSubs: 0,
      paymentIssuesCount: 0,
      clientMessagesAwaitingResponse: 0
    })
  ]);

  // Action counts
  const quotesNeedingResponse   = reports.quotesByStatus?.draft ?? 0;
  const quotesAwaitingClient    = reports.quotesByStatus?.sent  ?? 0;
  const casesPendingDocs        = countCaseStates(reports.casesByState, CASE_ACTION_GROUPS.pendingDocs);
  const casesDocsToReview       = countCaseStates(reports.casesByState, CASE_ACTION_GROUPS.docsToReview);
  const casesInProgress         = countCaseStates(reports.casesByState, CASE_ACTION_GROUPS.inProgress);
  const casesWaitingExternal    = countCaseStates(reports.casesByState, CASE_ACTION_GROUPS.waitingExternal);
  const casesReadyToDeliver     = countCaseStates(reports.casesByState, CASE_ACTION_GROUPS.readyToDeliver);
  const paymentIssuesCount      = reports.paymentIssuesCount ?? 0;
  const clientMsgs              = reports.clientMessagesAwaitingResponse ?? 0;

  const urgentCount  = quotesNeedingResponse + casesPendingDocs + casesDocsToReview + casesReadyToDeliver + paymentIssuesCount + clientMsgs;
  const followUpCount = quotesAwaitingClient + casesInProgress + casesWaitingExternal;

  const totalRevenue = reports.totalRevenue ?? stats.totalRevenue ?? 0;
  const activeSubs   = reports.activeSubs ?? 0;
  const emailDeliveryRate = reports.emailStats?.total > 0
    ? Math.round((reports.emailStats.delivered / reports.emailStats.total) * 100)
    : null;

  // MRR estimate from active subscriptions (rough: if we have subsByPlan we can sum)
  const subsByPlan = reports.subsByPlan ?? {};
  const planNames  = Object.keys(subsByPlan);

  return (
    <main className="min-h-screen bg-[#f8f4eb]">

      {/* ── HEADER ── */}
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#07111d] md:text-3xl">Panel de administración</h1>
              <p className="mt-1 text-sm text-[#29384a]">
                {urgentCount > 0
                  ? `⚠ ${urgentCount} acción${urgentCount !== 1 ? 'es' : ''} requiere${urgentCount === 1 ? '' : 'n'} atención inmediata`
                  : '✓ Sin acciones urgentes pendientes'}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/expedientes"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-xs font-semibold text-[#07111d] transition hover:border-[#c88b25]"
              >
                <FolderOpen className="h-3.5 w-3.5" /> Expedientes
              </Link>
              <Link
                href="/admin/reportes"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#07111d] px-4 py-2 text-xs font-semibold text-[#d7a33a] transition hover:bg-[#0d1f35]"
              >
                <TrendingUp className="h-3.5 w-3.5" /> Reportes
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">

        {/* ── PWA INSTALL CTA ── */}
        <InstallPwaPrompt variant="inline" />

        {/* ── ALERTA DE ACCIONES URGENTES ── */}
        {urgentCount > 0 && (
          <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50">
            <div className="flex items-center gap-3 border-b border-amber-200 px-6 py-4">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <h2 className="font-serif text-base font-bold text-amber-900">Requiere atención ahora</h2>
              <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                {urgentCount}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3">
              {[
                { count: quotesNeedingResponse, label: 'presupuesto por preparar', sub: 'Sin propuesta enviada aún', href: '/admin/presupuestos' },
                { count: casesPendingDocs, label: 'expediente esperando docs', sub: 'Cliente no ha subido archivos', href: '/admin/expedientes' },
                { count: casesDocsToReview, label: 'expediente con docs por revisar', sub: 'Documentación recibida pendiente', href: '/admin/expedientes' },
                { count: casesReadyToDeliver, label: 'resolución por entregar', sub: 'Resultado listo para el cliente', href: '/admin/expedientes' },
                { count: clientMsgs, label: 'mensaje de cliente sin responder', sub: 'Último mensaje enviado por el cliente', href: '/admin/expedientes' },
                { count: paymentIssuesCount, label: 'pago recurrente con incidencia', sub: 'Suscripción past_due o unpaid', href: '/admin/suscripciones' }
              ].filter((item) => item.count > 0).map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between gap-4 border-b border-amber-100 px-6 py-4 last:border-b-0 transition hover:bg-amber-100 sm:border-r sm:last:border-r-0"
                >
                  <div>
                    <p className="font-semibold text-amber-900">
                      <span className="text-lg">{item.count}</span>{' '}
                      {item.count !== 1 ? item.label.replace(/^(presupuesto|expediente|resolución|mensaje|pago)/, '$1s') : item.label}
                    </p>
                    <p className="mt-0.5 text-xs text-amber-700">{item.sub}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-amber-500" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── EN SEGUIMIENTO ── */}
        {followUpCount > 0 && (
          <div className="overflow-hidden rounded-2xl border border-blue-200 bg-blue-50">
            <div className="flex items-center gap-3 border-b border-blue-200 px-6 py-4">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              <h2 className="font-serif text-base font-bold text-blue-900">En seguimiento</h2>
            </div>
            <div className="grid sm:grid-cols-3">
              {[
                { count: quotesAwaitingClient, label: 'presupuesto enviado', sub: 'Esperando aprobación del cliente', href: '/admin/presupuestos' },
                { count: casesInProgress, label: 'expediente en tramitación', sub: 'Gestiones en curso', href: '/admin/expedientes' },
                { count: casesWaitingExternal, label: 'expediente pendiente de organismo', sub: 'Esperando respuesta externa', href: '/admin/expedientes' }
              ].filter((item) => item.count > 0).map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center justify-between gap-4 border-b border-blue-100 px-6 py-4 last:border-b-0 transition hover:bg-blue-100 sm:border-b-0 sm:border-r sm:last:border-r-0"
                >
                  <div>
                    <p className="font-semibold text-blue-900">
                      <span className="text-lg">{item.count}</span>{' '}
                      {item.count !== 1 ? item.label.replace(/^(presupuesto|expediente)/, '$1s') : item.label}
                    </p>
                    <p className="mt-0.5 text-xs text-blue-700">{item.sub}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-blue-500" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {urgentCount === 0 && followUpCount === 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
            <p className="text-sm font-semibold text-green-800">Todo al día — sin acciones pendientes</p>
          </div>
        )}

        {/* ── KPIs principales ── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            icon={CreditCard}
            value={totalRevenue > 0 ? `€${totalRevenue.toLocaleString('es-ES', { maximumFractionDigits: 0 })}` : '—'}
            label="Ingresos totales"
            sub="Pagos completados"
            href="/admin/reportes"
            accent
          />
          <StatCard
            icon={FolderOpen}
            value={stats.activeCases}
            label="Expedientes activos"
            sub={`${urgentCount} requieren atención`}
            href="/admin/expedientes"
          />
          <StatCard
            icon={Zap}
            value={activeSubs}
            label="Suscripciones activas"
            sub={paymentIssuesCount > 0 ? `${paymentIssuesCount} con incidencia` : 'Sin incidencias'}
            href="/admin/suscripciones"
          />
          <StatCard
            icon={Users}
            value={stats.totalUsers}
            label="Usuarios registrados"
            sub="Clientes en la plataforma"
            href="/admin/usuarios"
          />
          <StatCard
            icon={UserCheck}
            value={reports.leadsCount ?? 0}
            label="Leads captados"
            sub="Solicitudes de presupuesto"
            href="/admin/presupuestos"
          />
          <StatCard
            icon={Mail}
            value={reports.newsletterCount ?? 0}
            label="Suscriptores email"
            sub="Lista de newsletter"
            href="/admin/reportes"
          />
        </div>

        {/* ── GRÁFICOS ── */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Ingresos mensuales — 2/3 ancho */}
          <div className="lg:col-span-2 rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c88b25]">Ingresos</p>
                <h3 className="mt-1 font-serif text-lg font-bold text-[#07111d]">Últimos 6 meses</h3>
              </div>
              {totalRevenue > 0 && (
                <span className="rounded-full bg-[#d7a33a]/10 px-3 py-1 text-sm font-bold text-[#c88b25]">
                  €{totalRevenue.toLocaleString('es-ES', { maximumFractionDigits: 0 })} total
                </span>
              )}
            </div>
            <RevenueChart data={reports.revenueByMonth ?? []} />
          </div>

          {/* Expedientes por estado — 1/3 ancho */}
          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c88b25]">Expedientes</p>
            <h3 className="mt-1 font-serif text-lg font-bold text-[#07111d]">Por estado</h3>
            <div className="mt-4">
              <CasesDonut casesByState={reports.casesByState ?? {}} />
            </div>
          </div>
        </div>

        {/* ── SEGUNDA FILA DE MÉTRICAS ── */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* Funnel de presupuestos */}
          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#c88b25]" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c88b25]">Presupuestos</p>
                <h3 className="font-serif text-base font-bold text-[#07111d]">Embudo de conversión</h3>
              </div>
            </div>
            <QuotesFunnel quotesByStatus={reports.quotesByStatus ?? {}} />
            <Link href="/admin/presupuestos" className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#c88b25] hover:text-[#d7a33a]">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Mensajes sin responder */}
          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-[#c88b25]" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c88b25]">Mensajes</p>
                <h3 className="font-serif text-base font-bold text-[#07111d]">Sin responder</h3>
              </div>
            </div>
            <div className="flex flex-col items-center py-4">
              <p className={`font-serif text-5xl font-bold tabular-nums ${clientMsgs > 0 ? 'text-amber-500' : 'text-green-500'}`}>
                {clientMsgs}
              </p>
              <p className="mt-2 text-sm text-[#29384a]">
                {clientMsgs > 0
                  ? `expediente${clientMsgs !== 1 ? 's' : ''} con mensaje de cliente pendiente`
                  : 'Ningún mensaje pendiente'}
              </p>
            </div>
            <Link href="/admin/expedientes" className="flex items-center gap-1 text-xs font-semibold text-[#c88b25] hover:text-[#d7a33a]">
              Ir a expedientes <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Email delivery */}
          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#c88b25]" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c88b25]">Email</p>
                <h3 className="font-serif text-base font-bold text-[#07111d]">Tasa de entrega</h3>
              </div>
            </div>
            {emailDeliveryRate !== null && (
              <div className="mb-3 flex items-baseline gap-2">
                <p className={`font-serif text-4xl font-bold tabular-nums ${emailDeliveryRate >= 95 ? 'text-green-500' : emailDeliveryRate >= 85 ? 'text-amber-500' : 'text-red-500'}`}>
                  {emailDeliveryRate}%
                </p>
                <p className="text-xs text-[#29384a]">{reports.emailStats.total} emails enviados</p>
              </div>
            )}
            <EmailDeliveryBar
              total={reports.emailStats?.total ?? 0}
              delivered={reports.emailStats?.delivered ?? 0}
              bounced={reports.emailStats?.bounced ?? 0}
              failed={reports.emailStats?.failed ?? 0}
            />
          </div>
        </div>

        {/* ── SUSCRIPCIONES POR PLAN ── */}
        {planNames.length > 0 && (
          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c88b25]">Suscripciones</p>
                <h3 className="mt-1 font-serif text-lg font-bold text-[#07111d]">Distribución por plan</h3>
              </div>
              <Link href="/admin/suscripciones" className="text-xs font-semibold text-[#c88b25] hover:text-[#d7a33a]">
                Ver todas →
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {planNames.map((plan) => {
                const count = subsByPlan[plan] ?? 0;
                const pct = activeSubs > 0 ? Math.round((count / activeSubs) * 100) : 0;
                return (
                  <div key={plan} className="rounded-xl border border-[#f0e8d8] bg-[#f8f4eb] p-4">
                    <p className="truncate text-xs font-bold uppercase tracking-wide text-[#c88b25]">{plan}</p>
                    <p className="mt-1 font-serif text-2xl font-bold text-[#07111d]">{count}</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e8dfc9]">
                      <div className="h-full rounded-full bg-[#c88b25]" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-[#29384a]">{pct}% del total</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ACCESOS RÁPIDOS ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { href: '/admin/expedientes', icon: FolderOpen, label: 'Expedientes' },
            { href: '/admin/presupuestos', icon: FileText, label: 'Presupuestos' },
            { href: '/admin/suscripciones', icon: Zap, label: 'Suscripciones' },
            { href: '/admin/usuarios', icon: Users, label: 'Usuarios' },
            { href: '/admin/correo', icon: Mail, label: 'Correo' },
            { href: '/admin/reportes', icon: TrendingUp, label: 'Reportes' }
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 rounded-2xl border border-[#d8cbb5] bg-white py-5 text-center shadow-sm transition hover:border-[#c88b25] hover:shadow-md"
            >
              <Icon className="h-5 w-5 text-[#c88b25]" />
              <p className="text-xs font-semibold text-[#07111d]">{label}</p>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}
