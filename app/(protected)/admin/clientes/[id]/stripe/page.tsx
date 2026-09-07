'use client';

import { useParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Building2, CheckCircle2, CreditCard, Link2, RefreshCw, Search, ShieldCheck } from 'lucide-react';

type Company = {
  id: string;
  name: string;
  nif: string | null;
  status: string | null;
  role: string;
  legacyStripeCustomerId: string | null;
  tenantId: string | null;
};

type Mapping = {
  id: string;
  company_id: string;
  stripe_customer_id: string;
  is_primary: boolean;
  status: string;
  source: string;
};

type LocalSubscription = {
  id: string;
  company_id: string | null;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  plan_name: string;
  status: string;
};

type Evidence = {
  deleted: boolean;
  id: string;
  name?: string | null;
  email?: string | null;
  createdAt?: string;
  invoices?: Array<{
    id: string;
    number: string | null;
    status: string | null;
    customerName: string | null;
    customerTaxIds: string[];
    amountPaid: number;
    amountDue: number;
    currency: string;
    createdAt: string;
  }>;
  subscriptions?: Array<{
    id: string;
    status: string;
    priceId: string | null;
    productId: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
  }>;
};

type Payload = {
  client: { id: string; name: string; email: string; status: string };
  companies: Company[];
  mappings: Mapping[];
  subscriptions: LocalSubscription[];
  evidence: Evidence | null;
  evidenceError: string | null;
  rules: { emailIsIdentity: false; automaticMerge: false; exactStripeIdRequired: true };
};

function companyName(data: Payload | null, companyId: string | null) {
  return data?.companies.find((company) => company.id === companyId)?.name ?? (companyId ? 'Entidad vinculada' : 'Sin entidad');
}

