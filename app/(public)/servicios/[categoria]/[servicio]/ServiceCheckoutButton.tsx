'use client';

import { useState } from 'react';

export function ServiceCheckoutButton({ priceId, label = 'Contratar ahora' }: { priceId: string; label?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/services/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId })
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? 'No se pudo iniciar el pago.');
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex min-h-12 w-full items-center justify-center bg-[#D4A017] px-7 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E] disabled:opacity-60"
      >
        {loading ? 'Redirigiendo...' : label}
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
