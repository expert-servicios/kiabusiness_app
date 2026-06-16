import { getPublicAppUrl } from '@/lib/utils/app-url';

const BRAND = {
  from: process.env.RESEND_FROM_EMAIL ?? 'EXPERT <info@expertconsulting.es>',
  appUrl: getPublicAppUrl()
};

export interface TenantBrand {
  name?: string;
  tagline?: string;
  primary_color?: string;
  support_email?: string;
}

function base(title: string, body: string, brand?: TenantBrand): string {
  const brandName     = escapeHtmlRaw(brand?.name    ?? 'EXPERT');
  const brandTagline  = escapeHtmlRaw(brand?.tagline ?? 'Asesoría Legal · Fiscal · Administrativa');
  const brandColor    = brand?.primary_color ?? '#d7a33a';
  const supportEmail  = escapeHtmlRaw(brand?.support_email ?? 'info@expertconsulting.es');
  const footerName    = brand?.name
    ? escapeHtmlRaw(brand.name)
    : 'EXPERT ESTUDIOS PROFESIONALES, SLU &nbsp;·&nbsp; C/ Pintor Agrassot, 19 &nbsp;·&nbsp; 03110 Mutxamel (Alicante)';

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f8f4eb;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f4eb;padding:40px 20px;">
<tr><td>
<table width="600" cellpadding="0" cellspacing="0" align="center" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #d8cbb5;">
  <tr><td style="background:#07111d;padding:32px 40px;text-align:center;">
    <p style="margin:0;font-size:26px;font-weight:bold;color:${brandColor};letter-spacing:5px;font-family:Georgia,serif;">${brandName}</p>
    <p style="margin:6px 0 0;font-size:11px;color:#8899aa;letter-spacing:3px;text-transform:uppercase;">${brandTagline}</p>
  </td></tr>
  <tr><td style="padding:40px;">
    ${body}
  </td></tr>
  <tr><td style="background:#f8f4eb;padding:24px 40px;border-top:1px solid #d8cbb5;text-align:center;">
    <p style="margin:0;font-size:12px;color:#29384a;">${footerName}</p>
    <p style="margin:6px 0 0;font-size:12px;"><a href="mailto:${supportEmail}" style="color:#c88b25;text-decoration:none;">${supportEmail}</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

// Lightweight HTML escaper used before escapeHtml is defined (boot-time use in base())
function escapeHtmlRaw(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function btn(label: string, url: string): string {
  return `<p style="text-align:center;margin:28px 0 0;">
    <a href="${url}" style="display:inline-block;background:#c88b25;color:#061321;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:2px;padding:14px 32px;border-radius:50px;text-decoration:none;">${label}</a>
  </p>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 20px;font-size:24px;color:#07111d;font-family:Georgia,serif;">${text}</h1>`;
}

function para(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:#29384a;line-height:1.6;">${text}</p>`;
}

function detail(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#07111d;background:#f8f4eb;border-radius:8px;">${label}</td>
    <td style="padding:10px 16px;font-size:14px;color:#29384a;">${value}</td>
  </tr>`;
}

function table(...rows: string[]): string {
  return `<table width="100%" cellpadding="0" cellspacing="4" style="margin:20px 0;border-collapse:separate;">
    ${rows.join('')}
  </table>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── 0. Welcome — new user first login ───────────────────────────────────────
export function welcomeEmail(name: string) {
  return {
    subject: 'Bienvenido/a a EXPERT — tu área privada está lista',
    html: base('Bienvenido a EXPERT', `
      ${heading('¡Bienvenido/a a EXPERT!')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para('Tu cuenta está activa. Desde tu área privada puedes consultar el estado de tus expedientes, subir documentación, revisar presupuestos y gestionar tus suscripciones, todo en un solo lugar.')}
      ${table(
        detail('Expedientes', 'Estado en tiempo real de cada trámite'),
        detail('Documentación', 'Subida segura y control de pendientes'),
        detail('Presupuestos', 'Revisión y pago online'),
        detail('Suscripciones', 'Gestión de planes mensuales')
      )}
      ${para('Si tienes cualquier duda o necesitas orientación antes de empezar, escríbenos directamente. Es gratis orientarte.')}
      ${btn('Acceder a mi área privada', `${BRAND.appUrl}/dashboard`)}
    `)
  };
}

// ── 1. Quote received (client) ───────────────────────────────────────────────
export function quoteReceivedClient(name: string, services: string) {
  return {
    subject: 'Hemos recibido tu solicitud de presupuesto — EXPERT',
    html: base('Solicitud recibida', `
      ${heading('¡Solicitud recibida!')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para('Hemos recibido tu solicitud de presupuesto y la estamos revisando. Nos pondremos en contacto contigo en un plazo de 24 horas hábiles con una propuesta personalizada.')}
      ${table(detail('Servicios solicitados', escapeHtml(services)))}
      ${para('Si tienes alguna pregunta urgente, puedes escribirnos directamente.')}
      ${btn('Ver mi área privada', `${BRAND.appUrl}/dashboard`)}
    `)
  };
}

// ── 2. Quote received (admin) ────────────────────────────────────────────────
export function quoteReceivedAdmin(name: string, email: string, services: string, description: string) {
  const safeName  = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  return {
    subject: `Nueva solicitud de presupuesto de ${safeName}`,
    html: base('Nueva solicitud', `
      ${heading('Nueva solicitud de presupuesto')}
      ${para('Se ha recibida una nueva solicitud desde el sitio web.')}
      ${table(
        detail('Nombre', safeName),
        detail('Email', `<a href="mailto:${safeEmail}" style="color:#c88b25;">${safeEmail}</a>`),
        detail('Servicios', escapeHtml(services)),
        detail('Descripción', escapeHtml(description) || '—')
      )}
      ${btn('Gestionar en el panel', `${BRAND.appUrl}/admin/presupuestos`)}
    `)
  };
}

// ── 3. Quote responded — admin ha fijado importe ─────────────────────────────
export function quoteResponded(name: string, amount: number, expiresAt: string | null) {
  const expiry = expiresAt
    ? new Date(expiresAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'próximamente';
  return {
    subject: 'Tu presupuesto personalizado está listo — EXPERT',
    html: base('Presupuesto listo', `
      ${heading('Tu presupuesto está listo')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para('Hemos preparado una propuesta personalizada para los servicios que solicitaste. Puedes revisarla y aceptar el pago desde tu área privada.')}
      ${table(
        detail('Importe', `€${amount.toFixed(2)}`),
        detail('Válido hasta', expiry)
      )}
      ${para('<em>Si tienes alguna duda sobre la propuesta, responde a este email y lo aclaramos.</em>')}
      ${btn('Revisar y pagar', `${BRAND.appUrl}/dashboard/presupuestos`)}
    `)
  };
}

// ── 4. Quote accepted — cliente ha aceptado, pendiente de pago ───────────────
export function quoteAcceptedAdmin(name: string, amount: number) {
  const safeName = escapeHtml(name);
  return {
    subject: `Presupuesto aceptado por ${safeName}`,
    html: base('Presupuesto aceptado', `
      ${heading('Presupuesto aceptado')}
      ${para(`<strong>${safeName}</strong> ha aceptado el presupuesto de <strong>€${amount.toFixed(2)}</strong> y está pendiente de pago.`)}
      ${btn('Ver en el panel', `${BRAND.appUrl}/admin/presupuestos`)}
    `)
  };
}

// ── 5. Payment confirmed ──────────────────────────────────────────────────────
export function paymentConfirmed(name: string, amount: number, service: string) {
  return {
    subject: 'Pago recibido — comenzamos tu expediente',
    html: base('Pago confirmado', `
      ${heading('¡Pago confirmado!')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para('Hemos recibido tu pago correctamente. Tu expediente ha sido creado y ya podemos comenzar a trabajar en tu trámite.')}
      ${table(
        detail('Servicio', escapeHtml(service)),
        detail('Importe abonado', `€${amount.toFixed(2)}`)
      )}
      ${para('En breve nos pondremos en contacto para informarte sobre la documentación necesaria. También puedes seguir el estado de tu expediente desde tu área privada.')}
      ${btn('Ver mi expediente', `${BRAND.appUrl}/dashboard/expedientes`)}
    `)
  };
}

export function servicePaymentConfirmed(name: string, amount: number, service: string) {
  return {
    subject: 'Pago recibido - empezamos con tu trámite',
    html: base('Pago confirmado', `
      ${heading('Pago confirmado')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para('Hemos recibido tu pago correctamente. A partir de ahora revisaremos la documentación necesaria para preparar tu trámite.')}
      ${table(
        detail('Servicio', escapeHtml(service)),
        detail('Importe abonado', `€${amount.toFixed(2)}`)
      )}
      ${stepsBlock([
        'Reúne la documentación indicada en la página del servicio.',
        'Envíanos los documentos por WhatsApp o respondiendo a este email.',
        'Revisaremos la viabilidad y te indicaremos si falta algo antes de presentar.',
        'Cuando el expediente esté preparado, te avisaremos para el pago de la tasa oficial si corresponde.'
      ])}
      ${para('<small style="color:#8899aa;">La tasa administrativa del Ministerio de Justicia no está incluida en este pago y se abonará aparte cuando proceda.</small>')}
      ${btn('Escribir por WhatsApp', 'https://wa.me/34696550480')}
    `)
  };
}

// ── 6. Case status updated ────────────────────────────────────────────────────
const STATE_LABELS: Record<string, string> = {
  pendiente_documentacion: 'Pendiente de documentación',
  en_revision: 'En revisión',
  en_proceso: 'En proceso',
  presentado: 'Presentado ante el organismo',
  finalizado: 'Finalizado'
};

export function caseStatusUpdated(name: string, service: string, newState: string) {
  const label = STATE_LABELS[newState] ?? escapeHtml(newState);
  return {
    subject: `Actualización de tu expediente: ${label}`,
    html: base('Estado actualizado', `
      ${heading('Tu expediente ha avanzado')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para('Queremos informarte de que el estado de tu expediente ha sido actualizado.')}
      ${table(
        detail('Servicio', escapeHtml(service)),
        detail('Nuevo estado', `<strong style="color:#c88b25;">${label}</strong>`)
      )}
      ${para('Puedes consultar todos los detalles desde tu área privada.')}
      ${btn('Ver mi expediente', `${BRAND.appUrl}/dashboard/expedientes`)}
    `)
  };
}

// ── 7. Service completed ──────────────────────────────────────────────────────
export function serviceCompleted(name: string, service: string) {
  return {
    subject: 'Tu servicio ha sido completado con éxito — EXPERT',
    html: base('Servicio completado', `
      ${heading('¡Trámite completado!')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para(`Nos complace comunicarte que el trámite <strong>${escapeHtml(service)}</strong> ha sido completado satisfactoriamente.`)}
      ${para('Ha sido un placer trabajar contigo. Si en el futuro necesitas cualquier otro servicio, estaremos aquí para ayudarte.')}
      ${btn('Ver mi área privada', `${BRAND.appUrl}/dashboard`)}
    `)
  };
}

// ── 8. Review request ─────────────────────────────────────────────────────────
export function reviewRequest(name: string, service: string, token: string, brand?: TenantBrand) {
  const brandDisplay = brand?.name ?? 'EXPERT';
  return {
    subject: `¿Cómo fue tu experiencia con ${brandDisplay}?`,
    html: base('Solicitud de reseña', `
      ${heading('¿Cómo fue tu experiencia?')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para(`Tu expediente de <strong>${escapeHtml(service)}</strong> ha finalizado. Nos gustaría conocer tu opinión sobre el servicio recibido — tu valoración nos ayuda a mejorar y a llegar a más personas.`)}
      ${para('Solo te tomará 2 minutos.')}
      ${btn('Dejar mi valoración', `${BRAND.appUrl}/gracias/opinion?token=${encodeURIComponent(token)}`)}
      ${para('<small style="color:#8899aa;">Si no deseas dejar una valoración, ignora este correo.</small>')}
    `, brand)
  };
}

// ── 9. Subscription created ───────────────────────────────────────────────────
export function subscriptionCreated(name: string, planName: string, periodEnd: string | null) {
  const renewal = periodEnd
    ? new Date(periodEnd).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'próximamente';
  const safePlan = escapeHtml(planName);
  return {
    subject: `Tu suscripción ${safePlan} está activa — EXPERT`,
    html: base('Suscripción activa', `
      ${heading('¡Bienvenido a tu plan EXPERT!')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para(`Tu suscripción <strong>${safePlan}</strong> está activa. A partir de ahora nos ocupamos de tus trámites de forma continua.`)}
      ${table(
        detail('Plan activo', safePlan),
        detail('Próxima renovación', renewal)
      )}
      ${para('Puedes gestionar tu suscripción, descargar facturas o cancelar en cualquier momento desde el portal de facturación.')}
      ${btn('Gestionar suscripción', `${BRAND.appUrl}/dashboard/suscripciones`)}
    `)
  };
}

// ── 10. Subscription payment failed ──────────────────────────────────────────
export function subscriptionPaymentFailed(name: string, planName: string) {
  return {
    subject: 'No hemos podido procesar el pago de tu suscripción — EXPERT',
    html: base('Pago fallido', `
      ${heading('Problema con el pago')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para(`No hemos podido procesar el pago de tu suscripción <strong>${escapeHtml(planName)}</strong>. Por favor, actualiza tu método de pago para que el servicio no se interrumpa.`)}
      ${btn('Actualizar método de pago', `${BRAND.appUrl}/dashboard/suscripciones`)}
      ${para('<small style="color:#8899aa;">Si ya has resuelto el problema, ignora este correo. El sistema reintentará el cobro automáticamente.</small>')}
    `)
  };
}

// ── 11. Contact form — admin notification ─────────────────────────────────────
export function contactMessage(nombre: string, email: string, asunto: string, mensaje: string, telefono?: string) {
  const safeNombre = escapeHtml(nombre);
  const safeEmail  = escapeHtml(email);
  const safeAsunto = escapeHtml(asunto);
  const safeMensaje= escapeHtml(mensaje);
  return {
    subject: `Formulario de contacto: ${safeNombre}`,
    html: base('Nuevo contacto', `
      ${heading('Nuevo mensaje de contacto')}
      ${para('Has recibido un mensaje desde el formulario de contacto del sitio web.')}
      ${table(
        detail('Nombre', safeNombre),
        detail('Email', `<a href="mailto:${safeEmail}" style="color:#c88b25;">${safeEmail}</a>`),
        ...(telefono ? [detail('Teléfono', escapeHtml(telefono))] : []),
        ...(asunto ? [detail('Área', safeAsunto)] : []),
        detail('Mensaje', `<span style="white-space:pre-wrap;">${safeMensaje}</span>`)
      )}
      ${btn('Responder por email', `mailto:${safeEmail}`)}
    `)
  };
}

// ── 12. Contact form — auto-reply to sender ───────────────────────────────────
export function contactAutoReply(nombre: string, asunto: string) {
  return {
    subject: 'Hemos recibido tu mensaje — EXPERT',
    html: base('Mensaje recibido', `
      ${heading('¡Mensaje recibido!')}
      ${para(`Hola <strong>${escapeHtml(nombre)}</strong>,`)}
      ${para('Gracias por ponerte en contacto con nosotros. Hemos recibido tu consulta y te responderemos en menos de <strong>24 horas hábiles</strong>.')}
      ${asunto ? table(detail('Área consultada', escapeHtml(asunto))) : ''}
      ${para('Si tu consulta es urgente, puedes escribirnos directamente por WhatsApp:')}
      ${btn('Escribir por WhatsApp', 'https://wa.me/34696550480')}
      ${para('<small style="color:#8899aa;">Si no enviaste este mensaje, ignora este correo.</small>')}
    `)
  };
}

// ── 13. Holded — migration package confirmed ──────────────────────────────────
export function holdedMigrationConfirmed(name: string, packageName: string, calendlyUrl: string) {
  const bookingUrl = calendlyUrl || `${BRAND.appUrl}/cita`;
  return {
    subject: '¡Tu migración a Holded ha comenzado! Reserva tu sesión de formación',
    html: base('Migración a Holded confirmada', `
      ${heading('¡Tu compra está confirmada!')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para(`Hemos recibido tu pago para el <strong>${escapeHtml(packageName)}</strong>. En las próximas 24 horas hábiles nos pondremos en contacto para coordinar el inicio de la migración.`)}
      ${para('Mientras tanto, reserva ya tu sesión de formación incluida (2 horas de onboarding) en el horario que mejor te venga:')}
      ${btn('Reservar sesión de formación', bookingUrl)}
      ${para('<small style="color:#8899aa;">Si tienes alguna pregunta antes de la primera sesión, responde a este correo y te atendemos.</small>')}
    `)
  };
}

// ── 14. Holded — formación session confirmed ──────────────────────────────────
export function holdedFormacionConfirmed(name: string, calendlyUrl: string) {
  const bookingUrl = calendlyUrl || `${BRAND.appUrl}/cita`;
  return {
    subject: '¡Sesión de formación Holded confirmada! Reserva tu horario',
    html: base('Formación Holded confirmada', `
      ${heading('¡Tu sesión de formación está lista!')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para('Hemos recibido tu pago para la sesión de formación en Holded (2 horas). Ahora solo tienes que elegir el día y hora que mejor te conviene:')}
      ${btn('Reservar mi sesión de formación', bookingUrl)}
      ${table(
        detail('Duración', '2 horas'),
        detail('Formato', 'Videollamada (Google Meet / Zoom)'),
        detail('Contenido', 'Adaptado a tu nivel y necesidades')
      )}
      ${para('Si tienes alguna duda antes de la sesión o quieres indicarnos áreas concretas a cubrir, responde a este correo.')}
    `)
  };
}

// ── 15. Document required ─────────────────────────────────────────────────────
export function documentRequired(name: string, service: string, docs: string[]) {
  const list = docs.map((d) => `<li style="margin:6px 0;color:#29384a;">${escapeHtml(d)}</li>`).join('');
  return {
    subject: 'Documentación necesaria para tu expediente — EXPERT',
    html: base('Documentación requerida', `
      ${heading('Necesitamos documentación')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para(`Para continuar con tu expediente de <strong>${escapeHtml(service)}</strong>, necesitamos que nos proporciones los siguientes documentos:`)}
      <ul style="margin:16px 0;padding-left:20px;">${list}</ul>
      ${para('Puedes subir los archivos directamente desde tu área privada de forma segura.')}
      ${btn('Subir documentos', `${BRAND.appUrl}/dashboard/expedientes`)}
    `)
  };
}

// ── 16. Holded demo — solicitud recibida (usuario) ───────────────────────────
export function holdedDemoRequested(name: string, companyName: string) {
  return {
    subject: 'Hemos recibido tu solicitud de prueba Holded 14 días — EXPERT',
    html: base('Solicitud recibida', `
      ${heading('¡Solicitud recibida!')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para('Hemos recibido tu solicitud para la prueba Holded de 14 días. Te orientaremos para activarla y te lo confirmaremos por email en menos de <strong>24 horas hábiles</strong>.')}
      ${table(
        detail('Empresa', escapeHtml(companyName)),
        detail('Próximo paso', 'Recibirás un email cuando la demo esté activa'),
        detail('Incluido', 'Acceso de prueba al software Holded. Configuración, migración y formación se contratan aparte si las necesitas.')
      )}
      ${para('Si tienes cualquier pregunta mientras tanto, puedes responder directamente a este email.')}
    `)
  };
}

// ── 17. Holded demo — solicitud recibida (admin) ──────────────────────────────
export function holdedDemoRequestAdmin(input: {
  name: string;
  email: string;
  phone?: string | null;
  companyName: string;
  companyType?: string | null;
  employeesCount?: string | null;
  currentSoftware?: string | null;
  needs?: string | null;
  demoId: string;
}) {
  return {
    subject: `Nueva solicitud prueba Holded 14 días: ${escapeHtml(input.companyName)}`,
    html: base('Nueva solicitud demo Holded', `
      ${heading('Nueva solicitud de prueba Holded 14 días')}
      ${para('Se ha recibido una solicitud de prueba gratuita de Holded desde el sitio web.')}
      ${table(
        detail('Nombre', escapeHtml(input.name)),
        detail('Email', `<a href="mailto:${escapeHtml(input.email)}" style="color:#c88b25;">${escapeHtml(input.email)}</a>`),
        ...(input.phone ? [detail('Teléfono', escapeHtml(input.phone))] : []),
        detail('Empresa', escapeHtml(input.companyName)),
        ...(input.companyType ? [detail('Tipo de empresa', escapeHtml(input.companyType))] : []),
        ...(input.employeesCount ? [detail('Empleados', escapeHtml(input.employeesCount))] : []),
        ...(input.currentSoftware ? [detail('Software actual', escapeHtml(input.currentSoftware))] : []),
        ...(input.needs ? [detail('Necesidades', `<span style="white-space:pre-wrap;">${escapeHtml(input.needs)}</span>`)] : [])
      )}
      ${btn('Gestionar solicitud en el panel', `${BRAND.appUrl}/admin/holded-demos`)}
    `)
  };
}

// ── 18. Holded demo — demo activada → reservar onboarding ────────────────────
export function holdedDemoActivated(name: string, helpUrl: string) {
  return {
    subject: '¡Tu prueba de Holded está activa! Siguiente paso',
    html: base('Demo Holded activa', `
      ${heading('¡Tu prueba de Holded está activa!')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para('Ya hemos activado tu prueba de 14 días en Holded. Puedes empezar a revisar el software y, si quieres ayuda profesional para configurarlo, migrar datos o formarte, podemos orientarte con Pack Starter o formación Holded.')}
      ${table(
        detail('Estado', 'Prueba Holded activa — 14 días'),
        detail('Siguiente paso', 'Elegir si necesitas Pack Starter, formación o un plan mensual'),
        detail('Importante', 'Los servicios EXPERT no están incluidos en la prueba del software')
      )}
      ${btn('Ver opciones de ayuda', helpUrl)}
      ${para('<small style="color:#8899aa;">Si tienes dudas, responde a este correo y te indicamos el siguiente paso adecuado.</small>')}
    `)
  };
}

// ── 19. Holded demo — onboarding completado → reservar formación ──────────────
export function holdedOnboardingDone(name: string, calendlyFormacionUrl: string) {
  const bookingUrl = calendlyFormacionUrl || `${BRAND.appUrl}/cita`;
  return {
    subject: 'Formación Holded disponible — EXPERT',
    html: base('Formación Holded disponible', `
      ${heading('Siguiente paso: formación Holded')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para('Si quieres profundizar en Holded, puedes reservar una sesión de formación práctica de 2 horas adaptada a tu negocio.')}
      ${table(
        detail('Duración', '2 horas'),
        detail('Formato', 'Videollamada — contenido adaptado a tu sector'),
        detail('Coste', 'Servicio EXPERT aparte de la prueba Holded')
      )}
      ${btn('Reservar formación Holded', bookingUrl)}
      ${para('<small style="color:#8899aa;">La formación está pensada para que puedas usar Holded con autonomía desde el primer mes. Aprovéchala.</small>')}
    `)
  };
}

// ── 20. SaaS lead — admin notification ───────────────────────────────────────
export function saasLeadReceivedAdmin(input: {
  name: string;
  email: string;
  phone?: string | null;
  companyName: string;
  clientCountRange: string;
  currentTools?: string | null;
  operationalProblem: string;
  pilotInterest: string;
}) {
  const name = escapeHtml(input.name);
  const email = escapeHtml(input.email);
  const companyName = escapeHtml(input.companyName);
  const problem = escapeHtml(input.operationalProblem);

  return {
    subject: `Nuevo lead SaaS para asesorías: ${companyName}`,
    html: base('Nuevo lead SaaS', `
      ${heading('Nuevo interés B2B para EXPERT')}
      ${para('Se ha recibido una solicitud desde la página pública para asesorías.')}
      ${table(
        detail('Nombre', name),
        detail('Email', `<a href="mailto:${email}" style="color:#c88b25;">${email}</a>`),
        ...(input.phone ? [detail('Teléfono', escapeHtml(input.phone))] : []),
        detail('Empresa o despacho', companyName),
        detail('Clientes aproximados', escapeHtml(input.clientCountRange)),
        ...(input.currentTools ? [detail('Herramientas actuales', escapeHtml(input.currentTools))] : []),
        detail('Problema operativo', `<span style="white-space:pre-wrap;">${problem}</span>`),
        detail('Interés', escapeHtml(input.pilotInterest))
      )}
      ${btn('Responder por email', `mailto:${email}`)}
    `)
  };
}

// ── 21. SaaS lead — auto-reply ────────────────────────────────────────────────
export function saasLeadAutoReply(name: string) {
  return {
    subject: 'Hemos recibido tu interés en EXPERT para asesorías',
    html: base('Interés recibido', `
      ${heading('Gracias por tu interés')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para('Hemos recibido tu solicitud sobre la futura plataforma EXPERT para asesorías, gestorías y despachos profesionales.')}
      ${para('Estamos validando pilotos de forma discreta mientras seguimos construyendo el sistema para la operativa interna de EXPERT. Revisaremos tu caso y te responderemos con los siguientes pasos.')}
      ${para('Si quieres añadir algún detalle sobre tu operativa actual, puedes responder directamente a este email.')}
    `)
  };
}

// ── Enhancement helpers ───────────────────────────────────────────────────────

function funFactBlock(fact: string): string {
  return `<div style="margin-top:28px;padding:16px 20px;background:#f8f4eb;border-left:3px solid #c88b25;border-radius:0 8px 8px 0;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.1em;color:#c88b25;">¿Sabías que...?</p>
    <p style="margin:0;font-size:13px;color:#29384a;line-height:1.5;">${fact}</p>
  </div>`;
}

function stepsBlock(steps: string[]): string {
  const items = steps.map((s, i) => `
    <tr>
      <td style="padding:8px 12px;vertical-align:top;width:28px;">
        <span style="display:inline-block;width:22px;height:22px;background:#c88b25;border-radius:50%;color:#061321;font-size:11px;font-weight:bold;text-align:center;line-height:22px;">${i + 1}</span>
      </td>
      <td style="padding:8px 0;font-size:13px;color:#29384a;line-height:1.5;">${s}</td>
    </tr>`).join('');
  return `<div style="margin:20px 0;">
    <p style="margin:0 0 10px;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.08em;color:#07111d;">Próximos pasos</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;">${items}</table>
  </div>`;
}

function noteBlock(note: string): string {
  return `<div style="margin:16px 0;padding:14px 18px;background:#fff8ec;border:1px solid #f0d8a0;border-radius:8px;">
    <p style="margin:0 0 4px;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.1em;color:#c88b25;">Nota de tu gestor</p>
    <p style="margin:0;font-size:13px;color:#29384a;line-height:1.5;">${escapeHtml(note)}</p>
  </div>`;
}

// ── 22. Admin-created quote with direct Stripe link ───────────────────────────
export function quoteWithPaymentLink(
  name: string,
  amount: number,
  service: string,
  stripeUrl: string,
  expiresAt: string | null,
  funFact: string
) {
  const expiry = expiresAt
    ? new Date(expiresAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  return {
    subject: `Tu presupuesto EXPERT está listo — ${service}`,
    html: base('Presupuesto listo para pagar', `
      ${heading('Tu propuesta personalizada está lista')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para(`Hemos preparado tu presupuesto para <strong>${escapeHtml(service)}</strong>. Puedes completar el pago directamente desde el botón de abajo — sin necesidad de buscar nada en el panel.`)}
      ${table(
        detail('Servicio', escapeHtml(service)),
        detail('Importe total', `<strong style="font-size:18px;color:#c88b25;">€${amount.toFixed(2)}</strong>`),
        ...(expiry ? [detail('Válido hasta', expiry)] : [])
      )}
      ${btn('Pagar ahora — €' + amount.toFixed(2), stripeUrl)}
      ${stepsBlock([
        'Haz clic en "Pagar ahora" y completa el pago de forma segura (Visa / Mastercard / Amex).',
        'Recibirás un email de confirmación con los detalles de tu expediente.',
        'Accede a tu panel privado para seguir el estado en tiempo real y subir documentación.',
        'Tu gestor te contactará en menos de 24 horas hábiles para coordinar el inicio.'
      ])}
      ${para('<small style="color:#8899aa;">El pago se procesa de forma segura a través de Stripe (PCI-DSS). EXPERT no almacena datos de tu tarjeta. Si tienes alguna duda sobre el presupuesto, responde a este email.</small>')}
      ${funFactBlock(funFact)}
    `)
  };
}

// ── 23. Subscription invite — admin sends subscription link to client ──────────
export function subscriptionInvite(
  name: string,
  planName: string,
  amount: number,
  stripeUrl: string,
  funFact: string
) {
  return {
    subject: `Tu plan mensual EXPERT está listo para activar — ${planName}`,
    html: base('Plan mensual listo', `
      ${heading('Activa tu plan mensual')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para(`Tu plan de suscripción mensual <strong>${escapeHtml(planName)}</strong> está listo para activar. Desde el momento en que completes el pago, nos ocupamos de tus trámites de forma continua mes a mes.`)}
      ${table(
        detail('Plan', escapeHtml(planName)),
        detail('Cuota mensual', `<strong style="font-size:18px;color:#c88b25;">€${amount.toFixed(2)}/mes</strong>`),
        detail('Renovación', 'Automática cada mes, cancelable en cualquier momento'),
        detail('Pago', 'Seguro a través de Stripe (Visa / Mastercard / Amex)')
      )}
      ${btn('Activar mi plan — €' + amount.toFixed(2) + '/mes', stripeUrl)}
      ${stepsBlock([
        'Haz clic en "Activar mi plan" y completa el pago de forma segura.',
        'Recibirás un email de confirmación con los detalles de tu suscripción.',
        'Accede a tu panel privado para gestionar tu plan, descargar facturas o cancelar cuando quieras.',
        'Tu gestor te contactará para coordinar la operativa del primer mes.'
      ])}
      ${para('<small style="color:#8899aa;">Puedes cancelar tu suscripción en cualquier momento desde tu panel en <a href="' + BRAND.appUrl + '/dashboard/suscripciones" style="color:#c88b25;">Mi área privada</a>. La cancelación surte efecto al final del período de facturación en curso.</small>')}
      ${funFactBlock(funFact)}
    `)
  };
}

// ── New case-stage templates (8 stages) ───────────────────────────────────────

// Stage 1: nuevo — expediente abierto tras pago
export function caseOpened(name: string, service: string, note: string | null, funFact: string) {
  return {
    subject: `Tu expediente de ${service} está abierto — EXPERT`,
    html: base('Expediente abierto', `
      ${heading('¡Tu expediente ya está abierto!')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para(`Hemos abierto tu expediente para <strong>${escapeHtml(service)}</strong>. Tu gestor ya está asignado y comenzará a trabajar en tu caso.`)}
      ${note ? noteBlock(note) : ''}
      ${stepsBlock([
        'Espera la solicitud de documentación — te llegará por email en breve.',
        'Accede a tu panel privado para ver el estado en tiempo real.',
        'Sube los documentos que te solicitemos directamente desde el panel.',
        'Tu gestor te mantendrá informado en cada avance importante.'
      ])}
      ${btn('Ver mi expediente', `${BRAND.appUrl}/dashboard/expedientes`)}
      ${funFactBlock(funFact)}
    `)
  };
}

// Stage 2: docs_pendientes — documentación solicitada
export function caseDocsRequired(
  name: string,
  service: string,
  docs: string[],
  note: string | null,
  funFact: string,
  brand?: TenantBrand
) {
  const list = docs.map((d) => `<li style="margin:6px 0;color:#29384a;">${escapeHtml(d)}</li>`).join('');
  return {
    subject: `Documentación necesaria para tu expediente — ${service}`,
    html: base('Documentación requerida', `
      ${heading('Necesitamos tu documentación')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para(`Para avanzar con tu expediente de <strong>${escapeHtml(service)}</strong>, necesitamos que nos proporciones los siguientes documentos:`)}
      <ul style="margin:16px 0;padding-left:20px;">${list || '<li style="color:#29384a;">Tu gestor te indicará la documentación necesaria directamente.</li>'}</ul>
      ${note ? noteBlock(note) : ''}
      ${stepsBlock([
        'Reúne los documentos listados arriba (escaneados o en foto clara).',
        'Accede a tu panel privado y súbelos en la sección "Documentos" de tu expediente.',
        'También puedes enviarlos directamente por email respondiendo a este mensaje.',
        'Una vez recibidos, comenzaremos la revisión y te avisaremos del siguiente paso.'
      ])}
      ${btn('Subir documentos ahora', `${BRAND.appUrl}/dashboard/expedientes`)}
      ${para('<small style="color:#8899aa;">Si tienes dudas sobre algún documento o no sabes dónde obtenerlo, responde a este email y te ayudamos.</small>')}
      ${funFactBlock(funFact)}
    `, brand)
  };
}

// Stage 3: docs_recibidos — documentación recibida
export function caseDocsReceived(name: string, service: string, note: string | null, funFact: string, brand?: TenantBrand) {
  return {
    subject: `Documentación recibida — comenzamos la revisión de tu expediente`,
    html: base('Documentación recibida', `
      ${heading('Documentación recibida')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para(`Hemos recibido la documentación de tu expediente de <strong>${escapeHtml(service)}</strong>. Comenzamos la revisión.`)}
      ${note ? noteBlock(note) : ''}
      ${stepsBlock([
        'Tu gestor revisará la documentación en detalle (plazo habitual: 1-2 días hábiles).',
        'Si necesitamos algo adicional, te lo comunicaremos por email.',
        'Una vez revisada toda la documentación, te informaremos del siguiente paso.',
        'Puedes consultar el estado en tiempo real desde tu panel privado.'
      ])}
      ${btn('Ver mi expediente', `${BRAND.appUrl}/dashboard/expedientes`)}
      ${funFactBlock(funFact)}
    `, brand)
  };
}

// Stage 4: en_tramitacion — tramitación activa
export function caseInProgress(name: string, service: string, note: string | null, funFact: string, brand?: TenantBrand) {
  return {
    subject: `Tu expediente de ${service} está en tramitación`,
    html: base('Expediente en tramitación', `
      ${heading('Tu expediente está en tramitación')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para(`Tu expediente de <strong>${escapeHtml(service)}</strong> está siendo gestionado activamente por tu gestor. Estamos trabajando en ello.`)}
      ${note ? noteBlock(note) : ''}
      ${stepsBlock([
        'Tu gestor está tramitando activamente tu expediente.',
        'Te notificaremos por email en cada avance relevante.',
        'Si tienes cualquier duda urgente, escríbenos por WhatsApp al +34 696 55 04 80.',
        'Consulta el estado en tiempo real desde tu panel privado.'
      ])}
      ${btn('Ver mi expediente', `${BRAND.appUrl}/dashboard/expedientes`)}
      ${para('<small style="color:#8899aa;">Los plazos de tramitación dependen en parte de organismos externos (Hacienda, Registro, Extranjería...). Te mantendremos informado de cualquier novedad.</small>')}
      ${funFactBlock(funFact)}
    `, brand)
  };
}

// Stage 5: pendiente_externo — presentado, esperando respuesta de organismo
export function casePendingExternal(
  name: string,
  service: string,
  organism: string | null,
  note: string | null,
  funFact: string,
  brand?: TenantBrand
) {
  const org = organism ? escapeHtml(organism) : 'el organismo correspondiente';
  return {
    subject: `Expediente presentado ante ${org} — Pendiente de resolución`,
    html: base('Expediente presentado', `
      ${heading('Tu expediente ha sido presentado')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para(`Tu expediente de <strong>${escapeHtml(service)}</strong> ha sido presentado correctamente ante <strong>${org}</strong>. Ahora estamos pendientes de su resolución.`)}
      ${note ? noteBlock(note) : ''}
      ${stepsBlock([
        `Hemos presentado tu expediente ante ${org} — recibirás acuse de recibo si aplica.`,
        'Los plazos de resolución los fija el organismo: te informaremos en cuanto tengamos noticias.',
        'Mientras tanto, no necesitas hacer nada. Nosotros hacemos el seguimiento.',
        'Si el organismo solicita documentación adicional, te lo comunicaremos de inmediato.'
      ])}
      ${btn('Ver mi expediente', `${BRAND.appUrl}/dashboard/expedientes`)}
      ${para('<small style="color:#8899aa;">Los plazos administrativos pueden variar. Hacemos el seguimiento activo de tu expediente y te notificamos cualquier novedad.</small>')}
      ${funFactBlock(funFact)}
    `, brand)
  };
}

// Stage 6: resolucion_recibida — resolución del organismo recibida
export function caseResolutionReceived(name: string, service: string, note: string | null, funFact: string) {
  return {
    subject: `Resolución recibida para tu expediente de ${service} — EXPERT`,
    html: base('Resolución recibida', `
      ${heading('Hemos recibido resolución')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para(`Hemos recibido la resolución correspondiente a tu expediente de <strong>${escapeHtml(service)}</strong>. Tu gestor la está revisando y te informará del resultado en detalle.`)}
      ${note ? noteBlock(note) : ''}
      ${stepsBlock([
        'Tu gestor ha recibido y está analizando la resolución.',
        'Te contactaremos por email (y si es urgente, por teléfono/WhatsApp) con el resultado.',
        'Si la resolución requiere alguna acción por tu parte, te lo indicaremos con claridad.',
        'Accede a tu panel para ver si hay documentos o actualizaciones disponibles.'
      ])}
      ${btn('Ver mi expediente', `${BRAND.appUrl}/dashboard/expedientes`)}
      ${funFactBlock(funFact)}
    `)
  };
}

// Stage 7: entregado — servicio entregado al cliente
export function caseDelivered(name: string, service: string, note: string | null, funFact: string, brand?: TenantBrand) {
  return {
    subject: `Tu expediente de ${service} está completado — Documentación disponible`,
    html: base('Servicio entregado', `
      ${heading('¡Tu expediente está completado!')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para(`Tu expediente de <strong>${escapeHtml(service)}</strong> ha sido completado y la documentación final está disponible en tu panel privado.`)}
      ${note ? noteBlock(note) : ''}
      ${stepsBlock([
        'Accede a tu panel y descarga la documentación final en la sección "Documentos".',
        'Revisa que todo esté correcto — si hay algún error, escríbenos de inmediato.',
        'Guarda una copia de la documentación en un lugar seguro.',
        'Si en el futuro necesitas renovar o gestionar algo relacionado, ya sabemos dónde estamos.'
      ])}
      ${btn('Descargar mi documentación', `${BRAND.appUrl}/dashboard/expedientes`)}
      ${para(`<small style="color:#8899aa;">En breve recibirás un email para que puedas compartir tu opinión sobre el servicio. Tu valoración nos ayuda mucho. ¡Gracias por confiar en ${escapeHtml(brand?.name ?? 'EXPERT')}!</small>`)}
      ${funFactBlock(funFact)}
    `, brand)
  };
}

// ── Extended STATE_LABELS (all 12 states) ─────────────────────────────────────
export const ALL_CASE_STATE_LABELS: Record<string, string> = {
  nuevo: 'Expediente abierto',
  docs_pendientes: 'Documentación pendiente',
  docs_recibidos: 'Documentación recibida',
  en_tramitacion: 'En tramitación',
  pendiente_externo: 'Pendiente de organismo',
  resolucion_recibida: 'Resolución recibida',
  entregado: 'Entregado al cliente',
  finalizado: 'Finalizado',
  // Legacy states (backward compat)
  pendiente_documentacion: 'Pendiente de documentación',
  en_revision: 'En revisión',
  en_proceso: 'En proceso',
  presentado: 'Presentado',
};

// ── Presupuesto personalizado ─────────────────────────────────────────────────

export function presupuestoAvanzadoRequested(name: string, companyName: string) {
  return {
    subject: 'Hemos recibido tu solicitud de presupuesto personalizado — EXPERT',
    html: base('Solicitud de presupuesto recibida', `
      ${heading('¡Solicitud recibida!')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para(`Gracias por contactar con EXPERT. Hemos recibido tu solicitud de presupuesto personalizado para <strong>${escapeHtml(companyName)}</strong>.`)}
      ${para('Analizaremos tus necesidades y te enviaremos una propuesta detallada y ajustada a tu situación real en <strong>24 horas hábiles</strong>.')}
      ${stepsBlock([
        'Revisamos tu solicitud y los servicios que necesitas.',
        'Preparamos una propuesta personalizada con el coste mensual estimado.',
        'Te la enviamos por email — sin compromiso, sin letra pequeña.',
        'Si tienes dudas urgentes, escríbenos a info@expertconsulting.es'
      ])}
      ${para('<small style="color:#8899aa;">Si no recibes respuesta en 24 horas hábiles, revisa la carpeta de spam o escríbenos directamente a <a href="mailto:info@expertconsulting.es" style="color:#c88b25;">info@expertconsulting.es</a></small>')}
      ${btn('Ver todos los planes', `${BRAND.appUrl}/planes`)}
    `)
  };
}

export function presupuestoAvanzadoAdmin(data: {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  companyType?: string;
  taxId?: string;
  employees?: string;
  annualBilling?: string;
  currentSoftware?: string;
  urgency?: string;
  services: string[];
  message?: string;
}) {
  const safeEmail = escapeHtml(data.email);
  const servicesList = data.services.map(escapeHtml).join(', ');
  return {
    subject: `Nueva solicitud de presupuesto personalizado — ${escapeHtml(data.companyName)}`,
    html: base('Nueva solicitud presupuesto avanzado', `
      ${heading('Nueva solicitud de presupuesto')}
      ${para('Se ha recibido una nueva solicitud de presupuesto personalizado:')}
      ${table(
        detail('Nombre', escapeHtml(data.name)),
        detail('Email', `<a href="mailto:${safeEmail}" style="color:#c88b25;">${safeEmail}</a>`),
        detail('Teléfono', escapeHtml(data.phone)),
        detail('Empresa', escapeHtml(data.companyName)),
        ...(data.companyType    ? [detail('Tipo de empresa',    escapeHtml(data.companyType))]    : []),
        ...(data.taxId          ? [detail('CIF / NIF',          escapeHtml(data.taxId))]          : []),
        ...(data.employees      ? [detail('Empleados',          escapeHtml(data.employees))]      : []),
        ...(data.annualBilling  ? [detail('Facturación anual',  escapeHtml(data.annualBilling))]  : []),
        ...(data.currentSoftware? [detail('Software actual',    escapeHtml(data.currentSoftware))]: []),
        ...(data.urgency        ? [detail('Urgencia',           escapeHtml(data.urgency))]        : []),
        detail('Servicios solicitados', servicesList)
      )}
      ${data.message ? noteBlock(data.message) : ''}
      ${btn('Gestionar solicitud', `${BRAND.appUrl}/admin`)}
    `)
  };
}

// ── New message: admin → client notification ─────────────────────────────────
export function caseNewMessageFromAdvisor(clientName: string, service: string, preview: string, caseId: string) {
  return {
    subject: `Nuevo mensaje de tu asesor — ${service}`,
    html: base('Nuevo mensaje en tu expediente', `
      ${heading('Tu asesor te ha escrito')}
      ${para(`Hola <strong>${escapeHtml(clientName)}</strong>,`)}
      ${para(`Tu gestor de EXPERT ha enviado un mensaje en tu expediente de <strong>${escapeHtml(service)}</strong>.`)}
      <div style="margin:20px 0;padding:16px 20px;background:#f8f4eb;border-left:3px solid #c88b25;border-radius:0 8px 8px 0;">
        <p style="margin:0;font-size:13px;color:#29384a;font-style:italic;">"${escapeHtml(preview.slice(0, 200))}${preview.length > 200 ? '…' : ''}"</p>
      </div>
      ${btn('Ver mensaje completo', `${BRAND.appUrl}/dashboard/expedientes/${caseId}`)}
      ${para('<small style="color:#8899aa;">Puedes responder directamente desde tu panel privado.</small>')}
    `)
  };
}

// ── Client invite / onboarding ────────────────────────────────────────────────
export function clientInviteEmail(name: string, inviteUrl: string) {
  const firstName = name.split(' ')[0];
  return {
    subject: '🎉 Tu acceso a EXPERT está listo — actívalo ahora',
    html: base('Bienvenido/a a EXPERT', `
      ${heading(`¡Hola ${escapeHtml(firstName)}! 👋`)}
      ${para('Tu asesor/a de <strong>EXPERT</strong> ha creado tu área privada. Desde aquí podrás seguir tus trámites en tiempo real, enviar documentación y mucho más — todo sin llamadas ni papeleos.')}

      <div style="margin:24px 0;padding:20px 24px;background:#f8f4eb;border-radius:12px;border:1px solid #d8cbb5;">
        <p style="margin:0 0 12px;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:0.1em;color:#c88b25;">✨ Lo que encontrarás en tu área privada</p>
        <table cellpadding="0" cellspacing="0" style="width:100%;">
          <tr><td style="padding:6px 0;font-size:14px;color:#29384a;">📋 <strong>Mis expedientes</strong> — estado en tiempo real de cada trámite</td></tr>
          <tr><td style="padding:6px 0;font-size:14px;color:#29384a;">📂 <strong>Documentación</strong> — sube archivos de forma segura en segundos</td></tr>
          <tr><td style="padding:6px 0;font-size:14px;color:#29384a;">💶 <strong>Presupuestos</strong> — revisa y paga online sin trámites extra</td></tr>
          <tr><td style="padding:6px 0;font-size:14px;color:#29384a;">🔔 <strong>Notificaciones</strong> — te avisamos en cada avance importante</td></tr>
          <tr><td style="padding:6px 0;font-size:14px;color:#29384a;">💬 <strong>Comunicación directa</strong> — escríbenos sin cambiar de pantalla</td></tr>
        </table>
      </div>

      ${para('Activa tu cuenta ahora — <strong>es gratis y solo te llevará 30 segundos</strong>:')}
      ${btn('🚀 Activar mi área privada', inviteUrl)}
      ${para('<small style="color:#8899aa;">Este enlace es personal y caduca en 24 horas. Si no lo solicitaste tú, ignora este correo.</small>')}

      <div style="margin-top:28px;padding:16px 20px;background:#e8f5e9;border-left:3px solid #25D366;border-radius:0 8px 8px 0;">
        <p style="margin:0;font-size:13px;color:#1a5c2a;">💡 <strong>¿Tienes dudas?</strong> Puedes escribirnos directamente por WhatsApp al <a href="https://wa.me/34696550480" style="color:#1a9e4a;font-weight:bold;">+34 696 55 04 80</a> — respondemos en menos de 2 horas en horario de oficina.</p>
      </div>
    `)
  };
}

// ── Admin: nuevo cliente registrado ──────────────────────────────────────────
export function newClientAdminAlert(input: {
  name: string;
  email: string;
  phone: string | null;
  source: string;
}) {
  return {
    subject: `🆕 Nuevo cliente registrado: ${escapeHtml(input.name)}`,
    html: base('Nuevo cliente', `
      ${heading('Nuevo cliente registrado 🎉')}
      ${para('Se ha creado un nuevo acceso de cliente desde el panel de administración.')}
      ${table(
        detail('Nombre', escapeHtml(input.name)),
        detail('Email', `<a href="mailto:${escapeHtml(input.email)}" style="color:#c88b25;">${escapeHtml(input.email)}</a>`),
        ...(input.phone ? [detail('Teléfono / WhatsApp', escapeHtml(input.phone))] : []),
        detail('Origen', escapeHtml(input.source)),
        detail('Estado', '✉️ Invitación de activación enviada al cliente')
      )}
      ${para('Se ha enviado al cliente un email con enlace para activar su cuenta y acceder al área privada.')}
      ${btn('Ver en Usuarios', `${BRAND.appUrl}/admin/usuarios`)}
    `)
  };
}

// ── Admin: nuevo usuario registrado (vía cualquier flujo) ─────────────────────
export function newUserRegisteredAdmin(input: {
  name: string;
  email: string;
  phone?: string | null;
  registrationMethod: string;
}) {
  return {
    subject: `👤 Nuevo usuario en EXPERT: ${escapeHtml(input.name)}`,
    html: base('Nuevo registro', `
      ${heading('Nuevo usuario registrado')}
      ${para('Un nuevo usuario acaba de crear o activar su cuenta en la plataforma.')}
      ${table(
        detail('Nombre', escapeHtml(input.name)),
        detail('Email', `<a href="mailto:${escapeHtml(input.email)}" style="color:#c88b25;">${escapeHtml(input.email)}</a>`),
        ...(input.phone ? [detail('Teléfono', escapeHtml(input.phone))] : []),
        detail('Método', escapeHtml(input.registrationMethod)),
        detail('Fecha', new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }))
      )}
      ${btn('Ver en el panel', `${BRAND.appUrl}/admin/usuarios`)}
    `)
  };
}

// ── New message: client → admin notification ─────────────────────────────────
export function caseNewMessageFromClient(clientName: string, service: string, preview: string, caseId: string) {
  return {
    subject: `Mensaje de cliente — ${clientName} (${service})`,
    html: base('Mensaje de cliente', `
      ${heading('El cliente ha enviado un mensaje')}
      ${para(`<strong>${escapeHtml(clientName)}</strong> ha escrito en su expediente de <strong>${escapeHtml(service)}</strong>:`)}
      <div style="margin:20px 0;padding:16px 20px;background:#f8f4eb;border-left:3px solid #c88b25;border-radius:0 8px 8px 0;">
        <p style="margin:0;font-size:13px;color:#29384a;font-style:italic;">"${escapeHtml(preview.slice(0, 300))}${preview.length > 300 ? '…' : ''}"</p>
      </div>
      ${btn('Ver expediente', `${BRAND.appUrl}/admin/expedientes/${caseId}`)}
    `)
  };
}

// ── Cita: solicitud recibida (cliente) ──────────────────────────────────────
export function citaRequested(name: string, service: string, preferredDate: string, preferredTime: string) {
  return {
    subject: `Solicitud de cita recibida — EXPERT`,
    html: base('Solicitud de cita recibida', `
      ${heading('¡Solicitud recibida!')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para('Hemos recibido tu solicitud de cita. La revisaremos y te confirmaremos el día y la hora lo antes posible, normalmente en menos de 24 horas hábiles.')}
      ${table(
        detail('Servicio', escapeHtml(service)),
        detail('Fecha preferida', escapeHtml(preferredDate)),
        detail('Franja horaria', escapeHtml(preferredTime))
      )}
      ${para('Si necesitas cambiar algo o tienes alguna urgencia, responde a este email directamente.')}
      ${btn('Ver mi área privada', `${BRAND.appUrl}/dashboard`)}
    `)
  };
}

// ── Cita: confirmación (cliente) ─────────────────────────────────────────────
export function citaConfirmed(
  name: string,
  service: string,
  confirmedDate: string,
  confirmedTime: string,
  meetingUrl?: string | null
) {
  return {
    subject: `Tu cita está confirmada — ${confirmedDate}`,
    html: base('Cita confirmada', `
      ${heading('Tu cita está confirmada')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para(`Tu cita para <strong>${escapeHtml(service)}</strong> ha sido confirmada. Aquí tienes los detalles:`)}
      ${table(
        detail('Servicio', escapeHtml(service)),
        detail('Fecha', escapeHtml(confirmedDate)),
        detail('Hora', escapeHtml(confirmedTime)),
        ...(meetingUrl ? [detail('Enlace de reunión', `<a href="${meetingUrl}" style="color:#c88b25;">${meetingUrl}</a>`)] : [])
      )}
      ${meetingUrl ? btn('Unirme a la reunión', meetingUrl) : ''}
      ${para('Si necesitas cancelar o reagendar, responde a este email con al menos 24 horas de antelación.')}
    `)
  };
}

// ── Cita: notificación al admin ──────────────────────────────────────────────
export function citaRequestAdmin(params: {
  name: string;
  email: string;
  phone?: string | null;
  service: string;
  preferredDate: string;
  preferredTime: string;
  notes?: string | null;
  appointmentId: string;
}) {
  const safeEmail = escapeHtml(params.email);
  return {
    subject: `Nueva solicitud de cita — ${escapeHtml(params.name)}`,
    html: base('Nueva solicitud de cita', `
      ${heading('Nueva solicitud de cita')}
      ${para('Se ha recibido una nueva solicitud de cita desde el sitio web:')}
      ${table(
        detail('Nombre', escapeHtml(params.name)),
        detail('Email', `<a href="mailto:${safeEmail}" style="color:#c88b25;">${safeEmail}</a>`),
        ...(params.phone ? [detail('Teléfono', escapeHtml(params.phone))] : []),
        detail('Servicio', escapeHtml(params.service)),
        detail('Fecha preferida', escapeHtml(params.preferredDate)),
        detail('Franja', escapeHtml(params.preferredTime)),
        ...(params.notes ? [detail('Notas', escapeHtml(params.notes))] : [])
      )}
      ${btn('Gestionar cita', `${BRAND.appUrl}/admin/citas`)}
    `)
  };
}

// ── Cita: recordatorio 24h antes (cliente) ────────────────────────────────────
export function citaReminder(
  name: string,
  service: string,
  confirmedDate: string,
  confirmedTime: string,
  meetingUrl?: string | null
) {
  return {
    subject: `Recordatorio: tu cita mañana — ${confirmedDate}`,
    html: base('Recordatorio de cita', `
      ${heading('Tu cita es mañana')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para(`Te recordamos que tienes una cita mañana para <strong>${escapeHtml(service)}</strong>. Aquí tienes los detalles:`)}
      ${table(
        detail('Servicio', escapeHtml(service)),
        detail('Fecha', escapeHtml(confirmedDate)),
        detail('Hora', escapeHtml(confirmedTime)),
        ...(meetingUrl ? [detail('Enlace de reunión', `<a href="${meetingUrl}" style="color:#c88b25;">${meetingUrl}</a>`)] : [])
      )}
      ${meetingUrl ? btn('Unirse a la reunión', meetingUrl) : ''}
      ${para('Si necesitas cancelar o reagendar, responde a este correo con la mayor antelación posible.')}
      ${para('<small style="color:#8899aa;">EXPERT Consulting · expertconsulting.es</small>')}
    `)
  };
}

// ── Daily admin summary ───────────────────────────────────────────────────────

export interface DailySummaryData {
  date             : string;
  casesBlocked     : Array<{ id: string; service: string; client: string; daysPending: number }>;
  casesAwaitingDocs: Array<{ id: string; service: string; client: string; daysPending: number }>;
  quotesOpen       : Array<{ id: string; title: string; client: string; amount: number; daysOpen: number }>;
  paymentsFailedSubs: Array<{ client: string; plan: string }>;
  newLeads24h      : number;
  newMessages24h   : number;
  holdedJobsFailed : number;
}

export function dailyAdminSummary(data: DailySummaryData) {
  const hasAlerts =
    data.casesBlocked.length > 0 ||
    data.casesAwaitingDocs.length > 0 ||
    data.quotesOpen.length > 0 ||
    data.paymentsFailedSubs.length > 0;

  const urgentBadge = (n: number, label: string) =>
    n > 0
      ? `<span style="display:inline-block;background:#dc2626;color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;margin-left:6px;">${n} ${label}</span>`
      : '';

  const caseRows = (items: DailySummaryData['casesBlocked']) =>
    items.map((c) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0e9d8;font-size:13px;color:#07111d;">${escapeHtml(c.service)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0e9d8;font-size:13px;color:#29384a;">${escapeHtml(c.client)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0e9d8;font-size:12px;color:#dc2626;font-weight:600;">${c.daysPending}d</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0e9d8;">
          <a href="${BRAND.appUrl}/admin/expedientes/${c.id}" style="color:#c88b25;font-size:12px;">Ver</a>
        </td>
      </tr>`).join('');

  const quoteRows = data.quotesOpen.map((q) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e9d8;font-size:13px;color:#07111d;">${escapeHtml(q.title)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e9d8;font-size:13px;color:#29384a;">${escapeHtml(q.client)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e9d8;font-size:13px;color:#c88b25;font-weight:600;">€${q.amount.toFixed(0)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e9d8;font-size:12px;color:#d97706;">${q.daysOpen}d</td>
    </tr>`).join('');

  const failedSubRows = data.paymentsFailedSubs.map((s) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e9d8;font-size:13px;color:#07111d;">${escapeHtml(s.client)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f0e9d8;font-size:13px;color:#dc2626;">${escapeHtml(s.plan)}</td>
    </tr>`).join('');

  const tableWrapper = (rows: string) =>
    `<table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #d8cbb5;margin-bottom:20px;">${rows}</table>`;

  const sections: string[] = [];

  if (data.casesBlocked.length > 0) {
    sections.push(`
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#dc2626;">🔴 Expedientes bloqueados${urgentBadge(data.casesBlocked.length, '')}</p>
      ${tableWrapper(caseRows(data.casesBlocked))}`);
  }

  if (data.casesAwaitingDocs.length > 0) {
    sections.push(`
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#d97706;">📂 Documentación pendiente${urgentBadge(data.casesAwaitingDocs.length, '')}</p>
      ${tableWrapper(caseRows(data.casesAwaitingDocs))}`);
  }

  if (data.quotesOpen.length > 0) {
    sections.push(`
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#29384a;">💼 Presupuestos sin responder</p>
      ${tableWrapper(quoteRows)}`);
  }

  if (data.paymentsFailedSubs.length > 0) {
    sections.push(`
      <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#dc2626;">💳 Pagos fallidos en suscripciones</p>
      ${tableWrapper(failedSubRows)}`);
  }

  const kpisHtml = `
    <div style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;">
      ${[
        { label: 'Leads nuevos 24h', value: data.newLeads24h, color: data.newLeads24h > 0 ? '#c88b25' : '#29384a' },
        { label: 'Mensajes nuevos 24h', value: data.newMessages24h, color: data.newMessages24h > 0 ? '#c88b25' : '#29384a' },
        { label: 'Syncs Holded fallidos', value: data.holdedJobsFailed, color: data.holdedJobsFailed > 0 ? '#dc2626' : '#29384a' },
      ].map((kpi) => `
        <div style="flex:1;min-width:130px;background:#f8f4eb;border-radius:10px;padding:14px 16px;border:1px solid #d8cbb5;">
          <p style="margin:0 0 4px;font-size:11px;color:#8899aa;text-transform:uppercase;letter-spacing:0.08em;">${kpi.label}</p>
          <p style="margin:0;font-size:24px;font-weight:700;color:${kpi.color};">${kpi.value}</p>
        </div>`).join('')}
    </div>`;

  const subject = hasAlerts
    ? `⚠️ Resumen EXPERT ${data.date} — ${data.casesBlocked.length + data.casesAwaitingDocs.length} exp. requieren atención`
    : `✅ Resumen EXPERT ${data.date} — Todo al día`;

  return {
    subject,
    html: base('Resumen operativo diario', `
      ${heading(`Resumen operativo · ${data.date}`)}
      ${kpisHtml}
      ${sections.length > 0 ? sections.join('') : para('<strong style="color:#16a34a;">✅ Todo al día — no hay expedientes ni presupuestos pendientes de atención urgente.</strong>')}
      ${btn('Abrir panel admin', `${BRAND.appUrl}/admin`)}
      ${para('<small style="color:#8899aa;">Este resumen se genera automáticamente cada mañana. Accede al panel para gestionar cada elemento.</small>')}
    `),
  };
}

// ── Tenant admin notifications ───────────────────────────────────────────────

export function tenantAdminDocUploaded(
  params: { adminName: string; clientName: string; service: string; docName: string; portalUrl: string },
  brand?: TenantBrand
): { subject: string; html: string } {
  const { adminName, clientName, service, docName, portalUrl } = params;
  const a = escapeHtml(adminName);
  const c = escapeHtml(clientName);
  const s = escapeHtml(service);
  const d = escapeHtml(docName);
  return {
    subject: `Nuevo documento: ${c} — ${s}`,
    html: base('Nuevo documento recibido', `
      ${heading('Nuevo documento subido')}
      ${para(`Hola <strong>${a}</strong>,`)}
      ${para(`Tu cliente <strong>${c}</strong> ha subido un documento al expediente <strong>${s}</strong>:`)}
      ${table(
        detail('Cliente', c),
        detail('Expediente', s),
        detail('Documento', d)
      )}
      ${btn('Ver en el portal', portalUrl)}
      ${para('<small style="color:#8899aa;">Accede al portal para revisar el documento y gestionar el expediente.</small>')}
    `, brand),
  };
}

export function tenantAdminStatusChanged(
  params: { adminName: string; clientName: string; service: string; statusLabel: string; portalUrl: string },
  brand?: TenantBrand
): { subject: string; html: string } {
  const { adminName, clientName, service, statusLabel, portalUrl } = params;
  const a = escapeHtml(adminName);
  const c = escapeHtml(clientName);
  const s = escapeHtml(service);
  const st = escapeHtml(statusLabel);
  return {
    subject: `Estado actualizado: ${c} — ${s}`,
    html: base('Estado de expediente actualizado', `
      ${heading('Expediente actualizado')}
      ${para(`Hola <strong>${a}</strong>,`)}
      ${para(`El estado del expediente de <strong>${c}</strong> ha cambiado:`)}
      ${table(
        detail('Cliente', c),
        detail('Expediente', s),
        detail('Nuevo estado', `<strong>${st}</strong>`)
      )}
      ${btn('Ver expediente', portalUrl)}
      ${para('<small style="color:#8899aa;">Accede al portal para ver los detalles del expediente.</small>')}
    `, brand),
  };
}

// ── Tenant weekly digest — resumen semanal para tenant_admin ────────────────
export interface TenantWeeklyDigestData {
  adminName    : string;
  tenantName   : string;
  weekLabel    : string; // e.g. "9–15 jun 2026"
  portalUrl    : string;
  newClients   : number;
  activeCases  : number;
  finishedThisWeek: number;
  pendingDocs  : number;
  topPending   : Array<{ service: string; client: string; daysPending: number }>;
}

export function tenantWeeklyDigest(data: TenantWeeklyDigestData, brand?: TenantBrand) {
  const {
    adminName, tenantName, weekLabel, portalUrl,
    newClients, activeCases, finishedThisWeek, pendingDocs, topPending,
  } = data;
  const a = escapeHtml(adminName);
  const tn = escapeHtml(tenantName);
  const wl = escapeHtml(weekLabel);

  const hasAlerts = pendingDocs > 0 || topPending.length > 0;
  const subject = hasAlerts
    ? `⚠️ Resumen semanal ${tn} — ${wl}: ${pendingDocs} doc${pendingDocs !== 1 ? 's' : ''} pendiente${pendingDocs !== 1 ? 's' : ''}`
    : `✅ Resumen semanal ${tn} — ${wl}: todo al día`;

  const kpiRow = (label: string, value: number, accent?: boolean) =>
    `<td style="width:25%;text-align:center;padding:16px 8px;">
      <p style="margin:0;font-size:28px;font-weight:bold;color:${accent ? '#c88b25' : '#07111d'};">${value}</p>
      <p style="margin:4px 0 0;font-size:11px;color:#8899aa;text-transform:uppercase;letter-spacing:1px;">${label}</p>
    </td>`;

  const kpiBar = `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border:1px solid #e8dfc8;border-radius:12px;overflow:hidden;">
    <tr style="background:#faf8f2;">
      ${kpiRow('Clientes nuevos', newClients)}
      ${kpiRow('Exp. activos', activeCases)}
      ${kpiRow('Finalizados', finishedThisWeek)}
      ${kpiRow('Docs pendientes', pendingDocs, pendingDocs > 0)}
    </tr>
  </table>`;

  const pendingRows = topPending.length
    ? `<p style="margin:24px 0 8px;font-size:12px;font-weight:bold;color:#7a6e5f;text-transform:uppercase;letter-spacing:1px;">Esperando documentos</p>
       <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8dfc8;border-radius:12px;overflow:hidden;">
         ${topPending.map((r, i) => `
           <tr style="background:${i % 2 === 0 ? '#ffffff' : '#faf8f2'};">
             <td style="padding:10px 16px;font-size:13px;color:#07111d;">${escapeHtml(r.service)}</td>
             <td style="padding:10px 16px;font-size:13px;color:#07111d;">${escapeHtml(r.client)}</td>
             <td style="padding:10px 16px;font-size:12px;color:${r.daysPending > 5 ? '#c0392b' : '#8899aa'};text-align:right;white-space:nowrap;">${r.daysPending}d</td>
           </tr>`).join('')}
       </table>`
    : '';

  return {
    subject,
    html: base('Resumen semanal', `
      ${heading(`Resumen de la semana — ${wl}`)}
      ${para(`Hola <strong>${a}</strong>, aquí tienes el resumen de actividad de <strong>${tn}</strong>.`)}
      ${kpiBar}
      ${pendingRows}
      ${btn('Ver portal', portalUrl)}
      ${para('<small style="color:#8899aa;">Recibes este resumen cada lunes. Entra al portal para gestionar expedientes y documentos.</small>')}
    `, brand),
  };
}

// ── Document rejected — notify client to re-upload ──────────────────────────
export function documentRejected(name: string, documentName: string, service: string, caseId: string) {
  return {
    subject: `Documento rechazado — necesitamos que lo vuelvas a subir`,
    html: base('Documento rechazado', `
      ${heading('Necesitamos un nuevo documento')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para(`Hemos revisado el documento <strong>${escapeHtml(documentName)}</strong> de tu expediente de <strong>${escapeHtml(service)}</strong> y no podemos procesarlo en su estado actual.`)}
      ${para('Por favor, accede a tu expediente y sube de nuevo el documento correcto. Si tienes dudas sobre qué necesitamos exactamente, responde a este correo o escríbenos.')}
      ${btn('Ver mi expediente', `${BRAND.appUrl}/dashboard/expedientes/${caseId}`)}
      ${para('<small style="color:#8899aa;">Disculpa las molestias. Estamos aquí para ayudarte en cada paso del proceso.</small>')}
    `)
  };
}

export { BRAND };
export const emailTemplates = {
  contactConfirmation: 'Confirmación contacto',
  newInquiryAdmin: 'Nueva consulta admin',
  quoteRequest: 'Solicitud presupuesto',
  quoteSent: 'Presupuesto enviado',
  paymentConfirmed: 'Pago confirmado',
  serviceCompleted: 'Servicio finalizado',
  reviewRequest: 'Solicitud reseña',
  magicLinkLogin: 'Magic link login'
} as const;
