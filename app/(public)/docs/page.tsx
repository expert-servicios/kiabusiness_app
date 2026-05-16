import type { Metadata } from 'next';
import { NewsletterForm } from '@/components/site/NewsletterForm';
import { DocsExplorer } from '@/components/docs/DocsExplorer';
import { docCategories, docs, getAllDocTags } from '@/lib/utils/docs';

export const metadata: Metadata = {
  title: 'Base de conocimientos | Guías de trámites en España | EXPERT',
  description:
    'Guías detalladas sobre extranjería, nacionalidad, fiscalidad, empresas, trámites administrativos y Holded. Busca por tema, categoría o tag.',
  alternates: {
    canonical: 'https://expertconsulting.es/docs'
  },
  openGraph: {
    title: 'Base de conocimientos | EXPERT',
    description:
      'Guías detalladas sobre trámites en España: extranjería, nacionalidad, fiscalidad, empresas y gestión administrativa.',
    url: 'https://expertconsulting.es/docs',
    type: 'website'
  }
};

export default function DocsPage() {
  const docList = docs.map((doc) => ({
    slug: doc.slug,
    category: doc.category,
    title: doc.title,
    excerpt: doc.excerpt,
    tags: doc.tags,
    updatedAt: doc.updatedAt,
    readTime: doc.readTime,
    relatedServiceSlugs: doc.relatedServiceSlugs,
    relatedServiceCategories: doc.relatedServiceCategories,
    seoTitle: doc.seoTitle,
    seoDescription: doc.seoDescription
  }));

  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <section className="bg-[#0D1B2A] px-6 py-14 text-[#F8F6F1]">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Docs</p>
          <h1 className="mt-3 max-w-3xl font-serif text-3xl font-bold leading-tight md:text-5xl">
            Base de conocimientos para trámites en España
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[#9CA3AF]">
            Guías detalladas, ordenadas por trámite, para revisar requisitos, documentos, tasas, plazos y puntos críticos antes de empezar.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <DocsExplorer docs={docList} categories={docCategories} tags={getAllDocTags()} />
      </section>

      <section className="bg-[#0D1B2A] px-6 py-12 text-[#F8F6F1]">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Novedades</p>
            <h2 className="mt-3 font-serif text-2xl font-bold">Recibe nuevas guías y avisos prácticos</h2>
            <p className="mt-3 text-sm leading-6 text-[#9CA3AF]">
              Te avisaremos cuando publiquemos nuevos trámites, cambios normativos relevantes o mejoras en la base de conocimientos.
            </p>
          </div>
          <NewsletterForm source="docs" variant="dark" layout="horizontal" />
        </div>
      </section>
    </main>
  );
}
