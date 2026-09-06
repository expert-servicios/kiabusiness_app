import { getPublicAppUrl } from '@/lib/utils/app-url';

const APP_URL = getPublicAppUrl();

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function shell(title: string, body: string): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head><body style="margin:0;padding:0;background:#f8f4eb;font-family:Arial,sans-serif"><table width="100%" cellpadding="0" cellspacing="0" style="padding:36px 18px;background:#f8f4eb"><tr><td><table width="600" cellpadding="0" cellspacing="0" align="center" style="max-width:600px;background:#fff;border:1px solid #d8cbb5;border-radius:16px;overflow:hidden"><tr><td style="background:#07111d;padding:28px 36px;text-align:center"><div style="font-family:Georgia,serif;font-weight:bold;font-size:25px;letter-spacing:5px;color:#d7a33a">EXPERT</div><div style="margin-top:7px;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:#9ba8b5">Espacio de Cliente Responsable</div></td></tr><tr><td style="padding:36px;color:#29384a;font-size:15px;line-height:1.6">${body}</td></tr><tr><td style="padding:20px 36px;background:#f8f4eb;border-top:1px solid #d8cbb5;text-align:center;font-size:12px;color:#6b7280">EXPERT ESTUDIOS PROFESIONALES, SLU · info@expertconsulting.es</td></tr></table></td></tr></table></body></html>`;
}

function button(label: string, href: string): string {
  return `<p style="margin:26px 0 0;text-align:center"><a href="${href}" style="display:inline-block;background:#c88b25;color:#07111d;text-decoration:none;font-weight:bold;font-size:13px;padding:13px 24px;border-radius:999px">${escapeHtml(label)}</a></p>`;
}

function resource(label: string, href: string): string {
  return `<li style="margin:8px 0"><a href="${href}" style="color:#9a6a17;font-weight:bold">${escapeHtml(label)}</a></li>`;
}

export function onboardingPreparationEmail(input: {
  name: string;
  meetingDate: string;
  meetingTime: string;
  meetingUrl?: string | null;
}) {
  const safeName = escapeHtml(input.name);
  return {
    subject: 'Antes de tu onboarding EXPERT — prepara tu cuenta de Holded',
    html: shell('Preparación de onboarding', `
      <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:24px;color:#07111d">Prepara tu sesión de onboarding</h1>
      <p>Hola <strong>${safeName}</strong>,</p>
      <p>Para aprovechar al máximo nuestra reunión del <strong>${escapeHtml(input.meetingDate)} a las ${escapeHtml(input.meetingTime)}</strong>, te pedimos que revises previamente este material oficial de Holded Academy.</p>
      <p>La sesión estará orientada a <strong>resolver dudas concretas y revisar contigo la configuración</strong>, no a repetir contenidos básicos que puedes estudiar antes.</p>
      <p style="margin-bottom:8px"><strong>Antes de la reunión revisa:</strong></p>
      <ul style="padding-left:20px;margin-top:6px">
        ${resource('1. Primeros pasos en Holded', 'https://help.holded.com/es/articles/6834321-primeros-pasos-en-holded')}
        ${resource('2. Configurar tu cuenta: datos fiscales, dirección y preferencias', 'https://help.holded.com/es/articles/6911839-configurar-tu-cuenta-de-holded')}
        ${resource('3. Facturación: configuración inicial y preferencias', 'https://help.holded.com/es/articles/6834644-facturacion-guia-de-inicio')}
        ${resource('4. Crear y gestionar presupuestos', 'https://help.holded.com/es/articles/6987424-crear-y-gestionar-presupuestos')}
        ${resource('5. Crear una factura de venta', 'https://help.holded.com/es/articles/6834950-crear-una-factura-de-venta')}
        ${resource('6. Registrar una factura o ticket de compra', 'https://help.holded.com/es/articles/6899680-crear-una-factura-de-compra')}
        ${resource('7. Gastos: configuración, Escáner/Mailbox y registro de comprobantes', 'https://help.holded.com/es/articles/6959537-gastos-guia-de-inicio')}
      </ul>
      <p>Si puedes, entra en tu cuenta antes de la reunión y deja anotadas las dudas que te surjan. Así dedicaremos el tiempo a revisar casos reales de tu empresa y a dejar el entorno preparado para trabajar.</p>
      ${input.meetingUrl ? button('Abrir enlace de la reunión', input.meetingUrl) : ''}
    `),
  };
}

export function responsibleClientWelcomeEmail(input: { name: string; companyName: string; planName: string }) {
  return {
    subject: 'Tu alta está completada — bienvenido/a al Espacio de Cliente Responsable EXPERT',
    html: shell('Alta completada', `
      <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:24px;color:#07111d">Tu alta EXPERT está completada</h1>
      <p>Hola <strong>${escapeHtml(input.name)}</strong>,</p>
      <p>Hemos finalizado el onboarding de <strong>${escapeHtml(input.companyName)}</strong> para el plan <strong>${escapeHtml(input.planName)}</strong>.</p>
      <p>Desde este momento tu área privada funciona como tu <strong>Espacio de Cliente Responsable EXPERT</strong>: un lugar para mantener el control de tus expedientes, documentación, suscripción, comunicaciones y próximos pasos, con nuestro acompañamiento profesional.</p>
      <p>La idea es sencilla: tú conservas la visibilidad y las decisiones de tu negocio; EXPERT te ayuda a entender, organizar y ejecutar correctamente cada proceso.</p>
      ${button('Entrar en mi espacio EXPERT', `${APP_URL}/dashboard`)}
    `),
  };
}

export function onboardingReviewRequestEmail(input: { name: string; token: string }) {
  const reviewUrl = `${APP_URL}/gracias/opinion?token=${encodeURIComponent(input.token)}`;
  return {
    subject: '¿Cómo ha sido tu proceso de alta con EXPERT?',
    html: shell('Valoración del proceso de alta', `
      <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:24px;color:#07111d">Ayúdanos a mejorar el onboarding</h1>
      <p>Hola <strong>${escapeHtml(input.name)}</strong>,</p>
      <p>Tu alta ya está completada. Nos ayudaría conocer tu valoración sobre el proceso: contratación, comunicaciones, preparación previa y sesión de onboarding.</p>
      <p>La encuesta es breve y nos permite detectar qué debemos simplificar o explicar mejor para próximos clientes.</p>
      ${button('Valorar mi proceso de alta', reviewUrl)}
    `),
  };
}
