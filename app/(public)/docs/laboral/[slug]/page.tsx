import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CalendarDays, Clock, Lock, ShieldCheck } from 'lucide-react';
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

  const articles = getAcademyKnowledgeArticles();
  const articleIndex = articles.findIndex((item) => item.slug === slug);
  const previousArticle = articleIndex > 0 ? articles[articleIndex - 1] : undefined;
  const nextArticle = articleIndex >= 0 && articleIndex < articles.length - 1 ? articles[articleIndex + 1] : undefined;

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
            Módulo {article.module} · {article.phase} {!isPublic && '· Manual privado'}
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-3xl font-bold leading-tight md:text-5xl">{article.title}</h1>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#9CA3AF]">
            {article.readTime && <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-[#D4A017]" />{article.readTime}</span>}
            <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#D4A017]" />Revisado {formatDate(article.updatedAt)}</span>
            <span className="border border-white/15 px-2 py-1 text-xs font-semibold uppercase tracking-wide">
              {statusLabel(article.status)}
            </span>
          </div>
          {article.tools.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {article.tools.map((tool) => <span key={tool} className="bg-white/8 px-2.5 py-1 text-xs text-[#F8F6F1]">{tool}</span>)}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-14">
        {hasAccess ? (
          <>
            {article.status !== 'validated' && (
              <div className="mb-8 flex items-start gap-3 border border-[#D4A017]/35 bg-[#D4A017]/8 p-4 text-sm leading-6 text-[#23364D]">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#A97600]" />
                <p>Material en {article.status === 'review' ? 'revisión' : 'borrador'}. Contrasta plazos y datos sensibles con la fuente oficial vigente antes de ejecutar un trámite real.</p>
              </div>
            )}
            <AcademyKnowledgeArticleBody body={article.body} />
            <nav aria-label="Navegación entre manuales" className="mt-14 grid gap-3 border-t border-[#D4A017]/25 pt-8 sm:grid-cols-2">
              {previousArticle ? (
                <Link href={`/docs/laboral/${previousArticle.slug}`} className="group border border-[#0D1B2A]/15 bg-white p-4 transition hover:border-[#D4A017]">
                  <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#8899aa]"><ArrowLeft className="h-3.5 w-3.5" />Anterior</span>
                  <span className="mt-2 block font-serif font-bold text-[#0D1B2A] group-hover:text-[#A97600]">{previousArticle.title}</span>
                </Link>
              ) : <span />}
              {nextArticle && (
                <Link href={`/docs/laboral/${nextArticle.slug}`} className="group border border-[#0D1B2A]/15 bg-white p-4 text-right transition hover:border-[#D4A017]">
                  <span className="flex items-center justify-end gap-2 text-xs font-semibold uppercase tracking-wide text-[#8899aa]">Siguiente<ArrowRight className="h-3.5 w-3.5" /></span>
                  <span className="mt-2 block font-serif font-bold text-[#0D1B2A] group-hover:text-[#A97600]">{nextArticle.title}</span>
                </Link>
              )}
            </nav>
          </>
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
                  href={`/auth/login?next=${encodeURIComponent(`/docs/laboral/${slug}`)}`}
                  className="inline-flex items-center gap-2 border border-[#0D1B2A]/20 px-6 py-3 text-sm font-semibold text-[#0D1B2A] transition hover:border-[#D4A017]"
                >
                  Iniciar sesión
                </Link>
              )}
            </div>
            <p className="mx-auto mt-6 flex max-w-md items-start gap-2 text-left text-xs leading-5 text-[#8899aa]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A017]" />
              Este manual es un material de trabajo (estado: {statusLabel(article.status).toLocaleLowerCase('es')}) pendiente de validación funcional — no debe
              usarse como única referencia para un trámite con plazo inmediato.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: 'Borrador',
    review: 'En revisión',
    validated: 'Validado',
    pending_update: 'Actualización pendiente',
    outdated: 'No vigente',
  };
  return labels[status] ?? status;
}

function formatDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(Date.UTC(year, month - 1, day)));
}
