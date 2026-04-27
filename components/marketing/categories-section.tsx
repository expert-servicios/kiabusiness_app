import { categories } from '@/lib/utils/catalog';

export function CategoriesSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <h2 className="font-serif text-4xl">Categorías de servicios</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((item) => (
          <article key={item.slug} className="rounded-2xl bg-white p-6 shadow-lg shadow-brand-slate/10">
            <h3 className="font-serif text-2xl">{item.name}</h3>
            <p className="mt-3 text-sm text-brand-slate">{item.description}</p>
            <button className="mt-5 rounded-full border border-brand-gold px-4 py-2 text-sm">Ver servicios</button>
          </article>
        ))}
      </div>
    </section>
  );
}
