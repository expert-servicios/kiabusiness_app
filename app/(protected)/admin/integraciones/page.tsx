import Link from 'next/link';
import { cookies } from 'next/headers';
import { ArrowLeft, CheckCircle2, Clock3, Mail, Calendar, PlugZap, RefreshCw, Settings2, TriangleAlert, type LucideIcon } from 'lucide-react';
import { StripeSyncPanel } from '@/components/admin/StripeSyncPanel';
import { HoldedPullButton } from '@/components/admin/HoldedPullButton';
import { absoluteAppUrl } from '@/lib/utils/app-url';

interface SyncEvent {
  id: string;
  provider: string;
  direction: string;
  operation: string;
  local_entity: string | null;
  local_id: string | null;
  external_entity: string | null;
  external_id: string | null;
  status: string;
  attempt_count: number;
  error: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface HoldedStatus {
  ok: boolean;
  error?: string;
  config?: {
    configured: boolean;
    syncEnabled: boolean;
    syncQuotes: boolean;
    createInvoicesFromStripe: boolean;
    defaultQuoteDocType: string;
    hasCrmFunnelId: boolean;
    hasCrmDefaultStageId: boolean;
    hasProjectDefaultListId: boolean;
    hasDefaultTaxId: boolean;
    hasDefaultNumSerieId: boolean;
    hasDefaultSalesChannelId: boolean;
    hasDefaultBankId: boolean;
  };
  checks?: Array<{
    name: string;
    ok: boolean;
    count: number | null;
    ms: number;
    error?: string;
  }>;
}

const STATUS_CONFIG: Record<string, { label: string; className: string; Icon: LucideIcon }> = {
  success: {
    label: 'Sincronizado',
    className: 'border-green-200 bg-green-50 text-green-800',
    Icon: CheckCircle2
  },
  failed: {
    label: 'Fallido',
    className: 'border-red-200 bg-red-50 text-red-700',
    Icon: TriangleAlert
  },
  skipped: {
    label: 'Omitido',
    className: 'border-slate-200 bg-slate-50 text-slate-700',
    Icon: Clock3
  },
  pending: {
    label: 'Pendiente',
    className: 'border-amber-200 bg-amber-50 text-amber-800',
    Icon: RefreshCw
  }
};

function formatOperation(operation: string) {
  return operation
    .replace(/^sync_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

async function getCookieHeader() {
  const cookieStore = await cookies();
  return cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
}

interface GoogleStatus {
  gmailConnected: boolean;
  gmailEmail: string | null;
  calendarConnected: boolean;
}

async function getGoogleStatus(cookieHeader: string): Promise<GoogleStatus> {
  try {
    const headers = { cookie: cookieHeader };
    const [gmailRes, correoRes] = await Promise.all([
      fetch(absoluteAppUrl('/api/auth/google-gmail/status'), { headers, cache: 'no-store' }),
      fetch(absoluteAppUrl('/api/admin/correo?action=status'), { headers, cache: 'no-store' }),
    ]);
    const gmailData  = gmailRes.ok  ? await gmailRes.json()  : {};
    const correoData = correoRes.ok ? await correoRes.json() : {};
    return {
      gmailConnected:    gmailData.connected ?? correoData.gmailConnected ?? false,
      gmailEmail:        gmailData.email     ?? correoData.gmailEmail     ?? null,
      calendarConnected: false,
    };
  } catch {
    return { gmailConnected: false, gmailEmail: null, calendarConnected: false };
  }
}

async function getSyncEvents(cookieHeader: string): Promise<SyncEvent[]> {
  try {
    const res = await fetch(absoluteAppUrl('/api/admin/integration-sync-events?provider=holded'), {
      headers: { cookie: cookieHeader },
      cache: 'no-store'
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.events ?? [];
  } catch {
    return [];
  }
}

async function getHoldedStatus(cookieHeader: string): Promise<HoldedStatus | null> {
  try {
    const res = await fetch(absoluteAppUrl('/api/admin/integrations/holded/status'), {
      headers: { cookie: cookieHeader },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function AdminIntegracionesPage() {
  const cookieHeader = await getCookieHeader();
  const [events, holdedStatus, googleStatus] = await Promise.all([
    getSyncEvents(cookieHeader),
    getHoldedStatus(cookieHeader),
    getGoogleStatus(cookieHeader),
  ]);
  const failedCount = events.filter((event) => event.status === 'failed').length;
  const pendingCount = events.filter((event) => event.status === 'pending').length;
  const successCount = events.filter((event) => event.status === 'success').length;
  const config = holdedStatus?.config;

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-7">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#29384a] hover:text-[#07111d]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Panel admin
          </Link>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#07111d]">Integraciones</h1>
              <p className="mt-1 text-sm text-[#29384a]">
                Trazabilidad operativa de sincronizaciones con Holded
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-2">
                <p className="font-serif text-2xl font-bold text-green-800">{successCount}</p>
                <p className="text-xs text-green-700">OK</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2">
                <p className="font-serif text-2xl font-bold text-amber-800">{pendingCount}</p>
                <p className="text-xs text-amber-700">Pendientes</p>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2">
                <p className="font-serif text-2xl font-bold text-red-700">{failedCount}</p>
                <p className="text-xs text-red-700">Fallidos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <section className="mb-6 rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-[#c88b25]" />
                <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Estado Holded</p>
              </div>
              <h2 className="mt-2 font-serif text-lg font-bold text-[#07111d]">
                {holdedStatus?.ok ? 'API operativa' : 'Requiere revision'}
              </h2>
              <p className="mt-1 text-sm text-[#29384a]">
                Checks sin mostrar datos sensibles: solo disponibilidad, recuentos y configuracion activa.
              </p>
            </div>
            <div className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-1 text-xs font-semibold ${
              holdedStatus?.ok ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-700'
            }`}>
              {holdedStatus?.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <TriangleAlert className="h-3.5 w-3.5" />}
              {holdedStatus?.ok ? 'Conectado' : 'Pendiente'}
            </div>
          </div>

          {holdedStatus?.error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {holdedStatus.error}
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(holdedStatus?.checks ?? []).map((check) => (
              <div
                key={check.name}
                className={`rounded-xl border p-3 ${
                  check.ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <p className={`text-xs font-bold uppercase tracking-wide ${check.ok ? 'text-green-800' : 'text-red-700'}`}>
                  {check.name}
                </p>
                <p className="mt-1 text-sm text-[#29384a]">
                  {check.ok ? `${check.count ?? '-'} registros - ${check.ms} ms` : check.error ?? 'Error'}
                </p>
              </div>
            ))}
          </div>

          {config ? (
            <div className="mt-5 grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
              <span className="rounded-lg bg-[#f8f4eb] px-3 py-2 text-[#29384a]">
                Sync: <strong>{config.syncEnabled ? 'on' : 'off'}</strong>
              </span>
              <span className="rounded-lg bg-[#f8f4eb] px-3 py-2 text-[#29384a]">
                Presupuestos: <strong>{config.syncQuotes ? 'on' : 'off'}</strong>
              </span>
              <span className="rounded-lg bg-[#f8f4eb] px-3 py-2 text-[#29384a]">
                Facturas Stripe: <strong>{config.createInvoicesFromStripe ? 'crear' : 'no crear'}</strong>
              </span>
              <span className="rounded-lg bg-[#f8f4eb] px-3 py-2 text-[#29384a]">
                Tipo presupuesto: <strong>{config.defaultQuoteDocType}</strong>
              </span>
            </div>
          ) : null}

          {/* Pull sync button — client component */}
          <HoldedPullButton />
        </section>

        {/* ── Stripe sync ── */}
        <StripeSyncPanel />

        {/* ── Google integrations ── */}
        <section className="mb-6 grid gap-4 sm:grid-cols-2">
          {/* Gmail */}
          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
                  <Mail className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Gmail</p>
                  <p className="text-sm font-semibold text-[#07111d]">Bandeja de correo</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                googleStatus.gmailConnected
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}>
                {googleStatus.gmailConnected
                  ? <><CheckCircle2 className="h-3.5 w-3.5" /> Conectado</>
                  : <><PlugZap className="h-3.5 w-3.5" /> No conectado</>}
              </span>
            </div>
            {googleStatus.gmailEmail && (
              <p className="mt-3 truncate text-xs text-[#29384a]/70">{googleStatus.gmailEmail}</p>
            )}
            <div className="mt-4">
              {googleStatus.gmailConnected ? (
                <Link
                  href="/admin/correo"
                  className="text-xs font-semibold text-[#c88b25] hover:text-[#d7a33a]"
                >
                  Ir a bandeja de correo →
                </Link>
              ) : (
                <a
                  href="/api/auth/google-gmail"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#07111d] px-4 py-1.5 text-xs font-bold text-white transition hover:bg-[#1a2a3a]"
                >
                  Conectar Gmail
                </a>
              )}
            </div>
          </div>

          {/* Google Calendar */}
          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                  <Calendar className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Google Calendar</p>
                  <p className="text-sm font-semibold text-[#07111d]">Calendario fiscal clientes</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-800">
                <CheckCircle2 className="h-3.5 w-3.5" /> Activo
              </span>
            </div>
            <p className="mt-3 text-xs text-[#29384a]/70">
              Los clientes sincronizan sus obligaciones fiscales pendientes directamente en su Google Calendar personal.
            </p>
            <div className="mt-4">
              <Link
                href="/admin/calendario-fiscal"
                className="text-xs font-semibold text-[#c88b25] hover:text-[#d7a33a]"
              >
                Ver calendario fiscal →
              </Link>
            </div>
          </div>
        </section>

        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d8cbb5] bg-white p-12 text-center">
            <PlugZap className="mx-auto h-10 w-10 text-[#d8cbb5]" />
            <h2 className="mt-4 font-serif text-lg font-bold text-[#07111d]">Sin sincronizaciones todavía</h2>
            <p className="mt-2 text-sm text-[#29384a]">
              Cuando Stripe dispare una sincronización con Holded, el resultado aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const status = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.pending;
              const Icon = status.Icon;
              const date = new Date(event.created_at).toLocaleString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <article key={event.id} className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d7a33a]/10 text-[#c88b25]">
                        <PlugZap className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-[#c88b25]">
                          {event.provider}
                        </p>
                        <h2 className="mt-1 font-serif text-base font-bold text-[#07111d]">
                          {formatOperation(event.operation)}
                        </h2>
                        <p className="mt-1 text-xs text-[#29384a]">{date}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 border-t border-[#f0e8d8] pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-[#c88b25]">Origen</p>
                      <p className="mt-1 break-all text-[#29384a]">
                        {event.local_entity ?? '-'}
                        {event.local_id ? ` · ${event.local_id}` : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-[#c88b25]">Destino</p>
                      <p className="mt-1 break-all text-[#29384a]">
                        {event.external_entity ?? '-'}
                        {event.external_id ? ` · ${event.external_id}` : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-[#c88b25]">Dirección</p>
                      <p className="mt-1 text-[#29384a]">{event.direction}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-[#c88b25]">Intentos</p>
                      <p className="mt-1 text-[#29384a]">{event.attempt_count}</p>
                    </div>
                  </div>

                  {event.error ? (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-red-700">Error</p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-red-700">
                        {event.error}
                      </p>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
