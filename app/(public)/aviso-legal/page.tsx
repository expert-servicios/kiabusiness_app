import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Aviso Legal | EXPERT ESTUDIOS PROFESIONALES, SLU',
  description: 'Aviso legal del sitio web kseniailicheva.com — EXPERT ESTUDIOS PROFESIONALES, SLU. Información exigida por la LSSI-CE.',
  openGraph: {
    type: 'website',
    url: 'https://kseniailicheva.com/aviso-legal',
    title: 'Aviso Legal | EXPERT ESTUDIOS PROFESIONALES',
    description: 'Aviso legal del sitio web kseniailicheva.com — EXPERT ESTUDIOS PROFESIONALES, SLU.',
    siteName: 'EXPERT — Asesoría Fiscal y Legal',
    locale: 'es_ES'
  }
};

const LAST_UPDATED = '8 de mayo de 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-2xl font-bold text-[#0D1B2A]">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-7 text-[#23364D]">{children}</div>
    </section>
  );
}

export default function AvisoLegalPage() {
  return (
    <main className="bg-[#F8F6F1] px-6 py-16">
      <div className="mx-auto max-w-3xl">

        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017]">Legal</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-[#0D1B2A]">Aviso Legal</h1>
        <p className="mt-3 text-sm text-[#23364D]">
          En cumplimiento de la <strong>Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSI-CE)</strong>, se facilita la siguiente información sobre el titular del sitio web.
        </p>
        <p className="mt-1 text-xs text-[#9CA3AF]">Última actualización: {LAST_UPDATED}</p>

        <div className="mt-10 space-y-10">

          <Section title="1. Datos identificativos del titular">
            <div className="overflow-hidden rounded-xl border border-[#d8cbb5] bg-white">
              {[
                ['Denominación social', 'EXPERT ESTUDIOS PROFESIONALES, SLU'],
                ['CIF', 'B44991776'],
                ['Domicilio social', 'C/ Pintor Agrassot, 19 — 03110 Mutxamel (Alicante), España'],
                ['Correo electrónico', 'soy@kseniailicheva.com'],
                ['Teléfono / WhatsApp Business', '+34 696 55 04 80'],
                ['Sitio web', 'https://kseniailicheva.com'],
                ['Inscripción registral', 'Inscrita en el Registro Mercantil de Alicante'],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1 border-b border-[#f0e8d8] px-5 py-3 last:border-b-0 sm:flex-row sm:gap-4">
                  <span className="w-52 shrink-0 text-xs font-bold uppercase tracking-wide text-[#c88b25]">{label}</span>
                  <span className="text-sm text-[#0D1B2A]">{value}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="2. Objeto del sitio web">
            <p>
              El sitio web <strong>kseniailicheva.com</strong> es la plataforma digital de EXPERT ESTUDIOS PROFESIONALES, SLU, a través de la cual se ofrece información sobre servicios de asesoría fiscal, legal y administrativa, se posibilita la solicitud de presupuestos y la contratación de servicios profesionales, y se facilita el acceso al área privada de cliente.
            </p>
            <p>
              El acceso y uso del sitio web implica la aceptación de las condiciones establecidas en el presente Aviso Legal, así como en la <Link href="/privacidad" className="text-[#D4A017] underline underline-offset-4">Política de Privacidad</Link>, la <Link href="/cookies" className="text-[#D4A017] underline underline-offset-4">Política de Cookies</Link> y los <Link href="/terminos" className="text-[#D4A017] underline underline-offset-4">Términos y Condiciones</Link>.
            </p>
          </Section>

          <Section title="3. Propiedad intelectual e industrial">
            <p>
              Todos los contenidos del sitio web — incluyendo, sin carácter limitativo, textos, imágenes, logotipos, gráficos, vídeos, diseño gráfico, código fuente y estructura — son propiedad de EXPERT ESTUDIOS PROFESIONALES, SLU o de sus legítimos licenciantes, y están protegidos por la legislación española e internacional en materia de propiedad intelectual e industrial.
            </p>
            <p>
              Queda expresamente prohibida la reproducción total o parcial, la distribución, transformación o comunicación pública de los contenidos de este sitio web sin la autorización previa, expresa y por escrito de EXPERT ESTUDIOS PROFESIONALES, SLU, salvo en los casos en que la ley expresamente lo permita.
            </p>
            <p>
              El usuario puede visualizar los contenidos y realizar copias privadas para su uso personal, no comercial, siempre que no se vulneren los derechos de propiedad intelectual.
            </p>
          </Section>

          <Section title="4. Condiciones de uso y responsabilidad">
            <p>
              El usuario se compromete a hacer un uso lícito del sitio web, a no realizar actividades que puedan dañar, inutilizar, sobrecargar o deteriorar el sitio, y a no utilizar los contenidos con fines ilícitos, lesivos o contrarios a las presentes condiciones, a la moral o al orden público.
            </p>
            <p>
              EXPERT ESTUDIOS PROFESIONALES, SLU no se hace responsable de:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Los daños derivados de la interrupción, suspensión o mal funcionamiento del sitio web por causas ajenas a su voluntad.</li>
              <li>Los daños o perjuicios derivados del uso indebido de los contenidos del sitio.</li>
              <li>El contenido de sitios web de terceros enlazados desde este sitio, sobre los que no ejerce ningún control.</li>
              <li>Los virus u otros elementos perjudiciales que puedan introducirse en los equipos del usuario a través de la navegación por el sitio.</li>
            </ul>
            <p>
              EXPERT ESTUDIOS PROFESIONALES, SLU se reserva el derecho a modificar, suspender o interrumpir el acceso al sitio web sin previo aviso.
            </p>
          </Section>

          <Section title="5. Enlaces a terceros">
            <p>
              El sitio web puede contener enlaces a páginas web de terceros (Calendly, Stripe, Holded, entre otros). Estos enlaces se facilitan únicamente a título informativo. EXPERT ESTUDIOS PROFESIONALES, SLU no tiene control sobre dichos sitios ni asume responsabilidad alguna por su contenido, exactitud, legalidad o disponibilidad.
            </p>
          </Section>

          <Section title="6. Legislación aplicable y jurisdicción">
            <p>
              El presente Aviso Legal se rige por la legislación española, en particular por la <strong>Ley 34/2002, de 11 de julio (LSSI-CE)</strong>, el <strong>Real Decreto Legislativo 1/2007</strong> (Ley General para la Defensa de los Consumidores y Usuarios) y las demás normas de aplicación.
            </p>
            <p>
              Para la resolución de cualquier controversia derivada del acceso o uso de este sitio web, las partes se someten a los Juzgados y Tribunales del domicilio del consumidor, de conformidad con la normativa vigente de protección de consumidores.
            </p>
            <p>
              Para usuarios no consumidores, las partes se someten a los Juzgados y Tribunales de Alicante, con renuncia expresa a cualquier otro fuero que pudiera corresponderles.
            </p>
          </Section>

          <Section title="7. Resolución extrajudicial de conflictos">
            <p>
              De conformidad con el Reglamento (UE) nº 524/2013, los consumidores de la Unión Europea pueden acceder a la plataforma de resolución de litigios en línea de la Comisión Europea disponible en{' '}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-[#D4A017] underline underline-offset-4">
                ec.europa.eu/consumers/odr
              </a>
              . Nuestro correo electrónico de contacto a estos efectos es <a href="mailto:soy@kseniailicheva.com" className="text-[#D4A017] underline underline-offset-4">soy@kseniailicheva.com</a>.
            </p>
          </Section>

          <Section title="8. Contacto">
            <p>
              Para cualquier consulta relacionada con el presente Aviso Legal, puedes contactar con nosotros en <a href="mailto:soy@kseniailicheva.com" className="text-[#D4A017] underline underline-offset-4">soy@kseniailicheva.com</a> o en nuestra dirección postal: C/ Pintor Agrassot, 19 — 03110 Mutxamel (Alicante), España.
            </p>
          </Section>

          <div className="border-t border-[#D4A017]/25 pt-8">
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/privacidad" className="font-semibold text-[#D4A017] hover:text-[#F2C14E]">Política de Privacidad</Link>
              <Link href="/cookies" className="font-semibold text-[#D4A017] hover:text-[#F2C14E]">Política de Cookies</Link>
              <Link href="/terminos" className="font-semibold text-[#D4A017] hover:text-[#F2C14E]">Términos y Condiciones</Link>
              <Link href="/condiciones" className="font-semibold text-[#D4A017] hover:text-[#F2C14E]">Condiciones de Contratación</Link>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
