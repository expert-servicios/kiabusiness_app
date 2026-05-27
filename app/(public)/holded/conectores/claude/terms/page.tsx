import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Términos del conector Claude para Holded | EXPERT',
  description: 'Condiciones de uso del conector Claude para Holded operado por EXPERT.',
  alternates: { canonical: 'https://expertconsulting.es/holded/conectores/claude/terms' },
};

export default function HoldedClaudeTermsPage() {
  return (
    <main className="bg-[#F8F6F1] px-6 py-16 text-[#0D1B2A] md:py-20">
      <div className="mx-auto max-w-3xl">
        <Link href="/holded/conectores/claude" className="text-sm font-semibold text-[#B9871B]">Volver al conector</Link>
        <h1 className="mt-4 font-serif text-4xl font-bold">Términos del conector Claude para Holded</h1>
        <div className="mt-8 space-y-5 text-sm leading-7 text-[#23364D]">
          <p>El conector se ofrece para consultar y preparar información de Holded en lenguaje natural. El usuario es responsable de revisar los resultados antes de tomar decisiones empresariales, contables o fiscales.</p>
          <p>La herramienta no sustituye la revisión profesional. Los borradores generados deben verificarse en Holded antes de aprobarse, enviarse o contabilizarse.</p>
          <p>Está prohibido usar el conector para acciones ilícitas, acceso no autorizado o tratamiento de datos de terceros sin base legal.</p>
        </div>
      </div>
    </main>
  );
}
