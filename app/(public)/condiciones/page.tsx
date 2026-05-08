import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Condiciones Generales de Contratación | EXPERT ESTUDIOS PROFESIONALES',
  description: 'Condiciones generales de contratación de los servicios de EXPERT ESTUDIOS PROFESIONALES, SLU. Asesoría fiscal, legal y administrativa en España.',
  openGraph: {
    type: 'website',
    url: 'https://kseniailicheva.com/condiciones',
    title: 'Condiciones de Contratación | EXPERT',
    description: 'Condiciones generales de contratación de EXPERT ESTUDIOS PROFESIONALES, SLU.',
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

export default function CondicionesPage() {
  return (
    <main className="bg-[#F8F6F1] px-6 py-16">
      <div className="mx-auto max-w-3xl">

        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4A017]">Legal</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-[#0D1B2A]">Condiciones Generales de Contratación</h1>
        <p className="mt-3 text-sm text-[#23364D]">Última actualización: {LAST_UPDATED}</p>

        <div className="mt-10 space-y-10">

          <Section title="1. Prestador del servicio">
            <p>
              En cumplimiento del <strong>Real Decreto Legislativo 1/2007, de 16 de noviembre</strong>, por el que se aprueba el texto refundido de la Ley General para la Defensa de los Consumidores y Usuarios (TRLGDCU), y de la <strong>Ley 34/2002 (LSSI-CE)</strong>, las presentes Condiciones Generales de Contratación regulan la relación contractual entre:
            </p>
            <div className="overflow-hidden rounded-xl border border-[#d8cbb5] bg-white">
              {[
                ['Prestador', 'EXPERT ESTUDIOS PROFESIONALES, SLU'],
                ['CIF', 'B44991776'],
                ['Domicilio', 'C/ Pintor Agrassot, 19 — 03110 Mutxamel (Alicante), España'],
                ['Email', 'soy@kseniailicheva.com'],
                ['Teléfono', '+34 696 55 04 80'],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1 border-b border-[#f0e8d8] px-5 py-3 last:border-b-0 sm:flex-row sm:gap-4">
                  <span className="w-24 shrink-0 text-xs font-bold uppercase tracking-wide text-[#c88b25]">{label}</span>
                  <span className="text-sm text-[#0D1B2A]">{value}</span>
                </div>
              ))}
            </div>
            <p>Y el <strong>cliente</strong>: la persona física o jurídica que contrata los servicios a través del sitio web o el área privada de EXPERT.</p>
          </Section>

          <Section title="2. Ámbito de aplicación y aceptación">
            <p>
              Estas Condiciones se aplican a toda contratación de servicios profesionales realizada a través del sitio web <strong>kseniailicheva.com</strong> y su plataforma privada de cliente, con independencia del canal por el que se formalice el presupuesto (web, email o WhatsApp).
            </p>
            <p>
              La contratación de cualquier servicio implica la aceptación plena, expresa e inequívoca de las presentes Condiciones, que complementan los <Link href="/terminos" className="text-[#D4A017] underline underline-offset-4">Términos y Condiciones de uso</Link> del sitio.
            </p>
          </Section>

          <Section title="3. Servicios profesionales ofrecidos">
            <p>EXPERT presta servicios de carácter profesional en las siguientes áreas, sin ánimo exhaustivo:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li><strong>Fiscal:</strong> declaraciones de IVA, IRPF, Modelo 151, Impuesto de Sociedades, modelos informativos.</li>
              <li><strong>Contable:</strong> gestión contable mensual con Holded, conciliaciones, informes de resultados.</li>
              <li><strong>Laboral:</strong> nóminas, altas y bajas en la Seguridad Social, contratos.</li>
              <li><strong>Extranjería:</strong> residencia, reagrupación familiar, renovaciones, NIE, nacionalidad española.</li>
              <li><strong>Societario:</strong> constitución de empresas, ampliaciones de capital, cambios estatutarios, disoluciones.</li>
              <li><strong>Tráfico y capitanía:</strong> transferencias, bajas, altas, permisos de circulación.</li>
              <li><strong>Notarial e inmobiliario:</strong> apoderamiento notarial, compraventas, herencias.</li>
              <li><strong>Formación:</strong> sesiones de formación en Holded y herramientas de gestión.</li>
              <li><strong>Tecnológico:</strong> migración a Holded, configuración y onboarding.</li>
            </ul>
            <p>
              Los servicios contratables en cada momento son los que figuran en las páginas del sitio y en los presupuestos personalizados emitidos por EXPERT.
            </p>
          </Section>

          <Section title="4. Proceso de contratación">
            <p>El proceso de contratación sigue los siguientes pasos:</p>
            <ol className="list-decimal space-y-2 pl-6">
              <li>El cliente solicita un servicio o presupuesto a través del sitio web, email o WhatsApp.</li>
              <li>EXPERT emite una propuesta económica con el alcance, precio y condiciones del servicio.</li>
              <li>El cliente acepta expresamente la propuesta y realiza el pago a través del portal de cliente o el enlace de pago proporcionado.</li>
              <li>EXPERT confirma la recepción del pago por email y crea el expediente correspondiente.</li>
              <li>EXPERT inicia la prestación del servicio conforme al alcance acordado.</li>
            </ol>
            <p>
              El contrato queda perfeccionado en el momento en que EXPERT recibe y confirma el pago. En servicios de suscripción mensual, el contrato se renueva automáticamente cada período hasta que alguna de las partes comunique su resolución con la antelación prevista.
            </p>
          </Section>

          <Section title="5. Precios, impuestos y facturación">
            <p>
              Los precios publicados en el sitio web están expresados en euros (€) <strong>sin IVA</strong>, salvo que se indique expresamente lo contrario. Sobre los precios indicados se aplicará el <strong>IVA al tipo vigente en cada momento</strong> (actualmente el 21 % para clientes en España peninsular e Islas Baleares, o el tipo reducido o exento según la situación fiscal del cliente).
            </p>
            <p>
              EXPERT se reserva el derecho de modificar sus tarifas en cualquier momento. Los cambios de precio en servicios de suscripción se comunicarán al cliente con un mínimo de <strong>30 días de antelación</strong> antes de su entrada en vigor.
            </p>
            <p>
              La factura se emitirá a nombre de la persona o entidad indicada por el cliente en el momento de la contratación. EXPERT no podrá emitir facturas con datos distintos a los proporcionados por el cliente.
            </p>
          </Section>

          <Section title="6. Formas de pago">
            <p>
              El pago de los servicios se realiza de forma segura a través de <strong>Stripe</strong>, plataforma de pago certificada con el estándar de seguridad <strong>PCI-DSS nivel 1</strong>. Se aceptan tarjetas de crédito y débito (Visa, Mastercard, American Express) y, según disponibilidad, domiciliación bancaria (SEPA) para suscripciones recurrentes.
            </p>
            <p>
              EXPERT no almacena en ningún momento datos de tarjetas de pago. El procesamiento íntegro se delega en Stripe conforme a su política de seguridad y privacidad.
            </p>
            <p>
              En caso de impago o devolución de cargo, EXPERT se reserva el derecho de suspender la prestación del servicio hasta que el pago se regularice, así como de reclamar los importes adeudados por las vías legales oportunas.
            </p>
          </Section>

          <Section title="7. Derecho de desistimiento (consumidores)">
            <p>
              De conformidad con el <strong>artículo 102 del TRLGDCU</strong>, el cliente que actúe como consumidor (persona física que contrata fuera de su actividad empresarial o profesional) dispone de un plazo de <strong>14 días naturales</strong> desde la fecha de contratación para ejercer el derecho de desistimiento, sin necesidad de justificación y sin penalización.
            </p>
            <p>
              <strong>Excepción importante:</strong> Si el cliente ha solicitado expresamente el inicio de la prestación del servicio antes de que expire el plazo de desistimiento y el servicio ha comenzado a ejecutarse, perderá el derecho de desistimiento de forma proporcional al servicio ya prestado (art. 107.2 TRLGDCU). En caso de ejecución completa, perderá el derecho íntegramente.
            </p>
            <p>
              Para ejercer el desistimiento, el cliente debe comunicarlo mediante escrito dirigido a <a href="mailto:soy@kseniailicheva.com" className="text-[#D4A017] underline underline-offset-4">soy@kseniailicheva.com</a> dentro del plazo indicado, indicando el servicio contratado y su voluntad de desistir. EXPERT confirmará la recepción y tramitará la devolución en un plazo máximo de <strong>14 días</strong>.
            </p>
            <p>
              El derecho de desistimiento no aplica a servicios de empresa a empresa (B2B) ni a encargos donde el cliente haya renunciado expresamente a él por escrito.
            </p>
          </Section>

          <Section title="8. Cancelación de suscripciones">
            <p>
              Los planes de suscripción mensual (Plan Avanzado, Plan Colaborativo, Plan Delegado) pueden cancelarse en cualquier momento con un preaviso mínimo de <strong>30 días naturales</strong> comunicado por escrito a <a href="mailto:soy@kseniailicheva.com" className="text-[#D4A017] underline underline-offset-4">soy@kseniailicheva.com</a> o a través del panel de cliente.
            </p>
            <p>
              La cancelación surte efecto al final del período de facturación en curso. No se realizan devoluciones por períodos ya facturados y en curso, salvo que la cancelación sea motivada por un incumplimiento imputable a EXPERT.
            </p>
          </Section>

          <Section title="9. Devoluciones y reembolsos">
            <p>
              Con carácter general, no se realizan devoluciones por servicios ya prestados o en curso de prestación. Las excepciones son:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Ejercicio válido del derecho de desistimiento dentro del plazo legal (ver sección 7).</li>
              <li>Error imputable exclusivamente a EXPERT que haga imposible la prestación del servicio.</li>
              <li>Caso fortuito o fuerza mayor que impida definitivamente la ejecución del encargo.</li>
            </ul>
            <p>
              Las solicitudes de reembolso se analizarán caso por caso. En caso de ser procedente, la devolución se realizará por el mismo medio de pago utilizado en la contratación en un plazo máximo de 14 días.
            </p>
          </Section>

          <Section title="10. Obligaciones del cliente">
            <p>Para la correcta prestación del servicio, el cliente se compromete a:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Facilitar información veraz, completa y actualizada sobre su situación fiscal, legal o administrativa.</li>
              <li>Aportar la documentación requerida en los plazos acordados o indicados por EXPERT.</li>
              <li>Comunicar de inmediato cualquier cambio relevante en su situación que pueda afectar al servicio.</li>
              <li>Revisar y verificar la información y documentos emitidos por EXPERT antes de su presentación ante terceros.</li>
              <li>Mantener la confidencialidad de sus credenciales de acceso al área privada.</li>
              <li>Abonar las contraprestaciones económicas en los plazos acordados.</li>
            </ul>
            <p>
              EXPERT no será responsable de los perjuicios derivados del incumplimiento de estas obligaciones por parte del cliente.
            </p>
          </Section>

          <Section title="11. Responsabilidad de EXPERT">
            <p>
              EXPERT presta sus servicios con la diligencia exigible a un profesional de la asesoría y gestión, pero no puede garantizar resultados concretos en procedimientos administrativos cuya resolución corresponde a organismos públicos (Agencia Tributaria, Seguridad Social, Registro Mercantil, Delegaciones de Extranjería, etc.).
            </p>
            <p>
              EXPERT no será responsable de daños o perjuicios derivados de:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Información incorrecta, incompleta o tardía aportada por el cliente.</li>
              <li>Cambios normativos o de criterio administrativo producidos con posterioridad al encargo.</li>
              <li>Resoluciones desfavorables de la Administración Pública no imputables a negligencia de EXPERT.</li>
              <li>Retrasos o denegaciones por parte de organismos públicos fuera del control de EXPERT.</li>
              <li>Interrupciones del servicio por causas de fuerza mayor (fallos de suministro eléctrico, desastres naturales, ataques informáticos a infraestructura de terceros, etc.).</li>
            </ul>
          </Section>

          <Section title="12. Confidencialidad">
            <p>
              EXPERT se compromete a tratar con estricta confidencialidad toda la información y documentación aportada por el cliente, utilizándola exclusivamente para la prestación del servicio contratado. Esta obligación de confidencialidad se mantiene indefinidamente incluso tras la finalización de la relación contractual.
            </p>
            <p>
              El cliente autoriza a EXPERT a compartir la información estrictamente necesaria con las Administraciones Públicas, Registros, Notarías u otros organismos cuando sea imprescindible para la ejecución del servicio.
            </p>
          </Section>

          <Section title="13. Protección de datos">
            <p>
              El tratamiento de los datos personales del cliente se realiza conforme al <strong>Reglamento (UE) 2016/679 (RGPD)</strong> y la <strong>Ley Orgánica 3/2018 (LOPDGDD)</strong>. Para más información, consulta nuestra <Link href="/privacidad" className="text-[#D4A017] underline underline-offset-4">Política de Privacidad</Link>.
            </p>
          </Section>

          <Section title="14. Modificación de las condiciones">
            <p>
              EXPERT se reserva el derecho de modificar estas Condiciones. Los cambios se comunicarán a los clientes con suscripción activa con un mínimo de <strong>15 días de antelación</strong>. La continuación del uso del servicio tras esa fecha implica la aceptación de las nuevas condiciones. Si el cliente no acepta los cambios, podrá resolver el contrato sin penalización.
            </p>
          </Section>

          <Section title="15. Legislación aplicable y resolución de disputas">
            <p>
              Estas Condiciones se rigen por la legislación española. Para la resolución de controversias con consumidores, las partes se someten a los Juzgados y Tribunales del domicilio del consumidor.
            </p>
            <p>
              Para disputas entre empresas (B2B), las partes se someten expresamente a la jurisdicción de los Juzgados y Tribunales de Alicante, con renuncia a cualquier otro fuero.
            </p>
            <p>
              Los consumidores también pueden acceder a la plataforma europea de resolución de litigios en línea (ODR) en <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-[#D4A017] underline underline-offset-4">ec.europa.eu/consumers/odr</a>.
            </p>
          </Section>

          <div className="border-t border-[#D4A017]/25 pt-8">
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/privacidad" className="font-semibold text-[#D4A017] hover:text-[#F2C14E]">Política de Privacidad</Link>
              <Link href="/aviso-legal" className="font-semibold text-[#D4A017] hover:text-[#F2C14E]">Aviso Legal</Link>
              <Link href="/cookies" className="font-semibold text-[#D4A017] hover:text-[#F2C14E]">Política de Cookies</Link>
              <Link href="/terminos" className="font-semibold text-[#D4A017] hover:text-[#F2C14E]">Términos y Condiciones</Link>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
