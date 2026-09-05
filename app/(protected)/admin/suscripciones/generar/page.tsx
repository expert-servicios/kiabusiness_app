'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Copy, ExternalLink, Eye, Loader2, Mail, Search, Send, Sparkles } from 'lucide-react';

type ClientSummary = { id: string; full_name: string | null; email: string; status: string; plan: string | null };
type Company = { id: string; role: string; name: string; razon_social: string | null; nif: string | null };
type CheckoutSession = { id: string; stripe_session_id: string; status: string; company_id: string | null; created_at: string; metadata?: Record<string, unknown> | null };
type ClientDetail = {
  profile: { id: string; full_name: string | null; email: string; profile_completed: boolean; billing_ready: boolean; active_company_id: string | null };
  companies: Company[];
  subs: Array<{ id: string; plan: string; status: string; company_id: string | null }>;
  checkoutSessions: CheckoutSession[];
  quotes: Array<{ id: string; service: string; status: string; amount_eur: number; company_id: string | null }>;
};
type CheckoutResult = {
  stripeUrl: string;
  sessionId: string;
  companyId: string;
  leadId?: string | null;
  quoteId?: string | null;
  onboardingCaseId?: string | null;
  reused?: boolean;
};

const PLANS = [
  { key: 'STRIPE_PLAN_MONTHLY_49', name: 'Plan Supervisión', amount: 49 },
  { key: 'STRIPE_PLAN_MONTHLY_99', name: 'Plan Avanzado', amount: 99 },
  { key: 'STRIPE_PLAN_MONTHLY_199', name: 'Plan Colaborativo', amount: 199 },
] as const;

