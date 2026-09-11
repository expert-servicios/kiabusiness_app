'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Clock, Search, Tag, X } from 'lucide-react';
import type { Article } from '@/lib/utils/blog';

type BlogListItem = Omit<Article, 'body'>;

type Props = {
  articles: BlogListItem[];
  categories: string[];
  tags: string[];
};

export function BlogExplorer({ articles, categories, tags }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | string>('all');
  const [activeTag, setActiveTag] = useState<string>('all');

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return articles.filter((article) => {
      const matchesCategory = category === 'all' || article.category === category;
      const matchesTag = activeTag === 'all' || article.tags.includes(activeTag);
      const text = [article.title, article.excerpt, article.category, ...article.tags].join(' ').toLowerCase();
      const matchesQuery = !normalizedQuery || text.includes(normalizedQuery);

      return matchesCategory && matchesTag && matchesQuery;
    });
  }, [activeTag, category, articles, query]);

  const hasActiveFilters = query !== '' || category !== 'all' || activeTag !== 'all';

  const resetFilters = () => {
    setQuery('');
    setCategory('all');
    setActiveTag('all');
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:items-start">
      <aside className="border border-[#D4A017]/25 bg-white p-5">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#23364D]" htmlFor="blog-search">
            Buscar
          </label>
          <div className="mt-2 flex min-h-11 items-center gap-2 border border-[#D4A017]/30 bg-[#F8F6F1] px-3">
            <Search className="h-4 w-4 shrink-0 text-[#D4A017]" />
            <input
              id="blog-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="IVA, TIE, autónomos..."
              className="min-w-0 flex-1 bg-transparent text-sm text-[#0D1B2A] outline-none placeholder:text-[#9CA3AF]"
            />
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#23364D]">Categoría</p>
          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={`min-h-10 border px-3 text-left text-sm font-semibold transition ${
                category === 'all'
                  ? 'border-[#D4A017] bg-[#D4A017] text-[#0D1B2A]'
                  : 'border-[#D4A017]/25 text-[#23364D] hover:border-[#D4A017]'
              }`}
            >
              Todas
            </button>
            {categories.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setCategory(item)}
                className={`min-h-10 border px-3 text-left text-sm font-semibold transition ${
                  category === item
                    ? 'border-[#D4A017] bg-[#D4A017] text-[#0D1B2A]'
                    : 'border-[#D4A017]/25 text-[#23364D] hover:border-[#D4A017]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#23364D]">Tags</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => setActiveTag((current) => (current === tag ? 'all' : tag))}
                className={`inline-flex min-h-8 items-center gap-1 border px-2.5 text-xs font-semibold transition ${
                  activeTag === tag
                    ? 'border-[#D4A017] bg-[#D4A017] text-[#0D1B2A]'
                    : 'border-[#D4A017]/25 text-[#23364D] hover:border-[#D4A017]'
                }`}
              >
                <Tag className="h-3 w-3" />
                {tag}
              </button>
            ))}
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="mt-6 inline-flex min-h-10 w-full items-center justify-center gap-2 border border-[#D4A017]/40 px-3 text-sm font-bold text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
          >
            <X className="h-4 w-4" />
            Limpiar filtros
          </button>
        )}
      </aside>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-sm text-[#23364D]">
            {filteredArticles.length} {filteredArticles.length === 1 ? 'artículo encontrado' : 'artículos encontrados'}
          </p>
        </div>

        {filteredArticles.length === 0 ? (
          <div className="border border-[#D4A017]/25 bg-white p-10 text-center">
            <p className="text-sm font-semibold text-[#0D1B2A]">No se han encontrado artículos con estos filtros.</p>
            <p className="mt-2 text-sm text-[#23364D]">Prueba con otra palabra clave o quita algún filtro.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 inline-flex min-h-10 items-center gap-2 border border-[#D4A017]/40 px-4 text-sm font-bold text-[#D4A017] transition hover:bg-[#D4A017] hover:text-[#0D1B2A]"
            >
              <X className="h-4 w-4" />
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredArticles.map((article) => {
              return (
                <article
                  key={article.slug}
                  className="flex flex-col border border-[#D4A017]/20 bg-white shadow-[0_4px_16px_rgba(13,27,42,0.06)] transition hover:-translate-y-0.5 hover:border-[#D4A017]/50 hover:shadow-[0_10px_28px_rgba(13,27,42,0.10)]"
                >
                  <div className="flex flex-1 flex-col p-5">
                    <span className="inline-block self-start border border-[#D4A017]/40 bg-[#D4A017]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#D4A017]">
                      {article.category}
                    </span>
                    <h2 className="mt-3 font-serif text-lg font-bold leading-snug text-[#0D1B2A]">{article.title}</h2>
                    <p className="mt-3 flex-1 text-sm leading-6 text-[#23364D]">{article.excerpt}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {article.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="border border-[#D4A017]/20 px-2 py-1 text-[11px] text-[#6B7280]">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center justify-between text-xs text-[#9CA3AF]">
                      <span>{article.date}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {article.readTime}
                      </span>
                    </div>
                    <Link
                      href={`/blog/${article.slug}`}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#D4A017] transition hover:text-[#F2C14E]"
                    >
                      Leer artículo
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
