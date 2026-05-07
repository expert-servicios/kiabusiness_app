import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Condiciones de Contratación | EXPERT ESTUDIOS PROFESIONALES',
  description: 'Condiciones generales de contratación de servicios en EXPERT ESTUDIOS PROFESIONALES, SLU.',
  openGraph: {
    type: 'website',
    url: 'https://kseniailicheva.com/condiciones',
    title: 'Condiciones de Contratación | EXPERT',
    description: 'Condiciones generales de contratación de servicios en EXPERT ESTUDIOS PROFESIONALES, SLU.',
    siteName: 'EXPERT — Asesoría Fiscal y Legal',
    locale: 'es_ES'
  }
};

export default function CondicionesPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-serif text-4xl">Condiciones de Contratación</h1>
      <section className="mt-8 space-y-6 text-base leading-8 text-brand-slate">
        <p>Estas condiciones regulan la contratación de servicios de EXPERT ESTUDIOS PROFESIONALES, SLU a través de este sitio web.</p>
        <div>
          <h2 className="font-semibold text-2xl">Ámbito</h2>
          <p>Las presentes condiciones se aplican a todas las contrataciones de servicios ofrecidos en el sitio web y a la prestación de los mismos por parte de EXPERT ESTUDIOS PROFESIONALES, SLU.</p>
        </div>
        <div>
          <h2 className="font-semibold text-2xl">Proceso de contratación</h2>
          <p>El cliente solicita un servicio, recibe un presupuesto y confirma el pago a través de Stripe. La contratación se formaliza una vez que se realiza el pago y se crea la orden correspondiente.</p>
        </div>
        <div>
          <h2 className="font-semibold text-2xl">Precios y pagos</h2>
          <p>Los precios indicados pueden estar sujetos a impuestos y se liquidan en euros. El pago se realiza mediante la pasarela Stripe, cuyo servicio está sujeto a sus propios términos.</p>
        </div>
        <div>
          <h2 className="font-semibold text-2xl">Cancelaciones y devoluciones</h2>
          <p>Las condiciones de cancelación y devolución se aplican según el servicio contratado y las condiciones específicas acordadas. En general, la prestación de servicios profesionales se rige por la normativa vigente y la situación particular de cada encargo.</p>
        </div>
      </section>
    </main>
  );
}
