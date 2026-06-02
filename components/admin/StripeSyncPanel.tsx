'use client';

import { useState } from 'react';
import { RefreshCw, CheckCircle2, TriangleAlert, CreditCard } from 'lucide-react';

interface SyncStats {
  customers : { total: number; linked: number; lead_created: number; skipped: number; errors: number };
  invoices  : { total: number; created: number; skipped: number; errors: number };
  subs      : { total: number; created: number; updated: number; skipped: number; errors: number };
}

interface SyncResult {
  dryRun: boolean;
  stats: SyncStats;
}

export function StripeSyncPanel() {
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<SyncResult | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [dryRun, setDryRun]     = useState(true);

  async function runSync() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/integrations/stripe/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun, limit: 500 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setResult(data as SyncResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50">
            <CreditCard className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Stripe</p>
            <h2 className="font-serif text-lg font-bold text-[#07111d]">Importar clientes y facturas</h2>
            <p className="mt-1 text-sm text-[#29384a]">
              Sincroniza los clientes, facturas pagadas y suscripciones de Stripe hacia EXPERT.
              Usa <strong>Dry Run</strong> primero para ver qué se va a crear sin escribir nada.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[#29384a]">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="rounded"
              disabled={loading}
            />
            Dry Run (solo previsualizar)
          </label>
          <button
            onClick={runSync}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition
              ${dryRun
                ? 'bg-[#f8f4eb] text-[#07111d] border border-[#d8cbb5] hover:bg-[#eee9dc]'
                : 'bg-[#07111d] text-white hover:bg-[#1a2a3a]'}
              disabled:opacity-50`}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Sincronizando…' : dryRun ? 'Previsualizar' : 'Aplicar sync'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <TriangleAlert className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="mt-5 space-y-3">
          <div className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold
            ${result.dryRun
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-green-200 bg-green-50 text-green-800'}`}>
            <CheckCircle2 className="h-4 w-4" />
            {result.dryRun ? 'Previsualización completada — sin cambios escritos' : 'Sincronización aplicada correctamente'}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {/* Customers */}
            <div className="rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#8899aa]">Clientes</p>
              <p className="mt-1 text-2xl font-bold text-[#07111d]">{result.stats.customers.total}</p>
              <div className="mt-2 space-y-0.5 text-xs text-[#29384a]">
                <p>🔗 Vinculados al perfil: <strong>{result.stats.customers.linked}</strong></p>
                <p>👤 Leads creados: <strong>{result.stats.customers.lead_created}</strong></p>
                <p>⚠️ Sin email / omitidos: <strong>{result.stats.customers.skipped}</strong></p>
              </div>
            </div>

            {/* Invoices */}
            <div className="rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#8899aa]">Facturas pagadas</p>
              <p className="mt-1 text-2xl font-bold text-[#07111d]">{result.stats.invoices.total}</p>
              <div className="mt-2 space-y-0.5 text-xs text-[#29384a]">
                <p>✅ Órdenes creadas: <strong>{result.stats.invoices.created}</strong></p>
                <p>⏭ Ya existían: <strong>{result.stats.invoices.skipped}</strong></p>
              </div>
            </div>

            {/* Subscriptions */}
            <div className="rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#8899aa]">Suscripciones</p>
              <p className="mt-1 text-2xl font-bold text-[#07111d]">{result.stats.subs.total}</p>
              <div className="mt-2 space-y-0.5 text-xs text-[#29384a]">
                <p>✅ Creadas: <strong>{result.stats.subs.created}</strong></p>
                <p>♻️ Actualizadas: <strong>{result.stats.subs.updated}</strong></p>
                <p>⏭ Ya existían: <strong>{result.stats.subs.skipped}</strong></p>
              </div>
            </div>
          </div>

          {!result.dryRun && result.stats.customers.linked + result.stats.invoices.created + result.stats.subs.created > 0 && (
            <p className="text-xs text-[#29384a]">
              💡 Recarga la página de clientes para ver los perfiles vinculados.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
