'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, PlusCircle, XCircle } from 'lucide-react';

type Company = { id: string; name: string; nif: string | null; status: string; role: string };
type Subscription = { id: string; plan_name: string; status: string; company_id: string | null; created_at: string };
type Checkout = { id: string; stripe_session_id: string; status: string; company_id: string | null; metadata: Record<string, unknown> | null; created_at: string };
type Benefit = {
  id: string;
  subscription_id: string | null;
  checkout_session_id: string | null;
  feature_key: 'included_entity' | 'discount_percent' | 'discount_amount' | 'free_months';
  active: boolean;
  valid_from: string;
  valid_until: string | null;
  primary_company_id: string | null;
  beneficiary_company_id: string | null;
  primaryCompanyName: string | null;
  beneficiaryCompanyName: string | null;
  benefit_value: number | null;
  coverage_scope: string | null;
  excluded_services: string[];
  adminMeta: { reason: string | null; notes: string | null; sourceType: string | null; createdAt: string } | null;
};
type Payload = {
  client: { id: string; full_name: string | null; email: string; status: string };
  companies: Company[];
  subscriptions: Subscription[];
  checkoutSessions: Checkout[];
  benefits: Benefit[];
};

const BENEFIT_LABELS: Record<string, string> = {
  included_entity: 'Entidad incluida',
  discount_percent: 'Descuento %',
  discount_amount: 'Descuento importe',
  free_months: 'Meses gratis',
};

function checkoutPlan(checkout: Checkout) {
  const value = checkout.metadata?.plan_name;
  return typeof value === 'string' ? value : 'Suscripción EXPERT';
}

