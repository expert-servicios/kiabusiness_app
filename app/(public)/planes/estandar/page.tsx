import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { Breadcrumb } from '@/components/site/Breadcrumb';

export const metadata: Metadata = {
  title: 'Plan Colaborativo — 199 €/mes | EXPERT',
  description:
    'Plan Colaborativo de asesoría fiscal y administrativa para autónomos activos y pymes. 199 €/mes. Contabilidad completa, impuestos, nóminas y soporte prioritario.',
  alternates: { canonical: 'https://expertconsulting.es/planes/estandar' },
  openGraph: {
    type: 'website',
    url: 'https://expertconsulting.es/planes/estandar',
    title: 'Plan Colaborativo — 199 €/mes | EXPERT',
    description: 'Plan Colaborativo de asesoría fiscal. 199 €/mes sin permanencia.',
    images: [{ url: 'https://expertconsulting.es/catalog/consultoria.png', width: 1200, height: 630, alt: 'Plan Colaborativo — EXPERT' }]
  },
  twitter: { card: 'summary_large_image', images: ['https://expertconsulting.es/catalog/consultoria.png'] }
};

const includes = [
  'Todo lo del Plan Avanzado',
  'Contabilidad mensual completa (hasta 150 asientos/mes)',
  'Presentación de nóminas (hasta 3 empleados)',
  'Impuesto de Sociedades anual (si aplica)',
  'Modelos informativos (347, 349, 180, 190)',
  'Soporte prioritario por email y WhatsApp',
  'Revisión fiscal trimestral con informe',
  'Acceso a Holded (licencia incluida)',
  'Una gestión puntual por trimestre incluida'
];

const notIncludes = [
  'Gestiones de extranjería',
  'Trámites notariales o de tráfico',
  'Migración a Holded (servicio aparte)',
  'Formación incluida (descuento del 20%)',
  'Más de 3 empleados en nómina'
];

export default function PlanEstandarPage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <div className="mx-auto max-w-4xl px-6 pt-5 pb-2">
        <Breadcrumb items={[{ label: 'Planes', href: '/planes' }, { label: 'Plan Colaborativo' }]} />
      </div>
      {/* Hero */}
      <div className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Planes de suscripción</p>
          <div className="mt-2 inline-block border border-[#D4A017]/50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#D4A017]">
            Más popular
          </div>
          <h1 className="mt-3 font-serif text-3xl font-bold md:text-5xl">Plan Colaborativo</h1>
          <div className="mt-5 flex items-end justify-center gap-1">
            <span className="font-serif text-5xl font-bold text-[#D4A017]">199</span>
            <span className="mb-2 text-lg text-[#9CA3AF]">€/mes</span>
          </div>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#9CA3AF]">
            Para autónomos activos y pymes que necesitan contabilidad completa, impuestos gestionados y soporte
            continuo con criterio profesional.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/login"
              className="inline-flex min-h-12 items-center justify-center bg-[#D4A017] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              Suscribirme ahora
            </Link>
            <Link
              href="/solicitar-presupuesto"
              className="inline-flex min-h-12 items-center justify-center border border-[#D4A017] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
            >
              Tengo dudas, consultar
            </Link>
          </div>
        </div>
      </div>

      {/* Details */}
      <section className="mx-auto max-w-4xl px-6 py-14 md:py-18">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-serif text-2xl font-bold">¿Qué incluye?</h2>
            <ul className="mt-5 space-y-3">
              {includes.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" strokeWidth={2.5} />
                  <span className={`text-sm leading-6 ${item.startsWith('Todo') ? 'font-semibold text-[#0D1B2A]' : 'text-[#23364D]'}`}>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold">Límites del plan</h2>
            <ul className="mt-5 space-y-3">
              {notIncludes.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <X className="mt-0.5 h-5 w-5 shrink-0 text-[#9CA3AF]" strokeWidth={2} />
                  <span className="text-sm leading-6 text-[#9CA3AF]">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-[#23364D]">
              ¿Necesitas cobertura total?{' '}
              <Link href="/planes/premium" className="font-semibold text-[#D4A017] hover:text-[#F2C14E]">
                Consulta el Plan Premium →
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-14 border-t border-[#D4A017]/25 pt-10">
          <h2 className="font-serif text-2xl font-bold">Lo que marca la diferencia</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {[
              { title: 'Contabilidad real', text: 'No solo impuestos. Llevamos tu contabilidad mes a mes con informes de resultados y balance.' },
              { title: 'Holded incluido', text: 'Licencia de Holded incluida en el plan para que tengas visibilidad de tu negocio en tiempo real.' },
              { title: 'Soporte prioritario', text: 'Tus consultas tienen prioridad. Respuesta garantizada en menos de 24 h hábiles.' }
            ].map(({ title, text }) => (
              <div key={title} className="border border-[#D4A017]/25 bg-white p-6 shadow-[0_8px_20px_rgba(13,27,42,0.07)]">
                <h3 className="font-serif text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#23364D]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plan comparison */}
      <PlanComparison current="estandar" />

      {/* CTA */}
      <section className="brand-blue-bg px-6 py-12 text-center text-[#F8F6F1]">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-serif text-2xl font-bold md:text-3xl">Empieza sin riesgos</h2>
          <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
            Sin permanencia. Cancela cuando quieras con 30 días de preaviso.
          </p>
          <Link
            href="/auth/login"
            className="mt-6 inline-flex min-h-12 items-center justify-center bg-[#D4A017] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
          >
            Suscribirme — 199 €/mes
          </Link>
        </div>
      </section>
    </main>
  );
}

function PlanComparison({ current }: { current: 'basico' | 'estandar' | 'premium' }) {
  const plans = [
    { slug: 'basico', name: 'Básico', price: '99', href: '/planes/basico' },
    { slug: 'estandar', name: 'Estándar', price: '199', href: '/planes/estandar' },
    { slug: 'premium', name: 'Premium', price: '349', href: '/planes/premium' }
  ];

  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center font-serif text-2xl font-bold">Compara los planes</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <Link
              key={plan.slug}
              href={plan.href}
              className={`border p-6 text-center transition hover:-translate-y-0.5 ${
                plan.slug === current
                  ? 'border-[#D4A017] bg-white shadow-[0_12px_32px_rgba(13,27,42,0.12)]'
                  : 'border-[#D4A017]/25 bg-white hover:border-[#D4A017]'
              }`}
            >
              {plan.slug === current && (
                <span className="mb-3 block text-xs font-bold uppercase tracking-widest text-[#D4A017]">Plan actual</span>
              )}
              <p className="font-serif text-xl font-bold">{plan.name}</p>
              <p className="mt-2 font-serif text-3xl font-bold text-[#D4A017]">
                {plan.price} <span className="text-sm font-normal text-[#9CA3AF]">€/mes</span>
              </p>
              {plan.slug !== current && (
                <p className="mt-3 text-sm font-semibold text-[#D4A017]">Ver plan →</p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
