'use client';
import { useState } from 'react';

const PRICE_ID = 'price_1SyB8ULeYwwgvux4sZbYod1B';
const CALENDLY_URL = 'https://calendly.com/soy-kseniailicheva/reunion-informativa';

export function FormacionBuyButton({ area }: { area: string }) {
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/holded/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: PRICE_ID, packageName: `Formación: ${area}` })
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-2">
      <a
        href={CALENDLY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center border border-[#D4A017] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
      >
        Consulta gratuita 15 min
      </a>
      <button
        onClick={handleBuy}
        disabled={loading}
        className="inline-flex w-full items-center justify-center bg-[#D4A017] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E] disabled:opacity-60"
      >
        {loading ? 'Redirigiendo…' : 'Reservar sesión — 180 €'}
      </button>
    </div>
  );
}