export default function ClientBenefitsPage() {
  const params = useParams<{ id: string }>();
  const clientId = params.id;
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [sourceType, setSourceType] = useState<'subscription' | 'checkout'>('checkout');
  const [sourceId, setSourceId] = useState('');
  const [primaryCompanyId, setPrimaryCompanyId] = useState('');
  const [beneficiaryCompanyId, setBeneficiaryCompanyId] = useState('');
  const [benefitType, setBenefitType] = useState<'included_entity' | 'discount_percent' | 'discount_amount' | 'free_months'>('included_entity');
  const [value, setValue] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [excludeAnnualIrpf, setExcludeAnnualIrpf] = useState(true);

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await fetch(`/api/admin/clientes/${clientId}/subscription-benefits`, { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo cargar la configuración comercial');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { void load(); }, [load]);

  const sources = useMemo(() => {
    if (!data) return [];
    if (sourceType === 'subscription') {
      return data.subscriptions.filter((s) => ['active', 'trialing', 'past_due'].includes(s.status)).map((s) => ({
        id: s.id,
        companyId: s.company_id,
        label: `${s.plan_name} · ${s.status}`,
      }));
    }
    return data.checkoutSessions.filter((c) => c.status === 'open').map((c) => ({
      id: c.id,
      companyId: c.company_id,
      label: `${checkoutPlan(c)} · Checkout abierto`,
    }));
  }, [data, sourceType]);

  useEffect(() => {
    const selected = sources.find((source) => source.id === sourceId);
    if (selected?.companyId) setPrimaryCompanyId(selected.companyId);
    if (!selected && sources.length === 1) {
      setSourceId(sources[0].id);
      if (sources[0].companyId) setPrimaryCompanyId(sources[0].companyId);
    }
  }, [sourceId, sources]);

  const beneficiaryCompanies = (data?.companies ?? []).filter((company) => company.id !== primaryCompanyId);

  async function createBenefit() {
    if (!sourceId || !primaryCompanyId || !beneficiaryCompanyId || reason.trim().length < 3) {
      setError('Selecciona contratación, entidad beneficiaria e indica el motivo comercial.');
      return;
    }
    setSaving(true); setError(''); setMessage('');
    try {
      const payload = {
        sourceType,
        sourceId,
        primaryCompanyId,
        beneficiaryCompanyId,
        benefitType,
        value: benefitType === 'included_entity' ? null : Number(value),
        coverageScope: benefitType === 'included_entity' ? 'recurring_management' : 'subscription_fee',
        excludedServices: benefitType === 'included_entity' && excludeAnnualIrpf ? ['annual_irpf'] : [],
        validUntil: validUntil || null,
        reason,
        notes: notes || null,
      };
      const response = await fetch(`/api/admin/clientes/${clientId}/subscription-benefits`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo guardar el beneficio');
      setMessage('Beneficio comercial registrado y auditado. No se ha creado ningún cargo ni suscripción adicional en Stripe.');
      setBeneficiaryCompanyId(''); setValue(''); setValidUntil(''); setReason(''); setNotes('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el beneficio');
    } finally { setSaving(false); }
  }

  async function deactivate(benefit: Benefit) {
    const reasonText = window.prompt('Motivo para desactivar este beneficio:');
    if (!reasonText || reasonText.trim().length < 3) return;
    setSaving(true); setError(''); setMessage('');
    try {
      const response = await fetch(`/api/admin/clientes/${clientId}/subscription-benefits`, {
        method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ benefitId: benefit.id, action: 'deactivate', reason: reasonText.trim() }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo desactivar el beneficio');
      setMessage('Beneficio desactivado. No se han modificado datos históricos ni cargos Stripe.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo desactivar el beneficio');
    } finally { setSaving(false); }
  }

  if (loading) return <main className="min-h-screen bg-[#f8f4eb] p-8"><div className="mx-auto flex max-w-6xl justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#c88b25]" /></div></main>;

  return (
    <main className="min-h-screen bg-[#f8f4eb] px-6 py-8 text-[#07111d]">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c88b25]">Cliente 360 · Comercial</p><h1 className="mt-1 font-serif text-3xl font-bold">Beneficios y entidades incluidas</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#52606d]">Gestiona promociones asociadas a una contratación real. Una entidad incluida amplía el alcance operativo de la suscripción principal, pero no crea una segunda suscripción ni factura a 0 €.</p></div>
          <Link href={`/admin/clientes/${clientId}`} className="rounded-xl border border-[#d8cbb5] bg-white px-4 py-2 text-xs font-bold">Volver al Cliente 360</Link>
        </div>

        {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {message && <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{message}</div>}

        <section className="mt-6 rounded-2xl border border-[#d8cbb5] bg-white p-6">
          <div className="flex items-center gap-2"><PlusCircle className="h-5 w-5 text-[#c88b25]" /><h2 className="font-serif text-xl font-bold">Añadir beneficio</h2></div>
          <p className="mt-1 text-xs text-[#6b7280]">Puede vincularse a un Checkout abierto o a una suscripción ya creada. Si se vincula al Checkout, EXPERT lo enlazará a la suscripción cuando Stripe confirme el alta.</p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold">Estado de contratación<select value={sourceType} onChange={(e) => { setSourceType(e.target.value as 'subscription' | 'checkout'); setSourceId(''); setPrimaryCompanyId(''); }} className="mt-2 w-full rounded-xl border border-[#d8cbb5] px-3 py-3 text-sm"><option value="checkout">Checkout pendiente</option><option value="subscription">Suscripción existente</option></select></label>
            <label className="text-sm font-semibold">Contratación<select value={sourceId} onChange={(e) => setSourceId(e.target.value)} className="mt-2 w-full rounded-xl border border-[#d8cbb5] px-3 py-3 text-sm"><option value="">Seleccionar</option>{sources.map((source) => <option key={source.id} value={source.id}>{source.label}</option>)}</select></label>
            <label className="text-sm font-semibold">Entidad contratante<select value={primaryCompanyId} disabled className="mt-2 w-full rounded-xl border border-[#d8cbb5] bg-gray-50 px-3 py-3 text-sm"><option value="">Se obtiene de la contratación</option>{(data?.companies ?? []).map((company) => <option key={company.id} value={company.id}>{company.name}{company.nif ? ` · ${company.nif}` : ''}</option>)}</select></label>
            <label className="text-sm font-semibold">Entidad beneficiaria<select value={beneficiaryCompanyId} onChange={(e) => setBeneficiaryCompanyId(e.target.value)} className="mt-2 w-full rounded-xl border border-[#d8cbb5] px-3 py-3 text-sm"><option value="">Seleccionar</option>{beneficiaryCompanies.map((company) => <option key={company.id} value={company.id}>{company.name}{company.nif ? ` · ${company.nif}` : ''}</option>)}</select></label>
            <label className="text-sm font-semibold">Tipo de beneficio<select value={benefitType} onChange={(e) => setBenefitType(e.target.value as typeof benefitType)} className="mt-2 w-full rounded-xl border border-[#d8cbb5] px-3 py-3 text-sm">{Object.entries(BENEFIT_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
            {benefitType !== 'included_entity' && <label className="text-sm font-semibold">Valor<input type="number" min="0" step={benefitType === 'free_months' ? '1' : '0.01'} value={value} onChange={(e) => setValue(e.target.value)} className="mt-2 w-full rounded-xl border border-[#d8cbb5] px-3 py-3 text-sm" /></label>}
            <label className="text-sm font-semibold">Vigencia hasta <span className="font-normal text-[#6b7280]">(opcional)</span><input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="mt-2 w-full rounded-xl border border-[#d8cbb5] px-3 py-3 text-sm" /></label>
            <label className="text-sm font-semibold">Motivo comercial<input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej. promoción acordada al contratar el Plan Avanzado" className="mt-2 w-full rounded-xl border border-[#d8cbb5] px-3 py-3 text-sm" /></label>
          </div>

          {benefitType === 'included_entity' && <label className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><input type="checkbox" checked={excludeAnnualIrpf} onChange={(e) => setExcludeAnnualIrpf(e.target.checked)} className="mt-1" /><span><strong>Excluir declaración anual IRPF.</strong> La entidad queda incluida para gestión periódica/mensual, pero la Renta anual se contrata aparte salvo acuerdo expreso distinto.</span></label>}

          <label className="mt-4 block text-sm font-semibold">Notas internas <span className="font-normal text-[#6b7280]">(solo auditoría Admin)</span><textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-2 w-full rounded-xl border border-[#d8cbb5] px-3 py-3 text-sm" /></label>
          <div className="mt-5 flex justify-end"><button type="button" disabled={saving || sources.length === 0} onClick={() => void createBenefit()} className="inline-flex items-center gap-2 rounded-xl bg-[#07111d] px-5 py-3 text-sm font-bold text-white disabled:opacity-40">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Registrar beneficio</button></div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#d8cbb5] bg-white p-6">
          <h2 className="font-serif text-xl font-bold">Beneficios registrados</h2>
          {(data?.benefits ?? []).length === 0 ? <p className="mt-4 text-sm text-[#6b7280]">No hay beneficios comerciales registrados para este cliente.</p> : <div className="mt-4 space-y-3">{data!.benefits.map((benefit) => <article key={benefit.id} className={`rounded-xl border p-4 ${benefit.active ? 'border-green-200 bg-green-50/40' : 'border-[#e6dfd2] bg-[#faf8f2]'}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-[#07111d] px-2 py-1 text-xs font-bold text-white">{BENEFIT_LABELS[benefit.feature_key] ?? benefit.feature_key}</span>{benefit.active ? <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700"><CheckCircle2 className="h-3.5 w-3.5" />Activo</span> : <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-500"><XCircle className="h-3.5 w-3.5" />Inactivo</span>}</div><p className="mt-2 text-sm"><strong>{benefit.primaryCompanyName ?? 'Entidad contratante'}</strong> → <strong>{benefit.beneficiaryCompanyName ?? 'Entidad beneficiaria'}</strong></p><p className="mt-1 text-xs text-[#52606d]">Cobertura: {benefit.coverage_scope ?? '—'}{benefit.benefit_value !== null ? ` · Valor: ${benefit.benefit_value}` : ''}</p>{benefit.excluded_services?.length > 0 && <p className="mt-1 text-xs text-amber-800">Exclusiones: {benefit.excluded_services.join(', ')}</p>}<p className="mt-1 text-xs text-[#6b7280]">Desde {new Date(benefit.valid_from).toLocaleDateString('es-ES')}{benefit.valid_until ? ` hasta ${new Date(benefit.valid_until).toLocaleDateString('es-ES')}` : ' · sin fecha fin'}</p>{benefit.adminMeta?.reason && <p className="mt-2 text-xs text-[#29384a]">Motivo: {benefit.adminMeta.reason}</p>}{benefit.adminMeta?.notes && <p className="mt-1 text-xs text-[#6b7280]">Nota interna: {benefit.adminMeta.notes}</p>}</div>{benefit.active && <button type="button" disabled={saving} onClick={() => void deactivate(benefit)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">Desactivar</button>}</div></article>)}</div>}
        </section>
      </div>
    </main>
  );
}
