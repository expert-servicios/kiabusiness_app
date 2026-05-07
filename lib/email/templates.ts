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
    <p style="margin:6px 0 0;font-size:11px;color:#8899aa;letter-spacing:3px;text-transform:uppercase;">AsesorÃ­a Legal Â· Fiscal Â· Administrativa</p>
  </td></tr>
  <tr><td style="padding:40px;">
    ${body}
  </td></tr>
  <tr><td style="background:#f8f4eb;padding:24px 40px;border-top:1px solid #d8cbb5;text-align:center;">
    <p style="margin:0;font-size:12px;color:#29384a;">EXPERT ESTUDIOS PROFESIONALES, SLU &nbsp;Â·&nbsp; C/ Pintor Agrassot, 19 &nbsp;Â·&nbsp; 03110 Mutxamel (Alicante)</p>
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

// â”€â”€ 0. Welcome â€” new user first login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function welcomeEmail(name: string) {
  return {
    subject: 'Bienvenido/a a EXPERT â€” tu Ã¡rea privada estÃ¡ lista',
    html: base('Bienvenido a EXPERT', `
      ${heading('Â¡Bienvenido/a a EXPERT!')}
      ${para(`Hola <strong>${name}</strong>,`)}
      ${para('Tu cuenta estÃ¡ activa. Desde tu Ã¡rea privada puedes consultar el estado de tus expedientes, subir documentaciÃ³n, revisar presupuestos y gestionar tus suscripciones, todo en un solo lugar.')}
      ${table(
        detail('Expedientes', 'Estado en tiempo real de cada trÃ¡mite'),
        detail('DocumentaciÃ³n', 'Subida segura y control de pendientes'),
        detail('Presupuestos', 'RevisiÃ³n y pago online'),
        detail('Suscripciones', 'GestiÃ³n de planes mensuales')
      )}
      ${para('Si tienes cualquier duda o necesitas orientaciÃ³n antes de empezar, escrÃ­benos directamente. Es gratis orientarte.')}
      ${btn('Acceder a mi Ã¡rea privada', `${BRAND.appUrl}/dashboard`)}
    `)
  };
}

// â”€â”€ 1. Quote received (client) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function quoteReceivedClient(name: string, services: string) {
  return {
    subject: 'Hemos recibido tu solicitud de presupuesto',
    html: base('Solicitud recibida', `
      ${heading('Â¡Solicitud recibida!')}
      ${para(`Hola <strong>${name}</strong>,`)}
      ${para('Hemos recibido tu solicitud de presupuesto y la estamos revisando. Nos pondremos en contacto contigo en un plazo de 24 horas hÃ¡biles con una propuesta personalizada.')}
      ${table(detail('Servicios solicitados', services))}
      ${para('Si tienes alguna pregunta urgente, puedes escribirnos directamente.')}
      ${btn('Ver mi Ã¡rea privada', `${BRAND.appUrl}/dashboard`)}
    `)
  };
}

