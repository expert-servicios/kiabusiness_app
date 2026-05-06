import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, FileText, MonitorCheck, Settings, Upload, Clock, Calendar, Gift, Zap } from 'lucide-react';
import { getStripeClient } from '@/lib/integrations/stripe';
import { HoldedBuyButton } from '@/components/holded/HoldedBuyButton';
import { articles } from '@/lib/utils/blog';
import { FaqSection } from '@/components/site/FaqSection';

// Update this URL once you create the Calendly event
const CALENDLY_DEMO_URL = 'https://calendly.com/soy-kseniailicheva/30min';

export const metadata: Metadata = {
  title: 'Holded Solution Partner | Migración y Onboarding | EXPERT',
  description:
    'Migramos tu contabilidad a Holded con estructura clara. Pack Starter, migración completa y migración con inventario. Somos Holded Solution Partner certificados.'
};

const migrationSteps = [
  { title: 'Diagnóstico', text: 'Revisamos tu sistema actual, facturación, bancos, impuestos y necesidades de reporting.', Icon: FileText },
  { title: 'Migración', text: 'Definimos qué datos se trasladan, qué se depura y cómo se ordena la operativa en Holded.', Icon: Upload },
  { title: 'Configuración', text: 'Ajustamos facturas, contactos, bancos, categorías, impuestos y circuitos de trabajo.', Icon: Settings },
  { title: 'Formación', text: 'Sesiones prácticas para que el equipo trabaje con seguridad desde el primer día.', Icon: MonitorCheck }
] as const;

const PACKAGE_META = [
  {
    priceId: 'price_1SxNObLeYwwgvux4fLN9k8YG',
    name: 'Pack Starter',
    subtitle: 'Onboarding a Holded',
    badge: null,
    features: [
      'Configuración inicial de la cuenta',
      'Setup de empresa, facturación y bancos',
      'Conexión bancaria (Open Banking)',
      '1 sesión de formación de 2 horas',
      'Soporte por email durante 30 días'
    ]
  },
  {
    priceId: 'price_1SxNJcLeYwwgvux42XH9HxiJ',
    name: 'Migración completa',
    subtitle: 'Sin módulo de inventario',
    badge: 'Más popular',
    features: [
      'Todo lo del Pack Starter',
      'Migración de clientes y proveedores',
      'Migración de facturas emitidas y recibidas',
      'Configuración contable completa (PGC)',
      '2 sesiones de formación de 2 horas',
      'Soporte prioritario durante 60 días'
    ]
  },
  {
    priceId: 'price_1SxNLlLeYwwgvux4IjCOgIQl',
    name: 'Migración completa',
    subtitle: '+ Módulo de inventario',
    badge: null,
    features: [
      'Todo lo de Migración completa',
      'Migración de productos y referencias',
      'Configuración de almacenes y stock inicial',
      'Integración inventario ↔ facturación',
      '3 sesiones de formación de 2 horas',
      'Soporte prioritario durante 90 días'
    ]
  }
];

const FORMACION_PRICE_ID = 'price_1SyB8ULeYwwgvux4sZbYod1B';

async function getPrices() {
  try {
    const stripe = getStripeClient();
    const allIds = [...PACKAGE_META.map((p) => p.priceId), FORMACION_PRICE_ID];
    const results = await Promise.all(allIds.map((id) => stripe.prices.retrieve(id)));
    return results.map((p) => p.unit_amount ?? null);
  } catch {
    return [null, null, null, null];
  }
}

function formatPrice(cents: number | null) {
  if (cents === null) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents / 100);
}

const holdedArticles = articles.filter((a) => a.category === 'Holded');

