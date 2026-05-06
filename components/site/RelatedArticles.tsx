import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { articles } from '@/lib/utils/blog';

export function RelatedArticles({
  category,
  slugs,
  title = 'Artículos relacionados',
  limit = 3
}: {
  category?: string;
  slugs?: string[];
  title?: string;
  limit?: number;
}) {
  const filtered = slugs
    ? articles.filter((a) => slugs.includes(a.slug)).slice(0, limit)
    : category
    ? articles.filter((a) => a.category === category).slice(0, limit)
    : articles.slice(0, limit);

  if (filtered.length === 0) return null;

  return (
    <section className="brand-blue-bg px-6 py-16 md:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-[#D4A017]">Recursos</p>
            <h2 className="mt-3 font-serif text-2xl font-bold text-[#F8F6F1] md:text-3xl">{title}</h2>
          </div>
          <Link href="/blog" className="text-sm font-semibold text-[#D4A017] hover:text-[#F2C14E]">
            Ver todos los artículos →
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {filtered.map((a) => (
            <article key={a.slug} className="flex flex-col border border-[#D4A017]/25 bg-[#23364D]/40 p-6">
              <span className="inline-block self-start border border-rose-400/40 bg-rose-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-rose-400">
                {a.category}
              </span>
              <h3 className="mt-4 font-serif text-lg font-bold leading-snug text-[#F8F6F1]">{a.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-[#9CA3AF]">{a.excerpt}</p>
              <div className="mt-5 flex items-center justify-between text-xs text-[#6b7a8d]">
                <span>{a.date}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {a.readTime}
                </span>
              </div>
              <Link
                href={`/blog/${a.slug}`}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#D4A017] transition hover:text-[#F2C14E]"
              >
                Leer artículo <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
