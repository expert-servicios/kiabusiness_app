import { notFound, permanentRedirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Clock, MessageCircle } from 'lucide-react';
import { AddToCartButton } from '@/components/services/AddToCartButton';
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
  const title = `${category.name} | EXPERT`;
  const canonicalUrl = `https://expertconsulting.es/servicios/${categoria}`;
  const ogImage = `https://expertconsulting.es${category.imageUrl}`;
  return {
    title,
    description: category.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description: category.description,
      url: canonicalUrl,
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: category.name }]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: category.description,
      images: [ogImage]
    }
  };
}

export default async function CategoriaPage({ params }: { params: Promise<{ categoria: string }> }) {
  const { categoria } = await params;
  if (categoria === 'gestiones-especializadas') {
    permanentRedirect('/servicios/certificado-digital');
  }
  if (categoria === 'formacion') {
    permanentRedirect('/holded#formacion');
  }
  if (categoria === 'holded') {
    permanentRedirect('/holded');
  }

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
            {servicios.map((servicio) => {
              const cartItem = servicio.stripePriceId ? {
                priceId     : servicio.stripePriceId,
                name        : servicio.name,
                displayPrice: servicio.price ?? 'Consultar',
                slug        : servicio.slug,
                category    : servicio.categoria,
              } : null;

              return (
                <article
                  key={servicio.slug}
                  className="flex min-h-full flex-col rounded-2xl border border-[#D4A017]/25 bg-white p-6 shadow-[0_8px_24px_rgba(13,27,42,0.07)] transition hover:-translate-y-0.5 hover:border-[#D4A017] hover:shadow-[0_16px_40px_rgba(13,27,42,0.11)]"
                >
                  <div className="flex-1">
                    <Link href={`/servicios/${categoria}/${servicio.slug}`} className="group">
                      <h3 className="font-serif text-xl font-bold text-[#0D1B2A] group-hover:text-[#D4A017]">
                        {servicio.name}
                      </h3>
                    </Link>
                    <p className="mt-2 text-sm leading-6 text-[#23364D]">{servicio.shortDescription}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {servicio.price && (
                        <span className="rounded-full border border-[#D4A017]/30 bg-[#D4A017]/8 px-3 py-1 text-xs font-bold text-[#0D1B2A]">
                          {servicio.price}
                        </span>
                      )}
                      {servicio.duration && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4A017]/20 px-3 py-1 text-xs font-semibold text-[#23364D]">
                          <Clock className="h-3.5 w-3.5 text-[#D4A017]" />
                          {servicio.duration}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-2">
                    {cartItem ? (
                      <AddToCartButton
                        item={cartItem}
                        label={servicio.checkoutLabel ?? 'Añadir a la cesta'}
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#D4A017] px-4 py-2.5 text-sm font-bold text-[#0D1B2A] shadow-md shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    ) : (
                      <Link
                        href="/solicitar-presupuesto"
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#D4A017] px-4 py-2.5 text-sm font-bold text-[#0D1B2A] shadow-md shadow-[#D4A017]/20 transition hover:bg-[#F2C14E]"
                      >
                        Solicitar presupuesto
                      </Link>
                    )}
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Link
                        href={`/servicios/${categoria}/${servicio.slug}`}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D4A017]/30 px-4 py-2 text-sm font-semibold text-[#23364D] transition hover:border-[#D4A017] hover:text-[#0D1B2A]"
                      >
                        Ver detalles
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <a
                        href="https://wa.me/34696550480"
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D4A017]/30 px-4 py-2 text-sm font-semibold text-[#23364D] transition hover:border-[#D4A017] hover:text-[#0D1B2A]"
                      >
                        <MessageCircle className="h-4 w-4 text-[#D4A017]" />
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
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
