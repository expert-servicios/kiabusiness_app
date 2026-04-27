import { categories } from '@/lib/utils/catalog';

export default function ServiciosPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-serif text-4xl">Servicios</h1>
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <article key={c.slug} className="rounded-2xl bg-white p-6 shadow">
            <h2 className="font-semibold">{c.name}</h2>
            <p className="mt-2 text-sm text-brand-slate">{c.description}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
