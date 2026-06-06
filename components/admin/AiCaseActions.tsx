'use client';

import { useState } from 'react';
import { Sparkles, FileSearch, AlertCircle, PenLine, Loader2, Copy, Check } from 'lucide-react';

interface CaseSummary {
  summary: string;
  keyDates: string[];
  pendingActions: string[];
}

interface MissingDocsResult {
  missing: string[];
  present: string[];
}

interface DraftResult {
  subject: string;
  body: string;
}

type Action = 'summary' | 'missing-docs' | 'draft';

type ActionResult =
  | { action: 'summary';      result: CaseSummary     }
  | { action: 'missing-docs'; result: MissingDocsResult }
  | { action: 'draft';        result: DraftResult      }
  | null;

export function AiCaseActions({ caseId }: { caseId: string }) {
  const [loading, setLoading]             = useState<Action | null>(null);
  const [result, setResult]               = useState<ActionResult>(null);
  const [error, setError]                 = useState<string | null>(null);
  const [showDraftInput, setShowDraftInput] = useState(false);
  const [draftGoal, setDraftGoal]         = useState('');
  const [copied, setCopied]               = useState<string | null>(null);

  const run = async (action: Action) => {
    setLoading(action);
    setError(null);
    setResult(null);
    try {
      const body: Record<string, unknown> = { action };
      if (action === 'draft') body.goal = draftGoal.trim();
      const res = await fetch(`/api/admin/cases/${caseId}/ai`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(body),
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

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* ignore */ }
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
          onClick={() => { setShowDraftInput(false); void run('summary'); }}
          disabled={!!loading}
          className="inline-flex items-center gap-2 rounded-full border border-[#d8cbb5] px-4 py-2 text-xs font-semibold text-[#29384a] transition hover:border-[#c88b25] hover:text-[#07111d] disabled:opacity-60"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {loading === 'summary' ? 'Generando resumen…' : 'Resumir historial'}
        </button>

        <button
          type="button"
          onClick={() => { setShowDraftInput(false); void run('missing-docs'); }}
          disabled={!!loading}
          className="inline-flex items-center gap-2 rounded-full border border-[#d8cbb5] px-4 py-2 text-xs font-semibold text-[#29384a] transition hover:border-[#c88b25] hover:text-[#07111d] disabled:opacity-60"
        >
          <FileSearch className="h-3.5 w-3.5" />
          {loading === 'missing-docs' ? 'Analizando…' : 'Detectar documentos faltantes'}
        </button>

        <button
          type="button"
          onClick={() => { setResult(null); setError(null); setShowDraftInput((v) => !v); }}
          disabled={!!loading}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition disabled:opacity-60 ${
            showDraftInput
              ? 'border-[#c88b25] bg-[#c88b25]/5 text-[#c88b25]'
              : 'border-[#d8cbb5] text-[#29384a] hover:border-[#c88b25] hover:text-[#07111d]'
          }`}
        >
          <PenLine className="h-3.5 w-3.5" />
          Redactar mensaje
        </button>
      </div>

      {/* Draft input */}
      {showDraftInput && (
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-semibold text-[#07111d]">
            ¿Qué quieres comunicar al cliente?
          </label>
          <textarea
            value={draftGoal}
            onChange={(e) => setDraftGoal(e.target.value)}
            placeholder="Ej: «pedir el NIE actualizado», «avisar que el expediente está listo para presentar», «informar que necesitamos más documentación del empleador»…"
            rows={2}
            className="w-full resize-none rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#c88b25]"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => { void run('draft'); }}
              disabled={!!loading || draftGoal.trim().length < 5}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#07111d] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {loading === 'draft'
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Sparkles className="h-3.5 w-3.5" />}
              {loading === 'draft' ? 'Generando…' : 'Generar borrador'}
            </button>
            <button
              type="button"
              onClick={() => { setShowDraftInput(false); setDraftGoal(''); setResult(null); }}
              className="inline-flex items-center rounded-xl border border-[#d8cbb5] px-4 py-2 text-xs font-semibold text-[#29384a] hover:bg-[#f0e8d8]"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Summary result */}
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

      {/* Missing docs result */}
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

      {/* Draft message result */}
      {result?.action === 'draft' && (
        <div className="mt-4 space-y-3 rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] p-4">
          {result.result.subject && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-[#29384a]">Asunto (email)</p>
                <button
                  type="button"
                  onClick={() => { void copyText(result.result.subject, 'subject'); }}
                  className="flex items-center gap-1 text-xs text-[#c88b25] hover:underline"
                >
                  {copied === 'subject' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied === 'subject' ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <p className="rounded-lg bg-white px-3 py-2 text-sm text-[#07111d]">{result.result.subject}</p>
            </div>
          )}
          {result.result.body && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-[#29384a]">Mensaje</p>
                <button
                  type="button"
                  onClick={() => { void copyText(result.result.body, 'body'); }}
                  className="flex items-center gap-1 text-xs text-[#c88b25] hover:underline"
                >
                  {copied === 'body' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied === 'body' ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <p className="whitespace-pre-wrap rounded-lg bg-white px-3 py-3 text-sm text-[#07111d]">{result.result.body}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
