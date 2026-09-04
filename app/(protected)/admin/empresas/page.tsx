'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, Building2, CheckCircle2, ExternalLink, Loader2,
  Search, Shield, User, Zap, Plug, CreditCard,
} from 'lucide-react';

type CompanyRow = {
  id: string;
  display_name: string;
  razon_social: string | null;
  nombre_comercial: string | null;
  cif_nif: string | null;
  forma_juridica: string | null;
  status: string;
  email: string | null;
  telefono: string | null;
  ciudad: string | null;
  provincia: string | null;
  stripe_customer_id: string | null;
  owners: { id: string; role: string; name: string; email: string | null; status: string | null }[];
  active_subscription: { company_id: string; status: string; plan_name: string; stripe_subscription_id: string | null } | null;
  integrations: { provider: string; status: string; sync_mode: string; last_success_at: string | null; last_error: string | null }[];
  last_checkout: { status: string; stripe_session_id: string; created_at: string; metadata: Record<string, unknown> | null } | null;
};

type CompanySuggestion = {
  name?: string;
  taxId?: string;
  registeredAddress?: string;
  city?: string;
  province?: string;
  source: string;
  sourceUrl?: string;
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
};

type ResolveResult = { suggestions: CompanySuggestion[]; meta: { sources: string[]; elapsedMs: number } };

