import type { Metadata } from 'next';
import { FounderServiceLanding } from '@/components/services/FounderServiceLanding';

export const metadata: Metadata = {
  title: 'Constituir una SL online con CIRCE — Formación guiada 2 h | EXPERT',
  description: 'Sesión práctica de 2 horas para constituir tu Sociedad Limitada mediante PAE Virtual y CIRCE. 180 € + IVA. Preparación del DUE, denominación y firma notarial online.',
  alternates: { canonical: 'https://expertconsulting.es/servicios/empresas-autonomos/constitucion-sl-circe' },
};

export default function ConstitucionSlCircePage() {
  return (
    <FounderServiceLanding
      slug="constitucion-sl-circe"
      eyebrow="Formación práctica · 2 horas"
      title="Constituye tu Sociedad Limitada online mediante PAE Virtual y CIRCE"
      intro="Te guiamos en directo durante todo el proceso para que prepares correctamente el DUE, la estructura de la sociedad y los pasos previos a la firma notarial. Tú mantienes el control del expediente; nosotros te acompañamos para evitar errores y bloqueos."
      price="180 € + IVA"
      priceNote="Precio por una sesión online de hasta 2 horas. No incluye aranceles notariales, registrales, certificación de denominación ni otras tasas de terceros."
      checkoutLabel="Contratar sesión de 2 horas"
      includes={[
        'Revisión previa de socios, administradores, domicilio, actividad y estructura básica de la sociedad.',
        'Guía para solicitar la certificación negativa de denominación social en el Registro Mercantil Central.',
        'Acompañamiento en PAE Virtual / CIRCE para cumplimentar el Documento Único Electrónico (DUE).',
        'Revisión de epígrafes de actividad y datos fiscales básicos antes de enviar el expediente.',
        'Orientación sobre capital social, órgano de administración y estatutos tipo cuando resulten adecuados.',
        'Guía para coordinar la firma de la escritura, incluida la opción de actuación notarial online cuando sea aplicable.',
        'Checklist final con los pasos posteriores a la firma y la inscripción.'
      ]}
      steps={[
        { title: 'Preparamos la sociedad', text: 'Antes de la sesión debes tener definidos socios, porcentajes, administradores, domicilio, actividad y propuestas de nombre.' },
        { title: 'Reservas la denominación', text: 'Solicitas la certificación negativa en el Registro Mercantil Central. Si necesitas apoyo, te indicamos exactamente cómo hacerlo.' },
        { title: 'Trabajamos en PAE Virtual', text: 'Durante la sesión cumplimentamos juntos el DUE y revisamos la información antes del envío.' },
        { title: 'Formalizas la escritura', text: 'Coordinas la notaría y, cuando el procedimiento lo permita, puedes utilizar el Portal Notarial del Ciudadano para trámites societarios online.' }
      ]}
      resources={[
        { label: 'PAE Virtual / CIRCE', href: 'https://paeelectronico.es/es-es/CreaEmpresaPorTiMismo/Paginas/Home.aspx', note: 'Portal oficial para iniciar la creación telemática de la empresa.' },
        { label: 'Registro Mercantil Central', href: 'https://www.rmc.es/Deno_certif.aspx', note: 'Solicitud de certificación negativa de denominación social.' },
        { label: 'Portal Notarial del Ciudadano', href: 'https://www.portalnotarial.es/', note: 'Servicios notariales digitales y actuaciones por videoconferencia cuando proceda.' }
      ]}
      notes={[
        'Este producto es formación y acompañamiento: el cliente realiza el trámite en su propio expediente CIRCE.',
        'La certificación del nombre, aranceles de notaría y Registro Mercantil no están incluidos en el precio.',
        'Si algún socio extranjero no dispone de NIF español, debe resolver su identificación fiscal antes de completar la constitución.',
        'Las situaciones societarias no estándar pueden requerir estatutos personalizados o intervención profesional adicional.'
      ]}
      faqs={[
        { q: '¿Es lo mismo que vuestro servicio integral de constitución de SL?', a: 'No. Este servicio de 180 € + IVA es una sesión formativa guiada para que constituyas la sociedad utilizando PAE Virtual / CIRCE. El servicio integral de constitución es un producto distinto y tiene un alcance superior.' },
        { q: '¿Necesito certificado digital?', a: 'Para operar directamente en las sedes electrónicas y firmar determinados pasos necesitarás un sistema de identificación electrónica admitido. Revisaremos contigo qué necesita cada socio o representante.' },
        { q: '¿Puedo constituir la sociedad sin desplazarme?', a: 'CIRCE permite tramitar gran parte del expediente telemáticamente y el Notariado dispone de actuaciones societarias online. La posibilidad concreta depende del expediente y de que se cumplan los requisitos de identificación y firma.' },
        { q: '¿Qué ocurre si los socios viven fuera de España?', a: 'No impide necesariamente la constitución, pero todos deben estar correctamente identificados a efectos españoles. Si un socio extranjero no tiene DNI/NIE/NIF, conviene resolver primero su NIF.' }
      ]}
      related={{
        title: '¿Prefieres delegar la constitución?',
        text: 'EXPERT mantiene un servicio independiente de constitución integral de Sociedad Limitada para clientes que no quieren realizar el proceso por sí mismos.',
        href: '/servicios/empresas-autonomos/constitucion-sl',
        cta: 'Ver constitución integral'
      }}
    />
  );
}
