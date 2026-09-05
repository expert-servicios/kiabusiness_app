'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Building2, CheckCircle2, CircleDashed, CreditCard, FileText, Mail, Plug, RefreshCw, UserRoundCheck } from 'lucide-react';

type Client360 = {
  profile: {
    id: string;
    full_name: string | null;
    email: string;
    profile_completed: boolean;
    billing_ready: boolean;
    active_company_id: string | null;
    onboarding_completed_at: string | null;
  };
  companies: { id: string; name: string; nif: string | null }[];
  cases: { id: string; service: string; state: string; status: string; next_action?: string | null }[];
  quotes: { id: string; service: string; status: string; amount_eur: number; company_id: string | null }[];
  subs: { id: string; plan: string; status: string; company_id: string | null }[];
  checkoutSessions: { id: string; stripe_session_id: string; status: string; company_id: string | null; created_at: string }[];
  emailEvents: { id: number; subject: string | null; status: string | null; created_at: string }[];
  integrations: { id: string; provider: string; status: string; company_id: string | null; last_success_at: string | null; last_error: string | null }[];
};

type StepState = 'done' | 'active' | 'pending';
type Step = { key: string; title: string; detail: string; state: StepState; href?: string; action?: string; icon: React.ComponentType<{ className?: string }> };

function stateClass(state: StepState) {
  if (state === 'done') return 'border-green-200 bg-green-50';
  if (state === 'active') return 'border-amber-200 bg-amber-50';
  return 'border-[#e6dfd2] bg-white';
}

