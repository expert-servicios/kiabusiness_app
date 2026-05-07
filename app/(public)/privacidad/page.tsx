import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad | EXPERT ESTUDIOS PROFESIONALES',
  description: 'Política de privacidad para la web de EXPERT ESTUDIOS PROFESIONALES, SLU.',
  openGraph: {
    type: 'website',
    url: 'https://kseniailicheva.com/privacidad',
    title: 'Política de Privacidad | EXPERT',
    description: 'Política de privacidad para la web de EXPERT ESTUDIOS PROFESIONALES, SLU.',
    siteName: 'EXPERT — Asesoría Fiscal y Legal',
    locale: 'es_ES'
  }
};

export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-serif text-4xl">Política de Privacidad</h1>
      <section className="mt-8 space-y-6 text-base leading-8 text-brand-slate">
        <p>En EXPERT ESTUDIOS PROFESIONALES, SLU nos comprometemos a proteger tus datos personales y a garantizar su privacidad.</p>
        <div>
          <h2 className="font-semibold text-2xl">Responsable del tratamiento</h2>
          <p>EXPERT ESTUDIOS PROFESIONALES, SLU<br />CIF: B44991776<br />C/ Pintor Agrassot, 19 - 03110 Mutxamel (Alicante)<br />Correo: soy@kseniailicheva.com</p>
        </div>
        <div>
          <h2 className="font-semibold text-2xl">Finalidad</h2>
          <p>Tratamos tus datos para gestionar solicitudes de presupuesto, contratos de servicios, comunicaciones comerciales y operativas, envíos de facturas y atención al cliente.</p>
        </div>
        <div>
          <h2 className="font-semibold text-2xl">Legitimación</h2>
          <p>La base legal para el tratamiento es el consentimiento del interesado y la necesidad de gestión contractualmente derivada de la prestación de los servicios solicitados.</p>
        </div>
        <div>
          <h2 className="font-semibold text-2xl">Derechos</h2>
          <p>Puedes ejercitar los derechos de acceso, rectificación, supresión, limitación, oposición y portabilidad mediante correo a soy@kseniailicheva.com.</p>
        </div>
      </section>
    </main>
  );
}
