import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Check, Clock, FileText, MessageCircle } from 'lucide-react';
import { categories, getCategory, getServicesByCategory, getService } from '@/lib/utils/catalog';
import type { CategorySlug } from '@/lib/utils/catalog';
import { ServiceCheckoutButton } from './ServiceCheckoutButton';

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
  return {
    title: `${service.name} | EXPERT`,
    description: service.shortDescription,
    openGraph: {
      title: `${service.name} | EXPERT`,
      description: service.shortDescription,
      url: `https://kseniailicheva.com/servicios/${categoria}/${servicio}`
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

  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      {/* Hero */}
      <div className="brand-blue-bg px-6 py-14 text-[#F8F6F1] md:py-18">
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
              <ServiceCheckoutButton priceId={service.stripePriceId} label="Contratar ahora — pago seguro" />
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

      {/* Content */}
      <div className="mx-auto max-w-5xl px-6 py-14 md:py-18">
        <div className="grid gap-12 lg:grid-cols-[1fr_340px] lg:items-start">
          {/* Main */}
          <div>
            <h2 className="font-serif text-2xl font-bold">¿En qué consiste este servicio?</h2>
            <p className="mt-4 text-sm leading-7 text-[#23364D] md:text-base">{service.description}</p>

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

            {service.requiredDocs && service.requiredDocs.length > 0 && (
              <div className="mt-10">
                <h2 className="font-serif text-2xl font-bold">Documentación necesaria</h2>
                <p className="mt-2 text-sm text-[#23364D]">Prepara los siguientes documentos antes de iniciar el trámite:</p>
                <ul className="mt-5 space-y-3">
                  {service.requiredDocs.map((doc) => (
                    <li key={doc} className="flex items-start gap-3">
                      <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" strokeWidth={2} />
                      <span className="text-sm leading-6 text-[#23364D]">{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {service.faqs.length > 0 && (
              <div className="mt-12">
                <h2 className="font-serif text-2xl font-bold">Preguntas frecuentes</h2>
                <div className="mt-6 space-y-6">
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

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="brand-blue-bg p-6 text-[#F8F6F1]">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D4A017]">Siguiente paso</p>
              <h3 className="mt-3 font-serif text-xl font-bold">¿Listo para empezar?</h3>
              <p className="mt-2 text-sm leading-6 text-[#9CA3AF]">
                {service.stripePriceId
                  ? 'Contrata online de forma segura. Pago único, gestión 100% online.'
                  : 'Cuéntanos tu caso y te orientamos sin compromiso. Gestión 100% online.'}
              </p>
              {service.stripePriceId ? (
                <div className="mt-5">
                  <ServiceCheckoutButton priceId={service.stripePriceId} />
                  <Link
                    href="/solicitar-presupuesto"
                    className="mt-3 block w-full border border-[#D4A017]/50 px-4 py-3 text-center text-sm font-semibold text-[#D4A017] transition hover:border-[#D4A017] hover:bg-[#D4A017] hover:text-[#0D1B2A]"
                  >
                    Tengo dudas, prefiero hablar
                  </Link>
                </div>
              ) : (
                <>
                  <Link
                    href="/solicitar-presupuesto"
                    className="mt-5 block w-full bg-[#D4A017] px-4 py-3 text-center text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
                  >
                    Solicitar presupuesto
                  </Link>
                  <a
                    href="https://wa.me/34696550480"
                    className="mt-3 block w-full border border-[#D4A017]/50 px-4 py-3 text-center text-sm font-semibold text-[#D4A017] transition hover:border-[#D4A017] hover:bg-[#D4A017] hover:text-[#0D1B2A]"
                  >
                    Escribir por WhatsApp
                  </a>
                </>
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

      {/* Breadcrumb */}
      <nav className="px-6 py-4 text-xs text-[#9CA3AF]">
        <div className="mx-auto max-w-5xl flex gap-2">
          <Link href="/" className="hover:text-[#D4A017]">Inicio</Link>
          <span>/</span>
          <Link href="/servicios" className="hover:text-[#D4A017]">Servicios</Link>
          <span>/</span>
          <Link href={`/servicios/${categoria}`} className="hover:text-[#D4A017]">{category?.name}</Link>
          <span>/</span>
          <span className="text-[#0D1B2A]">{service.name}</span>
        </div>
      </nav>
    </main>
  );
}
