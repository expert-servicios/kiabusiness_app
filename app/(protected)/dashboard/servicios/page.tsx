import Link from 'next/link';
import { ArrowRight, ShoppingBag, ExternalLink } from 'lucide-react';
import { categories, services } from '@/lib/utils/catalog';

const CATEGORY_ICONS: Record<string, string> = {
  'declaraciones-impuestos': '📊',
  'extranjeria-nacionalidad': '🛂',
  'empresas-autonomos': '🏢',
  'trafico-capitania-maritima': '🚗',
  'notaria-propiedades': '🏠',
  'gestiones-especializadas': '🔐',
  'formacion': '🎓'
};

export default function DashboardServiciosPage() {
  return (
    <main className="min-h-screen bg-[#f8f4eb]">
      {/* Header */}
      <div className="border-b border-[#d8cbb5] bg-white">
        <div className="mx-auto max-w-5xl px-6 py-7">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-[#c88b25]" />
            <div>
              <h1 className="font-serif text-2xl font-bold text-[#07111d]">Catálogo de servicios</h1>
              <p className="mt-0.5 text-sm text-[#29384a]">
                Contrata directamente o solicita un presupuesto personalizado
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-10 px-6 py-8">

        {/* CTA solicitar presupuesto */}
        <div className="flex flex-col gap-4 rounded-2xl border border-[#d7a33a]/30 bg-[#d7a33a]/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-[#07111d]">¿No encuentras lo que buscas?</p>
            <p className="mt-0.5 text-sm text-[#29384a]">
              Solicita un presupuesto personalizado y te respondemos en menos de 24 h hábiles.
            </p>
          </div>
          <Link
            href="/solicitar-presupuesto"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#d7a33a] px-5 py-2.5 text-sm font-bold text-[#061321] transition hover:bg-[#f0bf54]"
          >
            Solicitar presupuesto <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Categories + services */}
        {categories.map((cat) => {
          const catServices = services.filter((s) => s.categoria === cat.slug);
          if (catServices.length === 0) return null;

          return (
            <section key={cat.slug}>
              {/* Category header */}
              <div className="mb-4 flex items-center gap-3">
                <span className="text-xl">{CATEGORY_ICONS[cat.slug] ?? '📋'}</span>
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#07111d]">{cat.name}</h2>
                  <p className="text-xs text-[#29384a]">{cat.description}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {catServices.map((service) => (
                  <div
                    key={service.slug}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-[#d8cbb5] bg-white p-5 transition hover:border-[#d7a33a]/60 hover:shadow-sm"
                  >
                    <div>
                      <p className="font-semibold text-[#07111d]">{service.name}</p>
                      <p className="mt-1 text-xs text-[#29384a] leading-relaxed">
                        {service.shortDescription}
                      </p>
                      {service.price && (
                        <p className="mt-2 text-xs font-bold text-[#c88b25]">{service.price}</p>
                      )}
                      {service.duration && (
                        <p className="text-[10px] text-[#29384a]/70">{service.duration}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {/* Direct checkout if stripePriceId exists */}
                      {service.stripePriceId ? (
                        <Link
                          href={`/servicios/${service.categoria}/${service.slug}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#d7a33a] px-3.5 py-2 text-xs font-bold text-[#061321] transition hover:bg-[#f0bf54]"
                        >
                          {service.checkoutLabel ?? 'Contratar'} <ArrowRight className="h-3 w-3" />
                        </Link>
                      ) : (
                        <Link
                          href={`/solicitar-presupuesto?servicio=${encodeURIComponent(service.name)}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#d7a33a] px-3.5 py-2 text-xs font-bold text-[#061321] transition hover:bg-[#f0bf54]"
                        >
                          Solicitar presupuesto <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                      {/* Ver detalle */}
                      <Link
                        href={`/servicios/${service.categoria}/${service.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#d8cbb5] px-3.5 py-2 text-xs font-semibold text-[#29384a] transition hover:border-[#d7a33a] hover:text-[#07111d]"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver detalle <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

      </div>
    </main>
  );
}
