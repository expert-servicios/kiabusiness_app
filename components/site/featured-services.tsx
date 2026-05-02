import Link from 'next/link';

const featuredServices = [
  {
    title: 'Declaración de la Renta',
    text: 'Preparamos y presentamos tu IRPF de forma rápida y segura.',
    icon: 'calculator',
    href: '/servicios/declaracion-renta',
    tone: 'navy'
  },
  {
    title: 'Modelo 151',
    text: 'Para trabajadores, profesionales e inversores desplazados.',
    icon: 'file',
    href: '/servicios/modelo-151',
    tone: 'gold'
  },
  {
    title: 'Nacionalidad española',
    text: 'Te acompañamos en todo el proceso hasta conseguir tu nacionalidad.',
    icon: 'passport',
    href: '/servicios/nacionalidad-espanola',
    tone: 'red'
  }
];

function Icon({ name, className = '' }: { name: string; className?: string }) {
  const common = 'h-7 w-7';
  const cls = `${common} ${className}`;

  if (name === 'calculator') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none">
        <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M16 15h0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'file') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none">
        <path d="M7 3h7l4 4v14H7V3Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M14 3v5h5M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === 'passport') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none">
        <rect x="6" y="3" width="12" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="11" r="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 17h6" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  return null;
}

export function FeaturedServices() {
  return (
    <section className="bg-[#F8F6F1] pb-16 text-[#0D1B2A]">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-8 text-center font-serif text-2xl font-bold uppercase tracking-wide">
          Servicios destacados
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {featuredServices.map((service) => {
            const color =
              service.tone === 'red'
                ? 'bg-[#9d1f2f] text-white'
                : service.tone === 'gold'
                ? 'bg-[#c88b25] text-white'
                : 'bg-[#0D1B2A] text-[#d7a33a]';

            return (
              <Link
                href={service.href}
                key={service.title}
                className="rounded-2xl border border-[#c88b25]/20 bg-white p-6 shadow-[0_18px_45px_rgba(13,27,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(13,27,42,0.14)]"
              >
                <div className="flex items-start gap-5">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-full ${color}`}>
                    <Icon name={service.icon} />
                  </div>

                  <div>
                    <h3 className="font-serif text-xl font-bold">{service.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#23364D]">{service.text}</p>
                    <p className="mt-4 text-sm font-semibold text-[#c88b25]">Más información →</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
