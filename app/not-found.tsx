import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F8F6F1] px-6">
      <div className="mx-auto max-w-md text-center">
        <p className="font-serif text-8xl font-bold text-[#D4A017] opacity-30 select-none">404</p>
        <h1 className="mt-2 font-serif text-2xl font-bold text-[#0D1B2A]">
          Página no encontrada
        </h1>
        <p className="mt-3 text-sm leading-7 text-[#23364D]">
          La página que buscas no existe o ha sido movida.
          Si crees que es un error, escríbenos a{' '}
          <a
            href="mailto:info@expertconsulting.es"
            className="font-semibold text-[#D4A017] underline underline-offset-4"
          >
            info@expertconsulting.es
          </a>
          .
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-none bg-[#0D1B2A] px-6 py-3 text-sm font-bold text-[#D4A017] transition hover:bg-[#1a2e47]"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
          <Link
            href="/servicios"
            className="inline-flex items-center gap-2 rounded-none border border-[#D4A017]/40 px-6 py-3 text-sm font-semibold text-[#0D1B2A] transition hover:border-[#D4A017]"
          >
            <Search className="h-4 w-4" />
            Ver servicios
          </Link>
        </div>

        <div className="mt-12 border-t border-[#D4A017]/20 pt-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4A017]">
            EXPERT Asesoría
          </p>
          <p className="mt-1 text-xs text-[#23364D]/60">
            Asesoría fiscal, legal y administrativa en España
          </p>
        </div>
      </div>
    </main>
  );
}
