import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Lock } from 'lucide-react';
import { getAcademyKnowledgeArticles } from '@/lib/utils/academy-knowledge';
import { getActiveEnrollment } from '@/lib/utils/academy-enrollment';
import { AcademyKnowledgeIndex } from '@/components/docs/AcademyKnowledgeIndex';

const PROGRAM_SLUG = 'gestion-laboral-integral';

export const metadata: Metadata = {
  title: 'Base de conocimientos — Gestión Laboral Integral | EXPERT',
  description:
    'Manuales operativos del Programa de Gestión Laboral Integral: configuración, contratación, nóminas, SILTRA, variaciones, bajas y cierre laboral.',
  alternates: { canonical: 'https://expertconsulting.es/docs/laboral' },
  robots: { index: false, follow: true }, // the index only teases private content — not worth ranking on its own
};

export default async function AcademyKnowledgeIndexPage() {
  const articles = getAcademyKnowledgeArticles();
  const { enrolled } = await getActiveEnrollment(PROGRAM_SLUG);

  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <section className="bg-[#0D1B2A] px-6 py-14 text-[#F8F6F1]">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017]">EXPERT Business Academy</p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight md:text-5xl">
            Base de conocimientos laboral
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#9CA3AF]">
            Manuales operativos del Programa de Gestión Laboral Integral, desde la configuración inicial hasta el
            cierre mensual y anual.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9CA3AF]">
            Filtra los contenidos por fase del ciclo laboral o por herramienta: Holded, Sistema RED, SILTRA,
            DelegaRed, NetContrata, Contrat@, Certific@2, TGSS, SEPE y AEAT.
          </p>
          {!enrolled && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-md border border-white/15 px-4 py-2 text-sm text-[#9CA3AF]">
              <Lock className="h-4 w-4 text-[#D4A017]" />
              Los manuales marcados como privados requieren matrícula activa
            </div>
          )}
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <AcademyKnowledgeIndex
            enrolled={enrolled}
            articles={articles.map((article) => ({
              slug: article.slug,
              title: article.title,
              module: article.module,
              access: article.access,
              status: article.status,
              readTime: article.readTime,
              tags: article.tags,
              phase: article.phase,
              tools: article.tools,
            }))}
          />

          {!enrolled && (
            <div className="mt-10 flex flex-col items-center gap-3 border border-[#D4A017]/30 bg-white p-8 text-center">
              <BookOpen className="h-8 w-8 text-[#D4A017]" />
              <p className="max-w-md text-sm leading-6 text-[#23364D]">
                Los manuales completos de configuración, contratación, nóminas, SILTRA, variaciones, bajas y cierre
                laboral están disponibles para alumnos matriculados en el Programa de Gestión Laboral Integral.
              </p>
              <Link
                href="/academy/gestion-laboral-integral"
                className="mt-2 inline-flex items-center gap-2 bg-[#D4A017] px-6 py-3 text-sm font-bold uppercase tracking-wide text-[#0D1B2A] transition hover:bg-[#F2C14E]"
              >
                Ver el programa
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
