'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

export function QuoteResendButton({ quoteId }: { quoteId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleResend = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/admin/quotes/${quoteId}/resend`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: data.error ?? 'Error al reenviar' });
      } else {
        setResult({ ok: true, message: 'Enlace de pago reenviado correctamente.' });
      }
    } catch {
      setResult({ ok: false, message: 'Error de conexión.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleResend}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full bg-[#c88b25] px-5 py-2 text-sm font-bold uppercase tracking-[0.18em] text-[#061321] transition hover:bg-[#b57a1e] disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
        {loading ? 'Enviando…' : 'Reenviar enlace de pago'}
      </button>
      {result && (
        <p className={`text-sm font-semibold ${result.ok ? 'text-green-700' : 'text-red-600'}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}
