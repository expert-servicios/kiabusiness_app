const featured = [
  {
    title: 'Declaración de la Renta',
    subtitle: 'IRPF 2024',
    description: 'Preparamos y presentamos tu declaración de forma rápida, segura y sin errores.',
    price: '72,60 €',
    cta: 'Contratar ahora',
    accent: 'bg-brand-slate'
  },
  {
    title: 'Modelo 151',
    subtitle: 'Para expatriados',
    description: 'Analizamos tu situación, optimizamos tu fiscalidad y gestionamos toda la presentación.',
    price: 'Desde consulta personalizada',
    cta: 'Más información',
    accent: 'bg-brand-gold'
  },
  {
    title: 'Nacionalidad Española',
    subtitle: 'Trámite integral',
    description: 'Te acompañamos en todo el proceso documental y presentación oficial.',
    price: 'Revisión + tramitación',
    cta: 'Solicitar información',
    accent: 'bg-[#a11b2b]'
  }
];

export function CategoriesSection() {
  return (
    <section className="bg-brand-cream px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center font-serif text-4xl text-brand-navy lg:text-5xl">Soluciones fiscales y legales</h2>
        <p className="mt-3 text-center text-lg text-brand-slate">Adaptadas a tu situación. Resultados reales.</p>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {featured.map((service) => (
            <article key={service.title} className="rounded-2xl border border-brand-slate/10 bg-white p-8 shadow-lg shadow-brand-slate/10">
              <div className={`mb-6 h-12 w-12 rounded-full ${service.accent}`} />
              <h3 className="font-serif text-4xl leading-tight text-brand-navy">{service.title}</h3>
              <p className="mt-1 text-sm uppercase tracking-wide text-brand-slate">{service.subtitle}</p>
              <p className="mt-5 min-h-20 text-brand-slate">{service.description}</p>
              <p className="mt-5 text-xl font-semibold text-brand-navy">{service.price}</p>
              <button className={`mt-6 w-full rounded-lg px-4 py-3 text-sm font-semibold text-white ${service.accent}`}>
                {service.cta}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