export default function StripeReconciliationPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Payload | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyTaxId, setNewCompanyTaxId] = useState('');
  const [newCompanyForm, setNewCompanyForm] = useState<'sl' | 'autonomo' | 'sa' | 'slne' | 'cb' | 'cooperativa' | 'fundacion' | 'otra'>('sl');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async (inspectCustomerId?: string) => {
    setLoading(true);
    setError('');
    try {
      const suffix = inspectCustomerId ? `?stripeCustomerId=${encodeURIComponent(inspectCustomerId)}` : '';
      const response = await fetch(`/api/admin/clientes/${id}/stripe-reconciliation${suffix}`, { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo cargar la reconciliación Stripe');
      setData(json);
      if (json.evidence && !json.evidence.deleted) {
        const latestInvoice = json.evidence.invoices?.[0];
        setNewCompanyName((current) => current || latestInvoice?.customerName || json.evidence.name || '');
        setNewCompanyTaxId((current) => current || latestInvoice?.customerTaxIds?.[0] || '');
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const inspectedCustomerAlreadyMapped = useMemo(() => {
    if (!data?.evidence?.id) return null;
    return data.mappings.find((mapping) => mapping.stripe_customer_id === data.evidence?.id) ?? null;
  }, [data]);

  async function inspect(event: FormEvent) {
    event.preventDefault();
    setNotice('');
    setNewCompanyName('');
    setNewCompanyTaxId('');
    await load(customerId.trim());
  }

  async function mutate(body: Record<string, unknown>, confirmation: string) {
    if (!window.confirm(confirmation)) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/admin/clientes/${id}/stripe-reconciliation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo completar la reconciliación');
      setNotice(json.idempotent ? 'La relación ya existía; no se ha duplicado.' : 'Cambio guardado y auditado.');
      await load(data?.evidence?.id || undefined);
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'Error de conexión');
    } finally {
      setBusy(false);
    }
  }

  const evidence = data?.evidence;
  const evidenceSubscriptions = evidence && !evidence.deleted ? evidence.subscriptions ?? [] : [];

  return (
    <main className="min-h-screen bg-[#f8f4eb] px-6 py-7 text-[#07111d]">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c88b25]">Cliente 360 · Identidad financiera</p>
            <h1 className="mt-1 font-serif text-3xl font-bold">Reconciliación Stripe</h1>
            <p className="mt-1 text-sm text-[#52606d]">{data?.client.name ?? 'Cliente'} · {data?.client.email ?? ''}</p>
          </div>
          <button type="button" onClick={() => void load(data?.evidence?.id || undefined)} className="rounded-xl border border-[#d8cbb5] bg-white p-2.5" title="Actualizar">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">Regla de identidad</p>
              <p className="mt-1 leading-6">El email es sólo un dato de contacto. Esta pantalla exige IDs Stripe exactos y acciones explícitas. No fusiona clientes, no reasigna históricos y no crea relaciones por coincidencia de email.</p>
            </div>
          </div>
        </section>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</div>}
        {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 className="mr-2 inline h-4 w-4" />{notice}</div>}

        <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
          <h2 className="font-serif text-lg font-bold">1. Inspeccionar Stripe Customer</h2>
          <p className="mt-1 text-xs text-[#6b7280]">Introduce el ID exacto, por ejemplo <code>cus_…</code>. La consulta es sólo lectura.</p>
          <form onSubmit={inspect} className="mt-4 flex flex-wrap gap-2">
            <input value={customerId} onChange={(event) => setCustomerId(event.target.value)} placeholder="cus_…" className="min-w-[300px] flex-1 rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm" />
            <button disabled={loading || !customerId.trim()} className="inline-flex items-center gap-2 rounded-xl bg-[#07111d] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><Search className="h-4 w-4" />Inspeccionar</button>
          </form>
        </section>

        {data?.evidenceError && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{data.evidenceError}</div>}

        {evidence && (
          <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-xs uppercase tracking-wide text-[#6b7280]">Evidencia Stripe</p><h2 className="mt-1 font-serif text-xl font-bold">{evidence.id}</h2></div>
                {inspectedCustomerAlreadyMapped && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Ya asociado</span>}
              </div>
              {evidence.deleted ? <p className="mt-4 text-sm text-red-700">Customer eliminado. No puede asociarse.</p> : <>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                  <div><dt className="text-xs text-[#6b7280]">Nombre Stripe</dt><dd className="font-semibold">{evidence.name || '—'}</dd></div>
                  <div><dt className="text-xs text-[#6b7280]">Email de contacto</dt><dd>{evidence.email || '—'}</dd></div>
                </dl>
                <div className="mt-5 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#6b7280]">Últimas facturas</p>
                  {(evidence.invoices ?? []).length === 0 ? <p className="text-sm text-[#6b7280]">Sin facturas.</p> : evidence.invoices?.map((invoice) => <div key={invoice.id} className="rounded-xl border border-[#eee6d8] p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{invoice.number || invoice.id}</span><span>{invoice.amountPaid.toFixed(2)} {invoice.currency} · {invoice.status}</span></div><p className="mt-1 text-xs text-[#52606d]">{invoice.customerName || 'Sin razón social'} · CIF/NIF: {invoice.customerTaxIds.join(', ') || 'no informado'}</p></div>)}
                </div>
              </>}
            </div>

            {!evidence.deleted && !inspectedCustomerAlreadyMapped && <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
              <h2 className="font-serif text-lg font-bold">2. Asociar a entidad</h2>
              <label className="mt-4 block text-xs font-bold text-[#52606d]">Empresa ya existente del usuario</label>
              <select value={selectedCompanyId} onChange={(event) => setSelectedCompanyId(event.target.value)} className="mt-1 w-full rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm">
                <option value="">Seleccionar…</option>
                {(data?.companies ?? []).map((company) => <option key={company.id} value={company.id}>{company.name}{company.nif ? ` · ${company.nif}` : ''}</option>)}
              </select>
              <button type="button" disabled={busy || !selectedCompanyId} onClick={() => void mutate({ action: 'map_customer', companyId: selectedCompanyId, stripeCustomerId: evidence.id }, `Vas a asociar ${evidence.id} a ${companyName(data, selectedCompanyId)}. Esta acción queda auditada. ¿Continuar?`)} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#07111d] px-4 py-2 text-sm font-bold disabled:opacity-50"><Link2 className="h-4 w-4" />Asociar Customer</button>

              <div className="my-5 border-t border-[#eee6d8]" />
              <p className="text-xs font-bold uppercase tracking-wide text-[#6b7280]">O crear una nueva empresa verificada</p>
              <div className="mt-3 space-y-3">
                <input value={newCompanyName} onChange={(event) => setNewCompanyName(event.target.value)} placeholder="Razón social" className="w-full rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm" />
                <input value={newCompanyTaxId} onChange={(event) => setNewCompanyTaxId(event.target.value)} placeholder="CIF/NIF" className="w-full rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm" />
                <select value={newCompanyForm} onChange={(event) => setNewCompanyForm(event.target.value as typeof newCompanyForm)} className="w-full rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm"><option value="sl">S.L.</option><option value="autonomo">Autónomo</option><option value="sa">S.A.</option><option value="slne">S.L.N.E.</option><option value="cb">Comunidad de bienes</option><option value="cooperativa">Cooperativa</option><option value="fundacion">Fundación</option><option value="otra">Otra</option></select>
                <button type="button" disabled={busy || !newCompanyName.trim() || !newCompanyTaxId.trim()} onClick={() => void mutate({ action: 'create_company_and_map', razonSocial: newCompanyName.trim(), cifNif: newCompanyTaxId.trim(), formaJuridica: newCompanyForm, stripeCustomerId: evidence.id }, `Se creará ${newCompanyName.trim()} (${newCompanyTaxId.trim()}) para este usuario y se asociará exclusivamente a ${evidence.id}. ¿Confirmas los datos?`)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#c88b25] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><Building2 className="h-4 w-4" />Crear empresa + asociar</button>
              </div>
            </div>}
          </section>
        )}

        {evidence && !evidence.deleted && evidenceSubscriptions.length > 0 && (
          <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
            <h2 className="font-serif text-lg font-bold">3. Suscripciones del Customer inspeccionado</h2>
            <p className="mt-1 text-xs text-[#6b7280]">Sólo se permite importar una suscripción después de que su Customer esté asociado explícitamente a la empresa seleccionada.</p>
            <div className="mt-4 space-y-3">
              {evidenceSubscriptions.map((subscription) => {
                const local = data?.subscriptions.find((item) => item.stripe_subscription_id === subscription.id);
                return <div key={subscription.id} className="rounded-xl border border-[#eee6d8] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><CreditCard className="h-4 w-4" /><p className="font-semibold">{subscription.id}</p><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold">{subscription.status}</span></div><p className="mt-1 text-xs text-[#52606d]">Price: {subscription.priceId || '—'}{subscription.currentPeriodEnd ? ` · periodo hasta ${new Date(subscription.currentPeriodEnd).toLocaleDateString('es-ES')}` : ''}</p>{local && <p className="mt-1 text-xs font-bold text-emerald-700">Ya existe en EXPERT · {companyName(data, local.company_id)}</p>}</div><button type="button" disabled={busy || !selectedCompanyId || Boolean(local?.company_id)} onClick={() => void mutate({ action: 'import_subscription', companyId: selectedCompanyId, stripeSubscriptionId: subscription.id }, `Vas a importar/vincular ${subscription.id} a ${companyName(data, selectedCompanyId)}. No se enviarán emails ni se modificarán facturas históricas. ¿Continuar?`)} className="rounded-xl border border-[#07111d] px-3 py-2 text-xs font-bold disabled:opacity-40">{local ? 'Vincular si procede' : 'Importar a EXPERT'}</button></div></div>;
              })}
            </div>
          </section>
        )}

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
            <h2 className="font-serif text-lg font-bold">Empresas gestionadas</h2>
            <div className="mt-4 space-y-3">
              {(data?.companies ?? []).length === 0 ? <p className="text-sm text-[#6b7280]">Todavía no hay entidades vinculadas.</p> : data?.companies.map((company) => <div key={company.id} className="rounded-xl border border-[#eee6d8] p-3"><div className="flex items-center gap-2"><Building2 className="h-4 w-4" /><p className="font-semibold">{company.name}</p></div><p className="mt-1 text-xs text-[#52606d]">{company.nif || 'Sin CIF/NIF'} · rol {company.role}</p>{company.legacyStripeCustomerId && <p className="mt-1 text-[11px] text-amber-700">Legacy Stripe: {company.legacyStripeCustomerId}</p>}</div>)}
            </div>
          </div>

          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
            <h2 className="font-serif text-lg font-bold">Mapeos explícitos</h2>
            <div className="mt-4 space-y-3">
              {(data?.mappings ?? []).length === 0 ? <p className="text-sm text-[#6b7280]">Sin mapeos explícitos todavía.</p> : data?.mappings.map((mapping) => <div key={mapping.id} className="rounded-xl border border-[#eee6d8] p-3"><div className="flex flex-wrap items-center gap-2"><Link2 className="h-4 w-4" /><p className="font-semibold">{mapping.stripe_customer_id}</p>{mapping.is_primary && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">principal</span>}<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold">{mapping.status}</span></div><p className="mt-1 text-xs text-[#52606d]">{companyName(data, mapping.company_id)} · {mapping.source}</p></div>)}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
