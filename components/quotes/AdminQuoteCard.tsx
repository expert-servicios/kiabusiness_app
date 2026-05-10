'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Pencil } from 'lucide-react';
import { HoldedSyncButton } from '@/components/admin/HoldedSyncButton';

interface Quote {
  id: string;
  title: string;
  amount_eur: number;
  status: string;
  created_at: string;
  expires_at: string | null;
  client_id: string | null;
}

const quoteStatuses = ['draft', 'sent', 'accepted', 'paid', 'expired'] as const;

type QuoteStatus = (typeof quoteStatuses)[number];

interface AdminQuoteCardProps {
  quote: Quote;
}

export function AdminQuoteCard({ quote }: AdminQuoteCardProps) {
  const router = useRouter();
  const [amount, setAmount] = useState<string>(quote.amount_eur.toFixed(2));
  const [status, setStatus] = useState<QuoteStatus>(quote.status as QuoteStatus);
  const [expiresAt, setExpiresAt] = useState<string>(quote.expires_at ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    const payload: Record<string, unknown> = {
      amount_eur: parseFloat(amount),
      status,
      expires_at: expiresAt || undefined
    };

    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'No se pudo actualizar el presupuesto');
        return;
      }

      setMessage('Presupuesto actualizado correctamente.');
      router.refresh();
    } catch (error) {
      setMessage('Error al actualizar.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#d8cbb5] bg-[#f8f4eb] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#07111d]">{quote.title}</p>
          <p className="mt-2 text-sm text-[#29384a]">Creado el {new Date(quote.created_at).toLocaleDateString('es-ES')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#061321] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#F8F6F1]">
            <CheckCircle2 className="h-4 w-4" />
            {quote.status}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#d7a33a]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#061321]">
            {quote.client_id ? 'Cliente registrado' : 'Lead anónimo'}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-4 text-sm text-[#29384a]">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#07111d]">Importe (€)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#d8cbb5] bg-white px-4 py-3 text-[#07111d] outline-none focus:border-[#c88b25]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#07111d]">Estado</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as QuoteStatus)}
              className="mt-2 w-full rounded-xl border border-[#d8cbb5] bg-white px-4 py-3 text-[#07111d] outline-none focus:border-[#c88b25]"
            >
              {quoteStatuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4 text-sm text-[#29384a]">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#07111d]">Vence el</label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[#d8cbb5] bg-white px-4 py-3 text-[#07111d] outline-none focus:border-[#c88b25]"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#c88b25] px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#061321] transition hover:bg-[#b57a1e] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Pencil className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>

          <HoldedSyncButton
            endpoint="/api/admin/integrations/holded/sync-quote"
            payload={{ quoteId: quote.id }}
            label="Sync Holded"
          />

          {message ? <p className="text-sm text-[#29384a]">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
