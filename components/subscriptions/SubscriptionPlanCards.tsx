'use client';

import { useState, lazy, Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle2, Zap, FileText, Gift } from 'lucide-react';
import { getReadinessCheck } from '@/lib/data/service-readiness-checks';
import type { ReadinessCheck } from '@/lib/data/service-readiness-checks';

const ReadinessModal = lazy(() =>
  import('@/components/services/ReadinessModal').then(m => ({ default: m.ReadinessModal }))
);

interface Plan {
  slug        : string;
  name        : string;
  tagline     : string;
  price       : string;
  priceId     : string;
  highlighted : boolean;
  features    : string[];
  isQuote     : boolean;
}

interface Props {
  planAvanzadoPriceId    : string;
  planColaborativoPriceId: string;
}

async function goToCheckout(priceId: string) {
  const res  = await fetch('/api/subscriptions/checkout', {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ priceId }),
  });
  const data = await res.json() as { url?: string; code?: string; error?: string };
  if (res.status === 409) {
    window.location.href =
      data.code === 'billing_required'
        ? '/dashboard/perfil?section=billing'
        : '/dashboard/perfil';
    return;
  }
  if (data.url) window.location.href = data.url;
}

const FEATURES_AVANZADO = [
  'Revisión mensual de tu contabilidad',
  'Impuestos trimestrales (IVA + IRPF)',
  'Resumen anual (Modelo 390 + 190)',
  'Declaración de la Renta anual',
  'Recordatorio de plazos fiscales',
  'Portal de cliente EXPERT',
  'Soporte por email y WhatsApp — 48 h',
  'Licencia Holded obligatoria (no incluida)',
];

const FEATURES_COLABORATIVO = [
  'Tú introduces facturas en Holded',
  'Revisión y validación mensual completa',
  'Impuestos trimestrales (IVA + IRPF)',
  'Impuesto de Sociedades anual (si aplica)',
  'Modelos informativos (347, 349, 180, 190)',
  'Declaración de la Renta anual',
  'Informe mensual de resultados',
  'Soporte prioritario — respuesta en 24 h',
  'Licencia Holded obligatoria (no incluida)',
];

const FEATURES_PERSONALIZADO = [
  'Contabilidad y fiscalidad completa',
  'Gestión laboral y nóminas (si aplica)',
  'Trámites de extranjería',
  'Asesoramiento fiscal estratégico',
  'Formación en Holded',
  'Precio ajustado a tu volumen real',
];

function PlanCard({
  plan, onReadiness,
}: {
  plan       : Plan;
  onReadiness: (check: ReadinessCheck, slug: string, priceId: string) => void;
}) {
  const check = !plan.isQuote ? getReadinessCheck(`plan-${plan.slug}`) : null;

  function handleCta() {
    if (plan.isQuote) return; // handled by Link
    if (check) {
      onReadiness(check, `plan-${plan.slug}`, plan.priceId);
    } else {
      void goToCheckout(plan.priceId);
    }
  }

  return (
    <div className={`relative flex flex-col rounded-3xl border p-6 ${
      plan.highlighted
        ? 'border-[#d7a33a] bg-white shadow-[0_8px_32px_rgba(212,160,23,0.18)]'
        : 'border-[#d8cbb5] bg-[#f8f4eb]'
    }`}>
      {plan.highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#d7a33a] px-4 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#07111d]">
          Más popular
        </span>
      )}

      <p className="text-sm uppercase tracking-[0.2em] text-[#c88b25]">{plan.name}</p>
      <p className="mt-0.5 text-xs text-[#29384a]">{plan.tagline}</p>
      <p className="mt-3 font-serif text-3xl font-bold text-[#07111d]">{plan.price}</p>

      <ul className="mt-4 flex-1 space-y-2">
        {plan.features.map((f) => (
          <li key={f} className={`flex items-start gap-2 text-xs ${
            f.includes('obligatoria') ? 'font-semibold text-[#c88b25]' : 'text-[#29384a]'
          }`}>
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c88b25]" />
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {plan.isQuote ? (
          <Link
            href="/solicitar-presupuesto?servicio=plan-personalizado"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#07111d] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#1a2d40]"
          >
            <FileText className="h-4 w-4" />
            Solicitar presupuesto
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleCta}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#c88b25] px-6 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#061321] transition hover:bg-[#b57a1e]"
          >
            <Zap className="h-4 w-4" />
            Configurar plan
          </button>
        )}

        {!plan.isQuote && (
          <Link
            href="/planes/gratuito"
            className="mt-2 block text-center text-[10px] text-[#29384a] transition hover:text-[#c88b25]"
          >
            <Gift className="mr-1 inline-block h-3 w-3" />
            ¿Sin Holded? Prueba gratis 14 días
          </Link>
        )}
      </div>
    </div>
  );
}

export function SubscriptionPlanCards({ planAvanzadoPriceId, planColaborativoPriceId }: Props) {
  const [readinessState, setReadinessState] = useState<{
    check  : ReadinessCheck;
    slug   : string;
    priceId: string;
  } | null>(null);

  const plans: Plan[] = [
    {
      slug: 'avanzado', name: 'Plan Avanzado', tagline: 'Tienes el control, yo superviso',
      price: '99 €/mes', priceId: planAvanzadoPriceId,
      highlighted: false, features: FEATURES_AVANZADO, isQuote: false,
    },
    {
      slug: 'colaborativo', name: 'Plan Colaborativo', tagline: 'Tú facturas, yo gestiono',
      price: '199 €/mes', priceId: planColaborativoPriceId,
      highlighted: true, features: FEATURES_COLABORATIVO, isQuote: false,
    },
    {
      slug: 'personalizado', name: 'Plan Personalizado', tagline: 'Gestión avanzada a medida',
      price: 'Consultar', priceId: '',
      highlighted: false, features: FEATURES_PERSONALIZADO, isQuote: true,
    },
  ];

  function handleApproved() {
    if (!readinessState) return;
    const { priceId } = readinessState;
    setReadinessState(null);
    void goToCheckout(priceId);
  }

  return (
    <>
      {readinessState && (
        <Suspense fallback={null}>
          <ReadinessModal
            check={readinessState.check}
            serviceSlug={readinessState.slug}
            onApproved={handleApproved}
            onClose={() => setReadinessState(null)}
          />
        </Suspense>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.slug}
            plan={plan}
            onReadiness={(check, slug, priceId) =>
              setReadinessState({ check, slug, priceId })
            }
          />
        ))}
      </div>
    </>
  );
}
