'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface Setting {
  key       : string;
  enabled   : boolean;
  updated_at: string;
}

const LABELS: Record<string, { title: string; description: string; group: string }> = {
  'case.pendiente_cliente'    : { group: 'Expedientes', title: 'Pendiente del cliente',       description: 'Email al cliente cuando el expediente espera su documentación.' },
  'case.en_revision'          : { group: 'Expedientes', title: 'En revisión',                  description: 'Email al cliente cuando el equipo empieza a revisar su expediente.' },
  'case.listo_para_presentar' : { group: 'Expedientes', title: 'Listo para presentar',         description: 'Email al cliente cuando el expediente está listo para presentar ante el organismo.' },
  'case.presentado'           : { group: 'Expedientes', title: 'Presentado',                   description: 'Email al cliente cuando el expediente ha sido presentado.' },
  'case.finalizado'           : { group: 'Expedientes', title: 'Finalizado',                   description: 'Email al cliente cuando el expediente queda cerrado y resuelto.' },
  'case.review_request'       : { group: 'Expedientes', title: 'Solicitud de valoración',      description: 'Envía un enlace de reseña al cliente al finalizar el expediente.' },
  'admin.daily_summary'       : { group: 'Administración', title: 'Resumen diario',            description: 'Email de resumen de actividad al administrador cada mañana.' },
};

const GROUPS = ['Expedientes', 'Administración'];

function Toggle({ enabled, busy, onChange, label }: { enabled: boolean; busy: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled ? 'true' : 'false'}
      title={enabled ? `Desactivar: ${label}` : `Activar: ${label}`}
      disabled={busy}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c88b25] focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ${
        enabled ? 'bg-[#c88b25]' : 'bg-[#d8cbb5]'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export function AutomationSettingsPanel() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ key: string; ok: boolean } | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch('/api/admin/automation-settings');
      if (!res.ok) { setLoadError(true); return; }
      const json = await res.json();
      setSettings(json.settings ?? []);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect

  const toggle = async (key: string, current: boolean) => {
    setBusy(key);
    setFeedback(null);
    // Optimistic update
    setSettings((prev) => prev.map((s) => s.key === key ? { ...s, enabled: !current } : s));
    try {
      const res = await fetch('/api/admin/automation-settings', {
        method : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ key, enabled: !current }),
      });
      if (!res.ok) throw new Error();
      setFeedback({ key, ok: true });
    } catch {
      // Revert on error
      setSettings((prev) => prev.map((s) => s.key === key ? { ...s, enabled: current } : s));
      setFeedback({ key, ok: false });
    } finally {
      setBusy(null);
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-[#7a6e5f]">
        <Loader2 className="h-4 w-4 animate-spin" /> Cargando automatizaciones…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertCircle className="h-4 w-4 shrink-0" />
        No se pudieron cargar las automatizaciones.
        <button type="button" onClick={load} className="ml-2 underline">Reintentar</button>
      </div>
    );
  }

  const byKey = Object.fromEntries(settings.map((s) => [s.key, s]));

  // Keys that exist in DB but aren't in LABELS yet (future-proof)
  const unknownKeys = settings.filter((s) => !LABELS[s.key]);

  return (
    <div className="space-y-8">
      {GROUPS.map((group) => {
        const groupKeys = Object.entries(LABELS)
          .filter(([, meta]) => meta.group === group)
          .map(([key]) => key);

        return (
          <div key={group}>
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#c88b25]">
              {group}
            </h3>
            <div className="divide-y divide-[#f0e8d8] rounded-2xl border border-[#d8cbb5] bg-white">
              {groupKeys.map((key) => {
                const meta    = LABELS[key];
                const setting = byKey[key];
                const enabled = setting?.enabled ?? true;
                const isBusy  = busy === key;
                const fb      = feedback?.key === key ? feedback : null;

                return (
                  <div key={key} className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#07111d]">{meta.title}</p>
                      <p className="mt-0.5 text-xs text-[#7a6e5f]">{meta.description}</p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {fb && (
                        fb.ok
                          ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                          : <AlertCircle  className="h-4 w-4 text-red-500" />
                      )}
                      {isBusy && !fb && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#c88b25]" />}
                      <Toggle
                        enabled={enabled}
                        busy={isBusy}
                        label={meta.title}
                        onChange={() => { void toggle(key, enabled); }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {unknownKeys.length > 0 && (
        <div>
          <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#7a6e5f]">
            Otras automatizaciones
          </h3>
          <div className="divide-y divide-[#f0e8d8] rounded-2xl border border-[#d8cbb5] bg-white">
            {unknownKeys.map(({ key, enabled }) => {
              const isBusy = busy === key;
              const fb     = feedback?.key === key ? feedback : null;
              return (
                <div key={key} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-[#29384a]">{key}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {fb && (fb.ok
                      ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                      : <AlertCircle  className="h-4 w-4 text-red-500" />
                    )}
                    {isBusy && !fb && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#c88b25]" />}
                    <Toggle enabled={enabled} busy={isBusy} label={key} onChange={() => { void toggle(key, enabled); }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
