export type JulyCampaignArea = 'holded' | 'planes' | 'certificado';

export type JulyEmailDraft = {
  id: string;
  title: string;
  subject: string;
  segment: 'all_active' | 'subscribers' | 'no_subscription' | 'leads' | 'all' | 'newsletter';
  bodyHtml: string;
};

const siteUrl = 'https://expertconsulting.es';

function withUtm(path: string, source: string, medium: string, campaign: string) {
  return `${siteUrl}${path}?utm_source=${source}&utm_medium=${medium}&utm_campaign=${campaign}`;
}

function sitePath(path: string, campaign: string) {
  return `${path}?utm_source=site&utm_medium=promo_bar&utm_campaign=${campaign}`;
}

export const julySiteCampaignLinks = {
  holded: sitePath('/holded/migracion-sin-inventario', 'julio_holded_2026'),
  planes: sitePath('/planes', 'julio_planes_2026'),
  certificadoPersonaFisica: sitePath('/servicios/certificado-digital/certificado-digital-persona-fisica', 'julio_certificado_2026'),
  certificadoEntidad: sitePath('/servicios/certificado-digital/certificado-digital-entidad', 'julio_certificado_2026'),
} as const;

export const julyMetricoolLinks: Record<JulyCampaignArea, string> = {
  holded: withUtm('/holded/migracion-sin-inventario', 'metricool', 'social', 'julio_holded_2026'),
  planes: withUtm('/planes', 'metricool', 'social', 'julio_planes_2026'),
  certificado: withUtm('/servicios/certificado-digital/certificado-digital-persona-fisica', 'metricool', 'social', 'julio_certificado_2026'),
};

const emailLinks = {
  holded: withUtm('/holded/migracion-sin-inventario', 'email', 'campaign', 'julio_holded_2026'),
  packStarter: withUtm('/holded/pack-starter', 'email', 'campaign', 'julio_holded_2026'),
  planes: withUtm('/planes', 'email', 'campaign', 'julio_planes_2026'),
  certificado: withUtm('/servicios/certificado-digital/certificado-digital-persona-fisica', 'email', 'campaign', 'julio_certificado_2026'),
  sociedades: withUtm('/planes/avanzado', 'email', 'campaign', 'julio_sociedades_2026'),
};

const emailShell = (pretitle: string, title: string, content: string, ctaLabel: string, ctaHref: string) => `
<!doctype html>
<html lang="es">
  <body style="margin:0;background:#f8f6f1;font-family:Arial,sans-serif;color:#0d1b2a;">
    <div style="max-width:640px;margin:0 auto;padding:28px 18px;">
      <div style="background:#0d1b2a;color:#f8f6f1;padding:28px;border-radius:14px;">
        <p style="margin:0 0 10px;color:#d4a017;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">${pretitle}</p>
        <h1 style="margin:0;font-size:28px;line-height:1.2;font-family:Georgia,serif;">${title}</h1>
      </div>
      <div style="background:#ffffff;padding:28px;border:1px solid #eadfca;border-radius:14px;margin-top:14px;">
        ${content}
        <p style="margin:26px 0 0;">
          <a href="${ctaHref}" style="display:inline-block;background:#d4a017;color:#0d1b2a;text-decoration:none;font-weight:700;padding:13px 18px;border-radius:10px;">${ctaLabel}</a>
        </p>
        <p style="margin:22px 0 0;color:#6b7280;font-size:12px;line-height:1.6;">
          Este mensaje no sustituye una revision fiscal de tu caso concreto. Si no sabes que servicio encaja, responde a este email y lo revisamos.
        </p>
      </div>
    </div>
  </body>
</html>`;

