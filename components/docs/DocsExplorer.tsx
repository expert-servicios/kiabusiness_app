'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BookOpen, Search, Tag, X } from 'lucide-react';
import type { DocCategorySlug, KnowledgeDoc } from '@/lib/utils/docs';

type DocListItem = Omit<KnowledgeDoc, 'body'>;

type Props = {
  docs: DocListItem[];
  categories: { slug: DocCategorySlug; name: string }[];
  tags: string[];
};

export function DocsExplorer({ docs, categories, tags }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | DocCategorySlug>('all');
  const [activeTag, setActiveTag] = useState<string>('all');

  const filteredDocs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return docs.filter((doc) => {
      const matchesCategory = category === 'all' || doc.category === category;
      const matchesTag = activeTag === 'all' || doc.tags.includes(activeTag);
      const text = [doc.title, doc.excerpt, doc.category, ...doc.tags].join(' ').toLowerCase();
      const matchesQuery = !normalizedQuery || text.includes(normalizedQuery);

      return matchesCategory && matchesTag && matchesQuery;
    });
  }, [activeTag, category, docs, query]);

  const resetFilters = () => {
    setQuery('');
    setCategory('all');
    setActiveTag('all');
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:items-start">
      <aside className="border border-[#D4A017]/25 bg-white p-5">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-[#23364D]" htmlFor="docs-search">
            Buscar
          </label>
          <div className="mt-2 flex min-h-11 items-center gap-2 border border-[#D4A017]/30 bg-[#F8F6F1] px-3">
            <Search className="h-4 w-4 shrink-0 text-[#D4A017]" />
            <input
              id="docs-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="nacionalidad, tasa, TIE..."
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
                key={item.slug}
                onClick={() => setCategory(item.slug)}
                className={`min-h-10 border px-3 text-left text-sm font-semibold transition ${
                  category === item.slug
                    ? 'border-[#D4A017] bg-[#D4A017] text-[#0D1B2A]'
                    : 'border-[#D4A017]/25 text-[#23364D] hover:border-[#D4A017]'
                }`}
              >
                {item.name}
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

        {(query || category !== 'all' || activeTag !== 'all') && (
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
            {filteredDocs.length} {filteredDocs.length === 1 ? 'guía encontrada' : 'guías encontradas'}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {filteredDocs.map((doc) => {
            const categoryName = categories.find((item) => item.slug === doc.category)?.name ?? doc.category;

            return (
              <article key={doc.slug} className="flex min-h-[280px] flex-col border border-[#D4A017]/20 bg-white p-5 shadow-[0_4px_16px_rgba(13,27,42,0.06)] transition hover:-translate-y-0.5 hover:border-[#D4A017]/55 hover:shadow-[0_10px_28px_rgba(13,27,42,0.10)]">
                <div className="flex items-center justify-between gap-3">
                  <span className="border border-[#D4A017]/35 bg-[#D4A017]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#D4A017]">
                    {categoryName}
                  </span>
                  <span className="text-xs text-[#9CA3AF]">{doc.readTime}</span>
                </div>
                <h2 className="mt-4 font-serif text-xl font-bold leading-tight text-[#0D1B2A]">{doc.title}</h2>
                <p className="mt-3 flex-1 text-sm leading-6 text-[#23364D]">{doc.excerpt}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {doc.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="border border-[#D4A017]/20 px-2 py-1 text-[11px] text-[#6B7280]">
                      {tag}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/docs/${doc.slug}`}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#D4A017] transition hover:text-[#F2C14E]"
                >
                  <BookOpen className="h-4 w-4" />
                  Leer guía
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
