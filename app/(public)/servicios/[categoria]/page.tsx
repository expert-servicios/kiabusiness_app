import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { categories, getCategory, getServicesByCategory } from '@/lib/utils/catalog';
import type { CategorySlug } from '@/lib/utils/catalog';

export function generateStaticParams() {
  return categories.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ categoria: string }>;
}): Promise<Metadata> {
  const { categoria } = await params;
  const category = getCategory(categoria);
  if (!category) return {};
  return {
    title: `${category.name} | EXPERT`,
    description: category.description,
    openGraph: {
      title: `${category.name} | EXPERT`,
      description: category.description,
      url: `https://expertconsulting.es/servicios/${categoria}`
    }
  };
}

export default async function CategoriaPage({ params }: { params: Promise<{ categoria: string }> }) {
  const { categoria } = await params;
  const category = getCategory(categoria);
  if (!category) return notFound();

  const servicios = getServicesByCategory(categoria as CategorySlug);

  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      {/* Hero */}
      <div className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Servicios</p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight md:text-5xl">{category.name}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#9CA3AF] md:text-lg">{category.description}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/solicitar-presupuesto"
              className="inline-flex min-h-12 items-center justify-center bg-[#D4A017] px-7 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              Solicitar presupuesto
            </Link>
            <a
              href="https://wa.me/34696550480"
              className="inline-flex min-h-12 items-center justify-center border border-[#D4A017] px-7 py-3 text-sm font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
            >
              Consulta por WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Services list */}
      <section className="px-6 py-14 md:py-18">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-serif text-2xl font-bold text-[#0D1B2A] md:text-3xl">
            {servicios.length > 0
              ? `${servicios.length} servicio${servicios.length !== 1 ? 's' : ''} en esta área`
              : 'Servicios disponibles'}
          </h2>
          <p className="mt-2 text-sm text-[#23364D]">
            Selecciona el servicio que necesitas para ver todos los detalles, precio orientativo y qué incluye.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {servicios.map((servicio) => (
              <Link
                key={servicio.slug}
                href={`/servicios/${categoria}/${servicio.slug}`}
                className="group border border-[#D4A017]/25 bg-white p-6 shadow-[0_8px_24px_rgba(13,27,42,0.07)] transition hover:-translate-y-0.5 hover:border-[#D4A017] hover:shadow-[0_16px_40px_rgba(13,27,42,0.11)]"
              >
                <h3 className="font-serif text-xl font-bold text-[#0D1B2A]">{servicio.name}</h3>
                <p className="mt-2 text-sm leading-6 text-[#23364D]">{servicio.shortDescription}</p>
                {servicio.price && (
                  <p className="mt-3 text-sm font-bold text-[#D4A017]">{servicio.price}</p>
                )}
                <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#D4A017]">
                  Ver detalles
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </p>
              </Link>
            ))}
          </div>

          {servicios.length === 0 && (
            <div className="mt-8 border border-[#D4A017]/25 bg-white p-8 text-center">
              <p className="text-[#23364D]">
                Los servicios de esta categoría se gestionan de forma personalizada.{' '}
                <Link href="/solicitar-presupuesto" className="font-semibold text-[#D4A017] hover:text-[#F2C14E]">
                  Solicita un presupuesto
                </Link>{' '}
                y te orientamos.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="brand-blue-bg px-6 py-12 text-center text-[#F8F6F1]">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">¿No encuentras lo que buscas?</p>
          <h2 className="mt-3 font-serif text-2xl font-bold md:text-3xl">Cuéntanos tu caso y te orientamos</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#9CA3AF]">
            Si no ves exactamente lo que necesitas, escríbenos. Analizamos tu situación y preparamos una propuesta a medida.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-4">
            <Link
              href="/solicitar-presupuesto"
              className="inline-flex min-h-11 items-center justify-center bg-[#D4A017] px-7 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              Solicitar presupuesto
            </Link>
            <Link
              href="/contacto"
              className="inline-flex min-h-11 items-center justify-center border border-[#D4A017]/50 px-7 py-3 text-sm font-bold uppercase tracking-wide text-[#D4A017] transition hover:border-[#D4A017] hover:bg-[#D4A017] hover:text-[#0D1B2A]"
            >
              Contactar
            </Link>
          </div>
        </div>
      </section>

      {/* Breadcrumb */}
      <nav className="px-6 py-4 text-xs text-[#9CA3AF]">
        <div className="mx-auto max-w-5xl flex gap-2">
          <Link href="/" className="hover:text-[#D4A017]">Inicio</Link>
          <span>/</span>
          <Link href="/servicios" className="hover:text-[#D4A017]">Servicios</Link>
          <span>/</span>
          <span className="text-[#0D1B2A]">{category.name}</span>
        </div>
      </nav>
    </main>
  );
}