const holdedFaq = [
  {
    q: '¿Qué es Holded y para qué sirve?',
    a: 'Holded es un software de gestión empresarial en la nube que integra contabilidad, facturación, inventario, proyectos y CRM en un solo lugar. Permite tener visibilidad total del negocio en tiempo real desde cualquier dispositivo.'
  },
  {
    q: '¿Cuánto tiempo tarda la migración a Holded?',
    a: 'Depende del volumen de datos y la complejidad de tu situación actual. Un Pack Starter puede estar listo en 1-2 semanas. Una migración completa con historial contable e inventario suele tardar entre 3 y 6 semanas.'
  },
  {
    q: '¿Qué datos se pueden migrar a Holded?',
    a: 'Migramos clientes, proveedores, facturas emitidas y recibidas, saldos contables, productos y referencias de inventario, contactos y configuración bancaria. Previamente hacemos un diagnóstico para definir qué se migra y qué se depura.'
  },
  {
    q: '¿La formación está incluida en el precio de migración?',
    a: 'Sí. Todos los paquetes de migración incluyen 2 horas de formación onboarding gratuita para que arranques con seguridad. También ofrecemos sesiones adicionales de formación por horas si necesitas profundizar en algún módulo.'
  },
  {
    q: '¿Puedo probar Holded antes de contratar la migración?',
    a: 'Sí. Como Holded Solution Partner podemos facilitarte una prueba gratuita de 14 días sin tarjeta de crédito. También ofrecemos una demo en vivo de 30 minutos adaptada a tu sector.'
  },
  {
    q: '¿Qué pasa si ya tengo Holded pero mal configurado?',
    a: 'Podemos hacer una auditoría de tu cuenta actual, reorganizar la estructura contable, limpiar datos y configurar correctamente todos los módulos. Contacta con nosotros para valorar tu caso.'
  }
];

