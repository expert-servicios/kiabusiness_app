import Link from 'next/link';
import { AlertTriangle, CheckCircle2, ArrowLeft, ShieldAlert } from 'lucide-react';
import { fetchWithCookies } from '@/lib/utils/server-fetch';
import { SecurityAlertResolveButton } from '@/components/admin/SecurityAlertResolveButton';

interface SecurityAlert {
  id         : string;
  alert_type : string;
  user_email : string | null;
  detail     : Record<string, unknown>;
  resolved   : boolean;
  resolved_at: string | null;
  created_at : string;
}

const ALERT_LABELS: Record<string, { label: string; color: string }> = {
  holded_mcp_auth_burst: { label: 'Ráfaga de fallos de autenticación MCP', color: 'text-red-700 bg-red-50 border-red-200' },
};

function alertLabel(type: string) {
  return ALERT_LABELS[type] ?? { label: type, color: 'text-amber-700 bg-amber-50 border-amber-200' };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default async function SecurityAlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const showResolved = tab === 'resueltas';

  const data = await fetchWithCookies<{ alerts: SecurityAlert[] }>(
    `/api/admin/security-alerts?resolved=${showResolved}`
  );
  const alerts: SecurityAlert[] = data?.alerts ?? [];

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-[#29384a]/50 hover:text-[#07111d]">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-serif text-xl font-bold text-[#07111d]">Alertas de seguridad</h1>
              <p className="text-xs text-[#29384a]/60">Eventos de autenticación MCP y actividad anómala</p>
            </div>
          </div>
          <ShieldAlert className="h-6 w-6 text-red-500" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">

        {/* Tabs */}
        <div className="flex gap-2">
          <Link
            href="/admin/seguridad"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition
              ${!showResolved ? 'bg-[#07111d] text-white' : 'bg-white border border-[#d8cbb5] text-[#29384a] hover:border-[#07111d]'}`}
          >
            Pendientes
          </Link>
          <Link
            href="/admin/seguridad?tab=resueltas"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition
              ${showResolved ? 'bg-[#07111d] text-white' : 'bg-white border border-[#d8cbb5] text-[#29384a] hover:border-[#07111d]'}`}
          >
            Resueltas
          </Link>
        </div>

        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#d8cbb5] bg-white py-16 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
            <p className="font-semibold text-[#07111d]">
              {showResolved ? 'No hay alertas resueltas' : 'Sin alertas pendientes'}
            </p>
            <p className="text-sm text-[#29384a]/60 mt-1">
              {showResolved ? 'Las alertas resueltas aparecerán aquí.' : 'El sistema funciona con normalidad.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const { label, color } = alertLabel(alert.alert_type);
              const detail = alert.detail as {
                failureCount?: number;
                windowMinutes?: number;
                userName?: string;
                channel?: string;
              };
              return (
                <div
                  key={alert.id}
                  className="rounded-2xl border border-[#d8cbb5] bg-white p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                      <div>
                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${color}`}>
                          {label}
                        </span>
                        <p className="mt-1 text-sm font-semibold text-[#07111d]">
                          {alert.user_email ?? 'Usuario desconocido'}
                        </p>
                        <p className="text-xs text-[#29384a]/60">{formatDate(alert.created_at)}</p>
                      </div>
                    </div>
                    {!alert.resolved && <SecurityAlertResolveButton alertId={alert.id} />}
                    {alert.resolved && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Resuelto {alert.resolved_at ? formatDate(alert.resolved_at) : ''}
                      </span>
                    )}
                  </div>

                  {/* Detail */}
                  <dl className="grid grid-cols-2 gap-2 rounded-xl bg-[#f8f4eb] px-4 py-3 text-xs sm:grid-cols-4">
                    {detail.failureCount !== undefined && (
                      <>
                        <div><dt className="text-[#29384a]/50">Intentos fallidos</dt><dd className="font-semibold text-[#07111d]">{detail.failureCount}</dd></div>
                        <div><dt className="text-[#29384a]/50">Ventana</dt><dd className="font-semibold text-[#07111d]">{detail.windowMinutes} min</dd></div>
                      </>
                    )}
                    {detail.userName && (
                      <div><dt className="text-[#29384a]/50">Nombre</dt><dd className="font-semibold text-[#07111d]">{detail.userName}</dd></div>
                    )}
                    {detail.channel && (
                      <div><dt className="text-[#29384a]/50">Canal</dt><dd className="font-semibold text-[#07111d]">{detail.channel}</dd></div>
                    )}
                  </dl>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
