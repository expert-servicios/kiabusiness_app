import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Anchor, BookOpen, Briefcase, Calculator, Globe2, Home, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { categories } from '@/lib/utils/catalog';

export const metadata: Metadata = {
  title: 'Servicios | EXPERT — Asesoría Fiscal, Legal y Administrativa',
  description:
    'Todos los servicios de EXPERT: declaraciones fiscales, extranjería, empresas, tráfico, notaría, gestiones especializadas y formación.'
};

const categoryIcons: Record<string, LucideIcon> = {
  'declaraciones-impuestos': Calculator,
  'extranjeria-nacionalidad': Globe2,
  'empresas-autonomos': Briefcase,
  'trafico-capitania-maritima': Anchor,
  'notaria-propiedades': Home,
  'gestiones-especializadas': Settings,
  formacion: BookOpen
};

export default function ServiciosPage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      {/* Hero */}
      <div className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Servicios</p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight md:text-5xl">
            Todo lo que necesitas, en un solo lugar.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#9CA3AF] md:text-lg">
            Fiscalidad, legal, extranjería, tráfico, notaría y formación. Asesoría digital con criterio profesional y
            seguimiento claro de cada trámite.
          </p>
        </div>
      </div>

      {/* Categories grid */}
      <section className="px-6 py-14 md:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-serif text-2xl font-bold md:text-3xl">Áreas de servicio</h2>
          <p className="mt-2 text-sm text-[#23364D]">
            Selecciona el área que corresponde a tu necesidad para ver todos los servicios disponibles.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const Icon = categoryIcons[cat.slug] ?? Briefcase;
              return (
                <Link
                  key={cat.slug}
                  href={`/servicios/${cat.slug}`}
                  className="group border border-[#D4A017]/25 bg-white p-7 shadow-[0_8px_24px_rgba(13,27,42,0.07)] transition hover:-translate-y-0.5 hover:border-[#D4A017] hover:shadow-[0_18px_40px_rgba(13,27,42,0.12)]"
                >
                  <span className="flex h-12 w-12 items-center justify-center border border-[#D4A017]/25 bg-[#0D1B2A] text-[#D4A017]">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 font-serif text-xl font-bold text-[#0D1B2A]">{cat.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#23364D]">{cat.description}</p>
                  <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#D4A017]">
                    Ver servicios
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Plans CTA */}
      <section className="brand-blue-bg px-6 py-14 text-[#F8F6F1]">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Planes de suscripción</p>
              <h2 className="mt-3 font-serif text-2xl font-bold md:text-3xl">
                Gestión fiscal y administrativa sin interrupciones.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[#9CA3AF]">
                Si necesitas cobertura mensual continua —contabilidad, impuestos, asesoramiento y seguimiento de
                trámites— nuestros planes de suscripción están diseñados para eso.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  href="/planes/basico"
                  className="inline-flex min-h-11 items-center justify-center border border-[#D4A017]/40 px-5 py-2.5 text-sm font-semibold text-[#D4A017] transition hover:border-[#D4A017] hover:bg-[#D4A017] hover:text-[#0D1B2A]"
                >
                  Plan Básico — 99 €/mes
                </Link>
                <Link
                  href="/planes/estandar"
                  className="inline-flex min-h-11 items-center justify-center border border-[#D4A017]/40 px-5 py-2.5 text-sm font-semibold text-[#D4A017] transition hover:border-[#D4A017] hover:bg-[#D4A017] hover:text-[#0D1B2A]"
                >
                  Plan Estándar — 199 €/mes
                </Link>
                <Link
                  href="/planes/premium"
                  className="inline-flex min-h-11 items-center justify-center bg-[#D4A017] px-5 py-2.5 text-sm font-semibold text-[#0D1B2A] transition hover:bg-[#F2C14E]"
                >
                  Plan Premium — 349 €/mes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quote CTA */}
      <section className="px-6 py-14 text-center">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">¿No sabes qué necesitas?</p>
          <h2 className="mt-3 font-serif text-2xl font-bold md:text-3xl">Cuéntanos tu caso y te orientamos</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#23364D]">
            Analizamos tu situación sin compromiso y te preparamos una propuesta clara con el servicio o plan más
            adecuado.
          </p>
          <Link
            href="/solicitar-presupuesto"
            className="mt-7 inline-flex min-h-12 items-center justify-center bg-[#0D1B2A] px-8 py-3 text-sm font-bold uppercase tracking-wide text-[#F8F6F1] transition hover:bg-[#23364D]"
          >
            Solicitar presupuesto gratuito
          </Link>
        </div>
      </section>
    </main>
  );
}
