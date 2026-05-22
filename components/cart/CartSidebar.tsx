'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export function CartSidebar() {
  const { items, removeItem, clearCart, isOpen, close } = useCart();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/services/checkout', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ priceIds: items.map(i => i.priceId) }),
      });
      const data = await res.json() as { url?: string; error?: string; requiresAuth?: boolean };
      if (res.status === 401 || data.requiresAuth) {
        window.location.href = '/acceso?next=/carrito';
        return;
      }
      if (data.url) {
        clearCart();
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
    <>
      {/* Backdrop */}
      <div
        className={[
          'fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={close}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-label="Cesta de servicios"
        aria-modal="true"
        className={[
          'fixed right-0 top-0 z-[90] flex h-full w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D4A017]/20 bg-[#0D1B2A] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-[#D4A017]" />
            <h2 className="font-serif text-lg font-bold text-white">Tu cesta</h2>
            {items.length > 0 && (
              <span className="rounded-full bg-[#D4A017] px-2 py-0.5 text-xs font-bold text-[#0D1B2A]">
                {items.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar cesta"
            className="rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <ShoppingBag className="h-12 w-12 text-[#D4A017]/30" />
              <p className="font-semibold text-[#0D1B2A]">Tu cesta está vacía</p>
              <p className="text-sm text-[#23364D]/60">Añade servicios desde las páginas de cada área</p>
              <button
                type="button"
                onClick={close}
                className="mt-2 rounded-xl bg-[#D4A017] px-5 py-2.5 text-sm font-bold text-[#0D1B2A] transition hover:bg-[#F2C14E]"
              >
                Ver servicios
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map(item => (
                <li key={item.priceId} className="rounded-2xl border border-[#D4A017]/20 bg-[#F8F6F1] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/servicios/${item.category}/${item.slug}`}
                        onClick={close}
                        className="text-sm font-semibold text-[#0D1B2A] leading-snug hover:text-[#D4A017] transition"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-sm font-bold text-[#D4A017]">{item.displayPrice}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.priceId)}
                      aria-label={`Eliminar ${item.name}`}
                      className="shrink-0 rounded-lg p-1.5 text-[#23364D]/40 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="space-y-3 border-t border-[#D4A017]/20 p-5">
            <p className="text-xs leading-relaxed text-[#23364D]/60">
              Precios sin IVA. El total con IVA se confirma en la pasarela de pago Stripe.
            </p>
            {error && <p className="text-xs font-semibold text-red-700">{error}</p>}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4A017] py-3 text-sm font-bold text-[#0D1B2A] shadow-md shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:opacity-60"
            >
              <ArrowRight className="h-4 w-4" />
              {loading ? 'Redirigiendo...' : 'Tramitar pedido'}
            </button>
            <Link
              href="/carrito"
              onClick={close}
              className="block text-center text-sm font-medium text-[#23364D] transition hover:text-[#D4A017]"
            >
              Ver cesta completa →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
