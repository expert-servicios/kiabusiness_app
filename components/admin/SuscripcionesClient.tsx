'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  CreditCard, CheckCircle2, AlertCircle, XCircle, RefreshCw,
  Mail, MessageCircle, ExternalLink, ArrowLeft, Loader2,
  User, Repeat2, Clock, Activity,
} from 'lucide-react';
import type { Subscription } from '@/app/(protected)/admin/suscripciones/page';
import { WaTemplateModal } from './WaTemplateModal';
import { NuevaCotizacionModal } from './NuevaCotizacionModal';

type FilterStatus = 'all' | 'active' | 'problem' | 'canceled';

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  active:   { label: 'Activa',          icon: <CheckCircle2 className="h-3.5 w-3.5"/>, color: 'bg-green-100 text-green-700 border-green-200' },
  trialing: { label: 'Prueba',          icon: <Clock className="h-3.5 w-3.5"/>,        color: 'bg-blue-100 text-blue-700 border-blue-200' },
  past_due: { label: 'Pago pendiente',  icon: <AlertCircle className="h-3.5 w-3.5"/>, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  canceled: { label: 'Cancelada',       icon: <XCircle className="h-3.5 w-3.5"/>,     color: 'bg-gray-100 text-gray-500 border-gray-200' },
  unpaid:   { label: 'Sin pagar',       icon: <AlertCircle className="h-3.5 w-3.5"/>, color: 'bg-red-100 text-red-700 border-red-200' },
};

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function SuscripcionesClient({ initialSubscriptions }: { initialSubscriptions: Subscription[] }) {
  const [subs, setSubs] = useState<Subscription[]>(initialSubscriptions);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [retrying, setRetrying] = useState<string | null>(null);
  const [retryResult, setRetryResult] = useState<Record<string, 'success' | 'error'>>({});
  const [retryError, setRetryError] = useState<Record<string, string>>({});
  const [waTarget, setWaTarget] = useState<Subscription | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/admin/subscriptions');
      if (res.ok) { const d = await res.json(); setSubs(d.subscriptions ?? []); }
    } finally { setRefreshing(false); }
  }, []);

  const handleRetry = async (sub: Subscription) => {
    setRetrying(sub.id);
    setRetryError((prev) => { const n = { ...prev }; delete n[sub.id]; return n; });
    try {
      const res = await fetch(`/api/admin/subscriptions/${sub.id}/retry`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setRetryError((prev) => ({ ...prev, [sub.id]: data.error ?? 'Error al reintentar' }));
        setRetryResult((prev) => ({ ...prev, [sub.id]: 'error' }));
      } else {
        setRetryResult((prev) => ({ ...prev, [sub.id]: 'success' }));
        // Update the local subscription status
        if (data.newSubStatus) {
          setSubs((prev) => prev.map((s) => s.id === sub.id ? { ...s, status: data.newSubStatus } : s));
        }
      }
    } finally { setRetrying(null); }
  };

  const filtered = useMemo(() => {
    switch (filter) {
      case 'active':   return subs.filter((s) => s.status === 'active' || s.status === 'trialing');
      case 'problem':  return subs.filter((s) => s.status === 'past_due' || s.status === 'unpaid');
      case 'canceled': return subs.filter((s) => s.status === 'canceled');
      default:         return subs;
    }
  }, [subs, filter]);

  const counts = {
    all:      subs.length,
    active:   subs.filter((s) => s.status === 'active' || s.status === 'trialing').length,
    problem:  subs.filter((s) => s.status === 'past_due' || s.status === 'unpaid').length,
    canceled: subs.filter((s) => s.status === 'canceled').length,
  };

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-8">
      <div className="mx-auto max-w-5xl px-6">

        {/* Header */}
        <div className="mb-5 flex items-center gap-2 text-xs font-semibold text-[#29384a]">
          <ArrowLeft className="h-3.5 w-3.5" />
          <Link href="/admin" className="hover:text-[#07111d]">Panel admin</Link>
        </div>

        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#c88b25]">Facturación recurrente</p>
            <h1 className="mt-1 flex items-center gap-2 font-serif text-2xl font-bold text-[#07111d]">
              <Repeat2 className="h-5 w-5 text-[#d7a33a]" /> Suscripciones
            </h1>
          </div>
          <button type="button" onClick={refresh} disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-sm font-semibold text-[#29384a] hover:border-[#c88b25] disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* KPI strip */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([
            { key: 'all', label: 'Total', color: 'text-[#07111d]' },
            { key: 'active', label: 'Activas', color: 'text-green-700' },
            { key: 'problem', label: 'Con problemas', color: 'text-amber-700' },
            { key: 'canceled', label: 'Canceladas', color: 'text-gray-500' },
          ] as const).map(({ key, label, color }) => (
            <button key={key} type="button" onClick={() => setFilter(key)}
              className={`rounded-2xl border p-4 text-left transition ${
                filter === key ? 'border-[#D4A017] bg-[#D4A017]/5' : 'border-[#d8cbb5] bg-white hover:border-[#c88b25]'
              }`}>
              <p className={`font-serif text-2xl font-bold ${color}`}>{counts[key]}</p>
              <p className="mt-1 text-xs text-[#29384a]">{label}</p>
            </button>
          ))}
        </div>

        {/* Problem alert */}
        {counts.problem > 0 && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              <strong>{counts.problem} suscripci{counts.problem === 1 ? 'ón tiene' : 'ones tienen'}</strong>{' '}
              pago pendiente. Usa el botón "Reintentar cobro" para reintentarlo directamente desde Stripe.
            </p>
            <button type="button" onClick={() => setFilter('problem')}
              className="ml-auto shrink-0 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700">
              Ver problemas
            </button>
          </div>
        )}

        {/* List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#d8cbb5] bg-white py-16 text-center">
            <Activity className="h-10 w-10 text-[#d8cbb5]" />
            <p className="mt-3 font-semibold text-[#29384a]">Sin suscripciones en esta categoría</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((sub) => {
              const cfg = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.canceled;
              const isProblem = sub.status === 'past_due' || sub.status === 'unpaid';
              const displayPhone = sub.client?.whatsapp_number ?? sub.client?.phone ?? null;
              const stripeUrl = sub.stripe_customer_id
                ? `https://dashboard.stripe.com/customers/${sub.stripe_customer_id}`
                : null;

              return (
                <div key={sub.id}
                  className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                    isProblem ? 'border-amber-200 bg-amber-50/30' : 'border-[#d8cbb5]'
                  }`}>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                    {/* Left: client + plan */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                        <span className="font-semibold text-[#07111d]">{sub.plan_name}</span>
                      </div>

                      {/* Client info */}
                      {sub.client ? (
                        <div className="flex flex-wrap items-center gap-2 text-sm text-[#29384a]">
                          <User className="h-3.5 w-3.5 shrink-0 text-[#9ca3af]" />
                          {sub.client_id ? (
                            <Link href={`/admin/clientes/${sub.client_id}`}
                              className="font-semibold text-[#07111d] hover:text-[#c88b25] hover:underline">
                              {sub.client.name ?? sub.client.email}
                            </Link>
                          ) : (
                            <span className="font-semibold">{sub.client.name ?? sub.client.email}</span>
                          )}
                          <span className="text-xs text-[#9ca3af]">{sub.client.email}</span>
                        </div>
                      ) : (
                        <p className="text-xs text-[#9ca3af]">Cliente: {sub.client_id?.slice(0, 8) ?? '—'}</p>
                      )}

                      {/* Dates */}
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#29384a]/70">
                        <span>Alta: {fmt(sub.created_at)}</span>
                        {sub.current_period_end && (
                          <span>Próx. renovación: <strong className="text-[#07111d]">{fmt(sub.current_period_end)}</strong></span>
                        )}
                        {sub.canceled_at && (
                          <span className="text-gray-400">Cancelada: {fmt(sub.canceled_at)}</span>
                        )}
                      </div>

                      {/* Retry error */}
                      {retryError[sub.id] && (
                        <p className="mt-2 text-xs text-red-600">{retryError[sub.id]}</p>
                      )}
                      {retryResult[sub.id] === 'success' && (
                        <p className="mt-2 text-xs text-green-700 font-semibold">✓ Cobro reintentado con éxito</p>
                      )}
                    </div>

                    {/* Right: actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Retry payment */}
                      {isProblem && (
                        <button
                          type="button"
                          onClick={() => handleRetry(sub)}
                          disabled={retrying === sub.id}
                          className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50"
                        >
                          {retrying === sub.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <RefreshCw className="h-3.5 w-3.5" />}
                          Reintentar cobro
                        </button>
                      )}

                      {/* WhatsApp */}
                      {displayPhone && (
                        <button
                          type="button"
                          title="Enviar WhatsApp"
                          onClick={() => setWaTarget(sub)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#25D366] text-white transition hover:bg-[#1da851]"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                      )}

                      {/* Email */}
                      {sub.client?.email && (
                        <a href={`mailto:${sub.client.email}`}
                          title="Enviar email"
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#d8cbb5] text-[#29384a] transition hover:border-[#c88b25]">
                          <Mail className="h-4 w-4" />
                        </a>
                      )}

                      {/* Stripe dashboard */}
                      {stripeUrl && (
                        <a href={stripeUrl} target="_blank" rel="noopener noreferrer"
                          title="Ver en Stripe"
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#d8cbb5] text-[#29384a] transition hover:border-[#c88b25]">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}

                      {/* Client profile */}
                      {sub.client_id && (
                        <Link href={`/admin/clientes/${sub.client_id}`}
                          title="Ver ficha cliente"
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#d8cbb5] text-[#29384a] transition hover:border-[#c88b25]">
                          <User className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* WhatsApp modal */}
      {waTarget?.client?.whatsapp_number && (
        <WaTemplateModal
          defaultPhone={waTarget.client.whatsapp_number}
          onClose={() => setWaTarget(null)}
          onSent={() => setWaTarget(null)}
        />
      )}
    </main>
  );
}