function defaultEmail(name: string, planName: string, amount: number) {
  return {
    subject: `Tu plan mensual EXPERT está listo para activar — ${planName}`,
    body: `Hola ${name},\n\nYa hemos preparado y verificado tu contratación de ${planName}. Puedes completar la activación mediante el botón seguro que aparece al final de este correo.\n\nLa cuota es de ${amount} € al mes + IVA. Una vez completado el pago, accederás al proceso de onboarding de EXPERT para continuar con la puesta en marcha del servicio.\n\nSi tienes cualquier duda antes de completar la contratación, responde a este correo y la revisamos contigo.\n\nUn saludo,\nKsenia Ilicheva\nEXPERT`,
  };
}

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
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [composing, setComposing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  async function fetchDetail(id: string) {
    const res = await fetch(`/api/admin/clientes/${id}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'No se pudo cargar el cliente');
    return json as ClientDetail;
  }

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/clientes');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'No se pudieron cargar los clientes');
        const rows = (json.clients ?? []) as ClientSummary[];
        setClients(rows);
        const initialClientId = new URLSearchParams(window.location.search).get('clientId');
        if (initialClientId && rows.some((client) => client.id === initialClientId)) await chooseClient(initialClientId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los clientes');
      } finally { setLoadingClients(false); }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredClients = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return clients.slice(0, 30);
    return clients.filter((client) => `${client.full_name ?? ''} ${client.email}`.toLowerCase().includes(needle)).slice(0, 30);
  }, [clients, query]);

  async function chooseClient(id: string) {
    setSelectedClientId(id); setDetail(null); setCompanyId(''); setResult(null); setEmailSent(false); setEmailSubject(''); setEmailBody(''); setError(''); setNotice(''); setLoadingDetail(true);
    try {
      const nextDetail = await fetchDetail(id);
      setDetail(nextDetail);
      const preferredCompany = nextDetail.companies.find((c) => c.id === nextDetail.profile.active_company_id) ?? nextDetail.companies[0] ?? null;
      setCompanyId(preferredCompany?.id ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el cliente');
    } finally { setLoadingDetail(false); }
  }

  async function generateLink() {
    if (!detail || !companyId) return;
    const plan = PLANS.find((item) => item.key === planKey)!;
    setGenerating(true); setError(''); setNotice(''); setResult(null); setEmailSent(false);
    try {
      const res = await fetch('/api/admin/subscriptions/send-link', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientEmail: detail.profile.email, companyId, planName: plan.name, amountEur: plan.amount, stripePriceEnvKey: plan.key, sendEmail: false }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'No se pudo generar el Checkout');
      setResult({ stripeUrl: json.stripeUrl, sessionId: json.sessionId, companyId: json.companyId, leadId: json.leadId, quoteId: json.quoteId, onboardingCaseId: json.onboardingCaseId, reused: false });
      const draft = defaultEmail(detail.profile.full_name ?? detail.profile.email.split('@')[0], plan.name, plan.amount);
      setEmailSubject(draft.subject); setEmailBody(draft.body);
      setNotice('Checkout generado y registrado. Revisa ahora el correo antes de enviarlo.');
      setDetail(await fetchDetail(detail.profile.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el Checkout');
    } finally { setGenerating(false); }
  }

  async function loadExistingCheckout(sessionId: string) {
    setLoadingExisting(true); setError(''); setNotice(''); setResult(null);
    try {
      const res = await fetch(`/api/admin/subscriptions/email?sessionId=${encodeURIComponent(sessionId)}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'No se pudo recuperar el Checkout');
      const plan = PLANS.find((item) => item.amount === Number(json.amountEur) || item.name === json.planName) ?? PLANS[1];
      setPlanKey(plan.key);
      setCompanyId(json.companyId);
      setResult({ stripeUrl: json.stripeUrl, sessionId: json.sessionId, companyId: json.companyId, leadId: json.leadId, quoteId: json.quoteId, onboardingCaseId: json.onboardingCaseId, reused: true });
      setEmailSent(json.emailSent === true);
      const draft = defaultEmail(json.clientName, json.planName, Number(json.amountEur));
      setEmailSubject(draft.subject); setEmailBody(draft.body);
      setNotice(json.emailSent
        ? `Checkout abierto recuperado. EXPERT ya registró un envío${json.emailSentAt ? ` el ${new Date(json.emailSentAt).toLocaleString('es-ES')}` : ''}; no se volverá a enviar.`
        : 'Checkout abierto recuperado sin crear otro. IMPORTANTE: EXPERT no puede asumir que no se haya enviado manualmente desde Outlook/Gmail; comprueba las comunicaciones antes de usar «Revisar y enviar».');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo recuperar el Checkout');
    } finally { setLoadingExisting(false); }
  }

  async function copyLink() {
    if (!result?.stripeUrl) return;
    await navigator.clipboard.writeText(result.stripeUrl);
    setNotice('Enlace copiado al portapapeles.');
  }

  async function improveWithKia() {
    if (!result) return;
    setComposing(true); setError(''); setNotice('');
    try {
      const res = await fetch('/api/admin/subscriptions/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'compose', sessionId: result.sessionId, subject: emailSubject, body: emailBody }) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'KIA no pudo mejorar el correo');
      setEmailSubject(json.subject); setEmailBody(json.body); setNotice('KIA ha mejorado el borrador. Revísalo antes de enviar.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'KIA no pudo mejorar el correo');
    } finally { setComposing(false); }
  }

  async function sendEmail() {
    if (!result || emailSent) return;
    const warning = result.reused ? '\n\nEste Checkout ya existía. Confirma antes que el enlace no se haya enviado manualmente desde Outlook/Gmail.' : '';
    if (!window.confirm(`Se enviará este correo al cliente usando la plantilla EXPERT y el Checkout verificado.${warning}\n\n¿Continuar?`)) return;
    setSending(true); setError(''); setNotice('');
    try {
      const res = await fetch('/api/admin/subscriptions/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send', sessionId: result.sessionId, subject: emailSubject, body: emailBody }) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? 'No se pudo enviar el correo');
      setEmailSent(true);
      setNotice(json.sent === false ? 'Este Checkout ya tenía una invitación registrada; EXPERT ha bloqueado el envío duplicado.' : `Correo enviado correctamente desde EXPERT a ${json.recipient}.`);
      if (detail) setDetail(await fetchDetail(detail.profile.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el correo');
    } finally { setSending(false); }
  }

  const activeForCompany = detail?.subs.some((sub) => sub.company_id === companyId && (sub.status === 'active' || sub.status === 'trialing')) ?? false;
  const openCheckoutForCompany = detail?.checkoutSessions.find((session) => session.company_id === companyId && session.status === 'open') ?? null;
  const latestQuoteForCompany = detail?.quotes.find((quote) => quote.company_id === companyId) ?? null;
  const selectedPlan = PLANS.find((plan) => plan.key === planKey)!;

  return (
    <main className="min-h-screen bg-[#f8f4eb] px-6 py-8 text-[#07111d]"><div className="mx-auto max-w-5xl">
      <div className="flex items-start gap-3"><Link href={selectedClientId ? `/admin/clientes/${selectedClientId}` : '/admin/suscripciones'} className="mt-1 rounded-lg border border-[#d8cbb5] p-2 text-[#29384a] hover:border-[#d7a33a]"><ArrowLeft className="h-4 w-4" /></Link><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c88b25]">Admin · Suscripciones</p><h1 className="mt-1 font-serif text-3xl font-bold">Contratación y correo al cliente</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#29384a]">Genera un Checkout nuevo solo cuando proceda o recupera uno abierto existente. Después revisa, edita o mejora con KIA el correo y envíalo desde EXPERT.</p></div></div>
      {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div className={`mt-6 rounded-xl border px-4 py-3 text-sm ${result?.reused && !emailSent ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>{notice}</div>}

      <section className="mt-6 rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
        <label className="text-xs font-bold uppercase tracking-wide text-[#29384a]">1. Cliente existente</label>
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#d8cbb5] px-3"><Search className="h-4 w-4 text-[#8a9aab]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nombre o email" className="w-full bg-transparent py-3 text-sm outline-none" /></div>
        {loadingClients ? <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[#c88b25]" /></div> : <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-[#f0e8d8]">{filteredClients.map((client) => <button key={client.id} type="button" onClick={() => void chooseClient(client.id)} className={`flex w-full items-center justify-between border-b border-[#f8f4eb] px-4 py-3 text-left last:border-b-0 ${selectedClientId === client.id ? 'bg-[#d7a33a]/10' : 'hover:bg-[#f8f4eb]'}`}><span><span className="block text-sm font-semibold">{client.full_name ?? 'Sin nombre'}</span><span className="block text-xs text-[#6b7280]">{client.email}</span></span>{client.plan && <span className="text-[11px] font-semibold text-[#c88b25]">{client.plan}</span>}</button>)}</div>}
      </section>

      {loadingDetail && <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-[#c88b25]" /></div>}
      {detail && <section className="mt-5 rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-serif text-xl font-bold">{detail.profile.full_name ?? detail.profile.email}</h2><p className="text-sm text-[#29384a]">{detail.profile.email}</p></div><div className="flex gap-2 text-xs"><span className={`rounded-full px-2.5 py-1 font-semibold ${detail.profile.profile_completed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>Perfil</span><span className={`rounded-full px-2.5 py-1 font-semibold ${detail.profile.billing_ready ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>Facturación</span></div></div>
        <div className="mt-6 grid gap-4 md:grid-cols-2"><label className="text-sm font-semibold">2. Entidad contratante<select value={companyId} onChange={(e) => { setCompanyId(e.target.value); setResult(null); setEmailSent(false); }} className="mt-2 w-full rounded-xl border border-[#d8cbb5] bg-white px-3 py-3 text-sm"><option value="">Selecciona entidad</option>{detail.companies.map((company) => <option key={company.id} value={company.id}>{company.razon_social ?? company.name} {company.nif ? `· ${company.nif}` : ''}</option>)}</select></label><label className="text-sm font-semibold">3. Plan<select value={planKey} onChange={(e) => { setPlanKey(e.target.value as (typeof PLANS)[number]['key']); setResult(null); setEmailSent(false); }} disabled={Boolean(openCheckoutForCompany)} className="mt-2 w-full rounded-xl border border-[#d8cbb5] bg-white px-3 py-3 text-sm disabled:bg-gray-50">{PLANS.map((plan) => <option key={plan.key} value={plan.key}>{plan.name} · {plan.amount} €/mes + IVA</option>)}</select></label></div>
        {latestQuoteForCompany && <div className="mt-4 rounded-xl border border-[#e6dfd2] bg-[#faf8f2] px-4 py-3 text-sm text-[#29384a]">Presupuesto existente: <strong>{latestQuoteForCompany.service}</strong> · {latestQuoteForCompany.status} · {latestQuoteForCompany.amount_eur} € base.</div>}
        {openCheckoutForCompany && !activeForCompany && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><p>Ya existe un Checkout abierto (<span className="font-mono text-xs">{openCheckoutForCompany.stripe_session_id}</span>). No se generará otro.</p><button type="button" disabled={loadingExisting} onClick={() => void loadExistingCheckout(openCheckoutForCompany.stripe_session_id)} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#07111d] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{loadingExisting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Gestionar Checkout abierto</button></div>}
        {activeForCompany && <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">Esta entidad ya tiene una suscripción activa/trialing. No procede generar otro Checkout.</div>}
        {!openCheckoutForCompany && !activeForCompany && <div className="mt-6 flex justify-end"><button type="button" onClick={() => void generateLink()} disabled={generating || !companyId || !detail.profile.profile_completed || !detail.profile.billing_ready} className="inline-flex items-center gap-2 rounded-xl bg-[#d7a33a] px-5 py-3 text-sm font-bold text-[#07111d] disabled:cursor-not-allowed disabled:opacity-50">{generating && <Loader2 className="h-4 w-4 animate-spin" />}Generar Checkout sin enviar</button></div>}
      </section>}

      {result && <>
        <section className={`mt-5 rounded-2xl border p-6 ${result.reused ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}><div className="flex items-start gap-3"><CheckCircle2 className={`mt-0.5 h-5 w-5 ${result.reused ? 'text-amber-700' : 'text-green-700'}`} /><div className="min-w-0 flex-1"><h2 className="font-semibold text-[#07111d]">{result.reused ? 'Checkout abierto recuperado y revalidado' : 'Contratación preparada y Checkout registrado'}</h2><p className="mt-1 text-xs text-[#29384a]">Session ID: <span className="font-mono">{result.sessionId}</span></p>{result.quoteId && <p className="mt-1 text-xs text-[#29384a]">Presupuesto: <span className="font-mono">{result.quoteId}</span></p>}{result.onboardingCaseId && <p className="mt-1 text-xs text-[#29384a]">Expediente: <span className="font-mono">{result.onboardingCaseId}</span></p>}<div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => void copyLink()} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-xs font-semibold"><Copy className="h-3.5 w-3.5" />Copiar enlace</button><a href={result.stripeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-xs font-semibold"><ExternalLink className="h-3.5 w-3.5" />Verificar Checkout</a><Link href={`/admin/clientes/${selectedClientId}`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] bg-white px-3 py-2 text-xs font-semibold">Volver al Cliente 360</Link></div></div></div></section>

        <section className="mt-5 rounded-2xl border border-[#d8cbb5] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-[#c88b25]">4. Comunicación</p><h2 className="mt-1 font-serif text-xl font-bold">Correo de contratación</h2></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setShowPreview((value) => !value)} className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8cbb5] px-3 py-2 text-xs font-semibold"><Eye className="h-3.5 w-3.5" />{showPreview ? 'Ocultar vista previa' : 'Vista previa'}</button><button type="button" onClick={() => void improveWithKia()} disabled={composing || sending || emailSent} className="inline-flex items-center gap-1.5 rounded-xl border border-[#c88b25] px-3 py-2 text-xs font-bold text-[#8b5a0a] disabled:opacity-50">{composing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}Mejorar con KIA</button></div></div>
          {result.reused && !emailSent && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900"><strong>Control de duplicados externos:</strong> este Checkout ya existía y EXPERT no tiene un envío propio registrado. Eso no demuestra que no se haya enviado por Outlook/Gmail u otro canal. <Link href={`/admin/clientes/${selectedClientId}/comunicaciones`} className="font-bold underline underline-offset-2">Revisar Comunicaciones</Link> antes de enviarlo desde aquí.</div>}
          <div className="mt-5 grid gap-5 lg:grid-cols-2"><div className="space-y-4"><label className="block text-sm font-semibold">Asunto<input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} disabled={emailSent} className="mt-2 w-full rounded-xl border border-[#d8cbb5] px-3 py-3 text-sm outline-none focus:border-[#c88b25] disabled:bg-gray-50" /></label><label className="block text-sm font-semibold">Mensaje<textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} disabled={emailSent} rows={15} className="mt-2 w-full resize-y rounded-xl border border-[#d8cbb5] px-3 py-3 text-sm leading-6 outline-none focus:border-[#c88b25] disabled:bg-gray-50" /></label><p className="text-xs leading-5 text-[#6b7280]">El enlace Stripe no forma parte del texto editable: EXPERT lo inserta en servidor como botón seguro. KIA tampoco puede modificarlo.</p></div>{showPreview && <div className="rounded-2xl bg-[#f8f4eb] p-4"><div className="overflow-hidden rounded-2xl border border-[#d8cbb5] bg-white"><div className="bg-[#07111d] px-6 py-6 text-center"><div className="font-serif text-2xl font-bold tracking-[0.2em] text-[#d7a33a]">EXPERT</div><div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#8899aa]">Asesoría Legal · Fiscal · Administrativa</div></div><div className="p-6"><h3 className="font-serif text-xl font-bold">{selectedPlan.name}</h3><div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#29384a]">{emailBody}</div><div className="mt-5 rounded-xl bg-[#f8f4eb] p-3 text-sm"><strong>{selectedPlan.amount} €/mes + IVA</strong></div><div className="mt-6 text-center"><span className="inline-block rounded-full bg-[#c88b25] px-6 py-3 text-xs font-bold uppercase tracking-wide text-[#07111d]">Activar {selectedPlan.name}</span></div></div><div className="border-t border-[#d8cbb5] bg-[#f8f4eb] px-5 py-4 text-center text-[10px] text-[#6b7280]">EXPERT ESTUDIOS PROFESIONALES, SLU · info@expertconsulting.es</div></div></div>}</div>
          <div className="mt-6 flex items-center justify-between gap-4 border-t border-[#f0e8d8] pt-5"><div className="flex items-center gap-2 text-xs text-[#6b7280]"><Mail className="h-4 w-4" />Destinatario canónico: <strong className="text-[#29384a]">validado en servidor desde Auth</strong></div><button type="button" onClick={() => void sendEmail()} disabled={sending || composing || emailSent || !emailSubject.trim() || emailBody.trim().length < 20} className="inline-flex items-center gap-2 rounded-xl bg-[#07111d] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : emailSent ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}{emailSent ? 'Correo ya enviado' : 'Revisar y enviar'}</button></div>
        </section>
      </>}
    </div></main>
  );
}
