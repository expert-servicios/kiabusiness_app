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

// ── 1. Quote received (client) ─────────────────────────────────────────────
export function quoteReceivedClient(name: string, services: string) {
  return {
    subject: 'Hemos recibido tu solicitud de presupuesto',
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

// ── 2. Quote received (admin) ──────────────────────────────────────────────
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

// ── 3. Quote responded — admin ha fijado importe ───────────────────────────
export function quoteResponded(name: string, amount: number, expiresAt: string | null) {
  const expiry = expiresAt
    ? new Date(expiresAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'próximamente';
  return {
    subject: 'Tu presupuesto personalizado está listo',
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

// ── 4. Quote accepted — cliente ha aceptado, pendiente de pago ────────────
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

// ── 5. Payment confirmed ───────────────────────────────────────────────────
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

// ── 6. Case status updated ─────────────────────────────────────────────────
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

// ── 7. Service completed ───────────────────────────────────────────────────
export function serviceCompleted(name: string, service: string) {
  return {
    subject: 'Tu servicio ha sido completado con éxito',
    html: base('Servicio completado', `
      ${heading('¡Trámite completado!')}
      ${para(`Hola <strong>${name}</strong>,`)}
      ${para(`Nos complace comunicarte que el trámite <strong>${service}</strong> ha sido completado satisfactoriamente.`)}
      ${para('Ha sido un placer trabajar contigo. Si en el futuro necesitas cualquier otro servicio, estaremos aquí para ayudarte.')}
      ${btn('Ver mi área privada', `${BRAND.appUrl}/dashboard`)}
    `)
  };
}

// ── 8. Review request ──────────────────────────────────────────────────────
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

// ── 9. Subscription created ────────────────────────────────────────────────
export function subscriptionCreated(name: string, planName: string, periodEnd: string | null) {
  const renewal = periodEnd
    ? new Date(periodEnd).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'próximamente';
  return {
    subject: `Tu suscripción ${planName} está activa`,
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

// ── 10. Subscription payment failed ───────────────────────────────────────
export function subscriptionPaymentFailed(name: string, planName: string) {
  return {
    subject: 'No hemos podido procesar el pago de tu suscripción',
    html: base('Pago fallido', `
      ${heading('Problema con el pago')}
      ${para(`Hola <strong>${name}</strong>,`)}
      ${para(`No hemos podido procesar el pago de tu suscripción <strong>${planName}</strong>. Por favor, actualiza tu método de pago para que el servicio no se interrumpa.`)}
      ${btn('Actualizar método de pago', `${BRAND.appUrl}/dashboard/suscripciones`)}
      ${para('<small style="color:#8899aa;">Si ya has resuelto el problema, ignora este correo. El sistema reintentará el cobro automáticamente.</small>')}
    `)
  };
}

// ── 11. Document required (stub — se activa cuando existan endpoints) ─────
export function documentRequired(name: string, service: string, docs: string[]) {
  const list = docs.map((d) => `<li style="margin:6px 0;color:#29384a;">${d}</li>`).join('');
  return {
    subject: 'Documentación necesaria para tu expediente',
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

export { BRAND };
