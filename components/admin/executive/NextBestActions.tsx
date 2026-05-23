'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, AlertCircle, Info, Clock, CheckCircle2, X } from 'lucide-react';

export interface NbaItem {
  id: string;
  action_type: string;
  priority: string;
  title: string;
  description: string | null;
  due_at: string | null;
  created_at: string;
  client: { id: string; full_name: string | null; email: string } | null;
  case: { id: string; service: string } | null;
}

const PRIORITY_ICON: Record<string, React.ElementType> = {
  critica: AlertTriangle,
  alta:    AlertCircle,
  media:   Info,
  baja:    Clock,
};
const PRIORITY_COLOR: Record<string, string> = {
  critica: 'text-red-600',
  alta:    'text-amber-600',
  media:   'text-blue-600',
  baja:    'text-[#29384a]',
};
const PRIORITY_BG: Record<string, string> = {
  critica: 'border-red-200 bg-red-50',
  alta:    'border-amber-200 bg-amber-50',
  media:   'border-[#d8cbb5] bg-white',
  baja:    'border-[#d8cbb5] bg-white',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'hace menos de 1h';
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

function NbaRow({ item, onDismiss }: { item: NbaItem; onDismiss: (id: string) => void }) {
  const [dismissing, setDismissing] = useState(false);
  const Icon = PRIORITY_ICON[item.priority] ?? Info;

  async function dismiss() {
    if (item.priority === 'critica') {
      if (!confirm(`¿Descartar acción crítica?\n\n"${item.title}"`)) return;
    }
    setDismissing(true);
    try {
      const res = await fetch(`/api/admin/nba/${item.id}/dismiss`, { method: 'POST' });
      if (res.ok) onDismiss(item.id);
    } finally {
      setDismissing(false);
    }
  }

  return (
    <div className={`rounded-xl border p-4 ${PRIORITY_BG[item.priority] ?? PRIORITY_BG.media}`}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${PRIORITY_COLOR[item.priority] ?? ''}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#07111d]">{item.title}</p>
          {item.description && (
            <p className="mt-0.5 text-xs text-[#29384a]">{item.description}</p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[#29384a]">
            <span>{timeAgo(item.created_at)}</span>
            {item.client && (
              <Link href={`/admin/clientes/${item.client.id}`} className="font-medium text-[#c88b25] hover:underline">
                {item.client.full_name ?? item.client.email}
              </Link>
            )}
            {item.case && (
              <Link href={`/admin/expedientes/${item.case.id}`} className="font-medium text-[#c88b25] hover:underline">
                Exp: {item.case.service}
              </Link>
            )}
          </div>
        </div>
        <button
          onClick={dismiss}
          disabled={dismissing}
          title="Descartar"
          className="shrink-0 rounded-lg p-1.5 text-[#29384a] hover:bg-[#f0e9da] disabled:opacity-40 transition"
        >
          {dismissing ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function NextBestActions({ initialItems }: { initialItems: NbaItem[] }) {
  const [items, setItems] = useState(initialItems);

  function handleDismiss(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
        <p className="mt-2 text-sm font-semibold text-emerald-800">Todo al día</p>
        <p className="mt-1 text-xs text-emerald-700">No hay acciones pendientes en este momento.</p>
      </section>
    );
  }

  const criticas = items.filter((i) => i.priority === 'critica');
  const resto    = items.filter((i) => i.priority !== 'critica');

  return (
    <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Qué hacer ahora</p>
        <span className="rounded-full bg-[#07111d] px-2.5 py-0.5 text-xs font-bold text-white">
          {items.length}
        </span>
      </div>
      <div className="space-y-2">
        {criticas.map((item) => <NbaRow key={item.id} item={item} onDismiss={handleDismiss} />)}
        {resto.map((item)    => <NbaRow key={item.id} item={item} onDismiss={handleDismiss} />)}
      </div>
    </section>
  );
}
