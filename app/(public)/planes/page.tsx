import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight, Check, Calendar, Gift,
  MonitorCheck, BookOpen, Database, Eye, Users, AlertCircle
} from 'lucide-react';
import { FaqSection } from '@/components/site/FaqSection';
import { RelatedArticles } from '@/components/site/RelatedArticles';

export const metadata: Metadata = {
  title: 'Planes de gestión contable con Holded | EXPERT',
  description:
    'Gestión contable integral en España con Holded. Elige el nivel de implicación: Avanzado, Colaborativo o Delegado. Desde 99 €/mes. Sin permanencia.'
};

const CALENDLY_DEMO = 'https://calendly.com/soy-kseniailicheva/30min';
const CALENDLY_FORMACION = 'https://calendly.com/soy-kseniailicheva/formacion-holded';

const plans = [
  {
    slug: 'avanzado',
    name: 'Plan Avanzado',
    tagline: 'Tienes el control, yo superviso',
    badge: null as string | null,
    price: 99,
    persona: 'Para autónomos que ya llevan su contabilidad y solo necesitan supervisión profesional y presentación de impuestos.',
    Icon: BookOpen,
    involvement: 'Alta implicación',
    features: [
      'Revisión mensual de tu contabilidad',
      'Impuestos trimestrales (IVA + IRPF)',
      'Resumen anual (Modelo 390 + 190)',
      'Declaración de la Renta anual',
      'Recordatorio de plazos fiscales',
      'Portal de cliente EXPERT',
      'Soporte por email y WhatsApp — 48 h',
      'Licencia Holded obligatoria (no incluida)'
    ],
    href: '/planes/basico'
  },
  {
    slug: 'colaborativo',
    name: 'Plan Colaborativo',
    tagline: 'Tú facturas, yo gestiono',
    badge: 'Más popular' as string | null,
    price: 199,
    persona: 'Para autónomos y pymes que introducen sus facturas en Holded y quieren que yo revise, cuadre y presente todos los impuestos.',
    Icon: Users,
    involvement: 'Implicación media',
    features: [
      'Tú introduces facturas de ventas y gastos en Holded',
      'Revisión y validación mensual completa',
      'Impuestos trimestrales (IVA + IRPF)',
      'Impuesto de Sociedades anual (si aplica)',
      'Modelos informativos (347, 349, 180, 190)',
      'Declaración de la Renta anual',
      'Informe mensual de resultados',
      'Soporte prioritario — respuesta en menos de 24 h',
      'Licencia Holded obligatoria (no incluida)'
    ],
    href: '/planes/estandar'
  },
  {
    slug: 'delegado',
    name: 'Plan Delegado',
    tagline: 'Tú observas, yo lo gestiono todo',
    badge: 'Cobertura total' as string | null,
    price: 349,
    persona: 'Para empresas que quieren delegar toda la contabilidad y solo necesitan acceso de lectura a su información en Holded.',
    Icon: Eye,
    involvement: 'Sin implicación contable',
    features: [
      'Contabilidad completa a cargo de EXPERT',
      'Introducción de todas las facturas y gastos',
      'Impuestos trimestrales y anuales completos',
      'Declaración de la Renta anual',
      'Gestión de nóminas hasta 3 empleados',
      'Una gestión de extranjería por trimestre',
      'Acceso de lectura a Holded (solo visualización)',
      'Informe mensual ejecutivo de resultados',
      'Reunión trimestral de seguimiento',
      'Soporte prioritario — respuesta en menos de 4 h',
      'Licencia Holded obligatoria (no incluida)'
    ],
    href: '/planes/premium'
  }
];

