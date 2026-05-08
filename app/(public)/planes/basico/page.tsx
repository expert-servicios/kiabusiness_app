import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { Breadcrumb } from '@/components/site/Breadcrumb';

export const metadata: Metadata = {
  title: 'Plan Avanzado — 99 €/mes | EXPERT',
  description:
    'Plan Avanzado de asesoría fiscal y administrativa para autónomos y PYMEs. 99 €/mes. Impuestos trimestrales, contabilidad básica y soporte por email.'
};

const includes = [
  'Impuestos trimestrales (IVA + IRPF)',
  'Resumen anual de impuestos (Modelo 390 + 190)',
  'Declaración de la Renta anual',
  'Contabilidad básica (hasta 50 asientos/mes)',
  'Soporte por email y WhatsApp',
  'Portal de cliente para subir documentos',
  'Recordatorio de plazos fiscales'
];

const notIncludes = [
  'Gestiones de extranjería',
  'Trámites notariales',
  'Declaraciones de no residentes',
  'Formación incluida',
  'Migración a Holded'
];

export default function PlanBasicoPage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <div className="mx-auto max-w-4xl px-6 pt-5 pb-2">
        <Breadcrumb items={[{ label: 'Planes', href: '/planes' }, { label: 'Plan Avanzado' }]} />
      </div>
      {/* Hero */}
      <div className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Planes de suscripción</p>
          <h1 className="mt-3 font-serif text-3xl font-bold md:text-5xl">Plan Avanzado</h1>
          <div className="mt-5 flex items-end justify-center gap-1">
            <span className="font-serif text-5xl font-bold text-[#D4A017]">99</span>
            <span className="mb-2 text-lg text-[#9CA3AF]">€/mes</span>
          </div>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#9CA3AF]">
            Para autónomos y pequeños negocios que necesitan tener sus obligaciones fiscales bajo control sin complicaciones.
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
                  <span className="text-sm leading-6 text-[#23364D]">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-bold">¿Qué no incluye?</h2>
            <ul className="mt-5 space-y-3">
              {notIncludes.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <X className="mt-0.5 h-5 w-5 shrink-0 text-[#9CA3AF]" strokeWidth={2} />
                  <span className="text-sm leading-6 text-[#9CA3AF]">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-[#23364D]">
              ¿Necesitas más cobertura?{' '}
              <Link href="/planes/estandar" className="font-semibold text-[#D4A017] hover:text-[#F2C14E]">
                Consulta el Plan Estándar →
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-14 border-t border-[#D4A017]/25 pt-10">
          <h2 className="font-serif text-2xl font-bold">Cómo funciona</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {[
              { n: '01', title: 'Te registras', text: 'Creas tu cuenta en el portal EXPERT y seleccionas el plan.' },
              { n: '02', title: 'Conectas tus datos', text: 'Subes tu documentación y nos autorizas para gestionar tus impuestos.' },
              { n: '03', title: 'Nosotros gestionamos', text: 'Tu asesor se encarga de todos los vencimientos fiscales sin que tengas que recordar nada.' }
            ].map(({ n, title, text }) => (
              <div key={n} className="border border-[#D4A017]/25 bg-white p-6 shadow-[0_8px_20px_rgba(13,27,42,0.07)]">
                <span className="font-serif text-3xl font-bold text-[#D4A017]">{n}</span>
                <h3 className="mt-4 font-serif text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#23364D]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plan comparison */}
      <PlanComparison current="basico" />

      {/* CTA */}
      <section className="brand-blue-bg px-6 py-12 text-center text-[#F8F6F1]">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-serif text-2xl font-bold md:text-3xl">¿Listo para empezar?</h2>
          <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
            Sin permanencia. Cancela cuando quieras con 30 días de preaviso.
          </p>
          <Link
            href="/auth/login"
            className="mt-6 inline-flex min-h-12 items-center justify-center bg-[#D4A017] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
          >
            Suscribirme — 99 €/mes
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
