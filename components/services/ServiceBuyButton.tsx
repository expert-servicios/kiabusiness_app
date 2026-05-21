'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';

type ServiceBuyButtonProps = {
  priceId: string;
  label: string;
  className?: string;
};

export function ServiceBuyButton({ priceId, label, className }: ServiceBuyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBuy = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/services/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId })
      });

      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setError(data.error ?? 'No hemos podido iniciar el pago.');
    } catch {
      setError('No hemos podido iniciar el pago.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleBuy}
        disabled={loading}
        className={
          className ??
          'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#D4A017] px-7 py-3 text-sm font-bold text-[#0D1B2A] shadow-md shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:cursor-not-allowed disabled:opacity-60'
        }
      >
        <ShoppingCart className="h-4 w-4" />
        {loading ? 'Redirigiendo...' : label}
      </button>
      {error && <p className="text-xs font-semibold text-red-700">{error}</p>}
    </div>
  );
}