const faqItems = [
  {
    q: '¿Por qué Holded es obligatorio en todos los planes?',
    a: 'Holded es el software de gestión que usamos para llevar tu contabilidad de forma colaborativa y transparente. Te da visibilidad en tiempo real y nos permite trabajar juntos con eficiencia. Sin Holded no podemos garantizar el nivel de servicio y transparencia que ofrecemos.'
  },
  {
    q: '¿Cuánto cuesta la licencia de Holded?',
    a: 'El coste de Holded va aparte de nuestra tarifa y depende del plan que contrates con ellos directamente. Como Holded Solution Partner certificados, podemos conseguirte una prueba gratuita de 14 días y condiciones especiales. El coste habitual ronda los 50-100 €/mes según el volumen de tu empresa.'
  },
  {
    q: '¿Qué pasa si ya tengo Holded?',
    a: 'Perfecto, podemos empezar directamente. Solo necesitamos acceso a tu cuenta para revisar la configuración y, si es necesario, reorganizar la estructura contable antes de comenzar el servicio mensual.'
  },
  {
    q: '¿Necesito migrar mis datos a Holded?',
    a: 'Si vienes de otro software o de hojas de cálculo, ofrecemos servicios de migración a Holded por separado: Pack Starter, Migración Completa o Migración con Inventario. Todos incluyen 2 horas de formación gratuita.'
  },
  {
    q: '¿Puedo cambiar de plan cuando quiera?',
    a: 'Sí. Puedes subir o bajar de plan con 30 días de preaviso. El cambio se aplica al inicio del siguiente período de facturación, sin coste adicional.'
  },
  {
    q: '¿Hay permanencia mínima?',
    a: 'No. Puedes cancelar en cualquier momento con 30 días de preaviso por escrito. No hay penalizaciones ni cláusulas de permanencia.'
  },
  {
    q: '¿Los precios incluyen IVA?',
    a: 'No, todos los precios son sin IVA. Se añadirá el 21 % de IVA para clientes en España peninsular o el tipo correspondiente según tu situación fiscal.'
  },
  {
    q: '¿Cómo es la comunicación con mi asesora?',
    a: 'Principalmente por email y WhatsApp. Los tiempos de respuesta varían por plan: hasta 48 h en Plan Avanzado, menos de 24 h en Plan Colaborativo y menos de 4 h en Plan Delegado. El Plan Delegado incluye además reuniones trimestrales de seguimiento.'
  }
];

