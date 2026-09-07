import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { temas } from '@/lib/utils/taxonomy';

export const metadata: Metadata = {
  title: 'Categorías | Servicios, guías y artículos por tema | EXPERT',
  description:
    'Explora servicios, guías de la base de conocimientos y artículos del blog agrupados por tema: fiscalidad, extranjería, empresas, Holded, trámites y formación.',
  alternates: { canonical: 'https://expertconsulting.es/categoria' }
};

export default function CategoriaIndexPage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <div className="brand-blue-bg px-6 py-16 text-[#F8F6F1] md:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Categorías</p>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight md:text-5xl">
            Todo por tema: servicios, guías y artículos
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#9CA3AF] md:text-lg">
            Cada categoría reúne en un solo lugar los servicios que ofrecemos, las guías de la base de conocimientos y los artículos del blog relacionados.
          </p>
        </div>
      </div>

      <section className="px-6 py-14 md:py-18">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
          {temas.map((tema) => (
            <Link
              key={tema.slug}
              href={`/categoria/${tema.slug}`}
              className="group flex flex-col border border-[#D4A017]/20 bg-white p-6 shadow-[0_4px_16px_rgba(13,27,42,0.06)] transition hover:-translate-y-0.5 hover:border-[#D4A017] hover:shadow-[0_10px_28px_rgba(13,27,42,0.10)]"
            >
              <h2 className="font-serif text-xl font-bold text-[#0D1B2A] group-hover:text-[#D4A017]">{tema.name}</h2>
              <p className="mt-3 flex-1 text-sm leading-6 text-[#23364D]">{tema.description}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#D4A017] transition group-hover:text-[#F2C14E]">
                Explorar
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <nav className="px-6 py-4 text-xs text-[#9CA3AF]">
        <div className="mx-auto flex max-w-5xl gap-2">
          <Link href="/" className="hover:text-[#D4A017]">Inicio</Link>
          <span>/</span>
          <span className="text-[#0D1B2A]">Categorías</span>
        </div>
      </nav>
    </main>
  );
}
