'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Building2, CheckCircle2, FileCheck2, RefreshCw, RotateCcw, Search, ShieldCheck } from 'lucide-react';

type Company = {
  id: string;
  name: string;
  nif: string | null;
  status: string | null;
  role: string;
};

type Attribution = {
  id: string;
  company_id: string;
  stripe_invoice_id: string;
  stripe_customer_id: string;
  invoice_tax_id: string | null;
  source: 'invoice_tax_id' | 'manual_review';
  status: 'active' | 'revoked';
  created_at: string;
  revoked_at: string | null;
  revocation_reason: string | null;
};

type Evidence = {
  id: string;
  number: string | null;
  status: string | null;
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  taxIds: string[];
  amountDue: number;
  amountPaid: number;
  currency: string;
  createdAt: string;
  periodStart: string | null;
  periodEnd: string | null;
};

type Payload = {
  client: { id: string; name: string; email: string; status: string };
  companies: Company[];
  attributions: Attribution[];
  evidence: Evidence | null;
  evidenceError: string | null;
};

export default function StripeInvoiceAttributionPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Payload | null>(null);
  const [invoiceId, setInvoiceId] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async (exactInvoiceId?: string) => {
    setLoading(true);
    setError('');
    try {
      const suffix = exactInvoiceId ? `?stripeInvoiceId=${encodeURIComponent(exactInvoiceId)}` : '';
      const response = await fetch(`/api/admin/clientes/${id}/stripe-invoice-attributions${suffix}`, { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudieron cargar las atribuciones');
      setData(json);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const evidence = data?.evidence ?? null;
  const activeExisting = useMemo(
    () => data?.attributions.find((item) => item.status === 'active' && item.stripe_invoice_id === evidence?.id) ?? null,
    [data, evidence?.id],
  );

  const selectedCompany = data?.companies.find((company) => company.id === selectedCompanyId) ?? null;
  const evidenceHasTaxId = Boolean(evidence?.taxIds.length);
  const taxIdMatchesSelected = Boolean(
    evidence && selectedCompany?.nif && evidence.taxIds.some((taxId) => taxId.replace(/[\s-]+/g, '').toUpperCase() === selectedCompany.nif?.replace(/[\s-]+/g, '').toUpperCase()),
  );

  async function inspect(event: FormEvent) {
    event.preventDefault();
    setNotice('');
    setSelectedCompanyId('');
    setManualReason('');
    await load(invoiceId.trim());
  }

  async function attribute() {
    if (!evidence || !selectedCompany) return;
    if (!window.confirm(`Vas a atribuir la factura ${evidence.number || evidence.id} a ${selectedCompany.name}. Esta acción queda auditada. ¿Continuar?`)) return;

    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/admin/clientes/${id}/stripe-invoice-attributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompany.id,
          stripeInvoiceId: evidence.id,
          manualReason: evidenceHasTaxId ? undefined : manualReason.trim(),
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo atribuir la factura');
      setNotice(json.idempotent ? 'La factura ya estaba atribuida a esta empresa.' : 'Factura atribuida y registrada con trazabilidad.');
      await load(evidence.id);
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'Error de conexión');
    } finally {
      setBusy(false);
    }
  }

  async function revoke(attribution: Attribution) {
    const reason = window.prompt('Motivo de la revocación (mínimo 10 caracteres). La atribución original se conservará:');
    if (!reason || reason.trim().length < 10) return;
    if (!window.confirm(`Se revocará la atribución de ${attribution.stripe_invoice_id}. La fila NO se eliminará. ¿Continuar?`)) return;

    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/admin/clientes/${id}/stripe-invoice-attributions/${attribution.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo revocar la atribución');
      setNotice(json.idempotent ? 'La atribución ya estaba revocada.' : 'Atribución revocada; el histórico se conserva.');
      await load(evidence?.id || undefined);
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'Error de conexión');
    } finally {
      setBusy(false);
    }
  }

  const canAttribute = Boolean(
    evidence &&
    selectedCompany &&
    !activeExisting &&
    (!evidenceHasTaxId ? manualReason.trim().length >= 10 : taxIdMatchesSelected),
  );

  return (
    <main className="min-h-screen bg-[#f8f4eb] px-6 py-7 text-[#07111d]">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href={`/admin/clientes/${id}/stripe`} className="inline-flex items-center gap-1 text-xs font-bold text-[#8a651e] hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" /> Stripe Customer
            </Link>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-[#c88b25]">Cliente 360 · Historia contable</p>
            <h1 className="mt-1 font-serif text-3xl font-bold">Atribución de facturas Stripe</h1>
            <p className="mt-1 text-sm text-[#52606d]">{data?.client.name ?? 'Cliente'} · {data?.client.email ?? ''}</p>
          </div>
          <button type="button" onClick={() => void load(evidence?.id || undefined)} className="rounded-xl border border-[#d8cbb5] bg-white p-2.5" title="Actualizar">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </header>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">La factura manda sobre el Customer</p>
              <p className="mt-1 leading-6">Un Stripe Customer puede haber sido reutilizado por varias sociedades. El CIF/NIF guardado en la factura es evidencia histórica. Una corrección revoca la atribución anterior; nunca se borra.</p>
            </div>
          </div>
        </section>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</div>}
        {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 className="mr-2 inline h-4 w-4" />{notice}</div>}

        <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
          <h2 className="font-serif text-lg font-bold">1. Inspeccionar factura exacta</h2>
          <p className="mt-1 text-xs text-[#6b7280]">Introduce el ID Stripe <code>in_…</code>. La consulta no modifica datos.</p>
          <form onSubmit={inspect} className="mt-4 flex flex-wrap gap-2">
            <input value={invoiceId} onChange={(event) => setInvoiceId(event.target.value)} placeholder="in_…" className="min-w-[300px] flex-1 rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm" />
            <button disabled={loading || !invoiceId.trim()} className="inline-flex items-center gap-2 rounded-xl bg-[#07111d] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><Search className="h-4 w-4" />Inspeccionar</button>
          </form>
        </section>

        {data?.evidenceError && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{data.evidenceError}</div>}

        {evidence && <section className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><p className="text-xs uppercase tracking-wide text-[#6b7280]">Factura Stripe</p><h2 className="mt-1 font-serif text-xl font-bold">{evidence.number || evidence.id}</h2></div>
              {activeExisting && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Ya atribuida</span>}
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
              <div><dt className="text-xs text-[#6b7280]">Stripe Invoice ID</dt><dd className="font-mono text-xs">{evidence.id}</dd></div>
              <div><dt className="text-xs text-[#6b7280]">Stripe Customer</dt><dd className="font-mono text-xs">{evidence.customerId || '—'}</dd></div>
              <div><dt className="text-xs text-[#6b7280]">Razón social en factura</dt><dd className="font-semibold">{evidence.customerName || '—'}</dd></div>
              <div><dt className="text-xs text-[#6b7280]">CIF/NIF histórico</dt><dd className={evidence.taxIds.length ? 'font-bold text-emerald-700' : 'text-amber-700'}>{evidence.taxIds.join(', ') || 'No informado'}</dd></div>
              <div><dt className="text-xs text-[#6b7280]">Importe pagado</dt><dd>{evidence.amountPaid.toFixed(2)} {evidence.currency}</dd></div>
              <div><dt className="text-xs text-[#6b7280]">Fecha</dt><dd>{new Date(evidence.createdAt).toLocaleDateString('es-ES')}</dd></div>
            </dl>
          </div>

          <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
            <h2 className="font-serif text-lg font-bold">2. Atribuir a empresa</h2>
            {activeExisting ? <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"><FileCheck2 className="mr-2 inline h-4 w-4" />Actualmente atribuida a <strong>{data?.companies.find((company) => company.id === activeExisting.company_id)?.name || activeExisting.company_id}</strong> mediante {activeExisting.source === 'invoice_tax_id' ? 'CIF/NIF de factura' : 'revisión manual'}.</div> : <>
              <label className="mt-4 block text-xs font-bold text-[#52606d]">Empresa gestionada</label>
              <select value={selectedCompanyId} onChange={(event) => setSelectedCompanyId(event.target.value)} className="mt-1 w-full rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm">
                <option value="">Seleccionar…</option>
                {(data?.companies ?? []).map((company) => <option key={company.id} value={company.id}>{company.name}{company.nif ? ` · ${company.nif}` : ''}</option>)}
              </select>

              {selectedCompany && evidenceHasTaxId && !taxIdMatchesSelected && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">El CIF/NIF de la factura ({evidence.taxIds.join(', ')}) no coincide con {selectedCompany.name} ({selectedCompany.nif || 'sin CIF/NIF'}). La API bloqueará la atribución.</div>}
              {selectedCompany && evidenceHasTaxId && taxIdMatchesSelected && <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />CIF/NIF coincidente. La atribución quedará como evidencia fiscal.</div>}

              {!evidenceHasTaxId && <div className="mt-3"><label className="block text-xs font-bold text-[#52606d]">Motivo de atribución manual</label><textarea value={manualReason} onChange={(event) => setManualReason(event.target.value)} rows={3} placeholder="Explica la evidencia revisada (mínimo 10 caracteres)…" className="mt-1 w-full rounded-xl border border-[#d8cbb5] px-3 py-2 text-sm" /></div>}

              <button type="button" disabled={busy || !canAttribute} onClick={() => void attribute()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#c88b25] px-4 py-2 text-sm font-bold text-white disabled:opacity-40"><Building2 className="h-4 w-4" />Atribuir factura</button>
            </>}
          </div>
        </section>}

        <section className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
          <h2 className="font-serif text-lg font-bold">Historial de atribuciones</h2>
          <p className="mt-1 text-xs text-[#6b7280]">Las filas revocadas permanecen visibles. No se elimina histórico.</p>
          <div className="mt-4 space-y-3">
            {(data?.attributions ?? []).length === 0 ? <p className="text-sm text-[#6b7280]">Todavía no hay facturas atribuidas a estas empresas.</p> : data?.attributions.map((item) => {
              const company = data.companies.find((candidate) => candidate.id === item.company_id);
              return <div key={item.id} className="rounded-xl border border-[#eee6d8] p-4 text-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{item.stripe_invoice_id}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{item.status}</span><span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">{item.source}</span></div><p className="mt-1 text-xs text-[#52606d]">{company?.name || item.company_id}{item.invoice_tax_id ? ` · ${item.invoice_tax_id}` : ''} · Customer {item.stripe_customer_id}</p>{item.revocation_reason && <p className="mt-1 text-xs text-red-700">Revocada: {item.revocation_reason}</p>}</div>{item.status === 'active' && <button disabled={busy} type="button" onClick={() => void revoke(item)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 disabled:opacity-40"><RotateCcw className="h-3.5 w-3.5" />Revocar</button>}</div></div>;
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
