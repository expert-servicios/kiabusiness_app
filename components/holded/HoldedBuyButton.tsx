'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';

export function HoldedBuyButton({ priceId, packageName }: { priceId: string; packageName: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBuy = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/holded/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, packageName })
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? 'No se pudo iniciar el pago.');
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleBuy}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 bg-[#D4A017] px-5 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E] disabled:opacity-60"
      >
        <ShoppingCart className="h-4 w-4" />
        {loading ? 'Redirigiendo...' : 'Comprar ahora'}
      </button>
      {error && <p className="text-center text-xs font-semibold text-red-700">{error}</p>}
    </div>
  );
}
