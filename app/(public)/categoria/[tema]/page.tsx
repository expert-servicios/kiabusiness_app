import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, BookOpen, Clock, GraduationCap, Newspaper } from 'lucide-react';
import { temas, getTema, getServicesForTema, getDocsForTema, getDocCategoryName, getArticlesForTema } from '@/lib/utils/taxonomy';

export function generateStaticParams() {
  return temas.map((t) => ({ tema: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ tema: string }> }): Promise<Metadata> {
  const { tema: temaSlug } = await params;
  const tema = getTema(temaSlug);
  if (!tema) return {};
  const canonicalUrl = `https://expertconsulting.es/categoria/${tema.slug}`;
  return {
    title: `${tema.name} | Servicios, guías y artículos | EXPERT`,
    description: tema.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${tema.name} | EXPERT`,
      description: tema.description,
      url: canonicalUrl,
      type: 'website'
    }
  };
}

export default async function CategoriaTemaPage({ params }: { params: Promise<{ tema: string }> }) {
  const { tema: temaSlug } = await params;
  const tema = getTema(temaSlug);
  if (!tema) return notFound();

  const serviceGroups = getServicesForTema(tema);
  const relatedDocs = getDocsForTema(tema);
  const docCategoryName = getDocCategoryName(tema);
  const relatedArticles = getArticlesForTema(tema).slice(0, 6);
  const totalServices = serviceGroups.reduce((sum, group) => sum + group.services.length, 0);
  const categoryUrl = `https://expertconsulting.es/categoria/${tema.slug}`;

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: tema.name,
    description: tema.description,
    url: categoryUrl,
    inLanguage: 'es-ES',
    provider: { '@type': 'Organization', name: 'EXPERT', url: 'https://expertconsulting.es' }
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://expertconsulting.es' },
      { '@type': 'ListItem', position: 2, name: 'Categorías', item: 'https://expertconsulting.es/categoria' },
      { '@type': 'ListItem', position: 3, name: tema.name, item: categoryUrl }
    ]
  };

  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* Hero */}
      <div className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Categoría</p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight md:text-5xl">{tema.name}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#9CA3AF] md:text-lg">{tema.description}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/solicitar-presupuesto"
              className="inline-flex min-h-12 items-center justify-center bg-[#D4A017] px-7 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
            >
              Solicitar presupuesto
            </Link>
            <a
              href="https://wa.me/34669045528"
              className="inline-flex min-h-12 items-center justify-center border border-[#D4A017] px-7 py-3 text-sm font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
            >
              Consulta por WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Servicios */}
      {tema.slug === 'formacion' ? (
        <section className="px-6 py-14 md:py-18">
          <div className="mx-auto max-w-5xl border border-[#D4A017]/25 bg-white p-8">
            <div className="flex items-start gap-3">
              <GraduationCap className="mt-1 h-5 w-5 shrink-0 text-[#D4A017]" />
              <div>
                <h2 className="font-serif text-xl font-bold text-[#0D1B2A]">EXPERT Business Academy</h2>
                <p className="mt-2 text-sm leading-6 text-[#23364D]">
                  Los programas de formación en gestión empresarial y fiscalidad viven en nuestra Academy, con precios, temario y matrícula.
                </p>
                <Link
                  href="/academy"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#D4A017] transition hover:text-[#F2C14E]"
                >
                  Ver programas de la Academy
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        totalServices > 0 && (
          <section className="px-6 py-14 md:py-18">
            <div className="mx-auto max-w-5xl">
              <h2 className="font-serif text-2xl font-bold text-[#0D1B2A] md:text-3xl">
                {totalServices} servicio{totalServices !== 1 ? 's' : ''} en esta categoría
              </h2>

              {serviceGroups.map(
                (group) =>
                  group.services.length > 0 && (
                    <div key={group.categorySlug} className="mt-8">
                      {serviceGroups.length > 1 && (
                        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">{group.categoryName}</h3>
                      )}
                      <div className="grid gap-4 md:grid-cols-2">
                        {group.services.map((servicio) => (
                          <Link
                            key={servicio.slug}
                            href={`/servicios/${group.categorySlug}/${servicio.slug}`}
                            className="group flex flex-col border border-[#D4A017]/20 bg-white p-5 shadow-[0_4px_16px_rgba(13,27,42,0.06)] transition hover:-translate-y-0.5 hover:border-[#D4A017] hover:shadow-[0_10px_28px_rgba(13,27,42,0.10)]"
                          >
                            <h4 className="font-serif text-lg font-bold text-[#0D1B2A] group-hover:text-[#D4A017]">
                              {servicio.name}
                            </h4>
                            <p className="mt-2 flex-1 text-sm leading-6 text-[#23364D]">{servicio.shortDescription}</p>
                            {servicio.price && (
                              <span className="mt-4 inline-block self-start border border-[#D4A017]/30 bg-[#D4A017]/8 px-2.5 py-1 text-xs font-bold text-[#0D1B2A]">
                                {servicio.price}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
              )}
            </div>
          </section>
        )
      )}

      {/* Guías de la base de conocimientos */}
      {relatedDocs.length > 0 && (
        <section className="bg-white px-6 py-14 md:py-18">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center gap-2.5">
              <BookOpen className="h-5 w-5 text-[#D4A017]" />
              <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">
                Guías{docCategoryName ? ` de ${docCategoryName}` : ''}
              </h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {relatedDocs.map((doc) => (
                <Link
                  key={doc.slug}
                  href={`/docs/${doc.slug}`}
                  className="flex flex-col border border-[#D4A017]/20 bg-[#F8F6F1] p-5 transition hover:border-[#D4A017]/55"
                >
                  <h3 className="font-serif text-base font-bold leading-snug text-[#0D1B2A]">{doc.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-[#23364D]">{doc.excerpt}</p>
                  <span className="mt-3 text-xs text-[#9CA3AF]">{doc.readTime}</span>
                </Link>
              ))}
            </div>
            <Link
              href="/docs"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-[#D4A017] transition hover:text-[#F2C14E]"
            >
              Ver toda la base de conocimientos
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* Artículos del blog */}
      {relatedArticles.length > 0 && (
        <section className="brand-blue-bg px-6 py-14 md:py-18">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center gap-2.5">
              <Newspaper className="h-5 w-5 text-[#D4A017]" />
              <h2 className="font-serif text-2xl font-bold text-[#F8F6F1]">Artículos relacionados</h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {relatedArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/blog/${article.slug}`}
                  className="flex flex-col border border-[#D4A017]/25 bg-[#23364D]/40 p-5 transition hover:border-[#D4A017]/55"
                >
                  <h3 className="font-serif text-base font-bold leading-snug text-[#F8F6F1]">{article.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-[#9CA3AF]">{article.excerpt}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-[#6b7a8d]">
                    <span>{article.date}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {article.readTime}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <Link
              href="/blog"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-[#D4A017] transition hover:text-[#F2C14E]"
            >
              Ver todos los artículos
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-[#0D1B2A] px-6 py-12 text-center text-[#F8F6F1]">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">¿No encuentras lo que buscas?</p>
          <h2 className="mt-3 font-serif text-2xl font-bold md:text-3xl">Cuéntanos tu caso y te orientamos</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#9CA3AF]">
            Analizamos tu situación y te decimos exactamente qué necesitas, sin compromiso.
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
        <div className="mx-auto flex max-w-5xl gap-2">
          <Link href="/" className="hover:text-[#D4A017]">Inicio</Link>
          <span>/</span>
          <Link href="/categoria" className="hover:text-[#D4A017]">Categorías</Link>
          <span>/</span>
          <span className="text-[#0D1B2A]">{tema.name}</span>
        </div>
      </nav>
    </main>
  );
}
