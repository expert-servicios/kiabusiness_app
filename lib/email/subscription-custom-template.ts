function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeParagraphs(body: string): string {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => {
      const safe = escapeHtml(paragraph).replace(/\n/g, '<br>');
      return `<p style="margin:0 0 16px;font-size:15px;color:#29384a;line-height:1.65;">${safe}</p>`;
    })
    .join('');
}

export function customSubscriptionInvite(input: {
  subject: string;
  body: string;
  planName: string;
  amountEur: number;
  checkoutUrl: string;
}) {
  const safeSubject = escapeHtml(input.subject);
  const safePlan = escapeHtml(input.planName);
  const checkoutUrl = escapeHtml(input.checkoutUrl);

  return {
    subject: input.subject,
    html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safeSubject}</title></head>
<body style="margin:0;padding:0;background:#f8f4eb;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f4eb;padding:40px 20px;">
<tr><td>
<table width="600" cellpadding="0" cellspacing="0" align="center" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #d8cbb5;">
  <tr><td style="background:#07111d;padding:32px 40px;text-align:center;">
    <p style="margin:0;font-size:26px;font-weight:bold;color:#d7a33a;letter-spacing:5px;font-family:Georgia,serif;">EXPERT</p>
    <p style="margin:6px 0 0;font-size:11px;color:#8899aa;letter-spacing:3px;text-transform:uppercase;">Asesoría Legal · Fiscal · Administrativa</p>
  </td></tr>
  <tr><td style="padding:40px;">
    <h1 style="margin:0 0 22px;font-size:24px;color:#07111d;font-family:Georgia,serif;">${safePlan}</h1>
    ${safeParagraphs(input.body)}
    <table width="100%" cellpadding="0" cellspacing="4" style="margin:22px 0;border-collapse:separate;">
      <tr><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#07111d;background:#f8f4eb;border-radius:8px;">Plan</td><td style="padding:10px 16px;font-size:14px;color:#29384a;">${safePlan}</td></tr>
      <tr><td style="padding:10px 16px;font-size:13px;font-weight:bold;color:#07111d;background:#f8f4eb;border-radius:8px;">Cuota mensual</td><td style="padding:10px 16px;font-size:14px;color:#29384a;"><strong style="font-size:18px;color:#c88b25;">€${input.amountEur.toFixed(2)}/mes + IVA</strong></td></tr>
    </table>
    <p style="text-align:center;margin:30px 0 16px;"><a href="${checkoutUrl}" style="display:inline-block;background:#c88b25;color:#061321;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;padding:15px 32px;border-radius:50px;text-decoration:none;">Activar ${safePlan}</a></p>
    <p style="margin:0;text-align:center;font-size:11px;color:#8899aa;">Pago seguro procesado por Stripe. EXPERT no almacena los datos de tu tarjeta.</p>
  </td></tr>
  <tr><td style="background:#f8f4eb;padding:24px 40px;border-top:1px solid #d8cbb5;text-align:center;">
    <p style="margin:0;font-size:12px;color:#29384a;">EXPERT ESTUDIOS PROFESIONALES, SLU · C/ Pintor Agrassot, 19 · 03110 Mutxamel (Alicante)</p>
    <p style="margin:6px 0 0;font-size:12px;"><a href="mailto:info@expertconsulting.es" style="color:#c88b25;text-decoration:none;">info@expertconsulting.es</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
  };
}
