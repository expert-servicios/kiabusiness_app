import { notFound } from 'next/navigation';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { AlertCircle, BookOpen, Check, CheckCircle2, Clock, FileText, ListChecks, MessageCircle, Newspaper, ShieldCheck } from 'lucide-react';
import { AddToCartButton } from '@/components/services/AddToCartButton';
import { ViabilityButton } from '@/components/services/ViabilityButton';
import { categories, getCategory, getServicesByCategory, getService } from '@/lib/utils/catalog';
import { getViabilityCheck, hasSpecificViabilityCheck } from '@/lib/data/viability-checks';
import type { CategorySlug } from '@/lib/utils/catalog';
import { getDocsForService } from '@/lib/utils/docs';
import { getArticlesForService } from '@/lib/utils/blog';

export function generateStaticParams() {
  const params: { categoria: string; servicio: string }[] = [];
  for (const cat of categories) {
    const servicios = getServicesByCategory(cat.slug);
    for (const s of servicios) {
      params.push({ categoria: cat.slug, servicio: s.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ categoria: string; servicio: string }>;
}): Promise<Metadata> {
  const { categoria, servicio } = await params;
  const service = getService(categoria as CategorySlug, servicio);
  if (!service) return {};
  const title = service.metaTitle ?? `${service.name} | EXPERT`;
  const description = service.metaDescription ?? service.shortDescription;
  const canonicalUrl = `https://expertconsulting.es/servicios/${categoria}/${servicio}`;
  const shareImageUrl = `https://expertconsulting.es/api/services/og?slug=${encodeURIComponent(servicio)}&variant=square`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      images: [
        {
          url: shareImageUrl,
          width: 1200,
          height: 1200,
          alt: service.name
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [shareImageUrl]
    }
  };
}

export default async function ServicioDetallePage({
  params
}: {
  params: Promise<{ categoria: string; servicio: string }>;
}) {
  const { categoria, servicio } = await params;
  if (categoria === 'gestiones-especializadas') {
    permanentRedirect(`/servicios/certificado-digital/${servicio}`);
  }
  if (categoria === 'formacion') {
    permanentRedirect('/holded#formacion');
  }
  if (categoria === 'holded') {
    permanentRedirect('/holded');
  }

  const service = getService(categoria as CategorySlug, servicio);
  if (!service) return notFound();

  const category = getCategory(categoria);
  const showViability   = hasSpecificViabilityCheck(servicio);
  const viabilityCheck  = showViability ? getViabilityCheck(servicio) : null;
  const relatedServices = getServicesByCategory(categoria as CategorySlug).filter((s) => s.slug !== servicio).slice(0, 3);
  const relatedDocs = getDocsForService(service.slug);
  const relatedArticles = getArticlesForService(service.slug);
  const canonicalUrl = `https://expertconsulting.es/servicios/${categoria}/${servicio}`;
  const offerPrice = service.stripePriceId
    ? service.price?.match(/(\d+[.,]\d{2}|\d+)/)?.[1]?.replace(',', '.')
    : undefined;

  const cartItem = service.stripePriceId ? {
    priceId     : service.stripePriceId,
    name        : service.name,
    displayPrice: service.price ?? 'Consultar',
    slug        : service.slug,
    category    : service.categoria,
  } : null;
  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.metaDescription ?? service.shortDescription,
    serviceType: category?.name ?? 'Servicios profesionales',
    provider: {
      '@type': 'Organization',
      name: 'EXPERT'
    },
    areaServed: {
      '@type': 'Country',
      name: 'España'
    },
    url: canonicalUrl,
    offers:
      offerPrice && service.stripePriceId
        ? {
            '@type': 'Offer',
            price: offerPrice,
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock',
            url: canonicalUrl
          }
        : undefined
  };

  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />

      {/* ── Hero — sin imagen, fondo oscuro limpio ── */}
      <div className="bg-[#0D1B2A] px-6 pb-10 pt-12 text-[#F8F6F1] md:pb-12 md:pt-16">
        <div className="mx-auto max-w-5xl">
          <Link
            href={`/servicios/${categoria}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017] hover:text-[#F2C14E]"
          >
            ← {category?.name ?? 'Servicios'}
          </Link>
          <h1 className="mt-4 font-serif text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
            {service.name}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/60">{service.shortDescription}</p>

          {/* Duration chip only — price lives exclusively in sidebar */}
          {service.duration && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-2xl border border-white/12 px-4 py-2.5">
                <Clock className="h-4 w-4 text-[#D4A017]" />
                <span className="text-sm text-white/70">{service.duration}</span>
              </div>
            </div>
          )}

          {/* CTA buttons */}
          <div className="mt-8 flex flex-wrap gap-3">
            {cartItem ? (
              <AddToCartButton
                item={cartItem}
                label={service.checkoutLabel ?? 'Añadir a la cesta'}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#D4A017] px-8 py-3 text-sm font-bold text-[#0D1B2A] shadow-lg shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:cursor-not-allowed disabled:opacity-60"
              />
            ) : (
              <Link
                href="/solicitar-presupuesto"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#D4A017] px-8 py-3 text-sm font-bold text-[#0D1B2A] shadow-lg shadow-[#D4A017]/20 transition hover:bg-[#F2C14E]"
              >
                Solicitar presupuesto
              </Link>
            )}
            <a
              href="https://wa.me/34696550480"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-8 py-3 text-sm font-semibold text-white/80 transition hover:border-white/50 hover:text-white"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </div>

          {/* Viability check button — only for services with specific checks */}
          {showViability && viabilityCheck && (
            <div className="mt-4">
              <ViabilityButton
                check={viabilityCheck}
                serviceSlug={servicio}
              />
            </div>
          )}
        </div>

        {/* Gold accent line */}
        <div className="mx-auto mt-10 max-w-5xl">
          <div className="h-px bg-gradient-to-r from-[#D4A017]/60 via-[#D4A017]/20 to-transparent" />
        </div>
      </div>

      {/* Breadcrumb */}
      <nav className="border-b border-[#D4A017]/12 bg-white/60 px-6 py-3 text-xs text-[#6B7280]" aria-label="Breadcrumb">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-1.5">
          <Link href="/" className="hover:text-[#D4A017]">Inicio</Link>
          <span className="text-[#D4A017]/40">/</span>
          <Link href="/servicios" className="hover:text-[#D4A017]">Servicios</Link>
          <span className="text-[#D4A017]/40">/</span>
          <Link href={`/servicios/${categoria}`} className="hover:text-[#D4A017]">{category?.name}</Link>
          <span className="text-[#D4A017]/40">/</span>
          <span className="text-[#0D1B2A] font-medium">{service.name}</span>
        </div>
      </nav>

      {/* ── Content grid ── */}
      <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:items-start">

          {/* ── Main column ── */}
          <div className="space-y-10">

            {/* Description */}
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">¿En qué consiste?</h2>
              <p className="mt-4 text-[15px] leading-7 text-[#23364D]">{service.description}</p>
            </div>

            {/* Price breakdown */}
            {(service.servicePriceDetail || service.officialFee) && (
              <div className="grid gap-4 md:grid-cols-2">
                {service.servicePriceDetail && (
                  <div className="rounded-2xl border border-[#D4A017]/25 bg-white p-5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">Precio del servicio</p>
                    <p className="mt-2 text-sm leading-6 text-[#23364D]">{service.servicePriceDetail}</p>
                  </div>
                )}
                {service.officialFee && (
                  <div className="rounded-2xl border border-[#D4A017]/25 bg-white p-5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4A017]">Tasa oficial</p>
                    <p className="mt-2 text-sm leading-6 text-[#23364D]">{service.officialFee}</p>
                  </div>
                )}
              </div>
            )}

            {/* Key points */}
            {service.keyPoints && service.keyPoints.length > 0 && (
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">Puntos clave</h2>
                <div className="mt-5 grid gap-4">
                  {service.keyPoints.map((point) => (
                    <div key={point.title} className="rounded-2xl border border-[#D4A017]/20 bg-white p-5">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" />
                        <div>
                          <h3 className="font-semibold text-[#0D1B2A]">{point.title}</h3>
                          <p className="mt-1.5 text-sm leading-6 text-[#23364D]">{point.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audience */}
            {service.audience && service.audience.length > 0 && (
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">¿Para quién es?</h2>
                <ul className="mt-5 space-y-3">
                  {service.audience.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" strokeWidth={2} />
                      <span className="text-[15px] leading-6 text-[#23364D]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Includes */}
            {service.includes.length > 0 && (
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">¿Qué incluye?</h2>
                <ul className="mt-5 space-y-3">
                  {service.includes.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" strokeWidth={2.5} />
                      <span className="text-[15px] leading-6 text-[#23364D]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Documents (grouped format) */}
            {service.documents && service.documents.length > 0 && (
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">Documentación necesaria</h2>
                <div className="mt-5 grid gap-4">
                  {service.documents.map((group) => (
                    <div key={group.title} className="rounded-2xl border border-[#D4A017]/20 bg-white p-5">
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-[#D4A017]" />
                        <h3 className="font-semibold text-[#0D1B2A]">{group.title}</h3>
                      </div>
                      <ul className="mt-4 space-y-2.5">
                        {group.items.map((item) => (
                          <li key={item} className="flex items-start gap-2.5">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" strokeWidth={2.5} />
                            <span className="text-sm leading-6 text-[#23364D]">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Process */}
            {service.process && service.process.length > 0 && (
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">Cómo funciona el proceso</h2>
                <ol className="mt-6 space-y-4">
                  {service.process.map((step, index) => (
                    <li key={step.title} className="grid grid-cols-[40px_1fr] gap-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4A017] text-sm font-bold text-[#0D1B2A]">
                        {index + 1}
                      </span>
                      <div className="pt-1">
                        <h3 className="font-semibold text-[#0D1B2A]">{step.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-[#23364D]">{step.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Not included / Review before hiring */}
            {(service.notIncluded?.length || service.reviewBeforeHiring?.length) ? (
              <div className="grid gap-6 md:grid-cols-2">
                {service.notIncluded && service.notIncluded.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-amber-700">No incluido</p>
                    <ul className="space-y-2.5">
                      {service.notIncluded.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                          <span className="text-sm leading-5 text-[#23364D]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {service.reviewBeforeHiring && service.reviewBeforeHiring.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-amber-700">Conviene revisar antes</p>
                    <ul className="space-y-2.5">
                      {service.reviewBeforeHiring.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                          <span className="text-sm leading-5 text-[#23364D]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}

            {/* Related articles */}
            {relatedArticles.length > 0 && (
              <div className="rounded-2xl border border-[#D4A017]/20 bg-white p-6">
                <div className="mb-4 flex items-center gap-2.5">
                  <Newspaper className="h-4 w-4 text-[#D4A017]" />
                  <h2 className="font-serif text-xl font-bold text-[#0D1B2A]">Artículos relacionados</h2>
                </div>
                <div className="grid gap-3">
                  {relatedArticles.map((art) => (
                    <Link
                      key={art.slug}
                      href={`/blog/${art.slug}`}
                      className="rounded-xl border border-[#D4A017]/15 bg-[#F8F6F1] p-4 transition hover:border-[#D4A017]"
                    >
                      <p className="font-semibold text-[#0D1B2A]">{art.title}</p>
                      <p className="mt-1 text-sm text-[#23364D]">{art.excerpt}</p>
                      <p className="mt-2 text-xs text-[#9CA3AF]">{art.readTime} · {art.date}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Final CTA */}
            {service.finalCta && (
              <div className="rounded-2xl border border-[#D4A017]/30 bg-[#D4A017]/8 p-7">
                <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">{service.finalCta.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#23364D]">{service.finalCta.text}</p>
                {cartItem && (
                  <div className="mt-6">
                    <AddToCartButton
                      item={cartItem}
                      label="Añadir a la cesta"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#D4A017] px-8 py-3 text-sm font-bold text-[#0D1B2A] shadow-lg shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:opacity-60"
                    />
                  </div>
                )}
              </div>
            )}

            {/* FAQs */}
            {service.faqs.length > 0 && (
              <div>
                <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">Preguntas frecuentes</h2>
                <div className="mt-6 space-y-5">
                  {service.faqs.map(({ q, a }) => (
                    <div key={q} className="border-l-2 border-[#D4A017] pl-5">
                      <p className="font-semibold text-[#0D1B2A]">{q}</p>
                      <p className="mt-2 text-sm leading-6 text-[#23364D]">{a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-5 lg:sticky lg:top-6">

            {/* CTA card */}
            <div className="overflow-hidden rounded-2xl border border-[#D4A017]/30 bg-white">
              {service.price && (
                <div className="border-b border-[#D4A017]/20 bg-[#D4A017]/8 px-6 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#D4A017]">Precio</p>
                  <p className="mt-1 text-2xl font-bold text-[#0D1B2A]">{service.price}</p>
                  {service.checkoutLegal && (
                    <p className="mt-1 text-xs text-[#23364D]/60">{service.checkoutLegal}</p>
                  )}
                </div>
              )}
              <div className="space-y-3 px-6 py-5">
                {cartItem ? (
                  <AddToCartButton
                    item={cartItem}
                    label="Añadir a la cesta"
                    className="inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-[#D4A017] px-4 py-2.5 text-sm font-bold text-[#0D1B2A] shadow-md shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:opacity-60"
                  />
                ) : (
                  <Link
                    href="/solicitar-presupuesto"
                    className="block w-full rounded-xl bg-[#D4A017] px-4 py-2.5 text-center text-sm font-bold text-[#0D1B2A] shadow-md shadow-[#D4A017]/20 transition hover:bg-[#F2C14E]"
                  >
                    Solicitar presupuesto
                  </Link>
                )}
                <a
                  href="https://wa.me/34696550480"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#D4A017]/30 px-4 py-2.5 text-sm font-semibold text-[#23364D] transition hover:border-[#D4A017] hover:bg-[#D4A017]/5"
                >
                  <MessageCircle className="h-4 w-4 text-[#D4A017]" />
                  Preguntar por WhatsApp
                </a>
                {!service.price && service.checkoutLegal && (
                  <p className="pt-1 text-xs leading-5 text-[#23364D]/50">{service.checkoutLegal}</p>
                )}
              </div>
            </div>

            {/* Requirements */}
            {service.requirements && service.requirements.length > 0 && (
              <div className="rounded-2xl border border-[#D4A017]/20 bg-white p-5">
                <div className="mb-4 flex items-center gap-2.5">
                  <ListChecks className="h-4 w-4 text-[#D4A017]" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#23364D]">Requisitos principales</p>
                </div>
                <ul className="space-y-2.5">
                  {service.requirements.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" strokeWidth={2.5} />
                      <span className="text-sm leading-5 text-[#23364D]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Required docs (flat list) */}
            {service.requiredDocs && service.requiredDocs.length > 0 && (
              <div className="rounded-2xl border border-[#D4A017]/20 bg-white p-5">
                <div className="mb-4 flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-[#D4A017]" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#23364D]">Documentación necesaria</p>
                </div>
                <ul className="space-y-2.5">
                  {service.requiredDocs.map((doc) => (
                    <li key={doc} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" strokeWidth={2.5} />
                      <span className="text-sm leading-5 text-[#23364D]">{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Related guides */}
            {relatedDocs.length > 0 && (
              <div className="rounded-2xl border border-[#D4A017]/20 bg-white p-5">
                <div className="mb-4 flex items-center gap-2.5">
                  <BookOpen className="h-4 w-4 text-[#D4A017]" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#23364D]">Guías y documentación</p>
                </div>
                <div className="space-y-2">
                  {relatedDocs.map((doc) => (
                    <Link
                      key={doc.slug}
                      href={`/docs/${doc.slug}`}
                      className="block rounded-xl border border-[#D4A017]/12 bg-[#F8F6F1] p-3.5 transition hover:border-[#D4A017]/40"
                    >
                      <p className="text-sm font-semibold text-[#0D1B2A]">{doc.title}</p>
                      {doc.excerpt && <p className="mt-1 text-xs leading-4 text-[#23364D]">{doc.excerpt}</p>}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related services */}
            {relatedServices.length > 0 && (
              <div className="rounded-2xl border border-[#D4A017]/20 bg-white p-5">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-wider text-[#23364D]">Otros servicios del área</p>
                <ul className="space-y-1">
                  {relatedServices.map((s) => (
                    <li key={s.slug}>
                      <Link
                        href={`/servicios/${categoria}/${s.slug}`}
                        className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-[#0D1B2A] transition hover:bg-[#F8F6F1] hover:text-[#D4A017]"
                      >
                        <span className="text-[#D4A017]/50">→</span>
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/servicios/${categoria}`}
                  className="mt-3 block rounded-lg px-2 py-2 text-sm font-bold text-[#D4A017] transition hover:text-[#F2C14E]"
                >
                  Ver todos los servicios →
                </Link>
              </div>
            )}
          </aside>

        </div>
      </div>
    </main>
  );
}