// â”€â”€ 2. Quote received (admin) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
        detail('DescripciÃ³n', description || 'â€”')
      )}
      ${btn('Gestionar en el panel', `${BRAND.appUrl}/admin/presupuestos`)}
    `)
  };
}

// â”€â”€ 3. Quote responded â€” admin ha fijado importe â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function quoteResponded(name: string, amount: number, expiresAt: string | null) {
  const expiry = expiresAt
    ? new Date(expiresAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'prÃ³ximamente';
  return {
    subject: 'Tu presupuesto personalizado estÃ¡ listo',
    html: base('Presupuesto listo', `
      ${heading('Tu presupuesto estÃ¡ listo')}
      ${para(`Hola <strong>${name}</strong>,`)}
      ${para('Hemos preparado una propuesta personalizada para los servicios que solicitaste. Puedes revisarla y aceptar el pago desde tu Ã¡rea privada.')}
      ${table(
        detail('Importe', `â‚¬${amount.toFixed(2)}`),
        detail('VÃ¡lido hasta', expiry)
      )}
      ${para('<em>Si tienes alguna duda sobre la propuesta, responde a este email y lo aclaramos.</em>')}
      ${btn('Revisar y pagar', `${BRAND.appUrl}/dashboard/presupuestos`)}
    `)
  };
}

// â”€â”€ 4. Quote accepted â€” cliente ha aceptado, pendiente de pago â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function quoteAcceptedAdmin(name: string, amount: number) {
  return {
    subject: `Presupuesto aceptado por ${name}`,
    html: base('Presupuesto aceptado', `
      ${heading('Presupuesto aceptado')}
      ${para(`<strong>${name}</strong> ha aceptado el presupuesto de <strong>â‚¬${amount.toFixed(2)}</strong> y estÃ¡ pendiente de pago.`)}
      ${btn('Ver en el panel', `${BRAND.appUrl}/admin/presupuestos`)}
    `)
  };
}

// â”€â”€ 5. Payment confirmed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function paymentConfirmed(name: string, amount: number, service: string) {
  return {
    subject: 'Pago recibido â€” comenzamos tu expediente',
    html: base('Pago confirmado', `
      ${heading('Â¡Pago confirmado!')}
      ${para(`Hola <strong>${name}</strong>,`)}
      ${para('Hemos recibido tu pago correctamente. Tu expediente ha sido creado y ya podemos comenzar a trabajar en tu trÃ¡mite.')}
      ${table(
        detail('Servicio', service),
        detail('Importe abonado', `â‚¬${amount.toFixed(2)}`)
      )}
      ${para('En breve nos pondremos en contacto para informarte sobre la documentaciÃ³n necesaria. TambiÃ©n puedes seguir el estado de tu expediente desde tu Ã¡rea privada.')}
      ${btn('Ver mi expediente', `${BRAND.appUrl}/dashboard/expedientes`)}
    `)
  };
}

// â”€â”€ 6. Case status updated â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const STATE_LABELS: Record<string, string> = {
  pendiente_documentacion: 'Pendiente de documentaciÃ³n',
  en_revision: 'En revisiÃ³n',
  en_proceso: 'En proceso',
  presentado: 'Presentado ante el organismo',
  finalizado: 'Finalizado'
};

export function caseStatusUpdated(name: string, service: string, newState: string) {
  const label = STATE_LABELS[newState] ?? newState;
  return {
    subject: `ActualizaciÃ³n de tu expediente: ${label}`,
    html: base('Estado actualizado', `
      ${heading('Tu expediente ha avanzado')}
      ${para(`Hola <strong>${name}</strong>,`)}
      ${para('Queremos informarte de que el estado de tu expediente ha sido actualizado.')}
      ${table(
        detail('Servicio', service),
        detail('Nuevo estado', `<strong style="color:#c88b25;">${label}</strong>`)
      )}
      ${para('Puedes consultar todos los detalles desde tu Ã¡rea privada.')}
      ${btn('Ver mi expediente', `${BRAND.appUrl}/dashboard/expedientes`)}
    `)
  };
}

// â”€â”€ 7. Service completed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function serviceCompleted(name: string, service: string) {
  return {
    subject: 'Tu servicio ha sido completado con Ã©xito',
    html: base('Servicio completado', `
      ${heading('Â¡TrÃ¡mite completado!')}
      ${para(`Hola <strong>${name}</strong>,`)}
      ${para(`Nos complace comunicarte que el trÃ¡mite <strong>${service}</strong> ha sido completado satisfactoriamente.`)}
      ${para('Ha sido un placer trabajar contigo. Si en el futuro necesitas cualquier otro servicio, estaremos aquÃ­ para ayudarte.')}
      ${btn('Ver mi Ã¡rea privada', `${BRAND.appUrl}/dashboard`)}
    `)
  };
}

// â”€â”€ 8. Review request â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function reviewRequest(name: string, service: string) {
  return {
    subject: 'Â¿CÃ³mo fue tu experiencia con EXPERT?',
    html: base('Solicitud de reseÃ±a', `
      ${heading('Â¿CÃ³mo fue tu experiencia?')}
      ${para(`Hola <strong>${name}</strong>,`)}
      ${para(`Tu expediente de <strong>${service}</strong> ha finalizado. Nos gustarÃ­a conocer tu opiniÃ³n sobre el servicio recibido â€” tu valoraciÃ³n nos ayuda a mejorar y a llegar a mÃ¡s personas.`)}
      ${para('Solo te tomarÃ¡ 2 minutos.')}
      ${btn('Dejar mi valoraciÃ³n', `${BRAND.appUrl}/gracias/opinion`)}
      ${para('<small style="color:#8899aa;">Si no deseas dejar una valoraciÃ³n, ignora este correo.</small>')}
    `)
  };
}

// â”€â”€ 9. Subscription created â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function subscriptionCreated(name: string, planName: string, periodEnd: string | null) {
  const renewal = periodEnd
    ? new Date(periodEnd).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'prÃ³ximamente';
  return {
    subject: `Tu suscripciÃ³n ${planName} estÃ¡ activa`,
    html: base('SuscripciÃ³n activa', `
      ${heading('Â¡Bienvenido a tu plan EXPERT!')}
      ${para(`Hola <strong>${name}</strong>,`)}
      ${para(`Tu suscripciÃ³n <strong>${planName}</strong> estÃ¡ activa. A partir de ahora nos ocupamos de tus trÃ¡mites de forma continua.`)}
      ${table(
        detail('Plan activo', planName),
        detail('PrÃ³xima renovaciÃ³n', renewal)
      )}
      ${para('Puedes gestionar tu suscripciÃ³n, descargar facturas o cancelar en cualquier momento desde el portal de facturaciÃ³n.')}
      ${btn('Gestionar suscripciÃ³n', `${BRAND.appUrl}/dashboard/suscripciones`)}
    `)
  };
}

// â”€â”€ 10. Subscription payment failed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function subscriptionPaymentFailed(name: string, planName: string) {
  return {
    subject: 'No hemos podido procesar el pago de tu suscripciÃ³n',
    html: base('Pago fallido', `
      ${heading('Problema con el pago')}
      ${para(`Hola <strong>${name}</strong>,`)}
      ${para(`No hemos podido procesar el pago de tu suscripciÃ³n <strong>${planName}</strong>. Por favor, actualiza tu mÃ©todo de pago para que el servicio no se interrumpa.`)}
      ${btn('Actualizar mÃ©todo de pago', `${BRAND.appUrl}/dashboard/suscripciones`)}
      ${para('<small style="color:#8899aa;">Si ya has resuelto el problema, ignora este correo. El sistema reintentarÃ¡ el cobro automÃ¡ticamente.</small>')}
    `)
  };
}

// â”€â”€ 11. Contact form â€” admin notification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function contactMessage(nombre: string, email: string, asunto: string, mensaje: string, telefono?: string) {
  return {
    subject: `Nuevo mensaje de contacto: ${nombre}`,
    html: base('Nuevo contacto', `
      ${heading('Nuevo mensaje de contacto')}
      ${para('Has recibido un mensaje desde el formulario de contacto del sitio web.')}
      ${table(
        detail('Nombre', nombre),
        detail('Email', `<a href="mailto:${email}" style="color:#c88b25;">${email}</a>`),
        ...(telefono ? [detail('TelÃ©fono', telefono)] : []),
        ...(asunto ? [detail('Ãrea', asunto)] : []),
        detail('Mensaje', `<span style="white-space:pre-wrap;">${mensaje}</span>`)
      )}
      ${btn('Responder por email', `mailto:${email}`)}
    `)
  };
}

// â”€â”€ 12. Contact form â€” auto-reply to sender â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function contactAutoReply(nombre: string, asunto: string) {
  return {
    subject: 'Hemos recibido tu mensaje â€” EXPERT',
    html: base('Mensaje recibido', `
      ${heading('Â¡Mensaje recibido!')}
      ${para(`Hola <strong>${nombre}</strong>,`)}
      ${para('Gracias por ponerte en contacto con nosotros. Hemos recibido tu consulta y te responderemos en menos de <strong>24 horas hÃ¡biles</strong>.')}
      ${asunto ? table(detail('Ãrea consultada', asunto)) : ''}
      ${para('Si tu consulta es urgente, puedes escribirnos directamente por WhatsApp:')}
      ${btn('Escribir por WhatsApp', 'https://wa.me/34696550480')}
      ${para('<small style="color:#8899aa;">Si no enviaste este mensaje, ignora este correo.</small>')}
    `)
  };
}

// â”€â”€ 13. Holded â€” migration package confirmed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function holdedMigrationConfirmed(name: string, packageName: string, calendlyUrl: string) {
  return {
    subject: 'Â¡Tu migraciÃ³n a Holded ha comenzado! Reserva tu sesiÃ³n de formaciÃ³n',
    html: base('MigraciÃ³n a Holded confirmada', `
      ${heading('Â¡Tu compra estÃ¡ confirmada!')}
      ${para(`Hola <strong>${name}</strong>,`)}
      ${para(`Hemos recibido tu pago para el <strong>${packageName}</strong>. En las prÃ³ximas 24 horas hÃ¡biles nos pondremos en contacto para coordinar el inicio de la migraciÃ³n.`)}
      ${para('Mientras tanto, reserva ya tu sesiÃ³n de formaciÃ³n incluida (2 horas de onboarding) en el horario que mejor te venga:')}
      ${btn('Reservar sesiÃ³n de formaciÃ³n', calendlyUrl)}
      ${para('<small style="color:#8899aa;">Si tienes alguna pregunta antes de la primera sesiÃ³n, responde a este correo y te atendemos.</small>')}
    `)
  };
}

// â”€â”€ 14. Holded â€” formaciÃ³n session confirmed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function holdedFormacionConfirmed(name: string, calendlyUrl: string) {
  return {
    subject: 'Â¡SesiÃ³n de formaciÃ³n Holded confirmada! Reserva tu horario',
    html: base('FormaciÃ³n Holded confirmada', `
      ${heading('Â¡Tu sesiÃ³n de formaciÃ³n estÃ¡ lista!')}
      ${para(`Hola <strong>${name}</strong>,`)}
      ${para('Hemos recibido tu pago para la sesiÃ³n de formaciÃ³n en Holded (2 horas). Ahora solo tienes que elegir el dÃ­a y hora que mejor te conviene:')}
      ${btn('Reservar mi sesiÃ³n de formaciÃ³n', calendlyUrl)}
      ${table(
        detail('DuraciÃ³n', '2 horas'),
        detail('Formato', 'Videollamada (Google Meet / Zoom)'),
        detail('Contenido', 'Adaptado a tu nivel y necesidades')
      )}
      ${para('Si tienes alguna duda antes de la sesiÃ³n o quieres indicarnos Ã¡reas concretas a cubrir, responde a este correo.')}
    `)
  };
}

// â”€â”€ 15. Document required (stub â€” se activa cuando existan endpoints) â”€â”€â”€â”€â”€
export function documentRequired(name: string, service: string, docs: string[]) {
  const list = docs.map((d) => `<li style="margin:6px 0;color:#29384a;">${d}</li>`).join('');
  return {
    subject: 'DocumentaciÃ³n necesaria para tu expediente',
    html: base('DocumentaciÃ³n requerida', `
      ${heading('Necesitamos documentaciÃ³n')}
      ${para(`Hola <strong>${name}</strong>,`)}
      ${para(`Para continuar con tu expediente de <strong>${service}</strong>, necesitamos que nos proporciones los siguientes documentos:`)}
      <ul style="margin:16px 0;padding-left:20px;">${list}</ul>
      ${para('Puedes subir los archivos directamente desde tu Ã¡rea privada de forma segura.')}
      ${btn('Subir documentos', `${BRAND.appUrl}/dashboard/expedientes`)}
    `)
  };
}

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
    subject: `Nuevo lead SaaS para asesorias: ${companyName}`,
    html: base('Nuevo lead SaaS', `
      ${heading('Nuevo interes B2B para EXPERT')}
      ${para('Se ha recibido una solicitud desde la pagina publica para asesorias.')}
      ${table(
        detail('Nombre', name),
        detail('Email', `<a href="mailto:${email}" style="color:#c88b25;">${email}</a>`),
        ...(input.phone ? [detail('Telefono', escapeHtml(input.phone))] : []),
        detail('Empresa o despacho', companyName),
        detail('Clientes aproximados', escapeHtml(input.clientCountRange)),
        ...(input.currentTools ? [detail('Herramientas actuales', escapeHtml(input.currentTools))] : []),
        detail('Problema operativo', `<span style="white-space:pre-wrap;">${problem}</span>`),
        detail('Interes', escapeHtml(input.pilotInterest))
      )}
      ${btn('Responder por email', `mailto:${email}`)}
    `)
  };
}

export function saasLeadAutoReply(name: string) {
  return {
    subject: 'Hemos recibido tu interes en EXPERT para asesorias',
    html: base('Interes recibido', `
      ${heading('Gracias por tu interes')}
      ${para(`Hola <strong>${escapeHtml(name)}</strong>,`)}
      ${para('Hemos recibido tu solicitud sobre la futura plataforma EXPERT para asesorias, gestorias y despachos profesionales.')}
      ${para('Estamos validando pilotos de forma discreta mientras seguimos construyendo el sistema para la operativa interna de EXPERT. Revisaremos tu caso y te responderemos con los siguientes pasos.')}
      ${para('Si quieres anadir algun detalle sobre tu operativa actual, puedes responder directamente a este email.')}
    `)
  };
}

export { BRAND };
export const emailTemplates = {
  contactConfirmation: 'ConfirmaciÃ³n contacto',
  newInquiryAdmin: 'Nueva consulta admin',
  quoteRequest: 'Solicitud presupuesto',
  quoteSent: 'Presupuesto enviado',
  paymentConfirmed: 'Pago confirmado',
  serviceCompleted: 'Servicio finalizado',
  reviewRequest: 'Solicitud reseÃ±a',
  magicLinkLogin: 'Magic link login'
} as const;
