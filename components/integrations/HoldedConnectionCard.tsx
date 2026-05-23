'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, RefreshCw, Unplug } from 'lucide-react';
import { HoldedPermissionStatus, type HoldedPermissions } from './HoldedPermissionStatus';
import { HoldedApiKeyForm } from './HoldedApiKeyForm';
import { HoldedConnectionGuide } from './HoldedConnectionGuide';

interface Integration {
  id                  : string;
  status              : string;
  api_key_last4       : string | null;
  permissions_detected: HoldedPermissions;
  last_success_at     : string | null;
  last_error          : string | null;
  sync_mode           : string;
  created_at          : string;
}

interface Props {
  integration : Integration | null;
  companyId  ?: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  active  : 'Conectado',
  pending : 'Pendiente',
  failed  : 'Error de conexión',
  disabled: 'Desactivado',
  revoked : 'Desconectado',
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
}

export function HoldedConnectionCard({ integration: initialIntegration, companyId }: Props) {
  const router = useRouter();
  const [integration, setIntegration] = useState<Integration | null>(initialIntegration);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState('');

  const isActive = integration?.status === 'active';

  async function handleDisconnect() {
    if (!integration) return;
    const confirmed = window.confirm(
      '¿Desconectar Holded? Se eliminará la clave API almacenada. Podrás volver a conectar cuando quieras.'
    );
    if (!confirmed) return;

    setDisconnecting(true);
    setError('');
    try {
      const res = await fetch('/api/integrations/holded/disconnect', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ integrationId: integration.id }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Error al desconectar');
        return;
      }
      setIntegration(null);
      router.refresh();
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setDisconnecting(false);
    }
  }

  // ── Connected state ────────────────────────────────────────────────────────
  if (isActive && integration) {
    return (
      <div className="space-y-6">
        {/* Status badge */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold text-[#3d3528]">Holded conectado</p>
              <p className="text-xs text-[#7a6e5f]">
                Clave: ••••{integration.api_key_last4 ?? '????'} · Última sync: {formatDate(integration.last_success_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.refresh()}
              className="flex items-center gap-1.5 rounded-xl border border-[#e8dfc8] bg-white px-3 py-2 text-xs font-medium text-[#7a6e5f] hover:border-[#c88b25] hover:text-[#c88b25]"
            >
              <RefreshCw size={12} />
              Actualizar
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
            >
              {disconnecting ? <Loader2 size={12} className="animate-spin" /> : <Unplug size={12} />}
              Desconectar
            </button>
          </div>
        </div>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {/* Permissions */}
        <div className="rounded-2xl border border-[#e8dfc8] bg-[#faf9f6] p-5">
          <HoldedPermissionStatus permissions={integration.permissions_detected} />
        </div>

        {/* Sync mode note */}
        <p className="text-xs text-[#a89880]">
          Modo de sincronización: <span className="font-medium">{integration.sync_mode === 'read_write' ? 'Lectura y escritura' : 'Solo lectura'}</span>.
          EXPERT solo lee tus datos — nunca modifica tu contabilidad sin confirmación explícita.
        </p>
      </div>
    );
  }

  // ── Non-active state (show error if any + form) ────────────────────────────
  return (
    <div className="space-y-6">
      {integration && !isActive && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          {integration.status === 'failed' ? (
            <XCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
          ) : (
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
          )}
          <div className="text-sm">
            <p className="font-medium text-[#3d3528]">{STATUS_LABELS[integration.status] ?? integration.status}</p>
            {integration.last_error && (
              <p className="mt-0.5 text-[#7a6e5f]">{integration.last_error}</p>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {/* Guide */}
      <div className="rounded-2xl border border-[#e8dfc8] bg-[#faf9f6] p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#c88b25]">
          Cómo obtener tu API key
        </p>
        <HoldedConnectionGuide />
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-[#e8dfc8] bg-white p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#c88b25]">
          Conectar Holded
        </p>
        <HoldedApiKeyForm
          companyId={companyId}
          onConnected={(newIntegration) => {
            setIntegration(newIntegration as unknown as Integration);
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
