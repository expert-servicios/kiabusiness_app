import Link from 'next/link';
import { featuredServices } from '@/config/brand';

export function FeaturedServices() {
  return (
    <section className="bg-brand-cream py-16">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.35em] text-brand-gold">Servicios destacados</p>
          <h2 className="mt-4 font-serif text-4xl tracking-[-0.04em] text-brand-navy">Servicios destacados</h2>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-3">
          {featuredServices.map(({ title, description, cta, href }) => (
            <article key={title} className="rounded-[28px] border border-brand-gold/15 bg-white p-8 shadow-[0_20px_40px_rgba(13,27,42,0.08)]">
              <h3 className="font-serif text-2xl text-brand-navy">{title}</h3>
              <p className="mt-4 text-sm leading-7 text-brand-gray">{description}</p>
              <Link
                href={href}
                className="mt-8 inline-flex items-center text-sm font-semibold text-brand-navy transition hover:text-brand-gold"
              >
                {cta}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
