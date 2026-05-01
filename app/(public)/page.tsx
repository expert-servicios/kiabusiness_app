import Image from 'next/image';
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

const trustItems = [
  {
    title: '+20 años',
    subtitle: 'de experiencia'
  },
  {
    title: 'Colaboradora social',
    subtitle: 'de la AEAT'
  },
  {
    title: 'Especialistas',
    subtitle: 'en fiscalidad española'
  },
  {
    title: 'Atención',
    subtitle: 'profesional y cercana'
  }
];

const howItWorks = [
  {
    title: 'Nos envías tu documentación',
    text: 'Por WhatsApp, email o plataforma segura. Nos adaptamos a ti.'
  },
  {
    title: 'Revisamos tu caso',
    text: 'Analizamos tu situación y te proponemos la mejor opción.'
  },
  {
    title: 'Gestionamos el trámite',
    text: 'Nos encargamos del proceso para que no tengas que preocuparte.'
  }
];

function Icon({
  name,
  className = ''
}: {
  name: string;
  className?: string;
}) {
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

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0D1B2A] text-white">
      <Header />
      <Hero />
      <ServiceCategories />
      <FeaturedServices />
      <PartnerStrip />
      <HowItWorks />
      <ReviewsPreview />
      <FinalCta />
      <Accreditations />
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="absolute left-0 right-0 top-0 z-50 border-b border-white/5 bg-[#06111f]/35 backdrop-blur-sm">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/expert-logo-dark.png"
            alt="EXPERT"
            width={190}
            height={64}
            priority
            className="h-auto w-[170px] md:w-[190px]"
          />
        </Link>

        <nav className="hidden items-center gap-9 text-sm font-semibold uppercase tracking-wide text-white/85 lg:flex">
          <Link href="/" className="relative text-[#F2C14E]">
            Inicio
            <span className="absolute -bottom-3 left-0 h-[2px] w-full bg-[#D4A017]" />
          </Link>
          <Link href="/servicios" className="hover:text-[#F2C14E]">Servicios</Link>
          <Link href="/sobre-mi" className="hover:text-[#F2C14E]">Sobre mí</Link>
          <Link href="/blog" className="hover:text-[#F2C14E]">Blog</Link>
          <Link href="/contacto" className="hover:text-[#F2C14E]">Contacto</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-xl border border-[#D4A017]/60 px-4 py-2 text-sm font-semibold text-[#F2C14E] transition hover:bg-[#D4A017] hover:text-[#0D1B2A] md:inline-flex"
          >
            Acceder / Registrarse
          </Link>

          <Link
            href="https://wa.me/34669045528"
            className="rounded-xl bg-[#D4A017] px-4 py-2 text-sm font-bold text-[#0D1B2A] shadow-lg shadow-black/20 transition hover:bg-[#F2C14E]"
          >
            WhatsApp
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[720px] overflow-hidden bg-[#06111f] pt-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(212,160,23,0.18),transparent_32%),linear-gradient(90deg,#06111f_0%,#0D1B2A_42%,#10233a_100%)]" />

      <div className="absolute inset-0 opacity-20">
        <div className="absolute left-[42%] top-24 h-[520px] w-[1px] bg-white/20" />
        <div className="absolute left-[52%] top-24 h-[520px] w-[1px] bg-white/10" />
      </div>

      <Image
        src="/expert-isotipo.png"
        alt=""
        width={520}
        height={520}
        className="pointer-events-none absolute right-6 top-24 hidden opacity-[0.18] lg:block"
      />

      <div className="pointer-events-none absolute -right-16 bottom-0 h-48 w-[62%] rounded-tl-full border-t-[18px] border-[#D4A017]/80 opacity-90" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-end gap-12 px-6 pb-12 pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:pt-28">
        <div className="z-10 pb-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.36em] text-[#F2C14E]">
            EXPERT · Asesoría fiscal, legal y administrativa
          </p>

          <h1 className="font-serif text-5xl font-bold uppercase leading-[0.95] tracking-wide text-white md:text-6xl lg:text-7xl">
            Asesoría fiscal
            <span className="mt-2 block text-[#D4A017]">en España</span>
          </h1>

          <p className="mt-5 font-serif text-2xl font-semibold text-white md:text-3xl">
            Para empresas, autónomos y particulares
          </p>

          <div className="mt-5 h-[3px] w-20 rounded-full bg-[#D4A017]" />

          <p className="mt-6 max-w-xl text-base leading-7 text-white/80 md:text-lg">
            Te ayudamos con impuestos, trámites, empresas y gestiones especializadas
            de forma clara, segura y profesional.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="https://wa.me/34669045528"
              className="rounded-xl bg-[#20b455] px-6 py-4 text-sm font-bold uppercase tracking-wide text-white shadow-xl shadow-black/25 transition hover:bg-[#189a47]"
            >
              Hablar por WhatsApp
            </Link>

            <Link
              href="/servicios"
              className="rounded-xl border border-[#D4A017] px-6 py-4 text-sm font-bold uppercase tracking-wide text-[#F2C14E] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
            >
              Ver servicios →
            </Link>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-2 gap-5 text-xs font-semibold uppercase text-white/85 md:grid-cols-4">
            {trustItems.map((item) => (
              <div key={item.title} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D4A017]/60 text-[#F2C14E]">
                  ✓
                </div>
                <div>
                  <p className="text-white">{item.title}</p>
                  <p className="text-white/60">{item.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <div className="absolute bottom-0 right-2 h-[420px] w-[420px] rounded-full bg-[#D4A017]/10 blur-3xl" />

          <Image
            src="/avatars/ksenia-avatar.png"
            alt="Ksenia Ilicheva"
            width={560}
            height={640}
            priority
            className="relative z-10 max-h-[600px] w-auto object-contain drop-shadow-[0_30px_70px_rgba(0,0,0,0.55)]"
          />
        </div>
      </div>
    </section>
  );
}

function ServiceCategories() {
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
                    <h3 className="font-serif text-xl font-bold text-[#0D1B2A]">{category.title}</h3>

                    <ul className="mt-3 space-y-1.5 text-sm text-[#23364D]">
                      {category.items.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="text-[#D4A017]">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>

                    <p className="mt-5 text-sm font-semibold text-[#D4A017]">Ver servicios →</p>
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

function FeaturedServices() {
  return (
    <section className="bg-[#F8F6F1] pb-16 text-[#0D1B2A]">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-8 text-center font-serif text-2xl font-bold uppercase tracking-wide">Servicios destacados</h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {featuredServices.map((service) => {
            const color =
              service.tone === 'red'
                ? 'bg-[#9d1f2f] text-white'
                : service.tone === 'gold'
                ? 'bg-[#D4A017] text-white'
                : 'bg-[#0D1B2A] text-[#F2C14E]';

            return (
              <Link
                href={service.href}
                key={service.title}
                className="rounded-2xl border border-[#D4A017]/20 bg-white p-6 shadow-[0_18px_45px_rgba(13,27,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(13,27,42,0.14)]"
              >
                <div className="flex items-start gap-5">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-full ${color}`}>
                    <Icon name={service.icon} />
                  </div>

                  <div>
                    <h3 className="font-serif text-xl font-bold">{service.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#23364D]">{service.text}</p>
                    <p className="mt-4 text-sm font-semibold text-[#D4A017]">Más información →</p>
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

function PartnerStrip() {
  return (
    <section className="bg-[#06111f] py-7 text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-6 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 text-[#0D1B2A]">
          <p className="text-xs text-[#23364D]">Nivel Starter</p>
          <p className="font-bold">Solution Partner</p>
          <p className="text-sm font-bold">Holded</p>
        </div>

        <div className="border-l border-[#D4A017]/35 pl-6">
          <p className="font-semibold text-white">Partner certificado</p>
          <p className="text-sm text-white/70">Holded para gestión contable y fiscal.</p>
        </div>

        <div className="border-l border-[#D4A017]/35 pl-6">
          <p className="font-semibold text-white">Colaboradora social</p>
          <p className="text-sm text-white/70">de la Agencia Tributaria.</p>
        </div>

        <div className="border-l border-[#D4A017]/35 pl-6">
          <p className="font-semibold text-white">Camerfirma</p>
          <p className="text-sm text-white/70">Entidad colaboradora para trámites digitales.</p>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="bg-[#F8F6F1] py-16 text-[#0D1B2A]">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="font-serif text-3xl font-bold uppercase tracking-wide">Así de fácil</h2>
        <div className="mx-auto mt-4 h-[2px] w-20 bg-[#D4A017]" />

        <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
          {howItWorks.map((step, index) => (
            <div key={step.title} className="relative rounded-3xl bg-white p-8 shadow-[0_18px_45px_rgba(13,27,42,0.08)]">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[#D4A017]/25 bg-[#F8F6F1] text-3xl font-bold text-[#D4A017] shadow-sm">
                {index + 1}
              </div>
              <h3 className="mt-5 font-serif text-lg font-bold uppercase">{step.title}</h3>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-[#23364D]">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewsPreview() {
  return (
    <section className="bg-[#06111f] py-16 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center font-serif text-3xl font-bold uppercase tracking-wide">Opiniones reales de clientes</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-6 text-white/65">
          Las valoraciones se publican únicamente después de finalizar un servicio y con autorización del cliente.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-[#D4A017]/35 bg-[#0D1B2A] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
            >
              <div className="text-[#F2C14E]">★★★★★</div>
              <p className="mt-5 text-sm leading-6 text-white/80">Reseña verificada tras servicio finalizado.</p>
              <div className="mt-5 border-t border-white/10 pt-4 text-sm text-white/55">Opinión pendiente de publicación</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-[#06111f] py-16 text-white">
      <div className="absolute -left-20 bottom-0 h-40 w-80 rounded-tr-full border-t-[16px] border-[#D4A017]/70" />
      <div className="absolute -right-20 top-0 h-40 w-80 rounded-bl-full border-b-[16px] border-[#D4A017]/70" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 md:flex-row">
        <div>
          <h2 className="font-serif text-3xl font-bold uppercase md:text-4xl">Nos ocupamos de todo.</h2>
          <p className="mt-2 font-serif text-2xl font-bold uppercase text-[#D4A017]">Tú solo envías los datos.</p>
          <p className="mt-3 text-white/70">Confía en una profesional y olvídate de preocupaciones.</p>
        </div>

        <Link
          href="https://wa.me/34669045528"
          className="rounded-xl bg-[#20b455] px-12 py-4 text-lg font-bold text-white shadow-xl shadow-black/30 transition hover:bg-[#189a47]"
        >
          Hablar por WhatsApp
        </Link>
      </div>
    </section>
  );
}

function Accreditations() {
  return (
    <section className="bg-[#F8F6F1] py-10 text-[#0D1B2A]">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center font-serif text-xl font-bold uppercase tracking-wide">Colaboraciones y acreditaciones oficiales</h2>
        <div className="mx-auto mt-3 h-[2px] w-20 bg-[#D4A017]" />

        <div className="mt-8 grid grid-cols-2 items-center gap-5 text-center text-lg font-semibold text-[#23364D]/45 md:grid-cols-5">
          <div>Agencia Tributaria</div>
          <div>Punto PAE</div>
          <div>Generalitat Valenciana</div>
          <div>Holded</div>
          <div>Camerfirma</div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#06111f] py-12 text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 md:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
        <div>
          <Image
            src="/expert-logo-dark.png"
            alt="EXPERT"
            width={210}
            height={80}
            className="h-auto w-[210px]"
          />

          <p className="mt-5 max-w-sm text-sm leading-6 text-white/70">
            Asesoría fiscal, legal y administrativa en España para empresas,
            autónomos y personas físicas.
          </p>

          <p className="mt-3 font-semibold text-[#D4A017]">Holded Solution Partner</p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Enlaces rápidos</h3>
          <ul className="space-y-2 text-sm text-white/65">
            <li><Link href="/">Inicio</Link></li>
            <li><Link href="/servicios">Servicios</Link></li>
            <li><Link href="/sobre-mi">Sobre mí</Link></li>
            <li><Link href="/blog">Blog</Link></li>
            <li><Link href="/contacto">Contacto</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Servicios</h3>
          <ul className="space-y-2 text-sm text-white/65">
            <li><Link href="/servicios/declaraciones-impuestos">Declaraciones e Impuestos</Link></li>
            <li><Link href="/servicios/extranjeria-nacionalidad">Extranjería y Nacionalidad</Link></li>
            <li><Link href="/servicios/empresas-autonomos">Empresas y Autónomos</Link></li>
            <li><Link href="/servicios/gestiones-especializadas">Gestiones Especializadas</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Contacto</h3>
          <ul className="space-y-3 text-sm text-white/70">
            <li>WhatsApp: +34 669 04 55 28</li>
            <li>Email: soy@kseniailicheva.com</li>
            <li>España</li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-10 flex max-w-7xl flex-col justify-between gap-4 border-t border-white/10 px-6 pt-6 text-xs text-white/45 md:flex-row">
        <p>© 2024 EXPERT. Todos los derechos reservados.</p>
        <div className="flex gap-4">
          <Link href="/legal/aviso-legal">Aviso legal</Link>
          <Link href="/legal/privacidad">Política de privacidad</Link>
          <Link href="/legal/cookies">Cookies</Link>
        </div>
      </div>
    </footer>
  );
}
