'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Loader2, Minus } from 'lucide-react';
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
  pending: { label: 'Pendiente', icon: Clock, bg: 'bg-amber-50 border-amber-200', color: 'text-amber-700' },
  submitted: { label: 'Presentada', icon: CheckCircle2, bg: 'bg-green-50 border-green-200', color: 'text-green-700' },
  exempt: { label: 'Exenta', icon: Minus, bg: 'bg-gray-50 border-gray-200', color: 'text-gray-600' },
  skipped: { label: 'Omitida', icon: Minus, bg: 'bg-gray-50 border-gray-200', color: 'text-gray-500' },
} as const;

function formatDeadline(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function AdminFiscalCalendar({ obligations: initialObligations, users, year }: Props) {
  const [obligations, setObligations] = useState(initialObligations);
  const [filterUser, setFilterUser] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterModelo, setFilterModelo] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const modelos = useMemo(() => [...new Set(obligations.map((o) => o.modelo))].sort(), [obligations]);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const filtered = useMemo(() => obligations.filter((o) => {
    if (filterUser && o.user_id !== filterUser) return false;
    if (filterStatus && o.status !== filterStatus) return false;
    if (filterModelo && o.modelo !== filterModelo) return false;
    return true;
  }), [obligations, filterModelo, filterStatus, filterUser]);

  async function updateStatus(id: string, status: FiscalObligation['status']) {
    setUpdating(id);
    try {
      const res = await fetch('/api/admin/fiscal-calendar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) setObligations((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
        <p className="font-semibold">Generación automática por tipo de cliente retirada.</p>
        <p className="mt-1 text-xs leading-5">Las obligaciones se crean únicamente desde plantillas fiscales confirmadas por Admin en Cliente 360. Esto evita asignar 303, 111, 115, 130, 202 u otros modelos solo por ser empresa o autónomo.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="rounded-xl border border-[#d8cbb5] bg-white px-3 py-2 text-sm">
          <option value="">Todos los clientes</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.full_name ?? u.email}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-xl border border-[#d8cbb5] bg-white px-3 py-2 text-sm">
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option><option value="submitted">Presentada</option><option value="exempt">Exenta</option><option value="skipped">Omitida</option>
        </select>
        <select value={filterModelo} onChange={(e) => setFilterModelo(e.target.value)} className="rounded-xl border border-[#d8cbb5] bg-white px-3 py-2 text-sm">
          <option value="">Todos los modelos</option>
          {modelos.map((m) => <option key={m} value={m}>Modelo {m}</option>)}
        </select>
        <span className="ml-auto text-xs text-[#52606d]">{filtered.length} obligaciones · ejercicio {year}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#d8cbb5] bg-white p-12 text-center">
          <Calendar className="mx-auto mb-3 h-10 w-10 text-[#d8cbb5]" />
          <p className="font-semibold">Sin obligaciones fiscales generadas</p>
          <p className="mt-1 text-sm text-[#52606d]">Activa las plantillas que correspondan desde la ficha Cliente 360 · Fiscal.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#d8cbb5] bg-white">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-b border-[#d8cbb5] bg-[#f8f4eb]"><th className="px-4 py-3 text-left">Modelo</th><th className="px-4 py-3 text-left">Obligación</th><th className="px-4 py-3 text-left">Cliente</th><th className="px-4 py-3 text-left">Plazo</th><th className="px-4 py-3 text-left">Estado</th><th className="px-4 py-3 text-left">Acción</th></tr></thead>
            <tbody className="divide-y divide-[#f0e9d8]">
              {filtered.map((obl) => {
                const cfg = STATUS_CONFIG[obl.status];
                const Icon = cfg.icon;
                const urgency = obl.status === 'pending' ? urgencyLevel(obl.deadline) : 'ok';
                const user = userMap.get(obl.user_id);
                return <tr key={obl.id} className={urgency === 'overdue' ? 'border-l-4 border-l-red-500' : urgency === 'critical' ? 'border-l-4 border-l-amber-500' : ''}>
                  <td className="px-4 py-3 font-mono font-bold">{obl.modelo}</td>
                  <td className="px-4 py-3"><p className="font-medium">{obl.description}</p>{obl.period_label && <p className="text-xs text-[#52606d]">{obl.period_label}</p>}</td>
                  <td className="px-4 py-3 text-xs">{user ? (user.full_name ?? user.email) : obl.user_id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-xs font-medium">{formatDeadline(obl.deadline)}</td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${cfg.bg} ${cfg.color}`}><Icon className="h-3 w-3" />{urgency === 'overdue' && obl.status === 'pending' ? 'Vencida' : cfg.label}</span></td>
                  <td className="px-4 py-3">{updating === obl.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <select value={obl.status} onChange={(e) => void updateStatus(obl.id, e.target.value as FiscalObligation['status'])} className="rounded-lg border border-[#d8cbb5] bg-[#f8f4eb] px-2 py-1 text-xs"><option value="pending">Pendiente</option><option value="submitted">Presentada</option><option value="exempt">Exenta</option><option value="skipped">Omitida</option></select>}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-[#52606d]">Para activar o modificar modelos fiscales, abre el cliente correspondiente en Cliente 360 y entra en <Link href="/admin/clientes" className="font-bold text-[#c88b25]">Fiscal</Link>.</p>
    </div>
  );
}
