'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Copy, ExternalLink, Loader2, Search } from 'lucide-react';

type ClientSummary = {
  id: string;
  full_name: string | null;
  email: string;
  status: string;
  plan: string | null;
};

type Company = {
  id: string;
  role: string;
  name: string;
  razon_social: string | null;
  nif: string | null;
};

type ClientDetail = {
  profile: {
    id: string;
    full_name: string | null;
    email: string;
    profile_completed: boolean;
    billing_ready: boolean;
    active_company_id: string | null;
  };
  companies: Company[];
  subs: Array<{ id: string; plan: string; status: string; company_id: string | null }>;
};

const PLANS = [
  { key: 'STRIPE_PLAN_MONTHLY_49', name: 'Plan Supervisión', amount: 49 },
  { key: 'STRIPE_PLAN_MONTHLY_99', name: 'Plan Avanzado', amount: 99 },
  { key: 'STRIPE_PLAN_MONTHLY_199', name: 'Plan Colaborativo', amount: 199 },
] as const;

export default function AdminGenerateSubscriptionLinkPage() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [query, setQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [companyId, setCompanyId] = useState('');
  const [planKey, setPlanKey] = useState<(typeof PLANS)[number]['key']>('STRIPE_PLAN_MONTHLY_99');
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ stripeUrl: string; sessionId: string; companyId: string } | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/clientes');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'No se pudieron cargar los clientes');
        setClients(json.clients ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los clientes');
      } finally {
        setLoadingClients(false);
      }
    })();
  }, []);

  const filteredClients = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return clients.slice(0, 30);
    return clients.filter((client) =>
      `${client.full_name ?? ''} ${client.email}`.toLowerCase().includes(needle),
    ).slice(0, 30);
  }, [clients, query]);

  async function chooseClient(id: string) {
    setSelectedClientId(id);
    setDetail(null);
    setCompanyId('');
    setResult(null);
    setError('');
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/clientes/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'No se pudo cargar el cliente');
      const nextDetail = json as ClientDetail;
      setDetail(nextDetail);
      const preferredCompany = nextDetail.companies.find((c) => c.id === nextDetail.profile.active_company_id)
        ?? nextDetail.companies[0]
        ?? null;
      setCompanyId(preferredCompany?.id ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el cliente');
    } finally {
      setLoadingDetail(false);
    }
  }

  async function generateLink() {
    if (!detail || !companyId) return;
    const plan = PLANS.find((item) => item.key === planKey)!;
    setGenerating(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/admin/subscriptions/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEmail: detail.profile.email,
          companyId,
          planName: plan.name,
          amountEur: plan.amount,
          stripePriceEnvKey: plan.key,
          sendEmail: false,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'No se pudo generar el Checkout');
      setResult({ stripeUrl: json.stripeUrl, sessionId: json.sessionId, companyId: json.companyId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el Checkout');
    } finally {
      setGenerating(false);
    }
  }

  async function copyLink() {
    if (!result?.stripeUrl) return;
    await navigator.clipboard.writeText(result.stripeUrl);
  }

  const activeForCompany = detail?.subs.some(
    (sub) => sub.company_id === companyId && (sub.status === 'active' || sub.status === 'trialing'),
  ) ?? false;

  return (
    <main className="min-h-screen bg-[#f8f4eb] px-6 py-8 text-[#07111d]">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-start gap-3">
          <Link href="/admin/suscripciones" className="mt-1 rounded-lg border border-[#d8cbb5] p-2 text-[#29384a] hover:border-[#d7a33a]">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c88b25]">Admin · Suscripciones</p>
            <h1 className="mt-1 font-serif text-3xl font-bold">Generar enlace de contratación</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#29384a]">
              Genera una única sesión Stripe para un cliente existente, la registra en EXPERT y no envía ningún email automáticamente. Revisa el enlace antes de comunicarlo.
            </p>
          </div>
        </div>

        {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <section className="mt-6 rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
          <label className="text-xs font-bold uppercase tracking-wide text-[#29384a]">1. Buscar cliente existente</label>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#d8cbb5] px-3">
            <Search className="h-4 w-4 text-[#8a9aab]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre o email"
              className="w-full bg-transparent py-3 text-sm outline-none"
            />
          </div>
          {loadingClients ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[#c88b25]" /></div>
          ) : (
            <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-[#f0e8d8]">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => void chooseClient(client.id)}
                  className={`flex w-full items-center justify-between border-b border-[#f8f4eb] px-4 py-3 text-left last:border-b-0 ${selectedClientId === client.id ? 'bg-[#d7a33a]/10' : 'hover:bg-[#f8f4eb]'}`}
                >
                  <span>
                    <span className="block text-sm font-semibold">{client.full_name ?? 'Sin nombre'}</span>
                    <span className="block text-xs text-[#6b7280]">{client.email}</span>
                  </span>
                  {client.plan && <span className="text-[11px] font-semibold text-[#c88b25]">{client.plan}</span>}
                </button>
              ))}
            </div>
          )}
        </section>

        {loadingDetail && <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-[#c88b25]" /></div>}

        {detail && (
          <section className="mt-5 rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl font-bold">{detail.profile.full_name ?? detail.profile.email}</h2>
                <p className="text-sm text-[#29384a]">{detail.profile.email}</p>
              </div>
              <div className="flex gap-2 text-xs">
                <span className={`rounded-full px-2.5 py-1 font-semibold ${detail.profile.profile_completed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>Perfil</span>
                <span className={`rounded-full px-2.5 py-1 font-semibold ${detail.profile.billing_ready ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>Facturación</span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold">
                2. Entidad contratante
                <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="mt-2 w-full rounded-xl border border-[#d8cbb5] bg-white px-3 py-3 text-sm">
                  <option value="">Selecciona entidad</option>
                  {detail.companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.razon_social ?? company.name} {company.nif ? `· ${company.nif}` : ''}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold">
                3. Plan
                <select value={planKey} onChange={(e) => setPlanKey(e.target.value as (typeof PLANS)[number]['key'])} className="mt-2 w-full rounded-xl border border-[#d8cbb5] bg-white px-3 py-3 text-sm">
                  {PLANS.map((plan) => (
                    <option key={plan.key} value={plan.key}>{plan.name} · {plan.amount} €/mes + IVA</option>
                  ))}
                </select>
              </label>
            </div>

            {activeForCompany && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Esta entidad ya tiene una suscripción activa/trialing. No generes otro Checkout sin revisar el caso.
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => void generateLink()}
                disabled={generating || !companyId || !detail.profile.profile_completed || !detail.profile.billing_ready || activeForCompany}
                className="inline-flex items-center gap-2 rounded-xl bg-[#d7a33a] px-5 py-3 text-sm font-bold text-[#07111d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating && <Loader2 className="h-4 w-4 animate-spin" />}
                Generar enlace sin enviar
              </button>
            </div>
          </section>
        )}

        {result && (
          <section className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-700" />
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-green-900">Checkout generado y registrado, sin email automático</h2>
                <p className="mt-1 text-xs text-green-800">Session ID: <span className="font-mono">{result.sessionId}</span></p>
                <p className="mt-3 break-all rounded-lg bg-white px-3 py-2 text-xs text-[#29384a]">{result.stripeUrl}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => void copyLink()} className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-white px-3 py-2 text-xs font-semibold text-green-900">
                    <Copy className="h-3.5 w-3.5" /> Copiar enlace
                  </button>
                  <a href={result.stripeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-white px-3 py-2 text-xs font-semibold text-green-900">
                    <ExternalLink className="h-3.5 w-3.5" /> Verificar en Stripe Checkout
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
