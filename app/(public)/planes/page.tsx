import type { Metadata } from 'next';
import type { LucideIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight, Check, HelpCircle, MonitorCheck, ShieldCheck,
  ClipboardList, Users, Sparkles, Database, MessageCircle, X, Gift,
} from 'lucide-react';
import { FaqSection } from '@/components/site/FaqSection';
import { RelatedArticles } from '@/components/site/RelatedArticles';
import { PlanCtaButton } from '@/components/planes/PlanCtaButton';
import { BillingToggle } from '@/components/planes/BillingToggle';

export const metadata: Metadata = {
  title: 'Planes de gestión contable con Holded desde 49 €/mes | EXPERT',
  description:
    'Todos los planes incluyen Plataforma EXPERT y Kia. Supervisión 49 €/mes, Avanzado 99 €/mes, Colaborativo 199 €/mes. Pago mensual o anual con 2 meses gratis. Holded obligatorio, sin permanencia.',
  alternates: { canonical: 'https://expertconsulting.es/planes' },
  openGraph: {
    type: 'website',
    url: 'https://expertconsulting.es/planes',
    title: 'Planes de gestión contable con Holded desde 49 €/mes | EXPERT',
    description:
      'Todos los planes incluyen Plataforma EXPERT y Kia. Supervisión 49 €/mes, Avanzado 99 €/mes, Colaborativo 199 €/mes. Pago mensual o anual con 2 meses gratis.',
    siteName: 'EXPERT — Asesoría Fiscal y Legal',
    locale: 'es_ES',
    images: [{ url: 'https://expertconsulting.es/catalog/consultoria.png', width: 1200, height: 630, alt: 'Planes de gestión contable con Holded — EXPERT' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planes de gestión contable con Holded desde 49 €/mes | EXPERT',
    description: 'Supervisión desde 49 €/mes, Avanzado 99 €/mes, Colaborativo 199 €/mes. Pago anual con 2 meses gratis.',
    images: ['https://expertconsulting.es/catalog/consultoria.png']
  }
};

type Plan = {
  slug        : 'supervision' | 'avanzado' | 'colaborativo';
  name        : string;
  tagline     : string;
  badge       : string | null;
  price       : number;
  annualTotal : number;
  annualMonthly: string;
  persona     : string;
  Icon        : LucideIcon;
  involvement : string;
  features    : string[];
  exclusions  : string[];
  ctaLabel    : string;
};

const plans: Plan[] = [
  {
    slug: 'supervision',
    name: 'Plan Supervisión',
    tagline: 'Tú llevas Holded, Kia y EXPERT supervisan',
    badge: 'Entrada',
    price: 49,
    annualTotal: 490,
    annualMonthly: '40,83',
    persona:
      'Para autónomos y pequeñas empresas que llevan su propia contabilidad en Holded y quieren una revisión mensual profesional, alertas y soporte básico sin delegar la gestión completa.',
    Icon: ShieldCheck,
    involvement: 'Autogestión supervisada',
    features: [
      'Plataforma EXPERT + Kia básico',
      'Revisión mensual básica de Holded',
      'Alertas básicas de errores y anomalías',
      'Revisión de facturas y categorías principales',
      'Revisión básica de bancos/conciliación',
      'Resumen mensual generado por Kia',
      'Estado de empresa básico',
      'Soporte por email/WhatsApp',
      'Licencia Holded obligatoria no incluida',
    ],
    exclusions: [
      'Presentación de impuestos',
      'Contabilidad delegada',
      'Subida de facturas por EXPERT',
      'Migración de datos',
      'Nóminas/laboral',
      'Reuniones periódicas',
      'Revisión fiscal avanzada',
    ],
    ctaLabel: 'Configurar plan — 49 €/mes',
  },
  {
    slug: 'avanzado',
    name: 'Plan Avanzado',
    tagline: 'Revisión profesional y fiscalidad básica',
    badge: null,
    price: 99,
    annualTotal: 990,
    annualMonthly: '82,50',
    persona:
      'Para autónomos y PYMEs que introducen su información en Holded y quieren revisión profesional, cierre trimestral y presentación de impuestos básicos.',
    Icon: MonitorCheck,
    involvement: 'Alta implicación',
    features: [
      'Plataforma EXPERT + Kia fiscal',
      'Revisión mensual de Holded',
      'Preparación y presentación de impuestos trimestrales básicos si aplica',
      'Revisión de cierre trimestral',
      'Calendario fiscal',
      'Alertas fiscales Kia',
      'Estado de empresa completo',
      'Soporte 48 h',
      'Renta anual del titular autónomo en casos sencillos, o condiciones especiales según complejidad',
      'Licencia Holded obligatoria no incluida',
    ],
    exclusions: [
      'Nóminas/laboral',
      'Gestión más delegada',
      'Alto volumen de facturas',
      'Inventario o e-commerce complejo',
    ],
    ctaLabel: 'Configurar plan — 99 €/mes',
  },
  {
    slug: 'colaborativo',
    name: 'Plan Colaborativo',
    tagline: 'Tú organizas, EXPERT revisa y valida',
    badge: 'Más popular',
    price: 199,
    annualTotal: 1990,
    annualMonthly: '165,83',
    persona:
      'Para negocios que trabajan en Holded y quieren más intervención mensual, informes, alertas y soporte prioritario sin pasar todavía a una gestión totalmente personalizada.',
    Icon: Users,
    involvement: 'Implicación media',
    features: [
      'Plataforma EXPERT + Kia avanzado',
      'Tú subes facturas o las organizas en Holded',
      'EXPERT revisa y valida mensualmente',
      'Preparación y presentación fiscal según alcance',
      'Informe mensual',
      'Alertas Kia de anomalías',
      'Soporte prioritario 24 h',
      'Estado de empresa completo',
      'Licencia Holded obligatoria no incluida',
    ],
    exclusions: [
      'Alto volumen sin presupuesto previo',
      'Nóminas/laboral no incluidas por defecto',
      'Varias sociedades',
      'Operativa internacional compleja',
    ],
    ctaLabel: 'Configurar plan — 199 €/mes',
  },
];

const comparisonRows = [
  { label: 'Plataforma EXPERT', supervision: 'Incluida', avanzado: 'Incluida', colaborativo: 'Incluida', personalizado: 'Incluida' },
  { label: 'Kia asistente', supervision: 'Básico', avanzado: 'Fiscal', colaborativo: 'Avanzado', personalizado: 'Premium' },
  { label: 'Revisión mensual', supervision: 'Básica', avanzado: 'Completa', colaborativo: 'Validación', personalizado: 'Según alcance' },
  { label: 'Alertas Kia', supervision: 'Básicas', avanzado: 'Fiscales', colaborativo: 'Anomalías', personalizado: 'Sí' },
  { label: 'Estado de empresa', supervision: 'Básico', avanzado: 'Completo', colaborativo: 'Completo', personalizado: 'A medida' },
  { label: 'Soporte', supervision: 'Básico', avanzado: '48 h', colaborativo: '24 h', personalizado: 'Según alcance' },
  { label: 'Presentación impuestos', supervision: 'No incluido', avanzado: 'Básicos', colaborativo: 'Según alcance', personalizado: 'Según alcance' },
  { label: 'Informe mensual', supervision: 'Resumen Kia', avanzado: 'Cierre trimestral', colaborativo: 'Sí', personalizado: 'A medida' },
  { label: 'Gestión más delegada', supervision: 'No incluido', avanzado: 'No incluido', colaborativo: 'Parcial', personalizado: 'Sí' },
  { label: 'Laboral/nóminas', supervision: 'No incluido', avanzado: 'No incluido', colaborativo: 'Presupuesto', personalizado: 'Sí' },
  { label: 'Volumen alto', supervision: 'No', avanzado: 'Presupuesto', colaborativo: 'Presupuesto', personalizado: 'Sí' },
  { label: 'Precio mensual', supervision: '49 €', avanzado: '99 €', colaborativo: '199 €', personalizado: 'Presupuesto' },
  { label: 'Precio anual (2 m. gratis)', supervision: '490 €/año', avanzado: '990 €/año', colaborativo: '1.990 €/año', personalizado: 'Presupuesto' },
];

const faqItems = [
  {
    q: '¿El Plan Supervisión incluye impuestos?',
    a: 'No. Incluye revisión mensual, alertas y soporte. Si necesitas preparación y presentación de impuestos, elige Plan Avanzado o superior.'
  },
  {
    q: '¿Puedo empezar por Supervisión y subir después?',
    a: 'Sí, puedes cambiar de plan con preaviso. Supervisión es una buena entrada si ya trabajas en Holded y quieres control profesional sin delegar toda la gestión.'
  },
  {
    q: '¿Qué diferencia hay entre prueba Holded y Plan Supervisión?',
    a: 'La prueba Holded es acceso al software. Plan Supervisión es revisión mensual de EXPERT sobre tu contabilidad en Holded.'
  },
  {
    q: '¿Necesito conectar Holded?',
    a: 'Sí. Todos los planes mensuales requieren Holded conectado desde el Panel Cliente antes de contratar.'
  },
  {
    q: '¿La licencia Holded está incluida?',
    a: 'No. Holded se contrata aparte. EXPERT puede orientarte sobre prueba, Pack Starter y preparación, pero la licencia no forma parte de la cuota mensual.'
  },
  {
    q: '¿Cómo funciona el pago anual con 2 meses gratis?',
    a: 'El plan anual se factura en un solo pago equivalente a 10 mensualidades. Pagas menos y tienes el servicio garantizado durante 12 meses sin preocuparte de la renovación mensual.'
  },
  {
    q: '¿Qué pasa si tengo mucho volumen, nóminas, inventario o varias sociedades?',
    a: 'En esos casos preparamos presupuesto personalizado. El precio fijo de los planes está pensado para volumen estándar y operativa sencilla.'
  },
  {
    q: '¿Hay permanencia mínima?',
    a: 'No en los planes mensuales. El plan anual garantiza el servicio durante 12 meses. Puedes cancelar o cambiar de plan con 30 días de preaviso por escrito.'
  },
];

interface Props {
  searchParams: Promise<{ billing?: string }>;
}

export default async function PlanesPage({ searchParams }: Props) {
  const params    = await searchParams;
  const isAnnual  = params.billing === 'anual';
  const loginBase = '/auth/login?next=/dashboard/suscripciones';
  const loginHref = isAnnual ? `${loginBase}?billing=anual` : loginBase;

  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <section className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-24">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Planes mensuales con Holded</p>
          <h1 className="mt-5 font-serif text-4xl font-bold leading-tight md:text-6xl">
            Revisión y gestión contable desde 49 €/mes.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-[#C9D1D9] md:text-lg">
            Elige cuánto quieres implicarte. Tú trabajas en <strong className="text-[#D4A017]">Holded</strong>, Kia detecta alertas y EXPERT revisa, valida o gestiona según el plan contratado.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="#planes"
              className="inline-flex min-h-12 items-center gap-2 bg-[#D4A017] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              Ver planes <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/ayuda/kia?topic=planes-mensuales"
              className="inline-flex min-h-12 items-center gap-2 border border-[#D4A017] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
            >
              <MessageCircle className="h-4 w-4" />
              Hablar con Kia
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017]">Paso previo</p>
              <h2 className="mt-3 font-serif text-3xl font-bold">¿Todavía no tienes Holded?</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#23364D]">
                Todos los planes mensuales de EXPERT trabajan con Holded. Si todavía no tienes cuenta, puedes empezar con la prueba gratuita de Holded y después elegir el plan de gestión que encaje contigo.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link href="/holded" className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#D4A017] px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]">
                <Sparkles className="h-4 w-4" />
                Solicitar prueba Holded 14 días
              </Link>
              <Link href="/holded/pack-starter" className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#0D1B2A]/20 px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:border-[#D4A017]">
                Ver Pack Starter
              </Link>
              <Link href="/ayuda/kia?topic=holded-planes" className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#D4A017]/50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017]/10">
                Preguntar a Kia
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F8F6F1] px-6 py-8">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {[
            ['Supervisión', 'Plataforma EXPERT + Kia básico. Tú llevas Holded y EXPERT revisa lo esencial.'],
            ['Avanzado', 'Plataforma EXPERT + Kia fiscal. Cierre trimestral e impuestos básicos según alcance.'],
            ['Colaborativo', 'Plataforma EXPERT + Kia avanzado. Más revisión, informes y soporte prioritario.'],
          ].map(([title, text]) => (
            <div key={title} className="border border-[#D4A017]/25 bg-white px-5 py-4">
              <p className="font-serif text-lg font-bold">{title}</p>
              <p className="mt-1 text-sm leading-6 text-[#23364D]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#0D1B2A] px-6 py-16 text-[#F8F6F1] md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Infraestructura base de todos los planes</p>
            <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl">
              Todos los planes incluyen Plataforma EXPERT + Kia
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#C9D1D9]">
              Desde tu área privada podrás conectar Holded, consultar el estado de tu empresa, enviar documentos, revisar alertas, ver tareas pendientes y comunicarte con Kia y el equipo EXPERT.
            </p>
            <p className="mt-6 text-lg font-semibold text-[#D4A017] md:text-xl">
              Holded organiza la contabilidad. Plataforma EXPERT y Kia organizan la gestión.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: MonitorCheck, title: 'Panel Cliente', text: 'Tu área privada con perfil, documentos, historial y acceso directo a Kia y al equipo EXPERT. Sin emails perdidos ni carpetas bautizadas con fechas.' },
              { icon: Sparkles, title: 'Kia asistente', text: 'Detecta documentos pendientes, avisa de plazos, prepara cierres y te explica el estado de tu empresa en cada momento.' },
              { icon: Database, title: 'Estado de empresa', text: 'Vista clara de la situación contable, fiscal y de gestión actualizada. Sabes qué falta antes de impuestos.' },
              { icon: ClipboardList, title: 'Documentos y alertas', text: 'Sube y clasifica documentos, recibe recordatorios automáticos y mantén todo ordenado desde un solo sitio.' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="border border-[#D4A017]/25 bg-[#23364D]/50 p-6">
                <Icon className="h-6 w-6 text-[#D4A017]" strokeWidth={1.7} />
                <h3 className="mt-4 font-serif text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#C9D1D9]">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 border border-[#D4A017]/30 bg-[#D4A017]/10 p-5 text-center">
            <p className="text-sm leading-7 text-[#C9D1D9]">
              <strong className="text-[#D4A017]">Incluido en todos los planes:</strong>
              {' '}Acceso a Plataforma EXPERT · Asistente Kia · Panel Cliente · Estado de empresa · Subida y clasificación de documentos · Alertas y recordatorios · Comunicación centralizada · Conexión Holded · Historial de gestiones
            </p>
          </div>
        </div>
      </section>

      <section id="planes" className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Precios</p>
            <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl">
              Planes EXPERT. Holded obligatorio.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#23364D]">
              Precios sin IVA. La licencia de Holded se contrata aparte. Todos los planes pasan por readiness antes de contratar.
            </p>
            <div className="mt-8 flex justify-center">
              <BillingToggle isAnnual={isAnnual} />
            </div>
            {isAnnual && (
              <p className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-[#D4A017]">
                <Gift className="h-4 w-4" />
                Pago único anual — equivale a 10 meses, 2 meses de regalo
              </p>
            )}
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => {
              const highlighted = plan.badge === 'Más popular';
              const annualCtaLabel = `Contratar anual — ${plan.annualTotal.toLocaleString('es-ES')} €/año`;
              return (
                <article
                  key={plan.slug}
                  className={`relative flex flex-col border p-7 ${
                    highlighted
                      ? 'border-[#D4A017] bg-white shadow-[0_8px_32px_rgba(212,160,23,0.18)]'
                      : 'border-[#D4A017]/25 bg-white'
                  }`}
                >
                  {plan.badge && (
                    <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                      highlighted
                        ? 'bg-[#D4A017] text-[#0D1B2A]'
                        : 'border border-[#D4A017]/40 bg-white text-[#D4A017]'
                    }`}>
                      {plan.badge}
                    </span>
                  )}

                  <div className="flex h-12 w-12 items-center justify-center bg-[#D4A017]/10">
                    <plan.Icon className="h-6 w-6 text-[#D4A017]" strokeWidth={1.7} />
                  </div>
                  <div className="mt-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">{plan.involvement}</span>
                    <h3 className="mt-1 font-serif text-2xl font-bold">{plan.name}</h3>
                    <p className="mt-0.5 text-sm font-semibold text-[#D4A017]">{plan.tagline}</p>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#23364D]">{plan.persona}</p>

                  {isAnnual ? (
                    <div className="mt-5">
                      <span className="inline-block bg-[#D4A017] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#0D1B2A]">
                        2 meses gratis
                      </span>
                      <div className="mt-2 flex items-end gap-1">
                        <span className="font-serif text-4xl font-bold">{plan.annualTotal.toLocaleString('es-ES')}</span>
                        <span className="mb-1 text-sm text-[#9CA3AF]">€/año + IVA</span>
                      </div>
                      <p className="text-xs text-[#9CA3AF]">≈ {plan.annualMonthly} €/mes · antes {plan.price} €/mes</p>
                    </div>
                  ) : (
                    <div className="mt-5">
                      <span className="font-serif text-4xl font-bold">{plan.price}</span>
                      <span className="ml-1 text-sm text-[#9CA3AF]">€/mes + IVA</span>
                      <p className="mt-0.5 text-xs text-[#9CA3AF]">
                        O{' '}
                        <Link href="/planes?billing=anual" className="text-[#D4A017] underline underline-offset-2 hover:no-underline">
                          {plan.annualTotal.toLocaleString('es-ES')} €/año — 2 meses gratis
                        </Link>
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#D4A017]">Incluye</p>
                    <ul className="mt-3 space-y-2.5">
                      {plan.features.map((f) => (
                        <li key={f} className={`flex items-start gap-2.5 text-sm ${
                          f.includes('Holded obligatoria')
                            ? 'font-semibold text-[#D4A017]'
                            : f.includes('Plataforma EXPERT')
                            ? 'font-bold text-[#0D1B2A]'
                            : 'text-[#23364D]'
                        }`}>
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-6 text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">No incluye</p>
                    <ul className="mt-3 space-y-2">
                      {plan.exclusions.slice(0, 4).map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-[#6B7280]">
                          <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.slug === 'colaborativo' && (
                    <p className="mt-5 border border-[#D4A017]/25 bg-[#D4A017]/5 px-4 py-3 text-xs leading-5 text-[#23364D]">
                      Precio pensado para volumen estándar y operativa sencilla. Alto volumen, nóminas, inventario, e-commerce, operaciones internacionales o varias sociedades requieren presupuesto personalizado.
                    </p>
                  )}

                  <div className="mt-7 space-y-3">
                    <PlanCtaButton
                      planSlug={plan.slug}
                      ctaLabel={isAnnual ? annualCtaLabel : plan.ctaLabel}
                      loginHref={loginHref}
                    />
                    <Link href={`/planes/${plan.slug}`} className="block text-center text-xs text-[#9CA3AF] transition hover:text-[#D4A017]">
                      Ver detalle del plan
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 pb-10">
        <div className="mx-auto max-w-7xl border-2 border-dashed border-[#D4A017]/60 bg-[#0D1B2A] p-8 text-[#F8F6F1] md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.32fr] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-serif text-2xl font-bold">Plan Personalizado</h3>
                <span className="border border-[#D4A017]/50 bg-[#D4A017]/10 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#D4A017]">A medida</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-[#D4A017]">Plataforma EXPERT + Kia premium</p>
              <p className="mt-2 max-w-4xl text-sm leading-7 text-[#C9D1D9]">
                Para nóminas, laboral, sociedades con volumen alto, e-commerce, inventario, operaciones UE/internacionales, varias empresas, contabilidad atrasada o gestión más delegada.
              </p>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                {['Plataforma EXPERT + Kia premium', 'Nóminas/laboral', 'Volumen alto', 'Varias sociedades', 'E-commerce', 'Inventario', 'Operativa internacional'].map((f) => (
                  <span key={f} className="inline-flex items-center gap-1.5 text-xs text-[#C9D1D9]">
                    <Check className="h-3.5 w-3.5 shrink-0 text-[#D4A017]" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/solicitar-presupuesto?servicio=plan-personalizado" className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]">
                <ClipboardList className="h-4 w-4" />
                Solicitar presupuesto
              </Link>
              <Link href="/ayuda/kia?topic=plan-personalizado" className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#D4A017]/40 px-6 py-3 text-sm font-semibold text-[#D4A017] transition hover:bg-[#D4A017]/10">
                <MessageCircle className="h-4 w-4" />
                Hablar con Kia
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Comparativa</p>
            <h2 className="mt-4 font-serif text-3xl font-bold">Qué incluye cada nivel.</h2>
          </div>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-sm">
              <thead>
                <tr className="bg-[#0D1B2A] text-left text-[#F8F6F1]">
                  <th className="px-4 py-3 font-semibold">Concepto</th>
                  <th className="px-4 py-3 font-semibold">Supervisión</th>
                  <th className="px-4 py-3 font-semibold">Avanzado</th>
                  <th className="px-4 py-3 font-semibold">Colaborativo</th>
                  <th className="px-4 py-3 font-semibold">Personalizado</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.label} className="border-b border-[#D4A017]/20">
                    <td className="px-4 py-3 font-semibold text-[#0D1B2A]">{row.label}</td>
                    <td className="px-4 py-3 text-[#23364D]">{row.supervision}</td>
                    <td className="px-4 py-3 text-[#23364D]">{row.avanzado}</td>
                    <td className="px-4 py-3 text-[#23364D]">{row.colaborativo}</td>
                    <td className="px-4 py-3 text-[#23364D]">{row.personalizado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 flex justify-center">
              <Image src="/Holded-Logotype-Red_Light.svg" alt="Holded" width={120} height={30} className="h-8 w-auto opacity-90" />
            </div>
            <h2 className="font-serif text-3xl font-bold leading-tight md:text-4xl">
              Holded no es opcional en los planes mensuales.
            </h2>
            <p className="mt-5 text-base leading-8 text-[#C9D1D9]">
              El checkout mensual se bloquea si no tienes perfil completo, datos fiscales listos y Holded conectado desde el Panel Cliente. No pedimos API keys por WhatsApp ni por email.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { icon: Database, title: 'Software aparte', text: 'La licencia Holded no está incluida en la cuota EXPERT.' },
              { icon: HelpCircle, title: 'Sin API por chat', text: 'La conexión se realiza en el Panel Cliente seguro.' },
              { icon: MonitorCheck, title: 'Readiness primero', text: 'Antes de pagar validamos si el plan encaja y si Holded está preparado.' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="border border-[#D4A017]/25 bg-[#23364D]/50 p-6">
                <Icon className="h-6 w-6 text-[#D4A017]" />
                <h3 className="mt-4 font-serif text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#C9D1D9]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FaqSection items={faqItems} title="Preguntas frecuentes sobre planes mensuales" />
      <RelatedArticles category="Holded" title="Guías sobre Holded y contabilidad" limit={3} />
    </main>
  );
}
