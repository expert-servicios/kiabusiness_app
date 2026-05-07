import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Términos y Condiciones | EXPERT',
  description:
    'Términos y condiciones de uso de los servicios de EXPERT — asesoría fiscal, legal y administrativa en España.',
  openGraph: {
    type: 'website',
    url: 'https://kseniailicheva.com/terminos',
    title: 'Términos y Condiciones | EXPERT',
    description: 'Términos y condiciones de uso de los servicios de EXPERT.',
    siteName: 'EXPERT — Asesoría Fiscal y Legal',
    locale: 'es_ES'
  }
};

export default function TerminosPage() {
  return (
    <main className="bg-[#F8F6F1] text-[#0D1B2A]">
      <div className="brand-blue-bg px-6 py-14 text-[#F8F6F1]">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D4A017]">Legal</p>
          <h1 className="mt-3 font-serif text-3xl font-bold md:text-4xl">Términos y Condiciones</h1>
          <p className="mt-3 text-sm text-[#9CA3AF]">Última actualización: enero 2026</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-14">
        <div className="prose-custom space-y-10">

          <Section title="1. Identificación del prestador">
            <p>
              En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio
              Electrónico (LSSI-CE), se informa de que el titular del sitio web <strong>kseniailicheva.com</strong> es:
            </p>
            <ul>
              <li><strong>Titular:</strong> Ksenia Ilicheva</li>
              <li><strong>Actividad:</strong> Asesoría fiscal, legal y administrativa</li>
              <li><strong>Email de contacto:</strong> soy@kseniailicheva.com</li>
              <li><strong>Teléfono:</strong> +34 696 55 04 80</li>
              <li><strong>Ámbito:</strong> España</li>
            </ul>
          </Section>

          <Section title="2. Objeto y aceptación">
            <p>
              Las presentes condiciones regulan el acceso y uso del sitio web <strong>kseniailicheva.com</strong> (en adelante,
              &quot;el Sitio&quot;) y la contratación de los servicios ofrecidos a través del mismo, incluyendo la plataforma de cliente
              EXPERT.
            </p>
            <p>
              El acceso y uso del Sitio implica la aceptación plena y sin reservas de las presentes condiciones. Si no estás de
              acuerdo con alguno de los términos aquí recogidos, debes abstenerte de utilizar este Sitio.
            </p>
          </Section>

          <Section title="3. Servicios ofrecidos">
            <p>
              A través de la plataforma EXPERT se prestan servicios profesionales de carácter fiscal, legal, administrativo y
              formativo, entre los que se incluyen, sin carácter exhaustivo:
            </p>
            <ul>
              <li>Gestión de declaraciones fiscales (IRPF, IVA, Modelo 151, Impuesto de Sociedades)</li>
              <li>Trámites de extranjería y nacionalidad española</li>
              <li>Constitución y gestión de empresas y autónomos</li>
              <li>Gestiones de tráfico y capitanía marítima</li>
              <li>Soporte en operaciones notariales e inmobiliarias</li>
              <li>Certificados digitales, migraciones a Holded y gestiones especializadas</li>
              <li>Formación fiscal, contable, laboral y en herramientas de gestión</li>
            </ul>
            <p>
              La descripción de cada servicio y su precio se detallan en las páginas específicas del Sitio y en los presupuestos
              personalizados emitidos por EXPERT.
            </p>
          </Section>

          <Section title="4. Contratación y proceso de compra">
            <p>
              La contratación de servicios se realiza a través del portal digital de EXPERT. El proceso es el siguiente:
            </p>
            <ol>
              <li>El cliente selecciona el servicio o solicita un presupuesto personalizado.</li>
              <li>EXPERT emite la propuesta económica y condiciones del servicio.</li>
              <li>El cliente acepta expresamente las condiciones y realiza el pago correspondiente.</li>
              <li>EXPERT inicia la prestación del servicio conforme al alcance acordado.</li>
            </ol>
            <p>
              El contrato se perfecciona en el momento en que el cliente realiza el pago o acepta expresamente el presupuesto
              enviado por EXPERT.
            </p>
          </Section>

          <Section title="5. Precios y facturación">
            <p>
              Los precios indicados en el Sitio están expresados en euros (€) e incluyen el IVA aplicable salvo que se indique
              expresamente lo contrario. EXPERT se reserva el derecho de modificar los precios en cualquier momento, siendo de
              aplicación los vigentes en el momento de la contratación.
            </p>
            <p>
              Los servicios de suscripción (planes mensuales) se facturan de forma recurrente según el plan contratado. El
              cliente puede cancelar su suscripción en cualquier momento a través de su panel de cliente, con efecto al final del
              período de facturación en curso.
            </p>
          </Section>

          <Section title="6. Formas de pago">
            <p>
              El pago se realiza de forma segura a través de la plataforma <strong>Stripe</strong>, que admite tarjetas de
              crédito y débito (Visa, Mastercard, American Express). EXPERT no almacena datos de tarjetas bancarias; estos son
              gestionados directamente por Stripe conforme a su política de seguridad PCI-DSS.
            </p>
          </Section>

          <Section title="7. Derecho de desistimiento">
            <p>
              De conformidad con el Real Decreto Legislativo 1/2007, el cliente consumidor dispone de un plazo de 14 días
              naturales desde la contratación para ejercer el derecho de desistimiento, sin necesidad de justificación y sin
              penalización alguna.
            </p>
            <p>
              No obstante, si el cliente ha solicitado expresamente el inicio de la prestación del servicio antes de que
              transcurra dicho plazo y el servicio ya ha sido ejecutado total o parcialmente, perderá el derecho de desistimiento
              en proporción a la parte ya prestada.
            </p>
            <p>
              Para ejercer el derecho de desistimiento, el cliente debe comunicarlo por escrito a{' '}
              <a href="mailto:soy@kseniailicheva.com" className="text-[#D4A017] hover:text-[#F2C14E]">
                soy@kseniailicheva.com
              </a>{' '}
              dentro del plazo indicado.
            </p>
          </Section>

          <Section title="8. Obligaciones del cliente">
            <p>El cliente se compromete a:</p>
            <ul>
              <li>Proporcionar información veraz, completa y actualizada para la prestación del servicio.</li>
              <li>Colaborar activamente facilitando la documentación requerida en los plazos acordados.</li>
              <li>No utilizar la plataforma para fines ilícitos o contrarios a la buena fe.</li>
              <li>Mantener la confidencialidad de sus credenciales de acceso al portal de cliente.</li>
              <li>Comunicar de inmediato cualquier error o incidencia en los datos o trámites gestionados.</li>
            </ul>
          </Section>

          <Section title="9. Responsabilidad y limitaciones">
            <p>
              EXPERT presta sus servicios con la diligencia profesional exigible, pero no puede garantizar resultados concretos
              en trámites administrativos o resoluciones de terceros (Administración Pública, Registros, Notarías, etc.), cuya
              decisión final corresponde a dichos organismos.
            </p>
            <p>
              EXPERT no será responsable de los daños o perjuicios derivados de:
            </p>
            <ul>
              <li>Información incorrecta, incompleta o tardía proporcionada por el cliente.</li>
              <li>Cambios normativos sobrevenidos con posterioridad a la prestación del servicio.</li>
              <li>Decisiones administrativas de organismos públicos.</li>
              <li>Interrupciones del servicio debidas a causas de fuerza mayor o fallos técnicos ajenos a EXPERT.</li>
            </ul>
          </Section>

          <Section title="10. Propiedad intelectual">
            <p>
              Todos los contenidos del Sitio (textos, imágenes, logotipos, diseño, código) son propiedad de EXPERT o de sus
              licenciantes y están protegidos por la legislación de propiedad intelectual e industrial. Queda prohibida su
              reproducción, distribución o modificación sin autorización expresa y por escrito.
            </p>
          </Section>

          <Section title="11. Protección de datos">
            <p>
              El tratamiento de los datos personales recogidos a través del Sitio se rige por nuestra{' '}
              <Link href="/privacidad" className="text-[#D4A017] hover:text-[#F2C14E]">
                Política de Privacidad
              </Link>
              , disponible en el Sitio, conforme al Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).
            </p>
          </Section>

          <Section title="12. Modificación de las condiciones">
            <p>
              EXPERT se reserva el derecho de modificar estas condiciones en cualquier momento. Las condiciones vigentes serán
              las publicadas en el Sitio en el momento de la contratación. Se notificará a los clientes registrados cualquier
              cambio sustancial con un mínimo de 15 días de antelación.
            </p>
          </Section>

          <Section title="13. Legislación aplicable y jurisdicción">
            <p>
              Las presentes condiciones se rigen por la legislación española. Para la resolución de controversias, las partes se
              someten a los Juzgados y Tribunales del domicilio del consumidor, sin perjuicio de la posibilidad de recurrir a
              vías alternativas de resolución de conflictos.
            </p>
          </Section>

          <Section title="14. Contacto">
            <p>Para cualquier consulta relacionada con estos términos, puedes contactar con nosotros en:</p>
            <ul>
              <li>
                Email:{' '}
                <a href="mailto:soy@kseniailicheva.com" className="text-[#D4A017] hover:text-[#F2C14E]">
                  soy@kseniailicheva.com
                </a>
              </li>
              <li>Teléfono: +34 696 55 04 80</li>
              <li>
                Formulario de contacto:{' '}
                <Link href="/contacto" className="text-[#D4A017] hover:text-[#F2C14E]">
                  kseniailicheva.com/contacto
                </Link>
              </li>
            </ul>
          </Section>

        </div>

        <div className="mt-12 border-t border-[#D4A017]/25 pt-8">
          <div className="flex flex-wrap gap-4 text-sm text-[#23364D]">
            <Link href="/privacidad" className="text-[#D4A017] hover:text-[#F2C14E] font-semibold">Política de Privacidad</Link>
            <Link href="/aviso-legal" className="text-[#D4A017] hover:text-[#F2C14E] font-semibold">Aviso Legal</Link>
            <Link href="/cookies" className="text-[#D4A017] hover:text-[#F2C14E] font-semibold">Política de Cookies</Link>
            <Link href="/condiciones" className="text-[#D4A017] hover:text-[#F2C14E] font-semibold">Condiciones de Contratación</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-[#0D1B2A] md:text-2xl">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-7 text-[#23364D] [&_a]:underline-offset-2 [&_li]:ml-4 [&_li]:list-disc [&_ol>li]:list-decimal [&_strong]:text-[#0D1B2A] [&_strong]:font-semibold">
        {children}
      </div>
    </div>
  );
}
