import { Star } from 'lucide-react';

const reviewCards = [
  { title: 'Reseña verificada', badge: 'Servicio finalizado' },
  { title: 'Reseña verificada', badge: 'Servicio finalizado' },
  { title: 'Reseña verificada', badge: 'Servicio finalizado' }
];

export function ReviewsPreview() {
  return (
    <section className="bg-brand-slate py-16 text-brand-cream">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.35em] text-brand-lightGold/90">Opiniones reales de clientes</p>
          <h2 className="mt-4 font-serif text-4xl tracking-[-0.04em] text-white">Opiniones reales de clientes</h2>
          <p className="mt-4 max-w-2xl text-base leading-8 text-brand-cream/80">
            Las valoraciones se publican únicamente después de finalizar un servicio y con autorización del cliente.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {reviewCards.map((card, index) => (
            <article key={`${card.title}-${index}`} className="rounded-[28px] border border-white/10 bg-brand-navy/80 p-8">
              <div className="flex items-center gap-1 text-brand-lightGold">
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <Star key={starIndex} className="h-4 w-4" />
                ))}
              </div>
              <p className="mt-6 text-lg font-semibold text-white">{card.title}</p>
              <span className="mt-4 inline-flex rounded-full border border-brand-gold/30 bg-brand-gold/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-brand-lightGold">
                {card.badge}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
