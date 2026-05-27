import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacidad del conector Claude para Holded | EXPERT',
  description: 'Política de privacidad específica del conector Claude para Holded operado por EXPERT.',
  alternates: { canonical: 'https://expertconsulting.es/holded/conectores/claude/privacy' },
};

export default function HoldedClaudePrivacyPage() {
  return (
    <LegalPage title="Privacidad del conector Claude para Holded">
      <p>EXPERT trata los datos necesarios para conectar Claude con la cuenta Holded autorizada por el usuario: email, identificador de sesión OAuth, API key cifrada, logs técnicos mínimos y resultados de llamadas a herramientas.</p>
      <p>La API key de Holded se cifra en reposo y no se muestra a Claude, al navegador ni a terceros. Claude recibe únicamente los resultados necesarios de cada herramienta invocada.</p>
      <p>No vendemos datos, no usamos los datos de Holded para marketing ajeno y no entrenamos modelos propios con la información conectada.</p>
    </LegalPage>
  );
}

function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="bg-[#F8F6F1] px-6 py-16 text-[#0D1B2A] md:py-20">
      <div className="mx-auto max-w-3xl">
        <Link href="/holded/conectores/claude" className="text-sm font-semibold text-[#B9871B]">Volver al conector</Link>
        <h1 className="mt-4 font-serif text-4xl font-bold">{title}</h1>
        <div className="mt-8 space-y-5 text-sm leading-7 text-[#23364D]">{children}</div>
      </div>
    </main>
  );
}
