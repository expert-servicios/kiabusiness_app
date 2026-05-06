'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';

export function HoldedBuyButton({ priceId, packageName }: { priceId: string; packageName: string }) {
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/holded/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, packageName })
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleBuy}
      disabled={loading}
      className="inline-flex w-full items-center justify-center gap-2 bg-[#D4A017] px-5 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E] disabled:opacity-60"
    >
      <ShoppingCart className="h-4 w-4" />
      {loading ? 'Redirigiendo…' : 'Comprar ahora'}
    </button>
  );
}
