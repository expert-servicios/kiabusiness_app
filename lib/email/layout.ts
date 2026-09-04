export const REQUIRED_ADMIN_NOTIFICATION_RECIPIENTS = [
  'info@expertservicios.es',
  'soy@kseniailicheva.com',
] as const;

const SIGNATURE_MARKER = 'data-expert-signature="v1"';

export function getAdminNotificationRecipients(): string[] {
  const configured = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);

  return Array.from(new Set([...REQUIRED_ADMIN_NOTIFICATION_RECIPIENTS, ...configured]));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function expertProfessionalSignatureHtml(): string {
  return `
<table ${SIGNATURE_MARKER} width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:28px;border-top:1px solid #d8cbb5;">
  <tr>
    <td style="padding:22px 0 0;font-family:Arial,sans-serif;color:#29384a;line-height:1.5;">
      <p style="margin:0;font-size:15px;font-weight:700;color:#07111d;">Ksenia Ilicheva</p>
      <p style="margin:2px 0 0;font-size:13px;">Dirección · EXPERT ESTUDIOS PROFESIONALES, S.L.U.</p>
      <p style="margin:2px 0 0;font-size:12px;color:#5b6775;">Asesoría Legal · Fiscal · Administrativa</p>
      <p style="margin:10px 0 0;font-size:12px;">
        <a href="mailto:info@expertservicios.es" style="color:#c88b25;text-decoration:none;">info@expertservicios.es</a>
        &nbsp;·&nbsp;
        <a href="tel:+34669045528" style="color:#c88b25;text-decoration:none;">+34 669 04 55 28</a>
        &nbsp;·&nbsp;
        <a href="https://expertconsulting.es" style="color:#c88b25;text-decoration:none;">expertconsulting.es</a>
      </p>
      <p style="margin:5px 0 0;font-size:11px;color:#7b8794;">C/ Pintor Agrassot, 19 · 03110 Mutxamel (Alicante)</p>
    </td>
  </tr>
</table>`;
}

export function appendExpertProfessionalSignature(html: string): string {
  if (html.includes(SIGNATURE_MARKER)) return html;

  const signature = expertProfessionalSignatureHtml();
  const bodyEnd = html.toLowerCase().lastIndexOf('</body>');
  if (bodyEnd === -1) return `${html}${signature}`;
  return `${html.slice(0, bodyEnd)}${signature}${html.slice(bodyEnd)}`;
}

export function newUserSignupAdminEmail(input: {
  name: string;
  email: string;
  userId: string;
}) {
  const name = escapeHtml(input.name);
  const email = escapeHtml(input.email);
  const userId = escapeHtml(input.userId);

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nueva alta EXPERT</title></head>
<body style="margin:0;padding:0;background:#f8f4eb;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8f4eb;padding:40px 20px;">
<tr><td>
<table width="600" cellpadding="0" cellspacing="0" align="center" role="presentation" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #d8cbb5;">
  <tr><td style="background:#07111d;padding:30px 40px;text-align:center;">
    <p style="margin:0;font-size:26px;font-weight:bold;color:#d7a33a;letter-spacing:5px;font-family:Georgia,serif;">EXPERT</p>
    <p style="margin:6px 0 0;font-size:11px;color:#8899aa;letter-spacing:3px;text-transform:uppercase;">Nueva alta de cliente</p>
  </td></tr>
  <tr><td style="padding:36px 40px;">
    <h1 style="margin:0 0 18px;font-size:23px;color:#07111d;font-family:Georgia,serif;">Nueva alta en EXPERT</h1>
    <p style="margin:0 0 18px;font-size:15px;color:#29384a;line-height:1.6;">Un nuevo usuario ha completado su primer acceso al área privada.</p>
    <table width="100%" cellpadding="0" cellspacing="4" role="presentation" style="margin:18px 0;border-collapse:separate;">
      <tr><td style="padding:10px 14px;background:#f8f4eb;font-size:13px;font-weight:700;color:#07111d;">Nombre</td><td style="padding:10px 14px;font-size:14px;color:#29384a;">${name}</td></tr>
      <tr><td style="padding:10px 14px;background:#f8f4eb;font-size:13px;font-weight:700;color:#07111d;">Email</td><td style="padding:10px 14px;font-size:14px;color:#29384a;"><a href="mailto:${email}" style="color:#c88b25;">${email}</a></td></tr>
      <tr><td style="padding:10px 14px;background:#f8f4eb;font-size:13px;font-weight:700;color:#07111d;">ID usuario</td><td style="padding:10px 14px;font-size:12px;color:#5b6775;">${userId}</td></tr>
    </table>
    <p style="margin:18px 0 0;text-align:center;"><a href="https://expertconsulting.es/admin/clientes" style="display:inline-block;background:#c88b25;color:#061321;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;padding:13px 26px;border-radius:50px;text-decoration:none;">Revisar en el panel</a></p>
    ${expertProfessionalSignatureHtml()}
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return {
    subject: `Nueva alta EXPERT — ${input.name}`,
    html,
  };
}
