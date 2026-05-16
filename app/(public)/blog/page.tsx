import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { blogArticles } from '@/lib/utils/blog';
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
    locale: 'es_ES'
  }
};

const categoryColors: Record<string, string> = {
  Fiscalidad: 'text-[#D4A017] border-[#D4A017]/40 bg-[#D4A017]/10',
  Extranjería: 'text-blue-400 border-blue-400/40 bg-blue-400/10',
  Empresas: 'text-emerald-400 border-emerald-400/40 bg-emerald-400/10',
  Holded: 'text-rose-400 border-rose-400/40 bg-rose-400/10',
  Trámites: 'text-purple-400 border-purple-400/40 bg-purple-400/10'
};

export default function BlogPage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      {/* Hero */}
      <div className="bg-[#0D1B2A] px-6 py-14 text-[#F8F6F1]">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Blog</p>
          <h1 className="mt-3 font-serif text-3xl font-bold md:text-4xl">Guías y artículos sobre fiscalidad en España</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#9CA3AF]">
            Contenido práctico sobre impuestos, extranjería, gestión de empresas y herramientas digitales. Sin jerga innecesaria.
          </p>
        </div>
      </div>

      {/* Articles */}
      <section className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogArticles.map((article) => {
            const colorClass = categoryColors[article.category] ?? 'text-[#D4A017] border-[#D4A017]/40';
            return (
              <article
                key={article.slug}
                className="flex flex-col border border-[#D4A017]/20 bg-white shadow-[0_4px_16px_rgba(13,27,42,0.06)] transition hover:-translate-y-0.5 hover:border-[#D4A017]/50 hover:shadow-[0_10px_28px_rgba(13,27,42,0.10)]"
              >
                <div className="flex flex-1 flex-col p-5">
                  <span className={`inline-block self-start border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${colorClass}`}>
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
