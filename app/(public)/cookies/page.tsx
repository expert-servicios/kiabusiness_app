import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Cookies | EXPERT ESTUDIOS PROFESIONALES',
  description: 'Política de cookies del sitio kseniailicheva.com — qué cookies usamos, para qué y cómo gestionarlas.',
  openGraph: {
    type: 'website',
    url: 'https://kseniailicheva.com/cookies',
    title: 'Política de Cookies | EXPERT',
    description: 'Política de cookies de EXPERT ESTUDIOS PROFESIONALES, SLU.',
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

const cookies = [
  {
    category: 'Técnicas (necesarias)',
    items: [
      {
        name: 'sb-*-auth-token',
        provider: 'Supabase (propia)',
        purpose: 'Mantiene la sesión autenticada del usuario en el área privada.',
        duration: 'Sesión / 1 semana',
        type: 'Primera parte'
      },
      {
        name: 'sb-*-auth-token-code-verifier',
        provider: 'Supabase (propia)',
        purpose: 'Token de verificación PKCE para el flujo OAuth seguro.',
        duration: 'Sesión',
        type: 'Primera parte'
      }
    ]
  },
  {
    category: 'Analíticas (requieren consentimiento)',
    items: [
      {
        name: '_ga',
        provider: 'Google Analytics 4',
        purpose: 'Distingue usuarios únicos para medir el tráfico del sitio de forma agregada.',
        duration: '2 años',
        type: 'Tercera parte (google.com)'
      },
      {
        name: '_ga_XXXXXXXX',
        provider: 'Google Analytics 4',
        purpose: 'Mantiene el estado de la sesión analítica vinculada al contenedor de GA4.',
        duration: '2 años',
        type: 'Tercera parte (google.com)'
      },
      {
        name: '_gid',
        provider: 'Google Analytics 4',
        purpose: 'Identifica al usuario durante 24 horas para medir sesiones de forma agregada.',
        duration: '24 horas',
        type: 'Tercera parte (google.com)'
      }
    ]
  },
  {
    category: 'Funcionales de pago (requieren consentimiento)',
    items: [
      {
        name: '__stripe_mid',
        provider: 'Stripe',
        purpose: 'Prevención de fraude y seguridad en el proceso de pago con Stripe.',
        duration: '1 año',
        type: 'Tercera parte (stripe.com)'
      },
      {
        name: '__stripe_sid',
        provider: 'Stripe',
        purpose: 'Identificación de sesión durante el proceso de pago seguro con Stripe.',
        duration: '30 minutos',
        type: 'Tercera parte (stripe.com)'
      }
    ]
  }
];

export default function CookiesPage() {
  return (
    <main className="bg-[#F8F6F1] px-6 py-16">
      <div className="mx-auto max-w-3xl">

        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017]">Legal</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-[#0D1B2A]">Política de Cookies</h1>
        <p className="mt-3 text-sm text-[#23364D]">Última actualización: {LAST_UPDATED}</p>

        <div className="mt-10 space-y-10">

          <Section title="1. ¿Qué son las cookies?">
            <p>
              Las cookies son pequeños archivos de texto que un sitio web envía al navegador del usuario cuando este lo visita. Permiten que el sitio recuerde información sobre la visita (preferencias de idioma, sesión iniciada, etc.) para facilitar la navegación en visitas posteriores y hacer el sitio más útil.
            </p>
            <p>
              Esta política se aplica al sitio web <strong>kseniailicheva.com</strong>, titularidad de <strong>EXPERT ESTUDIOS PROFESIONALES, SLU</strong> (CIF B44991776), C/ Pintor Agrassot, 19 — 03110 Mutxamel (Alicante), en cumplimiento del artículo 22.2 de la <strong>Ley 34/2002 (LSSI-CE)</strong> y el <strong>Reglamento (UE) 2016/679 (RGPD)</strong>.
            </p>
          </Section>

          <Section title="2. Tipos de cookies que utilizamos">
            <p>Clasificamos las cookies según su finalidad y su origen:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li><strong>Técnicas o necesarias:</strong> imprescindibles para el funcionamiento del sitio (autenticación, seguridad). No requieren consentimiento.</li>
              <li><strong>Analíticas:</strong> permiten conocer el número de visitantes, cómo navegan y qué contenidos son más consultados. Requieren consentimiento previo.</li>
              <li><strong>Funcionales de terceros:</strong> instaladas por proveedores de servicios integrados (Stripe) para garantizar el funcionamiento seguro de sus funciones.</li>
            </ul>
          </Section>

          <Section title="3. Tabla de cookies utilizadas">
            <div className="space-y-8">
              {cookies.map((group) => (
                <div key={group.category}>
                  <h3 className="font-semibold text-[#0D1B2A]">{group.category}</h3>
                  <div className="mt-3 overflow-x-auto rounded-xl border border-[#d8cbb5]">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#0D1B2A] text-[#F8F6F1]">
                          <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                          <th className="px-4 py-3 text-left font-semibold">Proveedor</th>
                          <th className="px-4 py-3 text-left font-semibold">Finalidad</th>
                          <th className="px-4 py-3 text-left font-semibold">Duración</th>
                          <th className="px-4 py-3 text-left font-semibold">Origen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d8cbb5]">
                        {group.items.map((c) => (
                          <tr key={c.name} className="bg-white even:bg-[#F8F6F1]">
                            <td className="px-4 py-3 font-mono font-medium text-[#0D1B2A]">{c.name}</td>
                            <td className="px-4 py-3">{c.provider}</td>
                            <td className="px-4 py-3 leading-5">{c.purpose}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{c.duration}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{c.type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="4. Consentimiento y gestión de cookies">
            <p>
              Las cookies <strong>técnicas</strong> se instalan automáticamente por ser necesarias para el funcionamiento del servicio y no requieren consentimiento.
            </p>
            <p>
              Las cookies <strong>analíticas y funcionales de terceros</strong> solo se activan si el usuario las acepta expresamente a través del banner de cookies que aparece en la primera visita al sitio.
            </p>
            <p>
              Puedes retirar tu consentimiento en cualquier momento o modificar tus preferencias haciendo clic en el enlace <strong>&quot;Gestionar cookies&quot;</strong> disponible en el pie de página del sitio.
            </p>
          </Section>

          <Section title="5. Cómo desactivar o eliminar cookies desde el navegador">
            <p>Independientemente del panel de preferencias del sitio, puedes gestionar las cookies directamente desde la configuración de tu navegador:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-[#D4A017] underline underline-offset-4">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer" className="text-[#D4A017] underline underline-offset-4">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-[#D4A017] underline underline-offset-4">Apple Safari</a></li>
              <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-[#D4A017] underline underline-offset-4">Microsoft Edge</a></li>
            </ul>
            <p>Ten en cuenta que desactivar las cookies técnicas puede impedir el correcto funcionamiento del área privada del sitio.</p>
          </Section>

          <Section title="6. Transferencias internacionales">
            <p>
              Las cookies analíticas de Google Analytics 4 y las funcionales de Stripe implican la transferencia de datos a servidores ubicados en Estados Unidos. Estas transferencias se realizan al amparo de las <strong>Cláusulas Contractuales Tipo</strong> aprobadas por la Comisión Europea, conforme al artículo 46 del RGPD.
            </p>
            <p>
              Para más información sobre el tratamiento de datos de Google, consulta la <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#D4A017] underline underline-offset-4">Política de Privacidad de Google</a>. Para Stripe, consulta la <a href="https://stripe.com/es/privacy" target="_blank" rel="noopener noreferrer" className="text-[#D4A017] underline underline-offset-4">Política de Privacidad de Stripe</a>.
            </p>
          </Section>

          <Section title="7. Actualizaciones de esta política">
            <p>
              Podemos actualizar esta Política de Cookies para reflejar cambios en las cookies que utilizamos o en la normativa aplicable. Cualquier modificación relevante se comunicará mediante un aviso en el sitio web. La fecha de la última actualización figura al inicio de este documento.
            </p>
          </Section>

          <Section title="8. Contacto">
            <p>
              Si tienes dudas sobre el uso de cookies en este sitio, puedes contactar con nosotros en <a href="mailto:soy@kseniailicheva.com" className="text-[#D4A017] underline underline-offset-4">soy@kseniailicheva.com</a>.
            </p>
          </Section>

          <div className="border-t border-[#D4A017]/25 pt-8">
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/privacidad" className="font-semibold text-[#D4A017] hover:text-[#F2C14E]">Política de Privacidad</Link>
              <Link href="/aviso-legal" className="font-semibold text-[#D4A017] hover:text-[#F2C14E]">Aviso Legal</Link>
              <Link href="/terminos" className="font-semibold text-[#D4A017] hover:text-[#F2C14E]">Términos y Condiciones</Link>
              <Link href="/condiciones" className="font-semibold text-[#D4A017] hover:text-[#F2C14E]">Condiciones de Contratación</Link>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
