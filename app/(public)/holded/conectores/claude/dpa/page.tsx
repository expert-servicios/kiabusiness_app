import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'DPA del conector Claude para Holded | EXPERT',
  description: 'Acuerdo de tratamiento de datos para el conector Claude para Holded.',
  alternates: { canonical: 'https://expertconsulting.es/holded/conectores/claude/dpa' },
};

export default function HoldedClaudeDpaPage() {
  return (
    <main className="bg-[#F8F6F1] px-6 py-16 text-[#0D1B2A] md:py-20">
      <div className="mx-auto max-w-3xl">
        <Link href="/holded/conectores/claude" className="text-sm font-semibold text-[#B9871B]">Volver al conector</Link>
        <h1 className="mt-4 font-serif text-4xl font-bold">DPA del conector Claude para Holded</h1>
        <div className="mt-8 space-y-5 text-sm leading-7 text-[#23364D]">
          <p>EXPERT actúa como encargado del tratamiento para operar la conexión técnica entre Claude y Holded a petición del usuario.</p>
          <p>El tratamiento se limita a autenticación OAuth, almacenamiento cifrado de credenciales, ejecución de herramientas autorizadas, logs técnicos y soporte.</p>
          <p>Anthropic puede actuar como subencargado o proveedor tecnológico cuando el usuario invoca herramientas desde Claude, de acuerdo con sus propias condiciones aplicables.</p>
          <p>El usuario puede revocar la conexión desde Claude o solicitar soporte escribiendo a info@expertconsulting.es.</p>
        </div>
      </div>
    </main>
  );
}
