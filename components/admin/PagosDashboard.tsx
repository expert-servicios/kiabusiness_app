'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  CreditCard, CheckCircle2, Clock, AlertCircle, Search, Download,
  Plus, RefreshCw, Link2, ArrowDownCircle, ChevronDown, ChevronRight,
  Banknote, Repeat2, X, FolderOpen,
} from 'lucide-react';
import type { UnifiedPayment } from '@/app/api/admin/pagos/unified/route';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Kpis { totalCobrado: number; pendingCount: number; unlinkedCount: number; total: number }

// ── Formatters ────────────────────────────────────────────────────────────────
const MONTH = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
function fmtDate(d: string) {
  const dt = new Date(d);
  return `${dt.getDate()} ${MONTH[dt.getMonth()]} ${dt.getFullYear().toString().slice(2)}`;
}
function fmtEur(n: number) {
  if (n === 0) return '—';
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 });
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === 'paid' || status === 'succeeded')
    return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700"><CheckCircle2 className="h-3 w-3"/>Cobrado</span>;
  if (status === 'active')
    return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700"><Repeat2 className="h-3 w-3"/>Activa</span>;
  if (status === 'canceled')
    return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500"><X className="h-3 w-3"/>Cancelado</span>;
  if (status === 'past_due')
    return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700"><AlertCircle className="h-3 w-3"/>Vencido</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700"><Clock className="h-3 w-3"/>Pendiente</span>;
}

// ── Origin badge ──────────────────────────────────────────────────────────────
function OriginBadge({ origin }: { origin: UnifiedPayment['origin'] }) {
  if (origin === 'stripe_order')        return <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">Stripe</span>;
  if (origin === 'stripe_subscription') return <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">Sub.</span>;
  return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">Manual</span>;
}

