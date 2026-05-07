import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aviso Legal | EXPERT ESTUDIOS PROFESIONALES',
  description: 'Información legal y datos de la empresa EXPERT ESTUDIOS PROFESIONALES, SLU.',
  openGraph: {
    type: 'website',
    url: 'https://kseniailicheva.com/aviso-legal',
    title: 'Aviso Legal | EXPERT ESTUDIOS PROFESIONALES',
    description: 'Información legal y datos de la empresa EXPERT ESTUDIOS PROFESIONALES, SLU.',
    siteName: 'EXPERT — Asesoría Fiscal y Legal',
    locale: 'es_ES'
  }
};

export default function AvisoLegalPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-serif text-4xl">Aviso Legal</h1>
      <section className="mt-8 space-y-6 text-base leading-8 text-brand-slate">
        <p>La presente página de aviso legal regula el uso del sitio web de EXPERT ESTUDIOS PROFESIONALES, SLU.</p>
        <div>
          <h2 className="font-semibold text-2xl">Datos de la empresa</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>Nombre: EXPERT ESTUDIOS PROFESIONALES, SLU</li>
            <li>CIF: B44991776</li>
            <li>Dirección: C/ Pintor Agrassot, 19 - 03110 Mutxamel (Alicante)</li>
            <li>Correo: soy@kseniailicheva.com</li>
            <li>WhatsApp Business: +34 696 55 04 80</li>
            <li>Sitio web: kseniailicheva.com</li>
          </ul>
        </div>
        <div>
          <h2 className="font-semibold text-2xl">Objeto</h2>
          <p>Este sitio web ofrece información sobre servicios de asesoría fiscal, legal y administrativa, y permite la solicitud de presupuestos, contratación de servicios y acceso a áreas privadas para clientes y administración.</p>
        </div>
        <div>
          <h2 className="font-semibold text-2xl">Propiedad intelectual</h2>
          <p>Todos los contenidos, diseños, textos, imágenes, logotipos y códigos presentes en este sitio son propiedad de EXPERT ESTUDIOS PROFESIONALES, SLU o de sus legítimos titulares, y están protegidos por la normativa de propiedad intelectual.</p>
        </div>
        <div>
          <h2 className="font-semibold text-2xl">Responsabilidad</h2>
          <p>El acceso y uso del sitio es responsabilidad del usuario. EXPERT ESTUDIOS PROFESIONALES, SLU no se hace responsable de los daños derivados del uso inadecuado de la información contenida en el sitio.</p>
        </div>
      </section>
    </main>
  );
}
