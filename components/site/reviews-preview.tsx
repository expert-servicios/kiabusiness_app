const reviewCards = [
  {
    title: 'Reseña verificada',
    badge: 'Servicio finalizado'
  },
  {
    title: 'Reseña verificada',
    badge: 'Servicio finalizado'
  },
  {
    title: 'Reseña verificada',
    badge: 'Servicio finalizado'
  }
];

export function ReviewsPreview() {
  return (
    <section className="bg-[#06111f] py-16 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center font-serif text-3xl font-bold uppercase tracking-wide">
          Opiniones reales de clientes
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-6 text-white/65">
          Las valoraciones se publican únicamente después de finalizar un servicio y con autorización del cliente.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {reviewCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-[#c88b25]/35 bg-[#0D1B2A] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
            >
              <div className="text-[#d7a33a]">★★★★★</div>
              <p className="mt-5 text-sm leading-6 text-white/80">Reseña verificada tras servicio finalizado.</p>
              <div className="mt-5 border-t border-white/10 pt-4 text-sm text-white/55">Opinión pendiente de publicación</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
