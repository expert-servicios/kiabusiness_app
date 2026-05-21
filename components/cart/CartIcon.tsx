'use client';

import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export function CartIcon() {
  const { items, toggle } = useCart();
  const count = items.length;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Cesta${count > 0 ? ` — ${count} ${count === 1 ? 'servicio' : 'servicios'}` : ''}`}
      className="relative flex h-10 w-10 items-center justify-center rounded-md border border-white/20 text-[#F8F6F1]/80 transition hover:border-[#D4A017] hover:text-[#D4A017]"
    >
      <ShoppingBag className="h-5 w-5" />
      {count > 0 && (
        <span
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4A017] text-[10px] font-bold text-[#0D1B2A]"
          aria-hidden="true"
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}
