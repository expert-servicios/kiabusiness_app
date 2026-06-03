'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AdminQuoteCard } from '@/components/quotes/AdminQuoteCard';
import { NuevaCotizacionModal } from './NuevaCotizacionModal';

interface Quote {
  id: string;
  title: string;
  amount_eur: number;
  status: string;
  created_at: string;
  expires_at: string | null;
  client_id: string | null;
}

const STATUS_ORDER = ['draft', 'sent', 'accepted', 'paid', 'expired'];
const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviado',
  accepted: 'Aceptado',
  paid: 'Pagado',
  expired: 'Expirado',
};
const STATUS_COLORS: Record<string, string> = {
  draft:    'bg-gray-100 text-gray-600',
  sent:     'bg-blue-100 text-blue-700',
  accepted: 'bg-amber-100 text-amber-700',
  paid:     'bg-green-100 text-green-700',
  expired:  'bg-red-100 text-red-600',
};

export function PresupuestosClient({ initialQuotes }: { initialQuotes: Quote[] }) {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const handleCreated = useCallback(() => {
    setShowModal(false);
    router.refresh();
  }, [router]);

  const filtered = filterStatus === 'all'
    ? quotes
    : quotes.filter((q) => q.status === filterStatus);

  const countByStatus = STATUS_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = quotes.filter((q) => q.status === s).length;
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-8">
      <div className="mx-auto max-w-4xl px-6">

        {/* Header */}
        <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-[#29384a]">
          <ArrowLeft className="h-3.5 w-3.5" />
          <Link href="/admin" className="hover:text-[#07111d]">Panel admin</Link>
        </div>

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#c88b25]">Operaciones</p>
            <h1 className="mt-1 flex items-center gap-2 font-serif text-2xl font-bold text-[#07111d]">
              <FileText className="h-5 w-5 text-[#d7a33a]" /> Presupuestos
            </h1>
            <p className="mt-1 text-sm text-[#29384a]">{quotes.length} presupuesto{quotes.length !== 1 ? 's' : ''} en total</p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-[#07111d] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1a2a3a]"
          >
            <Plus className="h-4 w-4" /> Nueva cotización
          </button>
        </div>

        {/* Status filter tabs */}
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              filterStatus === 'all' ? 'bg-[#07111d] text-white' : 'bg-white border border-[#d8cbb5] text-[#29384a] hover:border-[#c88b25]'
            }`}
          >
            Todos ({quotes.length})
          </button>
          {STATUS_ORDER.filter((s) => countByStatus[s] > 0).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                filterStatus === s
                  ? 'bg-[#07111d] text-white'
                  : `border border-[#d8cbb5] bg-white text-[#29384a] hover:border-[#c88b25]`
              }`}
            >
              {STATUS_LABELS[s]} ({countByStatus[s]})
            </button>
          ))}
        </div>

        {/* Quote list */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d8cbb5] bg-white py-16 text-center">
            <FileText className="mx-auto mb-3 h-10 w-10 text-[#d8cbb5]" />
            <p className="font-semibold text-[#29384a]">Sin presupuestos</p>
            {filterStatus !== 'all' && (
              <p className="mt-1 text-sm text-[#9ca3af]">No hay presupuestos con estado "{STATUS_LABELS[filterStatus]}".</p>
            )}
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-4 flex items-center gap-2 mx-auto rounded-xl bg-[#07111d] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1a2a3a]"
            >
              <Plus className="h-4 w-4" /> Nueva cotización
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((quote) => (
              <AdminQuoteCard key={quote.id} quote={quote} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <NuevaCotizacionModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </main>
  );
}
