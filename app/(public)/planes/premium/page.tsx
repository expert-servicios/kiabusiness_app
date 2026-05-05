import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Plan Premium — 349 €/mes | EXPERT',
  description:
    'Plan Premium de asesoría fiscal y administrativa sin límites. 349 €/mes. Contabilidad ilimitada, gestiones de extranjería, nóminas, formación incluida y atención personalizada.'
};

const includes = [
  'Todo lo del Plan Estándar',
  'Contabilidad mensual ilimitada',
  'Nóminas hasta 10 empleados',
  'Una gestión de extranjería por trimestre incluida',
  'Representación fiscal ante la AEAT',
  'Declaraciones de no residentes incluidas',
  'Revisión fiscal mensual con informe ejecutivo',
  'Bloque de formación bimestral incluido (2 h)',
  'Respuesta prioritaria en menos de 4 h hábiles',
  'Gestor de cuenta personal asignado',
  'Reunión de seguimiento trimestral'
];

export default function PlanPremiumPage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      {/* Hero */}
      <div className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Planes de suscripción</p>
          <div className="mt-2 inline-block bg-[#D4A017] px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#0D1B2A]">
            Cobertura total
          </div>
          <h1 className="mt-3 font-serif text-3xl font-bold md:text-5xl">Plan Premium</h1>
          <div className="mt-5 flex items-end justify-center gap-1">
            <span className="font-serif text-5xl font-bold text-[#D4A017]">349</span>
            <span className="mb-2 text-lg text-[#9CA3AF]">€/mes</span>
          </div>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#9CA3AF]">
            Para empresas y profesionales que necesitan cobertura fiscal, legal y administrativa completa, con un gestor
            personal asignado y sin límites de gestiones.
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
              Quiero una demo personalizada
            </Link>
          </div>
        </div>
      </div>

      {/* Details */}
      <section className="mx-auto max-w-4xl px-6 py-14 md:py-18">
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr]">
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

          <div className="space-y-6">
            <div className="brand-blue-bg p-6 text-[#F8F6F1]">
              <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">Gestor personal</p>
              <h3 className="mt-3 font-serif text-xl font-bold">Tu asesor, siempre disponible</h3>
              <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">
                Con el Plan Premium tienes un gestor de cuenta asignado que conoce tu negocio en profundidad y
                responde en menos de 4 horas hábiles.
              </p>
            </div>

            <div className="border border-[#D4A017]/25 bg-white p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-[#23364D]">Compara con otros planes</p>
              <div className="mt-4 space-y-3">
                {[
                  { name: 'Básico', price: '99', href: '/planes/basico' },
                  { name: 'Estándar', price: '199', href: '/planes/estandar' }
                ].map((plan) => (
                  <Link
                    key={plan.name}
                    href={plan.href}
                    className="flex items-center justify-between border border-[#D4A017]/25 p-3 text-sm hover:border-[#D4A017]"
                  >
                    <span className="font-semibold text-[#0D1B2A]">{plan.name}</span>
                    <span className="font-bold text-[#D4A017]">{plan.price} €/mes</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-[#D4A017]/25 pt-10">
          <h2 className="font-serif text-2xl font-bold">Para quién es el Plan Premium</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {[
              { title: 'Empresas con empleados', text: 'Si tienes nóminas que gestionar, operaciones complejas o necesitas representación fiscal continua.' },
              { title: 'Expatriados y no residentes', text: 'Con gestiones de extranjería, declaraciones de no residentes y representación ante la AEAT incluidas.' },
              { title: 'Negocios en crecimiento', text: 'Un asesor que te acompaña mensualmente, te informa de cambios normativos y te ayuda a tomar mejores decisiones.' }
            ].map(({ title, text }) => (
              <div key={title} className="border border-[#D4A017]/25 bg-white p-6 shadow-[0_8px_20px_rgba(13,27,42,0.07)]">
                <h3 className="font-serif text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#23364D]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="brand-blue-bg px-6 py-12 text-center text-[#F8F6F1]">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-serif text-2xl font-bold md:text-3xl">Cobertura total desde hoy</h2>
          <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
            Sin permanencia. Cancela cuando quieras con 30 días de preaviso.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/auth/login"
              className="inline-flex min-h-12 items-center justify-center bg-[#D4A017] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              Suscribirme — 349 €/mes
            </Link>
            <Link
              href="/solicitar-presupuesto"
              className="inline-flex min-h-12 items-center justify-center border border-[#D4A017] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
            >
              Solicitar demo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
