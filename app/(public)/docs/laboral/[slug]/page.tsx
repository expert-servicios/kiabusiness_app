import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Lock, ShieldCheck } from 'lucide-react';
import { getAcademyKnowledgeArticle, getAcademyKnowledgeArticles } from '@/lib/utils/academy-knowledge';
import { getActiveEnrollment } from '@/lib/utils/academy-enrollment';
import { AcademyKnowledgeArticleBody } from '@/components/docs/AcademyKnowledgeArticle';

const PROGRAM_SLUG = 'gestion-laboral-integral';

// Only public articles are statically generated — student-gated articles
// are rendered dynamically per-request so the access check always runs
// against the live session (no stale static HTML leaking gated content).
export function generateStaticParams() {
  return getAcademyKnowledgeArticles()
    .filter((a) => a.access === 'public')
    .map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getAcademyKnowledgeArticle(slug);
  if (!article) return {};

  const canonicalUrl = `https://expertconsulting.es/docs/laboral/${slug}`;
  return {
    title: `${article.title} | Base de conocimientos — Gestión Laboral Integral`,
    description: article.access === 'public'
      ? article.title
      : 'Manual privado del Programa de Gestión Laboral Integral — requiere matrícula activa.',
    keywords: article.tags,
    alternates: { canonical: canonicalUrl },
    // Student-gated manuals must never be indexed — they aren't public content.
    robots: article.access === 'student' ? { index: false, follow: false } : undefined,
  };
}

export default async function AcademyKnowledgeArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getAcademyKnowledgeArticle(slug);
  if (!article) notFound();

  const isPublic = article.access === 'public';
  const { user, enrolled } = isPublic
    ? { user: null, enrolled: false }
    : await getActiveEnrollment(PROGRAM_SLUG);
  const hasAccess = isPublic || enrolled;

  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <section className="bg-[#0D1B2A] px-6 py-14 text-[#F8F6F1]">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/docs/laboral"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#9CA3AF] transition hover:text-[#D4A017]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Base de conocimientos laboral
          </Link>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017]">
            Módulo {article.module} {!isPublic && '· Manual privado'}
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-3xl font-bold leading-tight md:text-5xl">{article.title}</h1>
          {article.readTime && (
            <div className="mt-6 flex items-center gap-2 text-sm text-[#9CA3AF]">
              <Clock className="h-4 w-4 text-[#D4A017]" />
              {article.readTime}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-14">
        {hasAccess ? (
          <AcademyKnowledgeArticleBody body={article.body} />
        ) : (
          <div className="border border-[#D4A017]/30 bg-white p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#D4A017]/15">
              <Lock className="h-7 w-7 text-[#D4A017]" />
            </div>
            <h2 className="mt-5 font-serif text-2xl font-bold text-[#0D1B2A]">Manual exclusivo para alumnos</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#23364D]">
              {user
                ? 'Tu cuenta no tiene una matrícula activa en el Programa de Gestión Laboral Integral. Este manual solo está disponible para alumnos matriculados.'
                : 'Inicia sesión con una cuenta matriculada en el Programa de Gestión Laboral Integral para acceder a este manual.'}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/academy/gestion-laboral-integral"
                className="inline-flex items-center gap-2 bg-[#D4A017] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
              >
                Ver el programa
              </Link>
              {!user && (
                <Link
                  href={`/auth/login?redirect=/docs/laboral/${slug}`}
                  className="inline-flex items-center gap-2 border border-[#0D1B2A]/20 px-6 py-3 text-sm font-semibold text-[#0D1B2A] transition hover:border-[#D4A017]"
                >
                  Iniciar sesión
                </Link>
              )}
            </div>
            <p className="mx-auto mt-6 flex max-w-md items-start gap-2 text-left text-xs leading-5 text-[#8899aa]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
              Este manual es un material de trabajo (estado: borrador) pendiente de validación funcional — no debe
              usarse como única referencia para un trámite con plazo inmediato.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