export const julyEmailCampaignDrafts: JulyEmailDraft[] = [
  {
    id: 'julio-holded-2026',
    title: 'Julio 2026 - Holded y cierre 2T',
    subject: 'Julio fiscal: tu Holded deberia estar listo antes del cierre',
    segment: 'newsletter',
    bodyHtml: emailShell(
      'Julio fiscal',
      'No esperes al dia 19 para ordenar tus facturas.',
      `
        <p style="margin:0 0 16px;line-height:1.7;">Hasta el 20 de julio se concentran las principales obligaciones del segundo trimestre. Si cada cierre te obliga a perseguir facturas, cruzar bancos a mano o reconstruir gastos, el problema no es solo el modelo: es el sistema.</p>
        <p style="margin:0 0 16px;line-height:1.7;">En EXPERT migramos tu operativa a Holded para centralizar clientes, proveedores, facturacion, bancos e impuestos desde una estructura revisable.</p>
        <ul style="margin:0 0 16px 20px;padding:0;line-height:1.7;">
          <li>Pack Starter si empiezas desde cero.</li>
          <li>Migracion sin inventario si vienes de Excel, ContaPlus u otro sistema sencillo.</li>
          <li>Migracion con inventario si gestionas catalogo, stock o almacenes.</li>
        </ul>
        <p style="margin:0;line-height:1.7;">La meta no es correr este trimestre: es llegar al siguiente con datos ordenados.</p>
      `,
      'Solicitar diagnostico Holded',
      emailLinks.holded
    ),
  },
  {
    id: 'julio-planes-2026',
    title: 'Julio 2026 - Planes mensuales',
    subject: 'La contabilidad mensual no deberia depender del ultimo dia',
    segment: 'no_subscription',
    bodyHtml: emailShell(
      'Planes mensuales',
      'Despues de implantar Holded, toca mantenerlo al dia.',
      `
        <p style="margin:0 0 16px;line-height:1.7;">Migrar a Holded ordena el punto de partida, pero la tranquilidad llega cuando hay revision mensual: facturas, bancos, categorias, alertas y cierre continuo.</p>
        <p style="margin:0 0 16px;line-height:1.7;">Por eso hemos preparado tres niveles de acompanamiento:</p>
        <ul style="margin:0 0 16px 20px;padding:0;line-height:1.7;">
          <li><strong>Supervision:</strong> tu llevas Holded, EXPERT revisa lo esencial.</li>
          <li><strong>Avanzado:</strong> revision profesional y fiscalidad trimestral basica segun alcance.</li>
          <li><strong>Colaborativo:</strong> mas validacion mensual, informe y soporte prioritario.</li>
        </ul>
        <p style="margin:0;line-height:1.7;">Todos requieren Holded conectado desde el Panel Cliente. No pedimos claves por WhatsApp ni email.</p>
      `,
      'Comparar planes',
      emailLinks.planes
    ),
  },
  {
    id: 'julio-certificado-2026',
    title: 'Julio 2026 - Certificado digital',
    subject: 'Antes del 20 de julio: certificado digital y datos preparados',
    segment: 'leads',
    bodyHtml: emailShell(
      'Certificado digital',
      'Si no puedes firmar o presentar, el tramite se bloquea.',
      `
        <p style="margin:0 0 16px;line-height:1.7;">En julio muchos tramites se vuelven urgentes: presentaciones ante AEAT, consultas, notificaciones y firmas. Si tu certificado esta caducado o dependes de otra persona para operar, conviene resolverlo antes de que sea un bloqueo.</p>
        <p style="margin:0 0 16px;line-height:1.7;">Como Punto de Registro Autorizado de Camerfirma, podemos tramitar certificados para persona fisica y entidad, con verificacion presencial o por videoconferencia cuando aplica.</p>
        <p style="margin:0;line-height:1.7;">Te ayudamos tambien con instalacion y prueba para que no te quedes con un certificado emitido pero inutilizable.</p>
      `,
      'Tramitar certificado digital',
      emailLinks.certificado
    ),
  },
  {
    id: 'julio-sociedades-2026',
    title: 'Julio 2026 - Sociedades y Q3 ordenado',
    subject: 'Despues del cierre: deja el siguiente trimestre bajo control',
    segment: 'all_active',
    bodyHtml: emailShell(
      'Sociedades y continuidad',
      'Julio no deberia terminar igual que empezo.',
      `
        <p style="margin:0 0 16px;line-height:1.7;">Hasta el 27 de julio se concentra el Impuesto sobre Sociedades para muchas entidades con ejercicio natural. Es un buen recordatorio: los cierres importantes no se preparan solo el mes de vencimiento.</p>
        <p style="margin:0 0 16px;line-height:1.7;">Si este mes ha dejado al descubierto datos incompletos, conciliaciones pendientes o dependencia de hojas sueltas, podemos ayudarte a dejar Holded y tu gestion mensual preparados para el tercer trimestre.</p>
        <p style="margin:0;line-height:1.7;">La recomendacion habitual para empresas es Plan Avanzado o Colaborativo, segun volumen, implicacion y necesidad de soporte.</p>
      `,
      'Ver plan recomendado',
      emailLinks.sociedades
    ),
  },
];
