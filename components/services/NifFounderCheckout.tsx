'use client';

import { useState } from 'react';
import { FounderServiceCheckoutButton } from '@/components/services/FounderServiceCheckoutButton';

export function NifFounderCheckout() {
  const [quantity, setQuantity] = useState(1);
  const total = quantity * 60;

  return (
    <div className="rounded-3xl border border-[#D4A017]/20 bg-white p-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9A6B12]">Número de socios</p>
      <div className="mt-3 flex items-center gap-3">
        <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="h-10 w-10 rounded-xl border border-[#0D1B2A]/15 text-lg font-bold">−</button>
        <span className="min-w-10 text-center text-xl font-bold">{quantity}</span>
        <button type="button" onClick={() => setQuantity((q) => Math.min(10, q + 1))} className="h-10 w-10 rounded-xl border border-[#0D1B2A]/15 text-lg font-bold">+</button>
      </div>
      <p className="mt-4 font-serif text-2xl font-bold">{total} € + IVA</p>
      <p className="mt-1 text-xs text-[#657383]">60 € + IVA por cada persona física.</p>
      <div className="mt-5">
        <FounderServiceCheckoutButton
          slug="nif-socio-extranjero"
          quantity={quantity}
          label={quantity === 1 ? 'Contratar 1 NIF' : `Contratar ${quantity} NIF`}
        />
      </div>
    </div>
  );
}
