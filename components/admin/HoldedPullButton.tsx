'use client';

import { useState } from 'react';
import { Download, CheckCircle2, TriangleAlert, Loader2, Users, FileText } from 'lucide-react';

type PullTarget = 'contacts' | 'invoices' | 'all';

interface PullResult {
  contacts: { fetched: number; matched: number; mapped: number; errors: number };
  invoices: { fetched: number; matched: number; errors: number };
}

export function HoldedPullButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PullResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<PullTarget>('all');

  const handlePull = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/integrations/holded/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Error al sincronizar');
        return;
      }
      setResult(data.result);
    } catch (e) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-5 rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Sincronizar desde Holded</p>
          <p className="mt-1 text-sm text-[#29384a]">
            Importa contactos y facturas de Holded → EXPERT y crea las asignaciones de mapping.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Target selector */}
          <div className="flex rounded-lg border border-[#d8cbb5] overflow-hidden text-xs font-semibold">
            {(['all', 'contacts', 'invoices'] as PullTarget[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTarget(t)}
                className={`px-3 py-1.5 transition ${
                  target === t
                    ? 'bg-[#07111d] text-white'
                    : 'bg-white text-[#29384a] hover:bg-[#f0e9d8]'
                }`}
              >
                {t === 'all' ? 'Todo' : t === 'contacts' ? 'Contactos' : 'Facturas'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handlePull}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[#07111d] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1a2a3a] disabled:opacity-50"
          >
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Download className="h-4 w-4" />}
            {loading ? 'Importando...' : 'Importar desde Holded'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          <TriangleAlert className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(target === 'all' || target === 'contacts') && (
            <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-green-700" />
              <div className="text-xs">
                <p className="font-bold text-green-800">Contactos</p>
                <p className="text-green-700">
                  {result.contacts.fetched} importados · {result.contacts.matched} coincidencias · {result.contacts.mapped} mapeados
                  {result.contacts.errors > 0 && ` · ${result.contacts.errors} errores`}
                </p>
              </div>
              <CheckCircle2 className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            </div>
          )}
          {(target === 'all' || target === 'invoices') && (
            <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-green-700" />
              <div className="text-xs">
                <p className="font-bold text-green-800">Facturas</p>
                <p className="text-green-700">
                  {result.invoices.fetched} importadas · {result.invoices.matched} coincidencias
                  {result.invoices.errors > 0 && ` · ${result.invoices.errors} errores`}
                </p>
              </div>
              <CheckCircle2 className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