// ── CSV export ────────────────────────────────────────────────────────────────
function exportCsv(payments: UnifiedPayment[]) {
  const cols = ['Fecha','Cliente','Email','Descripción','Importe','Moneda','Estado','Origen','Expediente','Método','Referencia'];
  const rows = payments.map((p) => [
    fmtDate(p.date),
    p.client_name ?? '',
    p.client_email ?? '',
    p.description,
    p.amount_eur,
    p.currency,
    p.status,
    p.origin,
    p.case_service ?? '',
    p.payment_method ?? '',
    p.reference ?? '',
  ]);
  const csv = [cols, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `pagos_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// ── Manual payment modal ──────────────────────────────────────────────────────
function ManualPaymentModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    description: '', amount_eur: '', client_id: '', case_id: '',
    payment_method: 'transferencia', reference: '', paid_at: new Date().toISOString().slice(0,10), notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [clients, setClients] = useState<{id:string;name:string|null;email:string}[]>([]);
  const [cases, setCases] = useState<{id:string;service:string;state:string}[]>([]);

  const loadClients = useCallback(async () => {
    if (clients.length > 0) return;
    const res = await fetch('/api/admin/clientes');
    if (res.ok) { const d = await res.json(); setClients(d.clients ?? []); }
  }, [clients.length]);

  const loadCases = useCallback(async (clientId: string) => {
    if (!clientId) { setCases([]); return; }
    const res = await fetch(`/api/admin/cases?clientId=${clientId}`);
    if (res.ok) { const d = await res.json(); setCases(d.cases ?? []); }
  }, []);

  const handleSave = async () => {
    if (!form.description || !form.amount_eur) { setError('Descripción e importe son obligatorios.'); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/admin/pagos/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount_eur: parseFloat(form.amount_eur),
          client_id: form.client_id || null,
          case_id: form.case_id || null,
          paid_at: new Date(form.paid_at).toISOString(),
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error'); return; }
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl bg-white sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#f0e9d8] px-5 py-4">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-[#c88b25]"/>
            <p className="font-semibold text-[#07111d]">Registrar pago manual</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#29384a] hover:bg-[#f0e9d8]"><X className="h-4 w-4"/></button>
        </div>
        <div className="p-5 space-y-3">
          <input placeholder="Descripción *" value={form.description} onChange={(e) => setForm((f) => ({...f, description: e.target.value}))}
            className="w-full rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#c88b25]"/>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Importe (€) *" value={form.amount_eur} onChange={(e) => setForm((f) => ({...f, amount_eur: e.target.value}))}
              className="rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#c88b25]"/>
            <select value={form.payment_method} onChange={(e) => setForm((f) => ({...f, payment_method: e.target.value}))}
              className="rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#c88b25]">
              {['transferencia','efectivo','bizum','cheque','otro'].map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={form.paid_at} onChange={(e) => setForm((f) => ({...f, paid_at: e.target.value}))}
              className="rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#c88b25]"/>
            <input placeholder="Referencia / Nº transferencia" value={form.reference} onChange={(e) => setForm((f) => ({...f, reference: e.target.value}))}
              className="rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#c88b25]"/>
          </div>
          <select value={form.client_id} onChange={(e) => { setForm((f) => ({...f, client_id: e.target.value, case_id: ''})); loadCases(e.target.value); }}
            onFocus={loadClients}
            className="w-full rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#c88b25]">
            <option value="">Sin cliente asignado</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name ?? c.email}</option>)}
          </select>
          {cases.length > 0 && (
            <select value={form.case_id} onChange={(e) => setForm((f) => ({...f, case_id: e.target.value}))}
              className="w-full rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#c88b25]">
              <option value="">Sin expediente</option>
              {cases.map((c) => <option key={c.id} value={c.id}>{c.service} ({c.state})</option>)}
            </select>
          )}
          <textarea placeholder="Notas internas (opcional)" value={form.notes} onChange={(e) => setForm((f) => ({...f, notes: e.target.value}))} rows={2}
            className="w-full resize-none rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#c88b25]"/>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-xl border border-[#d8cbb5] px-4 py-2 text-sm font-semibold text-[#29384a] hover:bg-[#f0e9d8]">Cancelar</button>
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#07111d] px-5 py-2 text-sm font-bold text-white hover:bg-[#1a2a3a] disabled:opacity-50">
              {saving ? <RefreshCw className="h-4 w-4 animate-spin"/> : <Plus className="h-4 w-4"/>}
              {saving ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Link case modal ────────────────────────────────────────────────────────────
function LinkCaseModal({ payment, onClose, onLinked }: { payment: UnifiedPayment; onClose: () => void; onLinked: (caseId: string|null) => void }) {
  const [cases, setCases] = useState<{id:string;service:string;state:string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);

  useState(() => {
    if (!payment.client_id) { setLoading(false); return; }
    fetch(`/api/admin/cases?clientId=${payment.client_id}`)
      .then((r) => r.json())
      .then((d) => setCases(d.cases ?? []))
      .finally(() => setLoading(false));
  });

  const link = async (caseId: string|null) => {
    setLinking(true);
    await fetch('/api/admin/pagos/link-case', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: payment.id, caseId, origin: payment.origin }),
    });
    setLinking(false);
    onLinked(caseId);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-white sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#f0e9d8] px-5 py-4">
          <p className="font-semibold text-[#07111d]">Vincular a expediente</p>
          <button type="button" onClick={onClose}><X className="h-4 w-4 text-[#29384a]"/></button>
        </div>
        <div className="p-4 space-y-2">
          {loading ? <p className="py-4 text-center text-sm text-[#29384a]">Cargando...</p> :
           cases.length === 0 ? <p className="py-4 text-center text-sm text-[#29384a]">No hay expedientes para este cliente.</p> :
           cases.map((c) => (
            <button key={c.id} type="button" onClick={() => link(c.id)} disabled={linking}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition hover:border-[#c88b25] ${
                payment.case_id === c.id ? 'border-[#D4A017] bg-[#D4A017]/5' : 'border-[#d8cbb5]'
              }`}>
              <div>
                <p className="font-semibold text-[#07111d]">{c.service}</p>
                <p className="text-xs text-[#29384a]/60">{c.state}</p>
              </div>
              <FolderOpen className="h-4 w-4 text-[#d7a33a]"/>
            </button>
          ))}
          {payment.case_id && (
            <button type="button" onClick={() => link(null)} disabled={linking}
              className="w-full rounded-xl border border-red-200 py-2 text-xs text-red-600 hover:bg-red-50">
              Desasociar expediente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export function PagosDashboard({
  initialPayments,
  initialKpis,
}: {
  initialPayments: UnifiedPayment[];
  initialKpis: Kpis;
}) {
  const [payments, setPayments] = useState<UnifiedPayment[]>(initialPayments);
  const [kpis, setKpis] = useState<Kpis>(initialKpis);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterOrigin, setFilterOrigin] = useState('all');
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showManual, setShowManual] = useState(false);
  const [linkTarget, setLinkTarget] = useState<UnifiedPayment|null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/admin/pagos/unified');
      if (res.ok) { const d = await res.json(); setPayments(d.payments ?? []); setKpis(d.kpis); }
    } finally { setRefreshing(false); }
  }, []);

  const syncStripe = async () => {
    setSyncing(true);
    try {
      await fetch('/api/admin/pagos', { method: 'POST' });
      await refresh();
    } finally { setSyncing(false); }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return payments.filter((p) => {
      if (filterStatus !== 'all') {
        const isPaid = p.status === 'paid' || p.status === 'succeeded';
        const isPending = !isPaid && p.status !== 'canceled';
        if (filterStatus === 'paid' && !isPaid) return false;
        if (filterStatus === 'pending' && !isPending) return false;
        if (filterStatus === 'canceled' && p.status !== 'canceled') return false;
      }
      if (filterOrigin !== 'all' && p.origin !== filterOrigin) return false;
      if (q) {
        return (p.client_name ?? '').toLowerCase().includes(q)
          || (p.client_email ?? '').toLowerCase().includes(q)
          || p.description.toLowerCase().includes(q)
          || (p.reference ?? '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [payments, search, filterStatus, filterOrigin]);

  const toggleRow = (id: string) =>
    setExpanded((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const handleLinked = (paymentId: string, caseId: string|null, caseService?: string|null) => {
    setPayments((prev) => prev.map((p) => p.id === paymentId
      ? { ...p, case_id: caseId, case_service: caseService ?? null }
      : p
    ));
    setLinkTarget(null);
    refresh();
  };

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#c88b25]">Control financiero</p>
            <h1 className="mt-1 flex items-center gap-2 font-serif text-2xl font-bold text-[#07111d]">
              <CreditCard className="h-6 w-6 text-[#d7a33a]"/> Pagos
            </h1>
            <p className="mt-1 text-sm text-[#29384a]">Stripe · Suscripciones · Pagos manuales</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowManual(true)}
              className="flex items-center gap-2 rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-sm font-semibold text-[#29384a] hover:border-[#c88b25]">
              <Plus className="h-4 w-4"/> Manual
            </button>
            <button type="button" onClick={() => exportCsv(filtered)}
              className="flex items-center gap-2 rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-sm font-semibold text-[#29384a] hover:border-[#c88b25]">
              <Download className="h-4 w-4"/> CSV
            </button>
            <button type="button" onClick={syncStripe} disabled={syncing}
              className="flex items-center gap-2 rounded-xl bg-[#07111d] px-4 py-2 text-sm font-bold text-white hover:bg-[#1a2d42] disabled:opacity-60">
              <ArrowDownCircle className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`}/>
              {syncing ? 'Sincronizando…' : 'Sync Stripe'}
            </button>
            <button type="button" onClick={refresh} disabled={refreshing}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d8cbb5] bg-white text-[#29384a] hover:border-[#c88b25] disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}/>
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total cobrado', value: fmtEur(kpis.totalCobrado), icon: CreditCard, color: 'text-green-700' },
            { label: 'Movimientos', value: kpis.total, icon: Repeat2, color: 'text-[#07111d]' },
            { label: 'Pendientes', value: kpis.pendingCount, icon: Clock, color: 'text-amber-700' },
            { label: 'Sin expediente', value: kpis.unlinkedCount, icon: AlertCircle, color: 'text-red-700' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-[#d8cbb5] bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${color}`}/>
                <span className="text-xs text-[#29384a]">{label}</span>
              </div>
              <p className={`mt-1 font-serif text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]"/>
            <input type="text" placeholder="Buscar cliente, descripción o referencia…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#d8cbb5] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#d7a33a]"/>
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-[#d8cbb5] bg-white px-3 py-2 text-sm outline-none focus:border-[#d7a33a]">
            <option value="all">Todos los estados</option>
            <option value="paid">Cobrados</option>
            <option value="pending">Pendientes</option>
            <option value="canceled">Cancelados</option>
          </select>
          <select value={filterOrigin} onChange={(e) => setFilterOrigin(e.target.value)}
            className="rounded-xl border border-[#d8cbb5] bg-white px-3 py-2 text-sm outline-none focus:border-[#d7a33a]">
            <option value="all">Todos los orígenes</option>
            <option value="stripe_order">Stripe (órdenes)</option>
            <option value="stripe_subscription">Suscripciones</option>
            <option value="manual">Manuales</option>
          </select>
          <span className="text-xs text-[#29384a]">{filtered.length} de {payments.length}</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-[#d8cbb5] bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#d8cbb5] text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-[#29384a]">
                <th scope="col" className="w-8 px-3 py-3"/>
                <th scope="col" className="px-4 py-3">Fecha</th>
                <th scope="col" className="px-4 py-3">Cliente</th>
                <th scope="col" className="px-4 py-3">Concepto</th>
                <th scope="col" className="px-4 py-3 text-right">Importe</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3">Origen</th>
                <th scope="col" className="px-4 py-3">Expediente</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="py-16 text-center text-sm text-[#29384a]">Sin resultados</td></tr>
              )}
              {filtered.map((p) => {
                const isExpanded = expanded.has(p.id);
                return (
                  <>
                    <tr key={p.id}
                      className="cursor-pointer border-b border-[#f8f4eb] transition hover:bg-[#faf7f0]"
                      onClick={() => toggleRow(p.id)}>
                      <td className="px-3 py-3 text-[#29384a]">
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5"/> : <ChevronRight className="h-3.5 w-3.5"/>}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#29384a] whitespace-nowrap">{fmtDate(p.date)}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#07111d]">{p.client_name ?? <span className="italic text-[#9ca3af]">Anónimo</span>}</p>
                        {p.client_email && <p className="text-xs text-[#29384a]/60">{p.client_email}</p>}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-xs text-[#29384a]">{p.description}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-[#07111d] whitespace-nowrap">
                        {fmtEur(p.amount_eur)}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={p.status}/></td>
                      <td className="px-4 py-3"><OriginBadge origin={p.origin}/></td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {p.case_service ? (
                          <button type="button" onClick={() => setLinkTarget(p)}
                            className="flex items-center gap-1 rounded-full bg-[#D4A017]/12 px-2.5 py-0.5 text-[10px] font-semibold text-[#c88b25] hover:bg-[#D4A017]/20">
                            <FolderOpen className="h-3 w-3"/>{p.case_service.slice(0,20)}
                          </button>
                        ) : p.origin !== 'stripe_subscription' ? (
                          <button type="button" onClick={() => setLinkTarget(p)}
                            className="flex items-center gap-1 text-[10px] font-semibold text-[#9ca3af] hover:text-[#c88b25]">
                            <Link2 className="h-3 w-3"/>Vincular
                          </button>
                        ) : <span className="text-[10px] text-[#9ca3af]">—</span>}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${p.id}-expand`} className="bg-[#faf7f0]">
                        <td colSpan={8} className="px-8 py-3">
                          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-[#29384a] sm:grid-cols-4">
                            {p.stripe_payment_id && <span><strong>PI:</strong> {p.stripe_payment_id}</span>}
                            {p.reference && <span><strong>Ref:</strong> {p.reference}</span>}
                            {p.payment_method && <span><strong>Método:</strong> {p.payment_method}</span>}
                            {p.holded_invoice_id && <span><strong>Holded:</strong> {p.holded_invoice_id}</span>}
                            {p.case_id && <span><strong>Case ID:</strong> {p.case_id.slice(0,8)}…</span>}
                            {p.case_state && <span><strong>Estado exp.:</strong> {p.case_state}</span>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showManual && (
        <ManualPaymentModal
          onClose={() => setShowManual(false)}
          onSaved={() => { setShowManual(false); refresh(); }}
        />
      )}

      {linkTarget && (
        <LinkCaseModal
          payment={linkTarget}
          onClose={() => setLinkTarget(null)}
          onLinked={(caseId) => handleLinked(linkTarget.id, caseId)}
        />
      )}
    </main>
  );
}
