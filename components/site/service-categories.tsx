import Link from 'next/link';
import { serviceCategories } from '@/config/brand';

export function ServiceCategories() {
  return (
    <section className="bg-brand-cream py-16">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.35em] text-brand-gold">Áreas de especialización</p>
          <h2 className="mt-4 font-serif text-4xl tracking-[-0.04em] text-brand-navy">Áreas de especialización</h2>
          <p className="mt-4 text-base leading-8 text-brand-gray">
            Soluciones fiscales, legales y administrativas para particulares, autónomos y empresas.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {serviceCategories.map(({ title, description, href, icon: Icon }) => (
            <article
              key={title}
              className="group rounded-[24px] border border-brand-gold/20 bg-white p-7 shadow-[0_20px_50px_rgba(13,27,42,0.08)] transition-transform hover:-translate-y-1"
            >
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gold/10 text-brand-gold">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-xl text-brand-navy">{title}</h3>
              <p className="mt-4 text-sm leading-7 text-brand-gray">{description}</p>
              <Link
                href={href}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-navy transition group-hover:text-brand-gold"
              >
                Ver servicios
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