export function ClientOnboardingCockpit({ clientId }: { clientId: string }) {
  const [data, setData] = useState<Client360 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch(`/api/admin/clientes/${clientId}`, { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? 'No se pudo cargar el alta');
      setData(json);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error de conexión');
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  const steps = useMemo<Step[]>(() => {
    if (!data) return [];
    const activeCompany = data.companies.find((company) => company.id === data.profile.active_company_id) ?? data.companies[0] ?? null;
    const companyQuery = activeCompany ? `&companyId=${encodeURIComponent(activeCompany.id)}` : '';
    const activeSubscription = data.subs.find((sub) => ['active', 'trialing'].includes(sub.status));
    const openCheckout = data.checkoutSessions.find((session) => session.status === 'open');
    const latestQuote = data.quotes[0] ?? null;
    const onboardingCase = data.cases.find((item) => item.service === 'Alta de usuario' && item.state !== 'finalizado') ?? null;
    const holded = data.integrations.find((integration) => integration.provider === 'holded' && integration.status === 'active' && (!activeCompany || !integration.company_id || integration.company_id === activeCompany.id));
    const profileReady = data.profile.profile_completed && data.profile.billing_ready;
    const companyReady = Boolean(activeCompany);
    const commercialReady = Boolean(latestQuote || openCheckout || activeSubscription);
    const checkoutState: StepState = activeSubscription ? 'done' : openCheckout ? 'active' : 'pending';
    const onboardingDone = Boolean(data.profile.onboarding_completed_at);

    return [
      { key: 'profile', title: 'Perfil y facturación', detail: profileReady ? 'Datos mínimos listos para contratar.' : 'Completar datos personales/fiscales antes de cobrar.', state: profileReady ? 'done' : 'active', href: `/admin/clientes/${clientId}`, action: profileReady ? 'Revisar ficha' : 'Completar ficha', icon: UserRoundCheck },
      { key: 'company', title: 'Entidad contratante', detail: activeCompany ? `${activeCompany.name}${activeCompany.nif ? ` · ${activeCompany.nif}` : ''}` : 'No hay entidad activa vinculada.', state: companyReady ? 'done' : 'active', href: `/admin/empresas?clientId=${encodeURIComponent(clientId)}${companyQuery}`, action: companyReady ? 'Ver empresa' : 'Vincular empresa', icon: Building2 },
      {
        key: 'commercial', title: 'Presupuesto y contratación',
        detail: latestQuote ? `${latestQuote.service} · ${latestQuote.status} · ${latestQuote.amount_eur} € base` : activeSubscription ? `Suscripción ${activeSubscription.plan}` : openCheckout ? 'Checkout ya generado; no crear otro mientras siga abierto.' : 'Preparar lead, presupuesto, expediente y Checkout en una sola operación.',
        state: commercialReady ? (activeSubscription ? 'done' : 'active') : (profileReady && companyReady ? 'active' : 'pending'), href: `/admin/suscripciones/generar?clientId=${clientId}`, action: commercialReady ? 'Revisar contratación' : 'Preparar contratación', icon: FileText,
      },
      {
        key: 'payment', title: 'Stripe y suscripción',
        detail: activeSubscription ? `${activeSubscription.plan} · ${activeSubscription.status}` : openCheckout ? `Checkout abierto · ${openCheckout.stripe_session_id}` : 'Pendiente de generar/completar Checkout.',
        state: checkoutState, href: `/admin/suscripciones?clientId=${encodeURIComponent(clientId)}${companyQuery}`, action: activeSubscription ? 'Ver suscripción' : 'Ver intentos', icon: CreditCard,
      },
      { key: 'onboarding', title: 'Onboarding', detail: onboardingDone ? 'Onboarding marcado como completado.' : onboardingCase?.next_action || (activeSubscription ? 'Continuar reunión inicial y configuración poscompra.' : 'Se activa después de la suscripción.'), state: onboardingDone ? 'done' : activeSubscription || onboardingCase ? 'active' : 'pending', href: `/admin/expedientes?clientId=${clientId}`, action: onboardingDone ? 'Ver expediente' : 'Continuar onboarding', icon: CheckCircle2 },
      { key: 'holded', title: 'Holded', detail: holded ? `Integración activa${holded.last_success_at ? ` · última OK ${new Date(holded.last_success_at).toLocaleDateString('es-ES')}` : ''}` : 'Sin integración Holded activa para la entidad.', state: holded ? 'done' : activeSubscription ? 'active' : 'pending', href: `/admin/clientes/${clientId}/integraciones`, action: holded ? 'Probar / gestionar' : 'Conectar / revisar', icon: Plug },
      { key: 'communications', title: 'Comunicaciones', detail: `${data.emailEvents.length} email(s) EXPERT registrados. Correo 360 disponible para seguimiento.`, state: data.emailEvents.length ? 'done' : 'active', href: `/admin/clientes/${clientId}/comunicaciones`, action: 'Abrir comunicaciones', icon: Mail },
    ];
  }, [data, clientId]);

  if (loading && !data) return <div className="border-b border-[#e6dfd2] bg-[#faf8f2] px-6 py-3 text-xs text-[#6b7280]"><RefreshCw className="mr-2 inline h-3.5 w-3.5 animate-spin" />Cargando alta y activación…</div>;
  if (error || !data) return <div className="border-b border-red-200 bg-red-50 px-6 py-2 text-xs text-red-700">No se pudo cargar el cockpit de alta: {error || 'sin datos'}</div>;

  const completed = steps.filter((step) => step.state === 'done').length;
  return (
    <section className="border-b border-[#e6dfd2] bg-[#faf8f2]">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c88b25]">Alta y activación</p><h2 className="mt-1 font-serif text-lg font-bold text-[#07111d]">Mesa de operaciones del cliente</h2><p className="mt-1 text-xs text-[#6b7280]">{completed}/{steps.length} etapas completadas. Ejecuta cada paso desde EXPERT sin reconstruir el flujo manualmente.</p></div><button type="button" onClick={() => void load()} className="rounded-lg border border-[#d8cbb5] bg-white p-2 text-[#29384a] hover:border-[#c88b25]" title="Actualizar alta"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon; const StateIcon = step.state === 'done' ? CheckCircle2 : CircleDashed;
            const body = <div className={`h-full rounded-xl border p-3 transition ${stateClass(step.state)} ${step.href ? 'hover:border-[#c88b25]' : ''}`}><div className="flex items-start justify-between gap-2"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-[#c88b25]" /><p className="text-sm font-bold text-[#07111d]">{step.title}</p></div><StateIcon className={`h-4 w-4 ${step.state === 'done' ? 'text-green-700' : step.state === 'active' ? 'text-amber-700' : 'text-[#9ca3af]'}`} /></div><p className="mt-2 min-h-10 text-xs leading-5 text-[#4b5563]">{step.detail}</p>{step.action && <p className="mt-2 text-[11px] font-bold text-[#9a6a17]">{step.action} →</p>}</div>;
            return step.href ? <Link key={step.key} href={step.href}>{body}</Link> : <div key={step.key}>{body}</div>;
          })}
        </div>
      </div>
    </section>
  );
}
