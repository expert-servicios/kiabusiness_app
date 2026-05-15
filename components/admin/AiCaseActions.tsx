'use client';

import { useState } from 'react';
import { Sparkles, FileSearch, AlertCircle } from 'lucide-react';

interface CaseSummary {
  summary: string;
  keyDates: string[];
  pendingActions: string[];
}

interface MissingDocsResult {
  missing: string[];
  present: string[];
}

type ActionResult =
  | { action: 'summary'; result: CaseSummary }
  | { action: 'missing-docs'; result: MissingDocsResult }
  | null;

export function AiCaseActions({ caseId }: { caseId: string }) {
  const [loading, setLoading] = useState<'summary' | 'missing-docs' | null>(null);
  const [result, setResult] = useState<ActionResult>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: 'summary' | 'missing-docs') => {
    setLoading(action);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/cases/${caseId}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Error al ejecutar acción IA');
      } else {
        setResult(data as ActionResult);
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#c88b25]" />
        <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Acciones IA</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => run('summary')}
          disabled={!!loading}
          className="inline-flex items-center gap-2 rounded-full border border-[#d8cbb5] px-4 py-2 text-xs font-semibold text-[#29384a] transition hover:border-[#c88b25] hover:text-[#07111d] disabled:opacity-60"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {loading === 'summary' ? 'Generando resumen…' : 'Resumir historial'}
        </button>
        <button
          type="button"
          onClick={() => run('missing-docs')}
          disabled={!!loading}
          className="inline-flex items-center gap-2 rounded-full border border-[#d8cbb5] px-4 py-2 text-xs font-semibold text-[#29384a] transition hover:border-[#c88b25] hover:text-[#07111d] disabled:opacity-60"
        >
          <FileSearch className="h-3.5 w-3.5" />
          {loading === 'missing-docs' ? 'Analizando…' : 'Detectar documentos faltantes'}
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {result?.action === 'summary' && (
        <div className="mt-4 space-y-3 rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] p-4 text-sm">
          <p className="text-[#07111d]">{result.result.summary}</p>
          {result.result.keyDates.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#29384a]">Fechas clave</p>
              <ul className="space-y-1">
                {result.result.keyDates.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-xs text-[#29384a]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c88b25]" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.result.pendingActions.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#29384a]">Acciones pendientes</p>
              <ul className="space-y-1">
                {result.result.pendingActions.map((a) => (
                  <li key={a} className="flex items-start gap-2 text-xs text-[#07111d]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {result?.action === 'missing-docs' && (
        <div className="mt-4 space-y-3 rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] p-4 text-sm">
          {result.result.missing.length > 0 ? (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-red-700">Posibles faltantes</p>
              <ul className="space-y-1">
                {result.result.missing.map((doc) => (
                  <li key={doc} className="flex items-start gap-2 text-xs text-red-800">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-green-700">No se detectaron documentos faltantes.</p>
          )}
          {result.result.present.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-green-700">Presentes y reconocidos</p>
              <ul className="space-y-1">
                {result.result.present.map((doc) => (
                  <li key={doc} className="flex items-start gap-2 text-xs text-[#29384a]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
