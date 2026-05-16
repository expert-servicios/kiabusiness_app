'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users, Search, RefreshCw, MessageSquare, FolderOpen,
  Phone, Mail, Calendar, CreditCard, ChevronDown, ChevronUp, ChevronsUpDown
} from 'lucide-react';
import { WaTemplateModal } from '@/components/admin/WaTemplateModal';

interface Client {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  whatsapp_number: string | null;
  status: string;
  created_at: string;
  totalCases: number;
  activeCases: number;
  plan: string | null;
  lastWhatsApp: string | null;
}

type SortKey = 'full_name' | 'created_at' | 'totalCases' | 'activeCases' | 'plan';
type SortDir = 'asc' | 'desc';

const PLAN_LABEL: Record<string, string> = {
  gratuito:     'Gratuito',
  avanzado:     'Avanzado',
  colaborativo: 'Colaborativo',
};

const PLAN_CLS: Record<string, string> = {
  gratuito:     'bg-gray-100 text-gray-600',
  avanzado:     'bg-blue-100 text-blue-700',
  colaborativo: 'bg-[#d7a33a]/15 text-[#c88b25]',
};

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function fmtRelative(d: string | null) {
  if (!d) return null;
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days}d`;
  if (days < 30) return `hace ${Math.floor(days / 7)}sem`;
  return fmt(d);
}

function SortBtn({ col, active, dir, onClick }: { col: string; active: boolean; dir: SortDir; onClick: () => void }) {
  const Icon = active ? (dir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-0.5 hover:text-[#07111d]">
      {col} <Icon className={`h-3 w-3 ${active ? 'text-[#d7a33a]' : 'text-[#9ca3af]'}`} />
    </button>
  );
}

function Initials({ name, email }: { name: string | null; email: string }) {
  const src = name ?? email;
  const letters = src.split(/[\s@]/).filter(Boolean).map((w) => w[0].toUpperCase()).slice(0, 2).join('');
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d7a33a]/12 text-sm font-bold text-[#c88b25]">
      {letters}
    </div>
  );
}

export default function AdminClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [waClient, setWaClient] = useState<Client | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/clientes', { cache: 'no-store' });
      const data = await res.json();
      setClients(data.clients ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = clients
    .filter((c) => {
      const q = search.toLowerCase();
      const matchQ = !q ||
        (c.full_name ?? '').toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone ?? '').includes(q);
      const matchPlan = filterPlan === 'all' || c.plan === filterPlan || (filterPlan === 'none' && !c.plan);
      const matchActive = filterActive === 'all' ||
        (filterActive === 'active' && c.activeCases > 0) ||
        (filterActive === 'inactive' && c.activeCases === 0);
      return matchQ && matchPlan && matchActive;
    })
    .sort((a, b) => {
      let av: string | number = a[sortKey] ?? '';
      let bv: string | number = b[sortKey] ?? '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const withPhone = clients.filter((c) => c.phone || c.whatsapp_number).length;
  const withSub = clients.filter((c) => c.plan).length;
  const withActiveCases = clients.filter((c) => c.activeCases > 0).length;

  return (
    <main className="min-h-screen bg-[#f8f4eb] py-8">
      <div className="mx-auto max-w-7xl px-6">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#c88b25]">CRM</p>
            <h1 className="mt-1 flex items-center gap-2 font-serif text-2xl font-bold text-[#07111d]">
              <Users className="h-6 w-6 text-[#d7a33a]" /> Clientes
            </h1>
            <p className="mt-1 text-sm text-[#29384a]">
              {clients.length} clientes · {withActiveCases} con expedientes activos · {withSub} con suscripción · {withPhone} con teléfono
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-sm font-semibold text-[#29384a] transition hover:border-[#c88b25] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* KPI strip */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total clientes', value: clients.length, icon: Users },
            { label: 'Con expediente activo', value: withActiveCases, icon: FolderOpen },
            { label: 'Con suscripción', value: withSub, icon: CreditCard },
            { label: 'Con teléfono', value: withPhone, icon: Phone },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-[#d8cbb5] bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-[#d7a33a]" />
                <span className="text-xs text-[#29384a]">{label}</span>
              </div>
              <p className="mt-1 font-serif text-2xl font-bold text-[#07111d]">{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#d8cbb5] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#d7a33a]"
            />
          </div>
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="rounded-xl border border-[#d8cbb5] bg-white px-3 py-2 text-sm outline-none focus:border-[#d7a33a]"
          >
            <option value="all">Todos los planes</option>
            <option value="gratuito">Gratuito</option>
            <option value="avanzado">Avanzado</option>
            <option value="colaborativo">Colaborativo</option>
            <option value="none">Sin suscripción</option>
          </select>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="rounded-xl border border-[#d8cbb5] bg-white px-3 py-2 text-sm outline-none focus:border-[#d7a33a]"
          >
            <option value="all">Todos</option>
            <option value="active">Con expediente activo</option>
            <option value="inactive">Sin expediente activo</option>
          </select>
          <span className="text-xs text-[#29384a]">{filtered.length} de {clients.length}</span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-[#29384a]">Cargando clientes…</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#d8cbb5] bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#d8cbb5] text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-[#29384a]">
                  <th className="px-4 py-3">
                    <SortBtn col="Cliente" active={sortKey === 'full_name'} dir={sortDir} onClick={() => toggleSort('full_name')} />
                  </th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3 text-center">
                    <SortBtn col="Exped." active={sortKey === 'totalCases'} dir={sortDir} onClick={() => toggleSort('totalCases')} />
                  </th>
                  <th className="px-4 py-3 text-center">
                    <SortBtn col="Plan" active={sortKey === 'plan'} dir={sortDir} onClick={() => toggleSort('plan')} />
                  </th>
                  <th className="px-4 py-3">
                    <SortBtn col="Alta" active={sortKey === 'created_at'} dir={sortDir} onClick={() => toggleSort('created_at')} />
                  </th>
                  <th className="px-4 py-3">Último WA</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-sm text-[#29384a]">
                      Sin clientes que coincidan con los filtros.
                    </td>
                  </tr>
                )}
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-[#f8f4eb] transition hover:bg-[#faf7f0]">

                    {/* Cliente */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Initials name={c.full_name} email={c.email} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#07111d]">
                            {c.full_name ?? <span className="italic text-[#9ca3af]">Sin nombre</span>}
                          </p>
                          <p className="truncate text-xs text-[#29384a]">{c.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contacto */}
                    <td className="px-4 py-3">
                      {c.phone ? (
                        <div className="flex items-center gap-1 text-xs text-[#29384a]">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span>{c.phone}</span>
                        </div>
                      ) : (
                        <span className="text-xs italic text-[#9ca3af]">Sin teléfono</span>
                      )}
                    </td>

                    {/* Expedientes */}
                    <td className="px-4 py-3 text-center">
                      {c.totalCases > 0 ? (
                        <Link
                          href={`/admin/expedientes?client=${c.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#1fae4b] hover:underline"
                        >
                          <FolderOpen className="h-3 w-3" />
                          {c.activeCases}<span className="font-normal text-[#29384a]">/{c.totalCases}</span>
                        </Link>
                      ) : (
                        <span className="text-xs text-[#9ca3af]">—</span>
                      )}
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3 text-center">
                      {c.plan ? (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${PLAN_CLS[c.plan] ?? 'bg-gray-100 text-gray-600'}`}>
                          {PLAN_LABEL[c.plan] ?? c.plan}
                        </span>
                      ) : (
                        <span className="text-xs text-[#9ca3af]">—</span>
                      )}
                    </td>

                    {/* Alta */}
                    <td className="px-4 py-3 text-xs text-[#29384a] whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-[#d8cbb5]" />
                        {fmt(c.created_at)}
                      </span>
                    </td>

                    {/* Último WA */}
                    <td className="px-4 py-3 text-xs text-[#29384a]">
                      {c.lastWhatsApp ? (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 text-[#25D366]" />
                          {fmtRelative(c.lastWhatsApp)}
                        </span>
                      ) : (
                        <span className="text-[#9ca3af]">—</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* WA button — only if has phone */}
                        {(c.phone || c.whatsapp_number) && (
                          <button
                            type="button"
                            onClick={() => setWaClient(c)}
                            title="Enviar WhatsApp"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#25D366] transition hover:bg-[#25D366]/10"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                        )}
                        <Link
                          href={`/admin/expedientes?client=${c.id}`}
                          title="Ver expedientes"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#29384a] transition hover:bg-[#f0e9d8]"
                        >
                          <FolderOpen className="h-4 w-4" />
                        </Link>
                        <a
                          href={`mailto:${c.email}`}
                          title="Enviar email"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#29384a] transition hover:bg-[#f0e9d8]"
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* WhatsApp modal */}
      {waClient && (
        <WaTemplateModal
          defaultPhone={(waClient.whatsapp_number ?? waClient.phone ?? '').replace(/\D/g, '')}
          onClose={() => setWaClient(null)}
          onSent={() => setWaClient(null)}
        />
      )}
    </main>
  );
}
