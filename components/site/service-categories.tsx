import Link from 'next/link';

const serviceCategories = [
  {
    title: 'Declaraciones e Impuestos',
    icon: 'document',
    items: ['IRPF', 'Modelo 151', 'No residentes'],
    href: '/servicios/declaraciones-impuestos'
  },
  {
    title: 'Extranjería y Nacionalidad',
    icon: 'globe',
    items: ['Nacionalidad', 'Residencias', 'Renovaciones'],
    href: '/servicios/extranjeria-nacionalidad'
  },
  {
    title: 'Empresas y Autónomos',
    icon: 'briefcase',
    items: ['Alta de autónomos', 'Constitución de empresas', 'Contabilidad e impuestos'],
    href: '/servicios/empresas-autonomos'
  },
  {
    title: 'Tráfico y Capitanía Marítima',
    icon: 'anchor',
    items: ['Transferencias', 'Matriculaciones', 'Gestiones náuticas'],
    href: '/servicios/trafico-capitania-maritima'
  },
  {
    title: 'Notaría y Propiedades',
    icon: 'home',
    items: ['Compraventas', 'Escrituras', 'Gestión documental'],
    href: '/servicios/notaria-propiedades'
  },
  {
    title: 'Gestiones Especializadas',
    icon: 'settings',
    items: ['Camerfirma', 'Migraciones a Holded', 'Automatizaciones'],
    href: '/servicios/gestiones-especializadas'
  }
];

function Icon({ name, className = '' }: { name: string; className?: string }) {
  const common = 'h-7 w-7';
  const cls = `${common} ${className}`;

  if (name === 'document') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none">
        <path d="M7 3h7l4 4v14H7V3Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M14 3v5h5M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === 'globe') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 12h18M12 3c2.2 2.5 3.2 5.5 3.2 9s-1 6.5-3.2 9M12 3C9.8 5.5 8.8 8.5 8.8 12s1 6.5 3.2 9" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === 'briefcase') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none">
        <path d="M4 8h16v11H4V8Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 8V5h6v3M4 12h16" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === 'anchor') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 7v12M7 10h10M5 15c1.2 3 3.6 4.5 7 4.5s5.8-1.5 7-4.5M5 15l-2 1M19 15l2 1" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === 'home') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none">
        <path d="M4 11 12 4l8 7v9h-6v-6h-4v6H4v-9Z" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === 'settings') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  return null;
}

export function ServiceCategories() {
  return (
    <section className="bg-[#F8F6F1] py-20 text-[#0D1B2A]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 text-center">
          <h2 className="font-serif text-3xl font-bold uppercase tracking-wide md:text-4xl">
            Soluciones legales, fiscales y administrativas
          </h2>
          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.25em] text-[#23364D]/70">
            Áreas de especialización
          </p>
          <div className="mx-auto mt-4 h-[2px] w-24 bg-[#D4A017]" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {serviceCategories.map((category, index) => {
            const isGold = index % 2 === 1;

            return (
              <Link
                href={category.href}
                key={category.title}
                className="group relative overflow-hidden rounded-2xl border border-[#D4A017]/18 bg-white p-6 shadow-[0_18px_45px_rgba(13,27,42,0.08)] transition hover:-translate-y-1 hover:border-[#D4A017]/45 hover:shadow-[0_24px_60px_rgba(13,27,42,0.14)]"
              >
                <div className="flex items-start gap-5">
                  <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full ${
                      isGold ? 'bg-[#D4A017] text-white' : 'bg-[#0D1B2A] text-[#F2C14E]'
                    } shadow-lg`}
                  >
                    <Icon name={category.icon} />
                  </div>

                  <div>
                    <h3 className="font-serif text-xl font-bold text-[#0D1B2A]">
                      {category.title}
                    </h3>

                    <ul className="mt-3 space-y-1.5 text-sm text-[#23364D]">
                      {category.items.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="text-[#D4A017]">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <p className="mt-5 text-sm font-semibold text-[#D4A017]">
                      Ver servicios →
                    </p>
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