export default async function HoldedPage() {
  const prices = await getPrices();
  const formacionPrice = prices[3];

  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="brand-blue-bg px-6 py-20 text-[#F8F6F1] md:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Holded Solution Partner</p>
            <h1 className="mt-5 max-w-3xl font-serif text-4xl font-bold leading-tight md:text-6xl">
              Migración contable a Holded con una estructura clara.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#9CA3AF] md:text-lg">
              Te ayudamos a pasar de procesos dispersos a una gestión contable y administrativa más ordenada,
              conectada y preparada para crecer.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={CALENDLY_DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
              >
                <Calendar className="h-4 w-4" />
                Demo gratuita — 30 min
              </a>
              <Link
                href="#precios"
                className="inline-flex min-h-12 items-center justify-center border border-[#D4A017] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
              >
                Ver paquetes →
              </Link>
            </div>
          </div>

          <div className="border border-[#D4A017]/25 bg-[#23364D]/35 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4A017]">Qué incluye</p>
            <div className="mt-5 space-y-3">
              {[
                'Migración desde hojas de cálculo o software anterior',
                'Configuración inicial de empresa, facturación y bancos',
                'Revisión de procesos contables y administrativos',
                'Formación en Holded en bloques de 2 horas',
                'Acompañamiento inicial tras la migración'
              ].map((s) => (
                <div key={s} className="flex gap-3 border border-[#D4A017]/20 bg-[#0D1B2A]/45 p-4">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" />
                  <p className="text-sm leading-6 text-[#F8F6F1]/86">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing cards ─────────────────────────────────────────────────── */}
      <section id="precios" className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Paquetes</p>
            <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl">
              Elige el paquete que se adapta a tu situación.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#23364D]">
              Precios fijos, sin sorpresas. Si tu caso es especial,{' '}
              <Link href="/solicitar-presupuesto?servicio=migracion-holded" className="font-semibold text-[#D4A017] hover:underline">
                solicita un presupuesto personalizado
              </Link>.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {PACKAGE_META.map((pkg, i) => {
              const isHighlighted = pkg.badge !== null;
              return (
                <div
                  key={pkg.priceId}
                  className={`relative flex flex-col border ${isHighlighted ? 'border-[#D4A017] shadow-[0_8px_32px_rgba(212,160,23,0.18)]' : 'border-[#D4A017]/25'} bg-white p-7`}
                >
                  {pkg.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D4A017] px-4 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#0D1B2A]">
                      {pkg.badge}
                    </span>
                  )}

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4A017]">{pkg.name}</p>
                    <h3 className="mt-1 font-serif text-xl font-bold text-[#0D1B2A]">{pkg.subtitle}</h3>
                    <p className="mt-4 font-serif text-4xl font-bold text-[#0D1B2A]">
                      {formatPrice(prices[i])}
                    </p>
                    <p className="mt-1 text-xs text-[#9CA3AF]">Pago único · IVA no incluido</p>
                  </div>

                  <ul className="mt-6 flex-1 space-y-3">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-[#23364D]">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex items-center gap-2 border border-[#D4A017]/40 bg-[#D4A017]/8 px-3 py-2">
                    <Gift className="h-4 w-4 shrink-0 text-[#D4A017]" />
                    <p className="text-xs font-bold text-[#0D1B2A]">2 horas de formación onboarding GRATIS</p>
                  </div>

                  <div className="mt-4 space-y-2">
                    <HoldedBuyButton priceId={pkg.priceId} packageName={`${pkg.name} ${pkg.subtitle}`} />
                    <Link
                      href={`/solicitar-presupuesto?servicio=holded-${pkg.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="inline-flex w-full items-center justify-center border border-[#0D1B2A]/20 px-5 py-3 text-sm font-semibold text-[#23364D] transition hover:border-[#D4A017] hover:text-[#0D1B2A]"
                    >
                      Solicitar información
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Process steps ─────────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Proceso</p>
            <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl">
              Una migración pensada para no desordenar tu actividad.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#23364D] md:text-base">
              Primero ordenamos el punto de partida, después migramos y configuramos, y finalmente formamos al equipo.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {migrationSteps.map(({ Icon, title, text }) => (
              <article key={title} className="border border-[#D4A017]/25 bg-[#F8F6F1] p-6 shadow-[0_10px_28px_rgba(13,27,42,0.07)]">
                <Icon className="h-8 w-8 stroke-[#D4A017]" strokeWidth={1.7} />
                <h3 className="mt-6 font-serif text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#23364D]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 CTAs ────────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">¿Por dónde empezar?</p>
            <h2 className="mt-4 font-serif text-3xl font-bold leading-tight">Elige cómo quieres avanzar.</h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {/* CTA 1 — Presupuesto personalizado */}
            <div className="flex flex-col border border-[#D4A017]/25 bg-white p-7">
              <div className="flex h-12 w-12 items-center justify-center bg-[#D4A017]/10 text-[#D4A017]">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-serif text-xl font-bold">Presupuesto personalizado</h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-[#23364D]">
                ¿Tu caso no encaja exactamente en ningún paquete? Cuéntanos la situación y preparamos una propuesta a medida: volumen de datos, historial, integraciones especiales.
              </p>
              <Link
                href="/solicitar-presupuesto?servicio=migracion-holded-personalizada"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#D4A017] transition hover:text-[#F2C14E]"
              >
                Solicitar presupuesto <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* CTA 2 — Prueba gratuita 14 días */}
            <div className="flex flex-col border border-[#D4A017]/25 bg-white p-7">
              <div className="flex h-12 w-12 items-center justify-center bg-[#D4A017]/10 text-[#D4A017]">
                <Gift className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-serif text-xl font-bold">Prueba gratuita 14 días</h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-[#23364D]">
                ¿Quieres probar Holded antes de comprometerte? Solicítanos acceso a una prueba gratuita de 14 días con nuestra cuenta de partner. Sin tarjeta de crédito.
              </p>
              <Link
                href="/contacto?asunto=Prueba%20gratuita%20Holded%2014%20d%C3%ADas"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#D4A017] transition hover:text-[#F2C14E]"
              >
                Solicitar prueba gratuita <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* CTA 3 — Demo Calendly */}
            <div className="flex flex-col border border-[#D4A017] bg-[#0D1B2A] p-7 text-[#F8F6F1]">
              <div className="flex h-12 w-12 items-center justify-center bg-[#D4A017]/15 text-[#D4A017]">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-serif text-xl font-bold">Demostración gratuita</h3>
              <p className="mt-3 flex-1 text-sm leading-7 text-[#9CA3AF]">
                30 minutos por videollamada. Te mostramos Holded en vivo adaptado a tu sector y resolvemos todas tus dudas antes de tomar ninguna decisión.
              </p>
              <a
                href={CALENDLY_DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#D4A017] transition hover:text-[#F2C14E]"
              >
                Reservar demo <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Formación por horas ───────────────────────────────────────────── */}
      <section className="bg-white px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Formación</p>
            <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl">
              Formación en Holded por horas.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#23364D]">
              ¿Ya tienes Holded pero necesitas mejorar el uso que le das? Sesiones de 2 horas adaptadas a tu nivel y flujo de trabajo concreto.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-md">
            <div className="flex flex-col border border-[#D4A017] bg-[#F8F6F1] p-8 shadow-[0_8px_32px_rgba(212,160,23,0.14)]">
              <div className="flex h-12 w-12 items-center justify-center bg-[#D4A017]/10 text-[#D4A017]">
                <MonitorCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-serif text-2xl font-bold text-[#0D1B2A]">Sesión de formación</h3>
              <p className="mt-1 text-sm text-[#9CA3AF]">Sesión individual · 2 horas · Videollamada</p>
              <p className="mt-5 font-serif text-4xl font-bold text-[#0D1B2A]">{formatPrice(formacionPrice)}</p>
              <p className="mt-1 text-xs text-[#9CA3AF]">Pago único · IVA no incluido</p>

              <ul className="mt-6 space-y-3">
                {[
                  'Sesión de 2 horas por videollamada',
                  'Contenido adaptado a tu nivel y sector',
                  'Resolución de dudas en tiempo real',
                  'Grabación de la sesión incluida',
                  'Tras el pago recibirás el enlace para reservar tu horario'
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#23364D]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-7">
                <HoldedBuyButton priceId={FORMACION_PRICE_ID} packageName="Formación Holded por horas" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <FaqSection items={holdedFaq} title="Preguntas frecuentes sobre Holded" />

      {/* ── Holded blog articles ───────────────────────────────────────────── */}
      {holdedArticles.length > 0 && (
        <section className="brand-blue-bg px-6 py-16 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Recursos</p>
                <h2 className="mt-3 font-serif text-2xl font-bold text-[#F8F6F1] md:text-3xl">
                  Guías sobre Holded para tu empresa.
                </h2>
              </div>
              <Link
                href="/blog"
                className="text-sm font-semibold text-[#D4A017] hover:text-[#F2C14E]"
              >
                Ver todos los artículos →
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {holdedArticles.map((a) => (
                <article key={a.slug} className="flex flex-col border border-[#D4A017]/25 bg-[#23364D]/40 p-6">
                  <span className="inline-block self-start border border-rose-400/40 bg-rose-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-rose-400">
                    {a.category}
                  </span>
                  <h3 className="mt-4 font-serif text-lg font-bold leading-snug text-[#F8F6F1]">{a.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-[#9CA3AF]">{a.excerpt}</p>
                  <div className="mt-5 flex items-center justify-between text-xs text-[#6b7a8d]">
                    <span>{a.date}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {a.readTime}
                    </span>
                  </div>
                  <Link
                    href={`/blog/${a.slug}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#D4A017] transition hover:text-[#F2C14E]"
                  >
                    Leer artículo <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 text-center md:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Siguiente paso</p>
          <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-5xl">
            Revisamos tu caso y preparamos una hoja de ruta.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#23364D]">
            Si ya usas Holded o quieres migrar, empezamos con una revisión inicial para definir alcance, prioridades y formación. Sin compromiso.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={CALENDLY_DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              <Calendar className="h-4 w-4" />
              Reservar demo gratuita
            </a>
            <Link
              href="#precios"
              className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#0D1B2A]/25 px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:border-[#D4A017]"
            >
              Ver precios <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
