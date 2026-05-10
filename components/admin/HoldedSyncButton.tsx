'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, PlugZap } from 'lucide-react';

export function HoldedSyncButton({
  endpoint,
  payload,
  label
}: {
  endpoint: string;
  payload: Record<string, string>;
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok || data.error || data.result?.error) {
        setMessage(data.error ?? data.result?.error ?? 'No se pudo sincronizar');
        return;
      }

      setMessage(data.result?.skipped ? 'Sincronizacion omitida.' : 'Sincronizado con Holded.');
      router.refresh();
    } catch {
      setMessage('Error de conexion.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleSync}
        disabled={loading}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#29384a] transition hover:border-[#d7a33a] hover:text-[#07111d] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlugZap className="h-3.5 w-3.5" />}
        {label}
      </button>
      {message ? <p className="text-xs text-[#29384a]">{message}</p> : null}
    </div>
  );
}
