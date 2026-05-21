'use client';

import { ShoppingBag, Check } from 'lucide-react';
import { useCart, type CartItem } from '@/contexts/CartContext';

type AddToCartButtonProps = {
  item      : CartItem;
  label?    : string;
  className?: string;
};

const DEFAULT_CLASS =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#D4A017] px-7 py-3 text-sm font-bold text-[#0D1B2A] shadow-md shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:cursor-not-allowed disabled:opacity-60';

export function AddToCartButton({ item, label = 'Añadir a la cesta', className }: AddToCartButtonProps) {
  const { addItem, items } = useCart();
  const inCart = items.some(i => i.priceId === item.priceId);

  return (
    <button
      type="button"
      onClick={() => { if (!inCart) addItem(item); }}
      disabled={inCart}
      className={className ?? DEFAULT_CLASS}
    >
      {inCart ? (
        <>
          <Check className="h-4 w-4" />
          En la cesta
        </>
      ) : (
        <>
          <ShoppingBag className="h-4 w-4" />
          {label}
        </>
      )}
    </button>
  );
}
