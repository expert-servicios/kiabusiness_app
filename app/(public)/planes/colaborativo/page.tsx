import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { Breadcrumb } from '@/components/site/Breadcrumb';

export const metadata: Metadata = {
  title: 'Plan Colaborativo — 199 €/mes | EXPERT',
  description:
    'Plan Colaborativo de gestión contable para autónomos activos y pymes. 199 €/mes sin permanencia. Tú introduces facturas en Holded, nosotros revisamos, cuadramos y presentamos todos los impuestos.',
  alternates: { canonical: 'https://expertconsulting.es/planes/colaborativo' },
  openGraph: {
    type: 'website',
    url: 'https://expertconsulting.es/planes/colaborativo',
    title: 'Plan Colaborativo — 199 €/mes | EXPERT',
    description: 'Plan Colaborativo de gestión contable. 199 €/mes sin permanencia.',
    images: [{ url: 'https://expertconsulting.es/catalog/consultoria.png', width: 1200, height: 630, alt: 'Plan Colaborativo — EXPERT' }]
  },
  twitter: { card: 'summary_large_image', images: ['https://expertconsulting.es/catalog/consultoria.png'] }
};

const includes = [
  'Todo lo del Plan Avanzado',
  'Tú introduces facturas — nosotros revisamos y validamos',
  'Contabilidad mensual completa (ilimitada de asientos)',
  'Impuesto de Sociedades anual (si aplica)',
  'Modelos informativos (347, 349, 180, 190)',
  'Informe mensual de resultados',
  'Soporte prioritario — respuesta en menos de 24 h'
];

const notIncludes = [
  'Gestión laboral y nóminas (servicio aparte)',
  'Gestiones de extranjería (servicio aparte)',
  'Trámites notariales o de tráfico',
  'Declaraciones de no residentes',
  'Migración a Holded (servicio aparte)',
  'Licencia de Holded (obligatoria, va aparte)'
];

export default function PlanColaborativoPage() {
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
            <span className="mb-2 text-lg text-[#9CA3AF]">€/mes · sin IVA</span>
          </div>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#9CA3AF]">
            Para autónomos activos y pymes que introducen sus facturas en Holded y quieren que su asesora
            revise, cuadre y presente todos los impuestos. Tú facturas, nosotros gestionamos.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/login"
              className="inline-flex min-h-12 items-center justify-center bg-[#D4A017] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              Suscribirme ahora
            </Link>
            <Link
              href="/contacto"
              className="inline-flex min-h-12 items-center justify-center border border-[#D4A017] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
            >
              Tengo dudas, consultar
            </Link>
          </div>
        </div>
      </div>

      {/* Details */}
      <section className="mx-auto max-w-4xl px-6 py-14">
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
            <div className="mt-5 border border-[#D4A017]/40 bg-[#D4A017]/5 px-4 py-3">
              <p className="text-xs font-bold text-[#0D1B2A]">
                Licencia Holded obligatoria — no incluida en el precio del plan.
              </p>
              <Link href="/holded" className="mt-1 block text-xs font-semibold text-[#D4A017] hover:underline">
                Obtener licencia de Holded →
              </Link>
            </div>
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
              ¿Necesitas gestión laboral u otras coberturas?{' '}
              <Link href="/planes/presupuesto-personalizado" className="font-semibold text-[#D4A017] hover:text-[#F2C14E]">
                Solicita presupuesto personalizado →
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-14 border-t border-[#D4A017]/25 pt-10">
          <h2 className="font-serif text-2xl font-bold">Lo que marca la diferencia</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {[
              { title: 'Contabilidad real', text: 'No solo impuestos. Revisamos y validamos tu contabilidad mes a mes con informe de resultados.' },
              { title: 'Holded como base', text: 'Tú introduces facturas en Holded, nosotros revisamos que cuadren y lo dejamos listo para Hacienda.' },
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
      <PlanComparison current="colaborativo" />

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

function PlanComparison({ current }: { current: 'avanzado' | 'colaborativo' }) {
  const plans = [
    { slug: 'avanzado', name: 'Plan Avanzado', price: '99', href: '/planes/avanzado' },
    { slug: 'colaborativo', name: 'Plan Colaborativo', price: '199', href: '/planes/colaborativo' },
    { slug: 'personalizado', name: 'Plan Personalizado', price: null, href: '/planes/presupuesto-personalizado' }
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
              {plan.price ? (
                <p className="mt-2 font-serif text-3xl font-bold text-[#D4A017]">
                  {plan.price} <span className="text-sm font-normal text-[#9CA3AF]">€/mes</span>
                </p>
              ) : (
                <p className="mt-2 font-serif text-xl font-bold text-[#D4A017]">A medida</p>
              )}
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
