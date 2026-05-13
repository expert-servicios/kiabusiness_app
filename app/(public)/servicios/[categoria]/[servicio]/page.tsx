import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { AlertCircle, BookOpen, Check, Clock, FileText, ListChecks, MessageCircle, ShieldCheck } from 'lucide-react';
import { ServiceBuyButton } from '@/components/services/ServiceBuyButton';
import { categories, getCategory, getServicesByCategory, getService } from '@/lib/utils/catalog';
import type { CategorySlug } from '@/lib/utils/catalog';
import { getDocsForService } from '@/lib/utils/docs';

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
  const canonicalUrl = `https://kseniailicheva.com/servicios/${categoria}/${servicio}`;
  const shareImageUrl = `https://kseniailicheva.com/api/services/og?slug=${encodeURIComponent(servicio)}&variant=square`;

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
  const service = getService(categoria as CategorySlug, servicio);
  if (!service) return notFound();

  const category = getCategory(categoria);
  const relatedServices = getServicesByCategory(categoria as CategorySlug).filter((s) => s.slug !== servicio).slice(0, 3);
  const relatedDocs = getDocsForService(service.slug);
  const compactWithDocs = relatedDocs.length > 0;
  const heroImage = `/api/services/og?slug=${encodeURIComponent(service.slug)}&variant=hero`;
  const canonicalUrl = `https://kseniailicheva.com/servicios/${categoria}/${servicio}`;
  const offerPrice = service.stripePriceId
    ? service.price?.match(/(\d+[.,]\d{2}|\d+)/)?.[1]?.replace(',', '.')
    : undefined;
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
      {/* Hero */}
      <div
        className="bg-[#0D1B2A] bg-cover bg-center px-6 py-14 text-[#F8F6F1] md:py-18"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(13, 27, 42, 0.94) 0%, rgba(13, 27, 42, 0.84) 48%, rgba(13, 27, 42, 0.58) 100%), url("${heroImage}")`
        }}
      >
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">
            {category?.name ?? 'Servicios'}
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight md:text-5xl">{service.name}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#9CA3AF]">{service.shortDescription}</p>

          <div className="mt-6 flex flex-wrap gap-5">
            {service.price && (
              <div className="border border-[#D4A017]/35 bg-[#D4A017]/10 px-4 py-2">
                <p className="text-xs font-bold uppercase tracking-widest text-[#D4A017]">Precio</p>
                <p className="mt-0.5 font-semibold text-[#F8F6F1]">{service.price}</p>
              </div>
            )}
            {service.duration && (
              <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                <Clock className="h-4 w-4 text-[#D4A017]" />
                <span>{service.duration}</span>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            {service.stripePriceId ? (
              <ServiceBuyButton priceId={service.stripePriceId} label={service.checkoutLabel ?? 'Contratar servicio'} />
            ) : (
              <Link
                href="/solicitar-presupuesto"
                className="inline-flex min-h-12 items-center justify-center bg-[#D4A017] px-7 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
              >
                Contratar / Solicitar presupuesto
              </Link>
            )}
            <a
              href="https://wa.me/34696550480"
              className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#D4A017] px-7 py-3 text-sm font-bold uppercase tracking-wide text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
            >
              <MessageCircle className="h-4 w-4" />
              Consulta por WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <nav className="border-b border-[#D4A017]/15 bg-white/70 px-6 py-4 text-xs text-[#6B7280]" aria-label="Breadcrumb">
        <div className="mx-auto flex max-w-5xl flex-wrap gap-2">
          <Link href="/" className="hover:text-[#D4A017]">Inicio</Link>
          <span>/</span>
          <Link href="/servicios" className="hover:text-[#D4A017]">Servicios</Link>
          <span>/</span>
          <Link href={`/servicios/${categoria}`} className="hover:text-[#D4A017]">{category?.name}</Link>
          <span>/</span>
          <span className="text-[#0D1B2A]">{service.name}</span>
        </div>
      </nav>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-6 py-14 md:py-18">
        <div className="grid gap-12 lg:grid-cols-[1fr_340px] lg:items-start">
          {/* Main */}
          <div>
            <h2 className="font-serif text-2xl font-bold">¿En qué consiste este servicio?</h2>
            <p className="mt-4 text-sm leading-7 text-[#23364D] md:text-base">{service.description}</p>

            {(service.servicePriceDetail || service.officialFee) && (
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {service.servicePriceDetail && (
                  <div className="border border-[#D4A017]/25 bg-white p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#D4A017]">Precio del servicio</p>
                    <p className="mt-2 text-sm leading-6 text-[#23364D]">{service.servicePriceDetail}</p>
                  </div>
                )}
                {service.officialFee && (
                  <div className="border border-[#D4A017]/25 bg-white p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#D4A017]">Tasa oficial</p>
                    <p className="mt-2 text-sm leading-6 text-[#23364D]">{service.officialFee}</p>
                  </div>
                )}
              </div>
            )}

            {service.keyPoints && service.keyPoints.length > 0 && (
              <div className="mt-10">
                <h2 className="font-serif text-2xl font-bold">Puntos clave</h2>
                <div className="mt-5 grid gap-4">
                  {(compactWithDocs ? service.keyPoints.slice(0, 2) : service.keyPoints).map((point) => (
                    <div key={point.title} className="border border-[#D4A017]/25 bg-white p-5">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" />
                        <div>
                          <h3 className="font-semibold text-[#0D1B2A]">{point.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-[#23364D]">{point.text}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(service.audience || service.requirements) && (
              <div className="mt-10 grid gap-8 md:grid-cols-2">
                {service.audience && service.audience.length > 0 && (
                  <div>
                    <h2 className="font-serif text-2xl font-bold">¿Para quién es?</h2>
                    <ul className="mt-5 space-y-3">
                      {service.audience.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" strokeWidth={2.5} />
                          <span className="text-sm leading-6 text-[#23364D]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {service.requirements && service.requirements.length > 0 && (
                  <div>
                    <h2 className="font-serif text-2xl font-bold">Requisitos principales</h2>
                    <ul className="mt-5 space-y-3">
                      {service.requirements.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <ListChecks className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" strokeWidth={2.5} />
                          <span className="text-sm leading-6 text-[#23364D]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {service.includes.length > 0 && (
              <div className="mt-10">
                <h2 className="font-serif text-2xl font-bold">¿Qué incluye?</h2>
                <ul className="mt-5 space-y-3">
                  {service.includes.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" strokeWidth={2.5} />
                      <span className="text-sm leading-6 text-[#23364D]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {relatedDocs.length > 0 && (
              <div className="mt-12 border border-[#D4A017]/25 bg-white p-6">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-[#D4A017]" />
                  <h2 className="font-serif text-2xl font-bold">Guías detalladas del trámite</h2>
                </div>
                <p className="mt-3 text-sm leading-7 text-[#23364D]">
                  Para mantener esta página clara, hemos separado los requisitos, documentación y puntos delicados en la base de conocimientos.
                </p>
                <div className="mt-5 grid gap-3">
                  {relatedDocs.map((doc) => (
                    <Link
                      key={doc.slug}
                      href={`/docs/${doc.slug}`}
                      className="border border-[#D4A017]/20 bg-[#F8F6F1] p-4 transition hover:border-[#D4A017]"
                    >
                      <p className="font-semibold text-[#0D1B2A]">{doc.title}</p>
                      <p className="mt-1 text-sm leading-6 text-[#23364D]">{doc.excerpt}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {!compactWithDocs && service.documents && service.documents.length > 0 && (
              <div className="mt-12">
                <h2 className="font-serif text-2xl font-bold">Documentación necesaria</h2>
                <div className="mt-6 grid gap-5">
                  {service.documents.map((group) => (
                    <div key={group.title} className="border border-[#D4A017]/25 bg-white p-6">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-[#D4A017]" />
                        <h3 className="font-semibold text-[#0D1B2A]">{group.title}</h3>
                      </div>
                      <ul className="mt-4 space-y-3">
                        {group.items.map((item) => (
                          <li key={item} className="flex items-start gap-3">
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

            {!compactWithDocs && service.process && service.process.length > 0 && (
              <div className="mt-12">
                <h2 className="font-serif text-2xl font-bold">Cómo funciona el proceso</h2>
                <ol className="mt-6 space-y-4">
                  {service.process.map((step, index) => (
                    <li key={step.title} className="grid grid-cols-[36px_1fr] gap-4">
                      <span className="flex h-9 w-9 items-center justify-center bg-[#D4A017] text-sm font-bold text-[#0D1B2A]">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-semibold text-[#0D1B2A]">{step.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-[#23364D]">{step.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {!compactWithDocs && (service.notIncluded || service.reviewBeforeHiring) && (
              <div className="mt-12 grid gap-8 md:grid-cols-2">
                {service.notIncluded && service.notIncluded.length > 0 && (
                  <div>
                    <h2 className="font-serif text-2xl font-bold">No incluido</h2>
                    <ul className="mt-5 space-y-3">
                      {service.notIncluded.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" />
                          <span className="text-sm leading-6 text-[#23364D]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {service.reviewBeforeHiring && service.reviewBeforeHiring.length > 0 && (
                  <div>
                    <h2 className="font-serif text-2xl font-bold">Conviene revisar antes</h2>
                    <ul className="mt-5 space-y-3">
                      {service.reviewBeforeHiring.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" />
                          <span className="text-sm leading-6 text-[#23364D]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {service.finalCta && (
              <div className="mt-12 border border-[#D4A017]/30 bg-white p-6">
                <h2 className="font-serif text-2xl font-bold">{service.finalCta.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#23364D]">{service.finalCta.text}</p>
                {service.stripePriceId && (
                  <div className="mt-5 max-w-md">
                    <ServiceBuyButton priceId={service.stripePriceId} label={service.checkoutLabel ?? 'Contratar ahora'} />
                  </div>
                )}
              </div>
            )}

            {service.faqs.length > 0 && (
              <div className="mt-12">
                <h2 className="font-serif text-2xl font-bold">Preguntas frecuentes</h2>
                <div className="mt-6 space-y-6">
                  {(compactWithDocs ? service.faqs.slice(0, 4) : service.faqs).map(({ q, a }) => (
                    <div key={q} className="border-l-2 border-[#D4A017] pl-5">
                      <p className="font-semibold text-[#0D1B2A]">{q}</p>
                      <p className="mt-2 text-sm leading-6 text-[#23364D]">{a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="brand-blue-bg p-6 text-[#F8F6F1]">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4A017]">Siguiente paso</p>
              <h3 className="mt-3 font-serif text-xl font-bold">¿Listo para empezar?</h3>
              <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">
                Cuéntanos tu caso y te orientamos sin compromiso. Gestión 100% online.
              </p>
              {service.stripePriceId ? (
                <div className="mt-5">
                  <ServiceBuyButton
                    priceId={service.stripePriceId}
                    label={service.checkoutLabel ?? 'Contratar ahora'}
                    className="inline-flex w-full min-h-12 items-center justify-center gap-2 bg-[#D4A017] px-4 py-3 text-center text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E] disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>
              ) : (
                <Link
                  href="/solicitar-presupuesto"
                  className="mt-5 block w-full bg-[#D4A017] px-4 py-3 text-center text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
                >
                  Solicitar presupuesto
                </Link>
              )}
              <a
                href="https://wa.me/34696550480"
                className="mt-3 block w-full border border-[#D4A017]/50 px-4 py-3 text-center text-sm font-semibold text-[#D4A017] transition hover:border-[#D4A017] hover:bg-[#D4A017] hover:text-[#0D1B2A]"
              >
                Escribir por WhatsApp
              </a>
              {service.checkoutLegal && (
                <p className="mt-4 text-xs leading-5 text-[#9CA3AF]">{service.checkoutLegal}</p>
              )}
            </div>

            {relatedServices.length > 0 && (
              <div className="border border-[#D4A017]/25 bg-white p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-[#23364D]">Otros servicios del área</p>
                <ul className="mt-4 space-y-3">
                  {relatedServices.map((s) => (
                    <li key={s.slug}>
                      <Link
                        href={`/servicios/${categoria}/${s.slug}`}
                        className="text-sm font-semibold text-[#0D1B2A] hover:text-[#D4A017]"
                      >
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/servicios/${categoria}`}
                  className="mt-4 block text-sm font-bold text-[#D4A017] hover:text-[#F2C14E]"
                >
                  Ver todos los servicios →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
