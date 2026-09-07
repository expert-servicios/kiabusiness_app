import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getPublishedBlogArticles } from '@/lib/utils/blog';
import { BlogExplorer } from '@/components/site/BlogExplorer';
import { NewsletterForm } from '@/components/site/NewsletterForm';

export const metadata: Metadata = {
  title: 'Blog | EXPERT — Fiscalidad, Extranjería y Gestión Administrativa',
  description:
    'Artículos y guías sobre fiscalidad en España, extranjería, gestión de empresas, Holded y trámites administrativos para residentes, expatriados y empresas.',
  openGraph: {
    type: 'website',
    url: 'https://expertconsulting.es/blog',
    title: 'Blog | EXPERT — Fiscalidad, Extranjería y Gestión Administrativa',
    description:
      'Artículos y guías sobre fiscalidad en España, extranjería, gestión de empresas, Holded y trámites administrativos.',
    siteName: 'EXPERT — Asesoría Fiscal y Legal',
    locale: 'es_ES',
    images: [{ url: '/branding/expert%20servicios.png', width: 1200, height: 630, alt: 'Blog EXPERT — Fiscalidad y Extranjería' }]
  },
  twitter: { card: 'summary_large_image', images: ['/branding/expert%20servicios.png'] },
  alternates: { canonical: 'https://expertconsulting.es/blog' }
};

const blogJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Blog EXPERT — Fiscalidad, Extranjería y Gestión Administrativa',
  url: 'https://expertconsulting.es/blog',
  inLanguage: 'es-ES',
  publisher: {
    '@type': 'Organization',
    name: 'EXPERT — Asesoría Fiscal y Legal',
    url: 'https://expertconsulting.es',
    logo: { '@type': 'ImageObject', url: 'https://expertconsulting.es/branding/expert-app.png' },
  },
  blogPost: getPublishedBlogArticles().map((a) => ({
    '@type': 'BlogPosting',
    headline: a.title,
    url: `https://expertconsulting.es/blog/${a.slug}`,
  })),
};

export default function BlogPage() {
  const articleList = getPublishedBlogArticles().map((article) => ({
    slug: article.slug,
    category: article.category,
    title: article.title,
    excerpt: article.excerpt,
    date: article.date,
    readTime: article.readTime,
    tags: article.tags,
    relatedServiceSlugs: article.relatedServiceSlugs
  }));

  const categories = Array.from(new Set(articleList.map((article) => article.category))).sort((a, b) =>
    a.localeCompare(b, 'es')
  );
  const tags = Array.from(new Set(articleList.flatMap((article) => article.tags))).sort((a, b) =>
    a.localeCompare(b, 'es')
  );

  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />
      {/* Hero */}
      <div className="bg-[#0D1B2A] px-6 py-14 text-[#F8F6F1]">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Blog</p>
          <h1 className="mt-3 font-serif text-3xl font-bold md:text-4xl">Guías y artículos sobre fiscalidad en España</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#9CA3AF]">
            Fiscalidad, IA y gestión explicadas sin tecnicismos, para empresarios que quieren entender — no solo delegar.
          </p>
        </div>
      </div>

      {/* Articles */}
      <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <BlogExplorer articles={articleList} categories={categories} tags={tags} />

        {/* Newsletter */}
        <div className="mt-12 bg-[#0D1B2A] p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017]">Alertas fiscales</p>
              <h2 className="mt-2 font-serif text-xl font-bold text-[#F8F6F1] md:text-2xl">
                Recibe los próximos artículos en tu email
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#9CA3AF]">
                Novedades fiscales, cambios en extranjería y guías prácticas. Sin spam. Cancela cuando quieras.
              </p>
            </div>
            <div className="md:min-w-[360px]">
              <NewsletterForm source="blog" variant="dark" layout="horizontal" />
            </div>
          </div>
          <p className="mt-6 border-t border-[#D4A017]/15 pt-4 text-center text-xs text-[#9CA3AF]">
            <Link href="/docs" className="font-semibold text-[#D4A017] transition hover:text-[#F2C14E]">
              ¿Prefieres ir directo a la base de conocimientos? →
            </Link>
          </p>
        </div>

        <div className="mt-6 border border-[#D4A017]/25 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-[#0D1B2A]">Próximamente más artículos</p>
          <p className="mt-2 text-sm text-[#23364D]">
            Publicamos nuevas guías cada semana. Síguenos en{' '}
            <a href="https://www.instagram.com/expert_servicios/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#D4A017] hover:text-[#F2C14E]">Instagram</a>{' '}
            y{' '}
            <a href="https://www.linkedin.com/in/ksenia-ilicheva/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#D4A017] hover:text-[#F2C14E]">LinkedIn</a>{' '}
            para no perderte ninguna.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0D1B2A] px-6 py-12 text-center text-[#F8F6F1]">
        <div className="mx-auto max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">¿Tienes una duda concreta?</p>
          <h2 className="mt-3 font-serif text-2xl font-bold">Pregunta directamente</h2>
          <p className="mt-3 text-sm leading-7 text-[#9CA3AF]">
            Si no encuentras respuesta en el blog, cuéntanos tu caso. Es gratis orientarte.
          </p>
          <Link
            href="/solicitar-presupuesto"
            className="mt-6 inline-flex min-h-11 items-center gap-2 bg-[#D4A017] px-7 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
          >
            Solicitar consulta
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
