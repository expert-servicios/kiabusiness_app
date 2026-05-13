const BRAND = {
  from: process.env.RESEND_FROM_EMAIL ?? 'EXPERT <soy@kseniailicheva.com>',
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://kseniailicheva.com'
};

function base(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f8f4eb;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f4eb;padding:40px 20px;">
<tr><td>
<table width="600" cellpadding="0" cellspacing="0" align="center" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #d8cbb5;">
  <tr><td style="background:#07111d;padding:32px 40px;text-align:center;">
    <p style="margin:0;font-size:26px;font-weight:bold;color:#d7a33a;letter-spacing:5px;font-family:Georgia,serif;">EXPERT</p>
    <p style="margin:6px 0 0;font-size:11px;color:#8899aa;letter-spacing:3px;text-transform:uppercase;">Asesoría Legal · Fiscal · Administrativa</p>
  </td></tr>
  <tr><td style="padding:40px;">
    ${body}
  </td></tr>
  <tr><td style="background:#f8f4eb;padding:24px 40px;border-top:1px solid #d8cbb5;text-align:center;">
    <p style="margin:0;font-size:12px;color:#29384a;">EXPERT ESTUDIOS PROFESIONALES, SLU &nbsp;·&nbsp; C/ Pintor Agrassot, 19 &nbsp;·&nbsp; 03110 Mutxamel (Alicante)</p>
    <p style="margin:6px 0 0;font-size:12px;"><a href="mailto:soy@kseniailicheva.com" style="color:#c88b25;text-decoration:none;">soy@kseniailicheva.com</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
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
      ${para(`Hola <strong>${name}</strong>,`)}
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
      ${para(`Hola <strong>${name}</strong>,`)}
      ${para('Hemos recibido tu solicitud de presupuesto y la estamos revisando. Nos pondremos en contacto contigo en un plazo de 24 horas hábiles con una propuesta personalizada.')}
      ${table(detail('Servicios solicitados', services))}
      ${para('Si tienes alguna pregunta urgente, puedes escribirnos directamente.')}
      ${btn('Ver mi área privada', `${BRAND.appUrl}/dashboard`)}
    `)
  };
}

// ── 2. Quote received (admin) ────────────────────────────────────────────────
export function quoteReceivedAdmin(name: string, email: string, services: string, description: string) {
  return {
    subject: `Nueva solicitud de presupuesto de ${name}`,
    html: base('Nueva solicitud', `
      ${heading('Nueva solicitud de presupuesto')}
      ${para('Se ha recibido una nueva solicitud desde el sitio web.')}
      ${table(
        detail('Nombre', name),
        detail('Email', email),
        detail('Servicios', services),
        detail('Descripción', description || '—')
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
      ${para(`Hola <strong>${name}</strong>,`)}
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
  return {
    subject: `Presupuesto aceptado por ${name}`,
    html: base('Presupuesto aceptado', `
      ${heading('Presupuesto aceptado')}
      ${para(`<strong>${name}</strong> ha aceptado el presupuesto de <strong>€${amount.toFixed(2)}</strong> y está pendiente de pago.`)}
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
      ${para(`Hola <strong>${name}</strong>,`)}
      ${para('Hemos recibido tu pago correctamente. Tu expediente ha sido creado y ya podemos comenzar a trabajar en tu trámite.')}
      ${table(
        detail('Servicio', service),
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
  const label = STATE_LABELS[newState] ?? newState;
  return {
    subject: `Actualización de tu expediente: ${label}`,
    html: base('Estado actualizado', `
      ${heading('Tu expediente ha avanzado')}
      ${para(`Hola <strong>${name}</strong>,`)}
      ${para('Queremos informarte de que el estado de tu expediente ha sido actualizado.')}
      ${table(
        detail('Servicio', service),
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
      ${para(`Hola <strong>${name}</strong>,`)}
      ${para(`Nos complace comunicarte que el trámite <strong>${service}</strong> ha sido completado satisfactoriamente.`)}
      ${para('Ha sido un placer trabajar contigo. Si en el futuro necesitas cualquier otro servicio, estaremos aquí para ayudarte.')}
      ${btn('Ver mi área privada', `${BRAND.appUrl}/dashboard`)}
    `)
  };
}

// ── 8. Review request ─────────────────────────────────────────────────────────
export function reviewRequest(name: string, service: string) {
  return {
    subject: '¿Cómo fue tu experiencia con EXPERT?',
    html: base('Solicitud de reseña', `
      ${heading('¿Cómo fue tu experiencia?')}
      ${para(`Hola <strong>${name}</strong>,`)}
      ${para(`Tu expediente de <strong>${service}</strong> ha finalizado. Nos gustaría conocer tu opinión sobre el servicio recibido — tu valoración nos ayuda a mejorar y a llegar a más personas.`)}
      ${para('Solo te tomará 2 minutos.')}
      ${btn('Dejar mi valoración', `${BRAND.appUrl}/gracias/opinion`)}
      ${para('<small style="color:#8899aa;">Si no deseas dejar una valoración, ignora este correo.</small>')}
    `)
  };
}

// ── 9. Subscription created ───────────────────────────────────────────────────
export function subscriptionCreated(name: string, planName: string, periodEnd: string | null) {
  const renewal = periodEnd
    ? new Date(periodEnd).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'próximamente';
  return {
    subject: `Tu suscripción ${planName} está activa — EXPERT`,
    html: base('Suscripción activa', `
      ${heading('¡Bienvenido a tu plan EXPERT!')}
      ${para(`Hola <strong>${name}</strong>,`)}
      ${para(`Tu suscripción <strong>${planName}</strong> está activa. A partir de ahora nos ocupamos de tus trámites de forma continua.`)}
      ${table(
        detail('Plan activo', planName),
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
      ${para(`Hola <strong>${name}</strong>,`)}
      ${para(`No hemos podido procesar el pago de tu suscripción <strong>${planName}</strong>. Por favor, actualiza tu método de pago para que el servicio no se interrumpa.`)}
      ${btn('Actualizar método de pago', `${BRAND.appUrl}/dashboard/suscripciones`)}
      ${para('<small style="color:#8899aa;">Si ya has resuelto el problema, ignora este correo. El sistema reintentará el cobro automáticamente.</small>')}
    `)
  };
}

// ── 11. Contact form — admin notification ─────────────────────────────────────
export function contactMessage(nombre: string, email: string, asunto: string, mensaje: string, telefono?: string) {
  return {
    subject: `Formulario de contacto: ${nombre}`,
    html: base('Nuevo contacto', `
      ${heading('Nuevo mensaje de contacto')}
      ${para('Has recibido un mensaje desde el formulario de contacto del sitio web.')}
      ${table(
        detail('Nombre', nombre),
        detail('Email', `<a href="mailto:${email}" style="color:#c88b25;">${email}</a>`),
        ...(telefono ? [detail('Teléfono', telefono)] : []),
        ...(asunto ? [detail('Área', asunto)] : []),
        detail('Mensaje', `<span style="white-space:pre-wrap;">${mensaje}</span>`)
      )}
      ${btn('Responder por email', `mailto:${email}`)}
    `)
  };
}

// ── 12. Contact form — auto-reply to sender ───────────────────────────────────
export function contactAutoReply(nombre: string, asunto: string) {
  return {
    subject: 'Hemos recibido tu mensaje — EXPERT',
    html: base('Mensaje recibido', `
      ${heading('¡Mensaje recibido!')}
      ${para(`Hola <strong>${nombre}</strong>,`)}
      ${para('Gracias por ponerte en contacto con nosotros. Hemos recibido tu consulta y te responderemos en menos de <strong>24 horas hábiles</strong>.')}
      ${asunto ? table(detail('Área consultada', asunto)) : ''}
      ${para('Si tu consulta es urgente, puedes escribirnos directamente por WhatsApp:')}
      ${btn('Escribir por WhatsApp', 'https://wa.me/34696550480')}
      ${para('<small style="color:#8899aa;">Si no enviaste este mensaje, ignora este correo.</small>')}
    `)
  };
}

// ── 13. Holded — migration package confirmed ──────────────────────────────────
export function holdedMigrationConfirmed(name: string, packageName: string, calendlyUrl: string) {
  return {
    subject: '¡Tu migración a Holded ha comenzado! Reserva tu sesión de formación',
    html: base('Migración a Holded confirmada', `
      ${heading('¡Tu compra está confirmada!')}
      ${para(`Hola <strong>${name}</strong>,`)}
      ${para(`Hemos recibido tu pago para el <strong>${packageName}</strong>. En las próximas 24 horas hábiles nos pondremos en contacto para coordinar el inicio de la migración.`)}
      ${para('Mientras tanto, reserva ya tu sesión de formación incluida (2 horas de onboarding) en el horario que mejor te venga:')}
      ${btn('Reservar sesión de formación', calendlyUrl)}
      ${para('<small style="color:#8899aa;">Si tienes alguna pregunta antes de la primera sesión, responde a este correo y te atendemos.</small>')}
    `)
  };
}

// ── 14. Holded — formación session confirmed ──────────────────────────────────
export function holdedFormacionConfirmed(name: string, calendlyUrl: string) {
  return {
    subject: '¡Sesión de formación Holded confirmada! Reserva tu horario',
    html: base('Formación Holded confirmada', `
      ${heading('¡Tu sesión de formación está lista!')}
      ${para(`Hola <strong>${name}</strong>,`)}
      ${para('Hemos recibido tu pago para la sesión de formación en Holded (2 horas). Ahora solo tienes que elegir el día y hora que mejor te conviene:')}
      ${btn('Reservar mi sesión de formación', calendlyUrl)}
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
  const list = docs.map((d) => `<li style="margin:6px 0;color:#29384a;">${d}</li>`).join('');
  return {
    subject: 'Documentación necesaria para tu expediente — EXPERT',
    html: base('Documentación requerida', `
      ${heading('Necesitamos documentación')}
      ${para(`Hola <strong>${name}</strong>,`)}
      ${para(`Para continuar con tu expediente de <strong>${service}</strong>, necesitamos que nos proporciones los siguientes documentos:`)}
      <ul style="margin:16px 0;padding-left:20px;">${list}</ul>
      ${para('Puedes subir los archivos directamente desde tu área privada de forma segura.')}
      ${btn('Subir documentos', `${BRAND.appUrl}/dashboard/expedientes`)}
    `)
  };
}

// ── 16. Holded demo — solicitud recibida (usuario) ───────────────────────────
export function holdedDemoRequested(name: string, companyName: string) {
  return {
    subject: 'Hemos recibido tu solicitud de plan gratuito Holded — EXPERT',
    html: base('Solicitud recibida', `
      ${heading('¡Solicitud recibida!')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para('Hemos recibido tu solicitud para el Plan Gratuito con Holded. Activaremos tu prueba de 14 días y te lo confirmaremos por email en menos de <strong>24 horas hábiles</strong>.')}
      ${table(
        detail('Empresa', escapeHtml(companyName)),
        detail('Próximo paso', 'Recibirás un email cuando la demo esté activa'),
        detail('Incluido', 'Onboarding de 1 hora + formación de 2 horas, sin coste')
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
    subject: `Nueva solicitud Plan Gratuito Holded: ${escapeHtml(input.companyName)}`,
    html: base('Nueva solicitud demo Holded', `
      ${heading('Nueva solicitud de Plan Gratuito')}
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
export function holdedDemoActivated(name: string, calendlyOnboardingUrl: string) {
  return {
    subject: '¡Tu demo de Holded está activa! Reserva tu onboarding gratuito',
    html: base('Demo Holded activa', `
      ${heading('¡Tu prueba de Holded está activa!')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para('Ya hemos activado tu prueba gratuita de 14 días en Holded. Ahora te toca dar el siguiente paso: reservar tu sesión de <strong>onboarding de 1 hora</strong> para que empieces con todo configurado desde el primer día.')}
      ${table(
        detail('Estado', '✅ Demo activa — 14 días gratuitos'),
        detail('Siguiente paso', 'Reservar sesión de onboarding (1 hora, sin coste)'),
        detail('Formato', 'Videollamada — te guiamos desde cero')
      )}
      ${btn('Reservar mi onboarding gratuito', calendlyOnboardingUrl)}
      ${para('<small style="color:#8899aa;">Si no puedes en los horarios disponibles, responde a este correo y buscamos una alternativa.</small>')}
    `)
  };
}

// ── 19. Holded demo — onboarding completado → reservar formación ──────────────
export function holdedOnboardingDone(name: string, calendlyFormacionUrl: string) {
  return {
    subject: '¡Onboarding completado! Reserva tu formación gratuita de 2 horas',
    html: base('Formación Holded disponible', `
      ${heading('Siguiente paso: formación gratuita de 2 horas')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para('Ya has completado el onboarding en Holded. Ahora puedes reservar tu sesión de <strong>formación de 2 horas gratuita</strong>, donde profundizaremos en las funciones más útiles para tu negocio.')}
      ${table(
        detail('Duración', '2 horas'),
        detail('Formato', 'Videollamada — contenido adaptado a tu sector'),
        detail('Coste', 'Incluida en tu Plan Gratuito')
      )}
      ${btn('Reservar mi formación gratuita', calendlyFormacionUrl)}
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
  funFact: string
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
    `)
  };
}

// Stage 3: docs_recibidos — documentación recibida
export function caseDocsReceived(name: string, service: string, note: string | null, funFact: string) {
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
    `)
  };
}

// Stage 4: en_tramitacion — tramitación activa
export function caseInProgress(name: string, service: string, note: string | null, funFact: string) {
  return {
    subject: `Tu expediente de ${service} está en tramitación — EXPERT`,
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
    `)
  };
}

// Stage 5: pendiente_externo — presentado, esperando respuesta de organismo
export function casePendingExternal(
  name: string,
  service: string,
  organism: string | null,
  note: string | null,
  funFact: string
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
    `)
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
export function caseDelivered(name: string, service: string, note: string | null, funFact: string) {
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
      ${para('<small style="color:#8899aa;">En breve recibirás un email para que puedas compartir tu opinión sobre el servicio. Tu valoración nos ayuda mucho. ¡Gracias por confiar en EXPERT!</small>')}
      ${funFactBlock(funFact)}
    `)
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
        'Si tienes dudas urgentes, escríbenos a soy@kseniailicheva.com'
      ])}
      ${para('<small style="color:#8899aa;">Si no recibes respuesta en 24 horas hábiles, revisa la carpeta de spam o escríbenos directamente a <a href="mailto:soy@kseniailicheva.com" style="color:#c88b25;">soy@kseniailicheva.com</a></small>')}
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
  const servicesList = data.services.join(', ');
  return {
    subject: `Nueva solicitud de presupuesto personalizado — ${data.companyName}`,
    html: base('Nueva solicitud presupuesto avanzado', `
      ${heading('Nueva solicitud de presupuesto')}
      ${para('Se ha recibido una nueva solicitud de presupuesto personalizado:')}
      ${table(
        detail('Nombre', escapeHtml(data.name)),
        detail('Email', data.email),
        detail('Teléfono', data.phone),
        detail('Empresa', escapeHtml(data.companyName)),
        ...(data.companyType ? [detail('Tipo de empresa', data.companyType)] : []),
        ...(data.taxId ? [detail('CIF / NIF', data.taxId)] : []),
        ...(data.employees ? [detail('Empleados', data.employees)] : []),
        ...(data.annualBilling ? [detail('Facturación anual', data.annualBilling)] : []),
        ...(data.currentSoftware ? [detail('Software actual', data.currentSoftware)] : []),
        ...(data.urgency ? [detail('Urgencia', data.urgency)] : []),
        detail('Servicios solicitados', escapeHtml(servicesList))
      )}
      ${data.message ? noteBlock(data.message) : ''}
      ${btn('Gestionar solicitud', `${BRAND.appUrl}/admin`)}
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
