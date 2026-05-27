import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Soporte del conector Claude para Holded | EXPERT',
  description: 'Soporte para instalar, conectar o revocar el conector Claude para Holded.',
  alternates: { canonical: 'https://expertconsulting.es/holded/conectores/claude/soporte' },
};

export default function HoldedClaudeSupportPage() {
  return (
    <main className="bg-[#F8F6F1] px-6 py-16 text-[#0D1B2A] md:py-20">
      <div className="mx-auto max-w-3xl">
        <Link href="/holded/conectores/claude" className="text-sm font-semibold text-[#B9871B]">Volver al conector</Link>
        <h1 className="mt-4 font-serif text-4xl font-bold">Soporte del conector Claude para Holded</h1>
        <div className="mt-8 space-y-5 text-sm leading-7 text-[#23364D]">
          <p>Para ayuda con instalación, OAuth, API key de Holded, permisos o revocación, escríbenos a info@expertconsulting.es.</p>
          <p>Si el problema afecta a datos contables, adjunta una descripción breve del caso, la hora aproximada del fallo y la herramienta de Claude usada.</p>
          <p>No envíes API keys por email o WhatsApp. Te indicaremos el canal seguro si necesitamos revisar la conexión.</p>
        </div>
      </div>
    </main>
  );
}
