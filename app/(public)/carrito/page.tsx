'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export default function CarritoPage() {
  const { items, removeItem, clearCart } = useCart();
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
        window.location.href = '/auth/login?next=/carrito';
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
    <main className="min-h-screen bg-[#F8F6F1] text-[#0D1B2A]">
      {/* Hero */}
      <div className="bg-[#0D1B2A] px-6 pb-10 pt-12 text-[#F8F6F1]">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/servicios"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017] hover:text-[#F2C14E]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Seguir añadiendo servicios
          </Link>
          <h1 className="mt-4 font-serif text-3xl font-bold md:text-4xl">Tu cesta de servicios</h1>
          <p className="mt-3 text-sm text-white/55">
            Revisa los servicios seleccionados y tramita el pedido en un solo pago.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-10">
        {items.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
            <ShoppingBag className="h-16 w-16 text-[#D4A017]/30" />
            <div>
              <p className="text-xl font-semibold text-[#0D1B2A]">Tu cesta está vacía</p>
              <p className="mt-2 text-sm text-[#23364D]/60">
                Explora nuestros servicios y añade los que necesitas
              </p>
            </div>
            <Link
              href="/servicios"
              className="inline-flex items-center gap-2 rounded-xl bg-[#D4A017] px-8 py-3 text-sm font-bold text-[#0D1B2A] shadow-md shadow-[#D4A017]/20 transition hover:bg-[#F2C14E]"
            >
              <ArrowRight className="h-4 w-4" />
              Ver todos los servicios
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
            {/* Items */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">
                {items.length} {items.length === 1 ? 'servicio seleccionado' : 'servicios seleccionados'}
              </p>
              <ul className="space-y-3">
                {items.map(item => (
                  <li
                    key={item.priceId}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-[#D4A017]/20 bg-white p-5"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/servicios/${item.category}/${item.slug}`}
                        className="font-semibold text-[#0D1B2A] transition hover:text-[#D4A017]"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-sm font-bold text-[#D4A017]">{item.displayPrice}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.priceId)}
                      aria-label={`Eliminar ${item.name}`}
                      className="shrink-0 rounded-lg p-2 text-[#23364D]/40 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={clearCart}
                className="mt-2 text-xs text-[#23364D]/50 transition hover:text-red-600"
              >
                Vaciar cesta
              </button>
            </div>

            {/* Summary sidebar */}
            <div className="overflow-hidden rounded-2xl border border-[#D4A017]/30 bg-white lg:sticky lg:top-6">
              <div className="border-b border-[#D4A017]/20 bg-[#D4A017]/8 px-6 py-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#D4A017]">Resumen del pedido</p>
                <p className="mt-1 text-sm text-[#23364D]">
                  {items.length} {items.length === 1 ? 'servicio' : 'servicios'}
                </p>
              </div>
              <div className="space-y-4 p-6">
                <div className="space-y-2 text-sm text-[#23364D]">
                  {items.map(item => (
                    <div key={item.priceId} className="flex items-start justify-between gap-2">
                      <span className="min-w-0 leading-snug">{item.name}</span>
                      <span className="shrink-0 font-semibold text-[#0D1B2A]">{item.displayPrice}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#D4A017]/20 pt-3 text-xs text-[#23364D]/60 leading-relaxed">
                  Precios sin IVA. El total exacto con IVA se calcula y confirma en la pasarela de pago Stripe.
                </div>
                {error && (
                  <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">{error}</p>
                )}
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4A017] py-3 text-sm font-bold text-[#0D1B2A] shadow-md shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:opacity-60"
                >
                  <ArrowRight className="h-4 w-4" />
                  {loading ? 'Redirigiendo...' : 'Tramitar pedido'}
                </button>
                <a
                  href="https://wa.me/34696550480"
                  className="block text-center text-sm font-medium text-[#23364D] transition hover:text-[#D4A017]"
                >
                  ¿Dudas? Escríbenos por WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