export default function PlanesPage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">

      {/* Hero */}
      <section className="brand-blue-bg px-6 py-20 text-[#F8F6F1] md:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Planes de suscripción mensual</p>
          <h1 className="mt-5 font-serif text-4xl font-bold leading-tight md:text-6xl">
            Gestión contable integral.<br />
            Elige tu nivel de implicación.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-[#9CA3AF] md:text-lg">
            Todos los planes funcionan con{' '}
            <strong className="text-[#D4A017]">Holded</strong> — el software que te da visibilidad
            total de tu negocio. Decide cuánto quieres implicarte: tú llevas la contabilidad,
            colaboramos, o lo delegas todo.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href={CALENDLY_DEMO}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-2 bg-[#D4A017] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              <Calendar className="h-4 w-4" />
              Demo gratuita — 30 min
            </a>
            <Link
              href="#planes"
              className="inline-flex min-h-12 items-center gap-2 border border-[#D4A017] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
            >
              Ver planes →
            </Link>
          </div>
        </div>
      </section>

      {/* Involvement spectrum */}
      <section className="bg-white px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017]">
            Tu nivel de implicación
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { label: 'Alta — tú llevas la contabilidad', plan: 'Plan Avanzado', cls: 'bg-[#D4A017]/10 border-[#D4A017]/30' },
              { label: 'Media — tú facturas, yo gestiono', plan: 'Plan Colaborativo', cls: 'bg-[#D4A017]/20 border-[#D4A017]/50' },
              { label: 'Ninguna — lo delego todo', plan: 'Plan Delegado', cls: 'bg-[#D4A017]/30 border-[#D4A017]' }
            ].map(({ label, plan, cls }) => (
              <div key={plan} className={`border ${cls} px-5 py-4 text-center`}>
                <p className="text-xs font-semibold text-[#23364D]">{label}</p>
                <p className="mt-1 font-serif text-base font-bold text-[#0D1B2A]">{plan}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 h-1 w-full bg-gradient-to-r from-[#D4A017]/20 via-[#D4A017]/50 to-[#D4A017]" />
          <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
            <span>Más implicación</span>
            <span>Delegación total</span>
          </div>
        </div>
      </section>

      {/* Plan cards */}
      <section id="planes" className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Precios</p>
            <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl">
              Sin permanencia. Sin sorpresas.
            </h2>
            <p className="mt-4 text-sm leading-7 text-[#23364D]">
              Precios mensuales fijos. IVA no incluido. Cancela con 30 días de preaviso.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const highlighted = plan.badge === 'Más popular';
              return (
                <div
                  key={plan.slug}
                  className={`relative flex flex-col border ${highlighted ? 'border-[#D4A017] shadow-[0_8px_32px_rgba(212,160,23,0.18)]' : 'border-[#D4A017]/25'} bg-white p-7`}
                >
                  {plan.badge && (
                    <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-0.5 text-[10px] font-bold uppercase tracking-widest ${highlighted ? 'bg-[#D4A017] text-[#0D1B2A]' : 'border border-[#D4A017]/40 bg-[#23364D] text-[#D4A017]'}`}>
                      {plan.badge}
                    </span>
                  )}

                  <div className="flex h-12 w-12 items-center justify-center bg-[#D4A017]/10">
                    <plan.Icon className="h-6 w-6 text-[#D4A017]" strokeWidth={1.7} />
                  </div>

                  <div className="mt-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">{plan.involvement}</span>
                    <h3 className="mt-1 font-serif text-2xl font-bold text-[#0D1B2A]">{plan.name}</h3>
                    <p className="mt-0.5 text-sm font-semibold text-[#D4A017]">{plan.tagline}</p>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-[#23364D]">{plan.persona}</p>

                  <div className="mt-5">
                    <span className="font-serif text-4xl font-bold text-[#0D1B2A]">{plan.price}</span>
                    <span className="ml-1 text-sm text-[#9CA3AF]">€/mes · sin IVA</span>
                  </div>

                  <ul className="mt-6 flex-1 space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className={`flex items-start gap-2.5 text-sm ${f.includes('obligatoria') ? 'font-semibold text-[#D4A017]' : 'text-[#23364D]'}`}>
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7 space-y-2">
                    <Link
                      href="/auth/login"
                      className="inline-flex w-full items-center justify-center bg-[#D4A017] px-5 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
                    >
                      Suscribirme — {plan.price} €/mes
                    </Link>
                    <a
                      href={CALENDLY_DEMO}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center border border-[#0D1B2A]/20 px-5 py-3 text-sm font-semibold text-[#23364D] transition hover:border-[#D4A017] hover:text-[#0D1B2A]"
                    >
                      Pedir demo gratuita
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Holded obligatorio */}
      <section className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 border border-[#D4A017]/50 bg-[#D4A017]/10 px-4 py-2">
              <AlertCircle className="h-4 w-4 text-[#D4A017]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">Importante</span>
            </div>
            <h2 className="mt-5 font-serif text-3xl font-bold leading-tight md:text-4xl">
              Holded es obligatorio en todos los planes.
            </h2>
            <p className="mt-5 text-base leading-8 text-[#9CA3AF]">
              Trabajamos exclusivamente con Holded porque es el único software que nos permite
              ofrecer transparencia total, colaboración en tiempo real y la visibilidad que mereces
              sobre tu negocio. La licencia de Holded va aparte de nuestra tarifa mensual.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col border border-[#D4A017]/25 bg-[#23364D]/50 p-6">
              <div className="flex h-10 w-10 items-center justify-center bg-[#D4A017]/15">
                <Gift className="h-5 w-5 text-[#D4A017]" />
              </div>
              <h3 className="mt-4 font-serif text-lg font-bold">Prueba gratuita 14 días</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-[#9CA3AF]">
                Prueba Holded sin tarjeta de crédito. Solicitamos el acceso de partner para ti.
              </p>
              <Link
                href="/contacto?asunto=Prueba%20gratuita%20Holded%2014%20d%C3%ADas"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#D4A017] hover:text-[#F2C14E]"
              >
                Solicitar prueba <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex flex-col border border-[#D4A017]/25 bg-[#23364D]/50 p-6">
              <div className="flex h-10 w-10 items-center justify-center bg-[#D4A017]/15">
                <Calendar className="h-5 w-5 text-[#D4A017]" />
              </div>
              <h3 className="mt-4 font-serif text-lg font-bold">Demo de 30 minutos</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-[#9CA3AF]">
                Te mostramos Holded en vivo adaptado a tu sector antes de tomar ninguna decisión.
              </p>
              <a
                href={CALENDLY_DEMO}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#D4A017] hover:text-[#F2C14E]"
              >
                Reservar demo <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="flex flex-col border border-[#D4A017]/25 bg-[#23364D]/50 p-6">
              <div className="flex h-10 w-10 items-center justify-center bg-[#D4A017]/15">
                <MonitorCheck className="h-5 w-5 text-[#D4A017]" />
              </div>
              <h3 className="mt-4 font-serif text-lg font-bold">Formación en Holded</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-[#9CA3AF]">
                Sesiones de 2 horas para que uses Holded con seguridad desde el primer día.
              </p>
              <a
                href={CALENDLY_FORMACION}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#D4A017] hover:text-[#F2C14E]"
              >
                Ver formación <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="flex flex-col border border-[#D4A017] bg-[#D4A017]/8 p-6">
              <div className="flex h-10 w-10 items-center justify-center bg-[#D4A017]/20">
                <Database className="h-5 w-5 text-[#D4A017]" />
              </div>
              <h3 className="mt-4 font-serif text-lg font-bold">Migración a Holded</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-[#9CA3AF]">
                Migramos tus datos desde hojas de cálculo o tu software actual. Paquetes desde Starter hasta con inventario.
              </p>
              <Link
                href="/holded#precios"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#D4A017] hover:text-[#F2C14E]"
              >
                Ver paquetes <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="bg-white px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Proceso</p>
            <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl">Empezar es sencillo.</h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-4">
            {[
              { n: '01', title: 'Elige tu plan', text: 'Selecciona el nivel de implicación que encaja contigo y regístrate o pide una demo.' },
              { n: '02', title: 'Obtienes Holded', text: 'Te ayudamos a conseguir la licencia de Holded y configuramos tu cuenta correctamente.' },
              { n: '03', title: 'Migramos tus datos', text: 'Si vienes de otro software, migramos tu historial contable a Holded de forma ordenada.' },
              { n: '04', title: 'Empezamos', text: 'Desde el primer mes gestionamos tu contabilidad según el plan elegido. Tú decides cuánto te implicas.' }
            ].map(({ n, title, text }) => (
              <div key={n} className="border border-[#D4A017]/25 bg-[#F8F6F1] p-6 shadow-[0_10px_28px_rgba(13,27,42,0.07)]">
                <span className="font-serif text-3xl font-bold text-[#D4A017]">{n}</span>
                <h3 className="mt-5 font-serif text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#23364D]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FaqSection items={faqItems} title="Preguntas frecuentes sobre los planes" />

      {/* Artículos relacionados */}
      <RelatedArticles category="Holded" title="Guías sobre Holded y contabilidad" limit={3} />

      {/* Final CTA */}
      <section className="px-6 py-16 text-center md:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Siguiente paso</p>
          <h2 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-5xl">
            ¿Dudas sobre qué plan es el tuyo?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#23364D]">
            Reserva una demo gratuita de 30 minutos. Te explico las diferencias, resuelvo tus dudas
            y te ayudo a elegir el plan que mejor encaja con tu situación.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={CALENDLY_DEMO}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-2 bg-[#D4A017] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              <Calendar className="h-4 w-4" />
              Reservar demo gratuita
            </a>
            <Link
              href="#planes"
              className="inline-flex min-h-12 items-center gap-2 border border-[#0D1B2A]/25 px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:border-[#D4A017]"
            >
              Ver planes <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
