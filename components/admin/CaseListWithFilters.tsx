'use client';

import { useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { AdminCaseCard } from '@/components/cases/AdminCaseCard';
import { CASE_ACTION_GROUPS } from '@/lib/utils/case-states';

interface Case {
  id: string;
  category: string;
  service: string;
  state: string;
  opened_at: string;
  closed_at: string | null;
  client_id: string;
  client: { full_name: string | null; email: string };
}

const STATE_FILTER_OPTIONS = [
  { label: 'Todos', value: 'all' },
  { label: 'Requieren acción', value: 'urgent' },
  { label: 'En seguimiento', value: 'followup' },
  { label: 'Finalizados', value: 'closed' }
] as const;

const URGENT_STATES = [
  ...CASE_ACTION_GROUPS.pendingDocs,
  ...CASE_ACTION_GROUPS.docsToReview,
  ...CASE_ACTION_GROUPS.readyToDeliver
];
const FOLLOWUP_STATES = [
  ...CASE_ACTION_GROUPS.inProgress,
  ...CASE_ACTION_GROUPS.waitingExternal,
  ...CASE_ACTION_GROUPS.delivered
];
const CLOSED_STATES = [...CASE_ACTION_GROUPS.closed];

function matchesStateFilter(state: string, filter: string): boolean {
  if (filter === 'all') return true;
  if (filter === 'urgent') return URGENT_STATES.includes(state as never);
  if (filter === 'followup') return FOLLOWUP_STATES.includes(state as never);
  if (filter === 'closed') return CLOSED_STATES.includes(state as never);
  return true;
}

export function CaseListWithFilters({ cases }: { cases: Case[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read filters from URL
  const search        = searchParams.get('q') ?? '';
  const stateFilter   = searchParams.get('state') ?? 'all';
  const categoryFilter = searchParams.get('cat') ?? 'all';

  // Update a single URL param, preserving others
  const setParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === 'all') params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.push(qs ? `?${qs}` : '?', { scroll: false });
  }, [router, searchParams]);

  const setSearch        = (v: string) => setParam('q', v);
  const setStateFilter   = (v: string) => setParam('state', v);
  const setCategoryFilter = (v: string) => setParam('cat', v);
  const clearFilters = () => {
    router.push('?', { scroll: false });
  };

  const categories = useMemo(() => {
    const cats = [...new Set(cases.map((c) => c.category))].sort();
    return cats;
  }, [cases]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return cases.filter((c) => {
      const matchesSearch =
        !q ||
        c.service.toLowerCase().includes(q) ||
        c.client.email.toLowerCase().includes(q) ||
        (c.client.full_name?.toLowerCase().includes(q) ?? false);
      const matchesState = matchesStateFilter(c.state, stateFilter);
      const matchesCat = categoryFilter === 'all' || c.category === categoryFilter;
      return matchesSearch && matchesState && matchesCat;
    });
  }, [cases, search, stateFilter, categoryFilter]);

  const open = filtered.filter((c) => !CLOSED_STATES.includes(c.state as never));
  const closed = filtered.filter((c) => CLOSED_STATES.includes(c.state as never));

  const hasFilters = search || stateFilter !== 'all' || categoryFilter !== 'all';

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#29384a]" />
          <input
            type="text"
            placeholder="Buscar por servicio, cliente o email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#d8cbb5] bg-white py-2.5 pl-9 pr-4 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
          />
        </div>

        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="rounded-xl border border-[#d8cbb5] bg-white px-4 py-2.5 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
        >
          {STATE_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {categories.length > 1 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-[#d8cbb5] bg-white px-4 py-2.5 text-sm text-[#07111d] outline-none focus:border-[#c88b25]"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8cbb5] px-3 py-2.5 text-xs font-semibold text-[#29384a] transition hover:border-[#c88b25] hover:text-[#07111d]"
          >
            <X className="h-3 w-3" /> Limpiar
          </button>
        )}
      </div>

      {/* Results summary */}
      <p className="mb-4 text-xs text-[#29384a]">
        {filtered.length} expediente{filtered.length !== 1 ? 's' : ''}
        {hasFilters ? ' (filtrados)' : ''}
        {' · '}<span className="font-semibold text-[#07111d]">{open.length} activos</span>
        {closed.length > 0 && ` · ${closed.length} finalizados`}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-[#d8cbb5] bg-[#f8f4eb] p-10 text-center text-sm text-[#29384a]">
          {hasFilters ? 'No hay expedientes que coincidan con los filtros.' : 'No hay expedientes registrados.'}
        </div>
      ) : (
        <div className="space-y-8">
          {open.length > 0 && (
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#c88b25]">
                Activos ({open.length})
              </h2>
              <div className="space-y-4">
                {open.map((c) => (
                  <AdminCaseCard key={c.id} caseItem={c} />
                ))}
              </div>
            </section>
          )}
          {closed.length > 0 && (
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#29384a]">
                Finalizados ({closed.length})
              </h2>
              <div className="space-y-4 opacity-60">
                {closed.map((c) => (
                  <AdminCaseCard key={c.id} caseItem={c} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
