'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowDownCircle, CheckCircle2, Clock, CreditCard, RefreshCw, Search, XCircle } from 'lucide-react';

interface Pago {
  id: string;
  payment_intent_id: string;
  customer_email: string | null;
  amount: number;
  currency: string;
  status: string;
  metadata: Record<string, string | null> | null;
  created_at: string;
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function fmtAmount(cents: number, currency: string) {
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: currency.toUpperCase() });
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'succeeded') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
      <CheckCircle2 className="h-3 w-3" /> Cobrado
    </span>
  );
  if (status === 'canceled') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">
      <XCircle className="h-3 w-3" /> Cancelado
    </span>
  );
  if (status === 'requires_confirmation' || status === 'requires_payment_method') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-700">
      <Clock className="h-3 w-3" /> Pendiente
    </span>
  );
  return (
    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">{status}</span>
  );
}

export default function AdminPagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; profilesLinked: number } | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pagos');
      const data = await res.json();
      setPagos(data.pagos ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const runSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/admin/pagos', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncResult({ synced: data.synced, profilesLinked: data.profilesLinked });
        await load();
      }
    } finally {
      setSyncing(false);
    }
  };

  const filtered = pagos.filter((p) => {
    const q = search.toLowerCase();
    const matchQ = !q
      || (p.customer_email ?? '').toLowerCase().includes(q)
      || ((p.metadata?.customer_name ?? '') as string).toLowerCase().includes(q)
      || (p.payment_intent_id ?? '').includes(q);
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchQ && matchStatus;
  });

  const totalCobrado = pagos
    .filter((p) => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.amount, 0);

  const countSucceeded = pagos.filter((p) => p.status === 'succeeded').length;
  const countPending   = pagos.filter((p) => p.status !== 'succeeded' && p.status !== 'canceled').length;

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-8">
      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#c88b25]">Stripe</p>
            <h1 className="mt-1 flex items-center gap-2 font-serif text-2xl font-bold text-[#07111d]">
              <CreditCard className="h-6 w-6 text-[#d7a33a]" /> Pagos
            </h1>
            <p className="mt-1 text-sm text-[#29384a]">Pagos sincronizados desde Stripe — 2026</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-sm font-semibold text-[#29384a] transition hover:border-[#c88b25] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button
              type="button"
              onClick={runSync}
              disabled={syncing}
              className="flex items-center gap-2 rounded-xl bg-[#07111d] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1a2d42] disabled:opacity-60"
            >
              <ArrowDownCircle className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando…' : 'Sincronizar con Stripe'}
            </button>
          </div>
        </div>

        {syncResult && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Sincronización completada: <strong>{syncResult.synced}</strong> pagos importados ·{' '}
            <strong>{syncResult.profilesLinked}</strong> perfiles vinculados con Stripe
          </div>
        )}

        {/* KPI strip */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: 'Total cobrado 2026', value: fmtAmount(totalCobrado, 'eur'), icon: CreditCard },
            { label: 'Pagos cobrados', value: countSucceeded, icon: CheckCircle2 },
            { label: 'Pendientes', value: countPending, icon: Clock },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-[#d8cbb5] bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-[#d7a33a]" />
                <span className="text-xs text-[#29384a]">{label}</span>
              </div>
              <p className="mt-1 font-serif text-xl font-bold text-[#07111d]">{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Buscar por email, nombre o ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#d8cbb5] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#d7a33a]"
            />
          </div>
          <select
            aria-label="Filtrar por estado"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-[#d8cbb5] bg-white px-3 py-2 text-sm outline-none focus:border-[#d7a33a]"
          >
            <option value="all">Todos los estados</option>
            <option value="succeeded">Cobrados</option>
            <option value="canceled">Cancelados</option>
            <option value="requires_confirmation">Pendientes</option>
          </select>
          <span className="text-xs text-[#29384a]">{filtered.length} de {pagos.length}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-[#29384a]">Cargando…</div>
        ) : pagos.length === 0 ? (
          <div className="rounded-2xl border border-[#d8cbb5] bg-white py-20 text-center">
            <CreditCard className="mx-auto mb-3 h-10 w-10 text-[#d8cbb5]" />
            <p className="text-sm font-semibold text-[#29384a]">Sin pagos sincronizados</p>
            <p className="mt-1 text-xs text-[#9ca3af]">Pulsa &quot;Sincronizar con Stripe&quot; para importar los pagos de 2026</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#d8cbb5] bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#d8cbb5] text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#29384a]">
                  <th scope="col" className="px-4 py-3">Fecha</th>
                  <th scope="col" className="px-4 py-3">Cliente</th>
                  <th scope="col" className="px-4 py-3">Servicio / Descripción</th>
                  <th scope="col" className="px-4 py-3 text-right">Importe</th>
                  <th scope="col" className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="py-16 text-center text-sm text-[#29384a]">Sin resultados</td></tr>
                )}
                {filtered.map((p) => {
                  const name = (p.metadata?.customer_name as string | null | undefined) ?? null;
                  const serviceName = (p.metadata?.service_name as string | null | undefined)
                    ?? (p.metadata?.description as string | null | undefined)
                    ?? null;
                  return (
                    <tr key={p.id} className="border-b border-[#f8f4eb] transition hover:bg-[#faf7f0]">
                      <td className="px-4 py-3 text-xs text-[#29384a] whitespace-nowrap">{fmt(p.created_at)}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#07111d]">{name ?? <span className="italic text-[#9ca3af]">Anónimo</span>}</p>
                        {p.customer_email && (
                          <p className="text-xs text-[#29384a]">{p.customer_email}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#29384a]">
                        {serviceName ?? <span className="italic text-[#9ca3af]">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-[#07111d]">
                        {fmtAmount(p.amount, p.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