export default function AdminEmpresasPage() {
  const [tab, setTab] = useState<'expert' | 'public'>('expert');
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [companiesError, setCompaniesError] = useState('');
  const [filter, setFilter] = useState('');

  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'name' | 'nif'>('name');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<ResolveResult | null>(null);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    void (async () => {
      setLoadingCompanies(true);
      try {
        const res = await fetch('/api/admin/empresas', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'No se pudieron cargar las empresas');
        setCompanies(json.companies ?? []);
      } catch (error) {
        setCompaniesError(error instanceof Error ? error.message : 'Error de conexión');
      } finally {
        setLoadingCompanies(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((company) => [
      company.display_name,
      company.razon_social,
      company.cif_nif,
      ...company.owners.flatMap((owner) => [owner.name, owner.email]),
    ].some((value) => value?.toLowerCase().includes(q)));
  }, [companies, filter]);

  const publicSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchError('');
    setResult(null);
    try {
      const res = await fetch('/api/company/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'nif' ? { taxId: query.trim() } : { name: query.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error al buscar');
      setResult(json);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Error de conexión');
    } finally {
      setSearching(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <h1 className="font-serif text-2xl font-bold text-[#07111d]">Empresas</h1>
          <p className="mt-1 text-sm text-[#29384a]">Entidades reales vinculadas a clientes y consulta auxiliar de fuentes públicas.</p>
          <div className="mt-5 flex gap-2">
            <button type="button" onClick={() => setTab('expert')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === 'expert' ? 'bg-[#07111d] text-white' : 'border border-[#d8cbb5] bg-white text-[#29384a]'}`}>
              Empresas EXPERT ({companies.length})
            </button>
            <button type="button" onClick={() => setTab('public')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === 'public' ? 'bg-[#07111d] text-white' : 'border border-[#d8cbb5] bg-white text-[#29384a]'}`}>
              Buscar empresa pública
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {tab === 'expert' ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#d8cbb5] bg-white p-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8a9aab]" />
                <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar por empresa, CIF, cliente o email…" className="w-full rounded-xl border border-[#d8cbb5] bg-[#fbf8f2] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#c88b25]" />
              </div>
            </div>

            {companiesError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{companiesError}</div>}
            {loadingCompanies ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#c88b25]" /></div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d8cbb5] bg-white py-16 text-center text-sm text-[#8a9aab]">No hay empresas para este filtro.</div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {filtered.map((company) => {
                  const holded = company.integrations.find((integration) => integration.provider === 'holded');
                  return (
                    <article key={company.id} className="rounded-2xl border border-[#d8cbb5] bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate font-serif text-lg font-bold text-[#07111d]">{company.display_name}</h2>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${company.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{company.status}</span>
                          </div>
                          <p className="mt-1 font-mono text-xs text-[#29384a]">{company.cif_nif ?? 'Sin CIF/NIF'}</p>
                          <p className="mt-1 text-xs text-[#8a9aab]">{[company.ciudad, company.provincia].filter(Boolean).join(', ') || 'Sin ubicación'}</p>
                        </div>
                        <Building2 className="h-5 w-5 shrink-0 text-[#c88b25]" />
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-xl bg-[#fbf8f2] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9aab]">Cliente</p>
                          {company.owners.length ? company.owners.map((owner) => (
                            <Link key={owner.id} href={`/admin/clientes/${owner.id}`} className="mt-1 block text-sm font-semibold text-[#07111d] hover:underline">
                              <User className="mr-1 inline h-3.5 w-3.5" />{owner.name}
                              {owner.email && <span className="ml-1 font-normal text-[#8a9aab]">· {owner.email}</span>}
                            </Link>
                          )) : <p className="mt-1 text-xs text-red-600">Sin cliente vinculado</p>}
                        </div>
                        <div className="rounded-xl bg-[#fbf8f2] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9aab]">Suscripción</p>
                          <p className="mt-1 text-sm font-semibold text-[#07111d]">{company.active_subscription?.plan_name ?? 'Sin suscripción activa'}</p>
                          {company.last_checkout && <p className="mt-1 text-[11px] text-[#8a9aab]">Último checkout: {company.last_checkout.status}</p>}
                        </div>
                        <div className="rounded-xl bg-[#fbf8f2] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9aab]">Stripe</p>
                          <p className="mt-1 text-xs text-[#29384a]">{company.stripe_customer_id ? 'Customer vinculado' : 'Sin Customer'}</p>
                        </div>
                        <div className="rounded-xl bg-[#fbf8f2] p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a9aab]">Integraciones</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {company.integrations.length ? company.integrations.map((integration, index) => (
                              <span key={`${integration.provider}-${index}`} className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${integration.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                {integration.provider} · {integration.status}
                              </span>
                            )) : <span className="text-xs text-[#8a9aab]">Sin integraciones</span>}
                          </div>
                          {holded?.last_error && <p className="mt-1 text-[10px] text-red-600">Holded: {holded.last_error}</p>}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-5">
            <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
              <div className="mb-4 flex gap-2">
                <button type="button" onClick={() => setMode('name')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${mode === 'name' ? 'bg-[#07111d] text-white' : 'bg-[#f8f4eb] text-[#29384a]'}`}>Nombre / razón social</button>
                <button type="button" onClick={() => setMode('nif')} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${mode === 'nif' ? 'bg-[#07111d] text-white' : 'bg-[#f8f4eb] text-[#29384a]'}`}>NIF / CIF</button>
              </div>
              <form onSubmit={publicSearch} className="flex gap-2">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={mode === 'nif' ? 'B12345678' : 'Nombre de la sociedad'} className="min-w-0 flex-1 rounded-xl border border-[#d8cbb5] bg-[#fbf8f2] px-4 py-2.5 text-sm outline-none focus:border-[#c88b25]" />
                <button disabled={!query.trim() || searching} className="inline-flex items-center gap-2 rounded-xl bg-[#d7a33a] px-5 py-2.5 text-sm font-bold text-[#07111d] disabled:opacity-50">
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Buscar
                </button>
              </form>
            </div>
            {searchError && <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{searchError}</div>}
            {result && (
              <div className="space-y-3">
                {result.suggestions.map((item, index) => (
                  <div key={`${item.source}-${index}`} className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-[#8a9aab]"><Shield className="h-3.5 w-3.5" />{item.source} · confianza {item.confidence}</div>
                        <h3 className="mt-1 font-serif text-base font-bold text-[#07111d]">{item.name ?? 'Sin denominación'}</h3>
                        <p className="font-mono text-xs text-[#29384a]">{item.taxId ?? 'Sin NIF/CIF'}</p>
                        <p className="mt-2 text-xs text-[#29384a]">{[item.registeredAddress, item.city, item.province].filter(Boolean).join(', ')}</p>
                      </div>
                      {item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 text-[#c88b25]" /></a>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
