'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, FileBarChart, Loader2 } from 'lucide-react';

type GenerateReportResponse = {
  ok?: boolean;
  reportId?: string;
  error?: string;
  code?: string;
};

function currentQuarterLabel() {
  const now = new Date();
  return `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`;
}

export function GenerateReportPanel() {
  const router = useRouter();
  const [period, setPeriod] = useState(currentQuarterLabel);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: period.trim() || undefined,
          lang: 'es',
          generatedBy: 'user',
        }),
      });
      const data = await res.json().catch(() => ({})) as GenerateReportResponse;

      if (!res.ok || !data.reportId) {
        setError(data.error ?? 'No se pudo generar el informe en este momento.');
        setErrorCode(data.code ?? null);
        return;
      }

      router.push(`/dashboard/informes/${data.reportId}`);
      router.refresh();
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-[#e8dfc8] bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c88b25]/10 text-[#c88b25]">
          <FileBarChart size={18} />
        </div>
        <div>
          <h2 className="font-serif text-lg font-bold text-[#07111d]">Generar informe visual</h2>
          <p className="mt-1 text-sm leading-6 text-[#7a6e5f]">
            Kia preparará un informe con KPIs, IVA estimado, flujo mensual, bancos, clientes principales y alertas desde Holded.
          </p>
        </div>
      </div>

      <label className="mt-6 block text-xs font-bold uppercase tracking-[0.16em] text-[#7a6e5f]" htmlFor="report-period">
        Periodo
      </label>
      <input
        id="report-period"
        value={period}
        onChange={(event) => setPeriod(event.target.value)}
        maxLength={20}
        placeholder="Q2 2026"
        className="mt-2 w-full rounded-xl border border-[#d8cbb5] bg-[#faf8f2] px-4 py-3 text-sm font-semibold text-[#07111d] outline-none transition focus:border-[#c88b25] focus:ring-2 focus:ring-[#c88b25]/20"
      />

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">{error}</p>
              {errorCode === 'holded_not_connected' && (
                <Link href="/dashboard/integraciones/holded" className="mt-1 inline-block font-semibold underline underline-offset-4">
                  Conectar Holded
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#c88b25] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#b07820] disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileBarChart className="h-4 w-4" />}
          {loading ? 'Generando informe...' : 'Generar informe'}
        </button>
        <Link href="/dashboard/informes" className="text-center text-sm font-semibold text-[#7a6e5f] hover:text-[#07111d]">
          Volver a mis informes
        </Link>
      </div>
    </form>
  );
}
