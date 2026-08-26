'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock, Lock, Search, Unlock } from 'lucide-react';
import type { AcademyKnowledgeArticle } from '@/lib/utils/academy-knowledge';

type ArticleCard = Pick<
  AcademyKnowledgeArticle,
  'slug' | 'title' | 'module' | 'access' | 'status' | 'readTime' | 'phase' | 'tools' | 'tags'
>;

const ALL = 'Todos';

export function AcademyKnowledgeIndex({ articles, enrolled }: { articles: ArticleCard[]; enrolled: boolean }) {
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState(ALL);
  const [tool, setTool] = useState(ALL);

  const phases = useMemo(() => [ALL, ...new Set(articles.map((article) => article.phase))], [articles]);
  const tools = useMemo(
    () => [ALL, ...new Set(articles.flatMap((article) => article.tools))].sort((a, b) =>
      a === ALL ? -1 : b === ALL ? 1 : a.localeCompare(b, 'es')
    ),
    [articles]
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es');
    return articles.filter((article) => {
      const matchesQuery = !normalizedQuery || [article.title, ...article.tags]
        .join(' ')
        .toLocaleLowerCase('es')
        .includes(normalizedQuery);
      return matchesQuery && (phase === ALL || article.phase === phase) && (tool === ALL || article.tools.includes(tool));
    });
  }, [articles, phase, query, tool]);

  return (
    <div>
      <div className="grid gap-3 border border-[#D4A017]/25 bg-white p-4 md:grid-cols-[1fr_220px_220px]">
        <label className="relative">
          <span className="sr-only">Buscar manual</span>
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#8899aa]" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por título o concepto"
            className="h-10 w-full border border-[#0D1B2A]/15 bg-[#F8F6F1] pl-10 pr-3 text-sm outline-none transition focus:border-[#D4A017]"
          />
        </label>
        <label>
          <span className="sr-only">Filtrar por fase</span>
          <select
            value={phase}
            onChange={(event) => setPhase(event.target.value)}
            className="h-10 w-full border border-[#0D1B2A]/15 bg-[#F8F6F1] px-3 text-sm outline-none transition focus:border-[#D4A017]"
          >
            {phases.map((item) => <option key={item} value={item}>{item === ALL ? 'Todas las fases' : item}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Filtrar por herramienta</span>
          <select
            value={tool}
            onChange={(event) => setTool(event.target.value)}
            className="h-10 w-full border border-[#0D1B2A]/15 bg-[#F8F6F1] px-3 text-sm outline-none transition focus:border-[#D4A017]"
          >
            {tools.map((item) => <option key={item} value={item}>{item === ALL ? 'Todas las herramientas' : item}</option>)}
          </select>
        </label>
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#8899aa]" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? 'manual' : 'manuales'}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {filtered.map((article) => {
          const locked = article.access === 'student' && !enrolled;
          return (
            <Link
              key={article.slug}
              href={`/docs/laboral/${article.slug}`}
              className="group flex min-h-48 flex-col border border-[#D4A017]/25 bg-white p-5 transition hover:border-[#D4A017] hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#D4A017]">
                    Módulo {article.module} · {article.phase}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[#8899aa]">
                    {statusLabel(article.status)}
                  </p>
                </div>
                {locked ? <Lock className="h-4 w-4 text-[#9CA3AF]" /> : <Unlock className="h-4 w-4 text-[#D4A017]" />}
              </div>
              <h2 className="mt-3 font-serif text-lg font-bold text-[#0D1B2A] group-hover:text-[#A97600]">
                {article.title}
              </h2>
              <div className="mt-auto pt-5">
                <div className="flex flex-wrap gap-1.5">
                  {article.tools.slice(0, 4).map((item) => (
                    <span key={item} className="bg-[#0D1B2A]/6 px-2 py-1 text-[11px] font-semibold text-[#23364D]">{item}</span>
                  ))}
                </div>
                {article.readTime && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-[#8899aa]">
                    <Clock className="h-3.5 w-3.5" />
                    {article.readTime}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="mt-4 border border-dashed border-[#0D1B2A]/20 bg-white p-8 text-center text-sm text-[#23364D]">
          No hay manuales que coincidan con los filtros seleccionados.
        </div>
      )}
    </div>
  );
}

function statusLabel(status: ArticleCard['status']) {
  return {
    draft: 'Borrador',
    review: 'En revisión',
    validated: 'Validado',
    pending_update: 'Actualización pendiente',
    outdated: 'No vigente',
  }[status];
}
