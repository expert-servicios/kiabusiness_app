'use client';

import { useState, useMemo } from 'react';
import { Calendar, CheckCircle2, Clock, AlertCircle, Minus, ChevronDown, ChevronUp, Loader2, CalendarPlus } from 'lucide-react';
import type { ClientType } from '@/lib/utils/fiscal-calendar';
import { urgencyLevel } from '@/lib/utils/fiscal-calendar';

interface FiscalObligation {
  id: string;
  user_id: string;
  company_id: string | null;
  year: number;
  obligation_key: string;
  modelo: string;
  description: string;
  period_label: string | null;
  deadline: string;
  status: 'pending' | 'submitted' | 'exempt' | 'skipped';
  google_event_id: string | null;
  notes: string | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
}

interface Props {
  obligations: FiscalObligation[];
  users: Profile[];
  year: number;
}

const STATUS_CONFIG = {
  pending:   { label: 'Pendiente', icon: Clock,        color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
  submitted: { label: 'Presentada', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  exempt:    { label: 'Exenta',     icon: Minus,        color: 'text-gray-500',  bg: 'bg-gray-50 border-gray-200' },
  skipped:   { label: 'Omitida',    icon: Minus,        color: 'text-gray-400',  bg: 'bg-gray-50 border-gray-200' },
} as const;

const URGENCY_BORDER: Record<string, string> = {
  overdue:  'border-l-4 border-l-red-500',
  critical: 'border-l-4 border-l-amber-500',
  soon:     'border-l-4 border-l-yellow-400',
  ok:       '',
};

function statusBadge(status: FiscalObligation['status'], deadline: string) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  const urgency = status === 'pending' ? urgencyLevel(deadline) : 'ok';
  const color = urgency === 'overdue' ? 'text-red-600' : urgency === 'critical' ? 'text-amber-700' : cfg.color;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.bg} ${color}`}>
      <Icon className="h-3 w-3" /> {urgency === 'overdue' && status === 'pending' ? 'Vencida' : cfg.label}
    </span>
  );
}

function formatDeadline(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function AdminFiscalCalendar({ obligations: initialObligations, users, year }: Props) {
  const [obligations, setObligations] = useState(initialObligations);
  const [filterUser, setFilterUser] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterModelo, setFilterModelo] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genUserId, setGenUserId] = useState('');
  const [genClientType, setGenClientType] = useState<ClientType>('empresa');
  const [genMsg, setGenMsg] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [showGenForm, setShowGenForm] = useState(false);

  const modelos = useMemo(() => [...new Set(obligations.map((o) => o.modelo))].sort(), [obligations]);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const filtered = useMemo(() => {
    return obligations.filter((o) => {
      if (filterUser && o.user_id !== filterUser) return false;
      if (filterStatus && o.status !== filterStatus) return false;
      if (filterModelo && o.modelo !== filterModelo) return false;
      return true;
    });
  }, [obligations, filterUser, filterStatus, filterModelo]);

  async function generateObligations() {
    if (!genUserId) return;
    setGenerating(true);
    setGenMsg('');
    try {
      const res = await fetch('/api/admin/fiscal-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: genUserId, clientType: genClientType, year }),
      });
      const data = await res.json();
      if (!res.ok) { setGenMsg(data.error ?? 'Error'); return; }
      setGenMsg(`✓ ${data.count} obligaciones generadas. Recarga para ver.`);
    } finally {
      setGenerating(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      const res = await fetch('/api/admin/fiscal-calendar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setObligations((prev) =>
          prev.map((o) => o.id === id ? { ...o, status: status as FiscalObligation['status'] } : o)
        );
      }
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-6">

      {/* Generate obligations panel */}
      <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
        <button
          onClick={() => setShowGenForm((v) => !v)}
          className="flex w-full items-center justify-between text-sm font-semibold text-[#07111d]"
        >
          <span className="flex items-center gap-2"><CalendarPlus className="h-4 w-4 text-[#d7a33a]" /> Generar obligaciones para un cliente</span>
          {showGenForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showGenForm && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[#29384a]">Cliente</label>
              <select
                value={genUserId}
                onChange={(e) => setGenUserId(e.target.value)}
                className="w-full rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d7a33a]/40"
              >
                <option value="">Selecciona cliente…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name ?? u.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[#29384a]">Tipo fiscal</label>
              <select
                value={genClientType}
                onChange={(e) => setGenClientType(e.target.value as ClientType)}
                className="w-full rounded-xl border border-[#d8cbb5] bg-[#f8f4eb] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d7a33a]/40"
              >
                <option value="empresa">Empresa (SL/SA)</option>
                <option value="autonomo">Autónomo</option>
                <option value="persona_fisica">Persona física</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={generateObligations}
                disabled={generating || !genUserId}
                className="inline-flex h-[38px] w-full items-center justify-center gap-2 rounded-xl bg-[#07111d] px-4 text-sm font-semibold text-white transition hover:bg-[#1a2d42] disabled:opacity-50"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Generar para {year}
              </button>
            </div>
            {genMsg && <p className="col-span-3 text-xs text-[#29384a]">{genMsg}</p>}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className="rounded-xl border border-[#d8cbb5] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d7a33a]/40"
        >
          <option value="">Todos los clientes</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.full_name ?? u.email}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-[#d8cbb5] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d7a33a]/40"
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="submitted">Presentada</option>
          <option value="exempt">Exenta</option>
          <option value="skipped">Omitida</option>
        </select>
        <select
          value={filterModelo}
          onChange={(e) => setFilterModelo(e.target.value)}
          className="rounded-xl border border-[#d8cbb5] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d7a33a]/40"
        >
          <option value="">Todos los modelos</option>
          {modelos.map((m) => <option key={m} value={m}>Modelo {m}</option>)}
        </select>
        <span className="ml-auto self-center text-xs text-[#29384a]">{filtered.length} obligaciones</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#d8cbb5] bg-white p-12 text-center">
          <Calendar className="mx-auto mb-3 h-10 w-10 text-[#d8cbb5]" />
          <p className="font-semibold text-[#07111d]">Sin obligaciones</p>
          <p className="mt-1 text-sm text-[#29384a]">Genera obligaciones para un cliente usando el panel de arriba.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#d8cbb5] bg-white shadow-sm">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-[#d8cbb5] bg-[#f8f4eb]">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#29384a]">Modelo</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#29384a]">Descripción</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#29384a]">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#29384a]">Plazo</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#29384a]">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#29384a]">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e9d8]">
              {filtered.map((obl) => {
                const urgency = obl.status === 'pending' ? urgencyLevel(obl.deadline) : 'ok';
                const user = userMap.get(obl.user_id);
                return (
                  <tr key={obl.id} className={`transition hover:bg-[#faf8f2] ${URGENCY_BORDER[urgency]}`}>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-lg bg-[#07111d]/8 px-2 py-0.5 font-mono text-xs font-bold text-[#07111d]">
                        {obl.modelo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#07111d]">{obl.description}</p>
                      {obl.period_label && <p className="text-xs text-[#29384a]">{obl.period_label}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#29384a]">
                      {user ? (user.full_name ?? user.email) : obl.user_id.slice(0, 8) + '…'}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-[#07111d]">
                      {formatDeadline(obl.deadline)}
                    </td>
                    <td className="px-4 py-3">{statusBadge(obl.status, obl.deadline)}</td>
                    <td className="px-4 py-3">
                      {updating === obl.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-[#29384a]" />
                      ) : (
                        <select
                          value={obl.status}
                          onChange={(e) => updateStatus(obl.id, e.target.value)}
                          className="rounded-lg border border-[#d8cbb5] bg-[#f8f4eb] px-2 py-1 text-xs focus:outline-none"
                        >
                          <option value="pending">Pendiente</option>
                          <option value="submitted">Presentada</option>
                          <option value="exempt">Exenta</option>
                          <option value="skipped">Omitir</option>
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
