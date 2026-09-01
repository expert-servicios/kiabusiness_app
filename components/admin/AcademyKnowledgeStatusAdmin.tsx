'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';

export interface KnowledgeStatusRow {
  slug: string;
  title: string;
  module: number;
  status: 'draft' | 'review' | 'validated' | 'pending_update' | 'outdated';
  updatedAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  review: 'En revisión',
  validated: 'Validado',
  pending_update: 'Actualización pendiente',
  outdated: 'No vigente',
};

const STATUS_OPTIONS = Object.keys(STATUS_LABEL) as Array<KnowledgeStatusRow['status']>;

function StatusSelect({ article, onChanged }: { article: KnowledgeStatusRow; onChanged: (slug: string, status: KnowledgeStatusRow['status']) => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = async (status: KnowledgeStatusRow['status']) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/academy/knowledge-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: article.slug, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Error al guardar');
        return;
      }
      onChanged(article.slug, status);
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <select
        value={article.status}
        disabled={saving}
        onChange={(e) => handleChange(e.target.value as KnowledgeStatusRow['status'])}
        className="border border-[#0D1B2A]/15 bg-white px-3 py-2 text-sm text-[#0D1B2A] disabled:opacity-50"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function AcademyKnowledgeStatusAdmin({ initialArticles }: { initialArticles: KnowledgeStatusRow[] }) {
  const [articles, setArticles] = useState(initialArticles);

  const handleChanged = (slug: string, status: KnowledgeStatusRow['status']) => {
    setArticles((prev) => prev.map((a) => (a.slug === slug ? { ...a, status } : a)));
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-[#8899aa] hover:text-[#0D1B2A]">
        <ArrowLeft className="h-4 w-4" /> Volver al panel
      </Link>
      <div className="mt-4 flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-[#D4A017]" />
        <h1 className="font-serif text-2xl font-bold text-[#0D1B2A]">Estado editorial — Base de conocimientos laboral</h1>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#23364D]">
        Cambia aquí el estado mostrado en <code>/docs/laboral</code> sin necesidad de un despliegue. Este cambio
        sobreescribe el frontmatter del Markdown solo para lo que ven los visitantes — el contenido versionado en el
        repositorio no cambia.
      </p>

      <div className="mt-8 overflow-x-auto border border-[#0D1B2A]/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#0D1B2A]/10 bg-[#F8F6F1] text-xs font-bold uppercase tracking-wide text-[#8899aa]">
            <tr>
              <th className="px-4 py-3">Módulo</th>
              <th className="px-4 py-3">Manual</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article.slug} className="border-b border-[#0D1B2A]/5 last:border-0">
                <td className="px-4 py-3 text-[#8899aa]">{article.module}</td>
                <td className="px-4 py-3 font-semibold text-[#0D1B2A]">{article.title}</td>
                <td className="px-4 py-3">
                  <StatusSelect article={article} onChanged={handleChanged} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
