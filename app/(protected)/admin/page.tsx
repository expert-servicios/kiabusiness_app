import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  AlertCircle, CheckCircle2,
  CreditCard, FileText, FolderOpen, Users
} from 'lucide-react';
import { CASE_ACTION_GROUPS, countCaseStates } from '@/lib/utils/case-states';

interface AdminStats {
  totalUsers: number;
  pendingQuotes: number;
  activeCases: number;
  totalRevenue: number;
}

interface AdminReports {
  casesByState: Record<string, number>;
  quotesByStatus: Record<string, number>;
  totalRevenue: number;
  activeSubs: number;
  paymentIssuesCount: number;
  clientMessagesAwaitingResponse: number;
}

async function fetchAdmin<T>(path: string, fallback: T): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}${path}`, {
    headers: { cookie: cookieHeader },
    cache: 'no-store'
  });
  if (!res.ok) return fallback;
  return res.json();
}

export default async function AdminPage() {
  const [stats, reports] = await Promise.all([
    fetchAdmin<AdminStats>('/api/admin/stats', { totalUsers: 0, pendingQuotes: 0, activeCases: 0, totalRevenue: 0 }),
    fetchAdmin<AdminReports>('/api/admin/reports', {
      casesByState: {},
      quotesByStatus: {},
      totalRevenue: 0,
      activeSubs: 0,
      paymentIssuesCount: 0,
      clientMessagesAwaitingResponse: 0
    })
  ]);

  const quotesNeedingResponse = reports.quotesByStatus?.draft ?? 0;
  const quotesAwaitingClient = reports.quotesByStatus?.sent ?? 0;
  const casesPendingDocs = countCaseStates(reports.casesByState, CASE_ACTION_GROUPS.pendingDocs);
  const casesDocsToReview = countCaseStates(reports.casesByState, CASE_ACTION_GROUPS.docsToReview);
  const casesInProgress = countCaseStates(reports.casesByState, CASE_ACTION_GROUPS.inProgress);
  const casesWaitingExternal = countCaseStates(reports.casesByState, CASE_ACTION_GROUPS.waitingExternal);
  const casesReadyToDeliver = countCaseStates(reports.casesByState, CASE_ACTION_GROUPS.readyToDeliver);
  const paymentIssuesCount = reports.paymentIssuesCount ?? 0;
  const clientMessagesAwaitingResponse = reports.clientMessagesAwaitingResponse ?? 0;
  const urgentCount =
    quotesNeedingResponse +
    casesPendingDocs +
    casesDocsToReview +
    casesReadyToDeliver +
    paymentIssuesCount +
    clientMessagesAwaitingResponse;
  const followUpCount = quotesAwaitingClient + casesInProgress + casesWaitingExternal;

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-7">
          <h1 className="font-serif text-2xl font-bold text-[#07111d] md:text-3xl">Panel de administración</h1>
          <p className="mt-1 text-sm text-[#29384a]">
            {urgentCount > 0
              ? `${urgentCount} acción${urgentCount !== 1 ? 'es' : ''} requiere${urgentCount === 1 ? '' : 'n'} atención inmediata`
              : 'Sin acciones urgentes pendientes'}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">

        {/* REQUIERE ATENCIÓN AHORA */}
        {urgentCount > 0 && (
          <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50">
            <div className="flex items-center gap-3 border-b border-amber-200 px-6 py-4">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <h2 className="font-serif text-base font-bold text-amber-900">Requiere atención ahora</h2>
            </div>
            <div className="grid divide-y divide-amber-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              {quotesNeedingResponse > 0 && (
                <Link
                  href="/admin/presupuestos"
                  className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-amber-100"
                >
                  <div>
                    <p className="font-semibold text-amber-900">
                      {quotesNeedingResponse} presupuesto{quotesNeedingResponse !== 1 ? 's' : ''} por preparar
                    </p>
                    <p className="mt-0.5 text-xs text-amber-700">Solicitudes recibidas sin propuesta enviada aún</p>
                  </div>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                    {quotesNeedingResponse}
                  </span>
                </Link>
              )}
              {casesPendingDocs > 0 && (
                <Link
                  href="/admin/expedientes"
                  className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-amber-100"
                >
                  <div>
                    <p className="font-semibold text-amber-900">
                      {casesPendingDocs} expediente{casesPendingDocs !== 1 ? 's' : ''} esperando documentación
                    </p>
                    <p className="mt-0.5 text-xs text-amber-700">El cliente aún no ha subido los archivos</p>
                  </div>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                    {casesPendingDocs}
                  </span>
                </Link>
              )}
              {casesDocsToReview > 0 && (
                <Link
                  href="/admin/expedientes"
                  className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-amber-100"
                >
                  <div>
                    <p className="font-semibold text-amber-900">
                      {casesDocsToReview} expediente{casesDocsToReview !== 1 ? 's' : ''} con documentos por revisar
                    </p>
                    <p className="mt-0.5 text-xs text-amber-700">Documentacion recibida pendiente de validacion</p>
                  </div>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                    {casesDocsToReview}
                  </span>
                </Link>
              )}
              {casesReadyToDeliver > 0 && (
                <Link
                  href="/admin/expedientes"
                  className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-amber-100"
                >
                  <div>
                    <p className="font-semibold text-amber-900">
                      {casesReadyToDeliver} resolucion{casesReadyToDeliver !== 1 ? 'es' : ''} por entregar
                    </p>
                    <p className="mt-0.5 text-xs text-amber-700">Resultado recibido, falta preparar entrega al cliente</p>
                  </div>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                    {casesReadyToDeliver}
                  </span>
                </Link>
              )}
              {clientMessagesAwaitingResponse > 0 && (
                <Link
                  href="/admin/expedientes"
                  className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-amber-100"
                >
                  <div>
                    <p className="font-semibold text-amber-900">
                      {clientMessagesAwaitingResponse} mensaje{clientMessagesAwaitingResponse !== 1 ? 's' : ''} de cliente sin responder
                    </p>
                    <p className="mt-0.5 text-xs text-amber-700">El último mensaje del expediente lo envió el cliente</p>
                  </div>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                    {clientMessagesAwaitingResponse}
                  </span>
                </Link>
              )}
              {paymentIssuesCount > 0 && (
                <Link
                  href="/admin/suscripciones"
                  className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-amber-100"
                >
                  <div>
                    <p className="font-semibold text-amber-900">
                      {paymentIssuesCount} pago{paymentIssuesCount !== 1 ? 's' : ''} recurrente{paymentIssuesCount !== 1 ? 's' : ''} con incidencia
                    </p>
                    <p className="mt-0.5 text-xs text-amber-700">Suscripciones en estado past_due o unpaid</p>
                  </div>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                    {paymentIssuesCount}
                  </span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* EN SEGUIMIENTO */}
        {followUpCount > 0 && (
          <div className="overflow-hidden rounded-2xl border border-blue-200 bg-blue-50">
            <div className="flex items-center gap-3 border-b border-blue-200 px-6 py-4">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              <h2 className="font-serif text-base font-bold text-blue-900">En seguimiento</h2>
            </div>
            <div className="grid divide-y divide-blue-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              {quotesAwaitingClient > 0 && (
                <Link
                  href="/admin/presupuestos"
                  className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-blue-100"
                >
                  <div>
                    <p className="font-semibold text-blue-900">
                      {quotesAwaitingClient} presupuesto{quotesAwaitingClient !== 1 ? 's' : ''} enviado{quotesAwaitingClient !== 1 ? 's' : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-blue-700">Esperando aprobación o pago del cliente</p>
                  </div>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-400 text-xs font-bold text-white">
                    {quotesAwaitingClient}
                  </span>
                </Link>
              )}
              {casesInProgress > 0 && (
                <Link
                  href="/admin/expedientes"
                  className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-blue-100"
                >
                  <div>
                    <p className="font-semibold text-blue-900">
                      {casesInProgress} expediente{casesInProgress !== 1 ? 's' : ''} en tramitacion
                    </p>
                    <p className="mt-0.5 text-xs text-blue-700">Gestiones en curso dentro del flujo operativo</p>
                  </div>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-400 text-xs font-bold text-white">
                    {casesInProgress}
                  </span>
                </Link>
              )}
              {casesWaitingExternal > 0 && (
                <Link
                  href="/admin/expedientes"
                  className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-blue-100"
                >
                  <div>
                    <p className="font-semibold text-blue-900">
                      {casesWaitingExternal} expediente{casesWaitingExternal !== 1 ? 's' : ''} pendiente{casesWaitingExternal !== 1 ? 's' : ''} de organismo
                    </p>
                    <p className="mt-0.5 text-xs text-blue-700">Presentado o esperando respuesta externa</p>
                  </div>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-400 text-xs font-bold text-white">
                    {casesWaitingExternal}
                  </span>
                </Link>
              )}
            </div>
          </div>
        )}

        {urgentCount === 0 && followUpCount === 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
            <p className="text-sm font-semibold text-green-800">Todo al día — sin elementos pendientes de acción</p>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Link
            href="/admin/usuarios"
            className="group rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm transition hover:border-[#d7a33a] hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <Users className="h-5 w-5 text-[#c88b25]" />
              <p className="font-serif text-3xl font-bold text-[#07111d]">{stats.totalUsers}</p>
            </div>
            <p className="mt-3 text-xs font-semibold text-[#29384a]">Usuarios</p>
            <p className="mt-1 text-xs font-semibold text-[#d7a33a] transition group-hover:translate-x-0.5">Ver →</p>
          </Link>
          <Link
            href="/admin/presupuestos"
            className="group rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm transition hover:border-[#d7a33a] hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <FileText className="h-5 w-5 text-[#c88b25]" />
              <p className="font-serif text-3xl font-bold text-[#07111d]">{stats.pendingQuotes}</p>
            </div>
            <p className="mt-3 text-xs font-semibold text-[#29384a]">Presupuestos activos</p>
            <p className="mt-1 text-xs font-semibold text-[#d7a33a] transition group-hover:translate-x-0.5">Ver →</p>
          </Link>
          <Link
            href="/admin/expedientes"
            className="group rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm transition hover:border-[#d7a33a] hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <FolderOpen className="h-5 w-5 text-[#c88b25]" />
              <p className="font-serif text-3xl font-bold text-[#07111d]">{stats.activeCases}</p>
            </div>
            <p className="mt-3 text-xs font-semibold text-[#29384a]">Expedientes activos</p>
            <p className="mt-1 text-xs font-semibold text-[#d7a33a] transition group-hover:translate-x-0.5">Ver →</p>
          </Link>
          <Link
            href="/admin/suscripciones"
            className="group rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm transition hover:border-[#d7a33a] hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <CreditCard className="h-5 w-5 text-[#c88b25]" />
              <p className="font-serif text-2xl font-bold text-[#07111d]">
                {stats.totalRevenue > 0
                  ? `€${stats.totalRevenue.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`
                  : `${reports.activeSubs ?? 0}`}
              </p>
            </div>
            <p className="mt-3 text-xs font-semibold text-[#29384a]">
              {stats.totalRevenue > 0 ? 'Ingresos totales' : 'Suscripciones activas'}
            </p>
            <p className="mt-1 text-xs font-semibold text-[#d7a33a] transition group-hover:translate-x-0.5">Ver →</p>
          </Link>
        </div>

      </div>
    </main>
  );
}
