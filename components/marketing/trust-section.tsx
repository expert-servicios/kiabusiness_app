const trustItems = [
  '+20 años de experiencia',
  'Colaboradora social de la AEAT',
  'Especialistas en expatriados',
  'Confidencialidad y seguridad',
  '100% compromiso y transparencia'
];

export function TrustSection() {
  return (
    <section className="hero-gradient px-6 py-10 text-brand-cream">
      <div className="mx-auto grid max-w-7xl gap-3 md:grid-cols-2 lg:grid-cols-5">
        {trustItems.map((item) => (
          <div key={item} className="rounded-lg border border-brand-lightGold/25 bg-brand-slate/20 px-4 py-4 text-center text-sm font-medium">
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
