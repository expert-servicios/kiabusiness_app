export interface ContractData {
  clientName: string;
  clientEmail: string;
  clientCompany?: string | null;
  clientTaxId?: string | null;
  clientAddress?: string | null;
  serviceTitle: string;
  serviceDescription: string;
  amountEur: number;
  contractDate: string;
  contractType: 'service' | 'subscription';
  planName?: string | null;
}

const EXPERT = {
  name: 'EXPERT ESTUDIOS PROFESIONALES, SLU',
  cif: 'B44991776',
  address: 'C/ Pintor Agrassot, 19 — 03110 Mutxamel (Alicante), España',
  email: 'info@expertconsulting.es',
  phone: '+34 696 55 04 80',
  web: 'https://expertconsulting.es',
  rep: 'Ksenia Ilicheva',
  registro: 'Registro Mercantil de Alicante — Tomo 4562, Folio 146, Hoja A-184902',
};

function fmt(n: number) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function generateContractHtml(d: ContractData): string {
  const isSubscription = d.contractType === 'subscription';
  const title = isSubscription ? 'Contrato de Prestación de Servicios — Suscripción Mensual' : 'Contrato de Prestación de Servicios';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>${title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 13px; line-height: 1.7; color: #111; background: #fff; padding: 48px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 4px; letter-spacing: 0.04em; }
  h2 { font-size: 13px; font-weight: bold; margin: 28px 0 8px; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  .subtitle { text-align: center; font-size: 11px; color: #555; margin-bottom: 32px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
  td { padding: 7px 10px; border: 1px solid #ddd; vertical-align: top; }
  td:first-child { font-weight: bold; width: 38%; background: #f9f7f3; }
  p { margin-bottom: 10px; }
  .amount { font-size: 22px; font-weight: bold; text-align: center; color: #c88b25; margin: 16px 0; }
  .signatures { display: flex; gap: 60px; margin-top: 48px; }
  .sig-block { flex: 1; }
  .sig-line { border-top: 1px solid #333; margin-top: 48px; padding-top: 6px; font-size: 11px; color: #555; }
  .legal-notice { font-size: 10px; color: #888; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px; }
  .badge { display: inline-block; background: #0D1B2A; color: #D4A017; font-size: 10px; font-weight: bold; letter-spacing: 0.1em; padding: 2px 8px; margin-bottom: 16px; }
  @media print { body { padding: 24px; } }
</style>
</head>
<body>

<div style="text-align:center; margin-bottom: 24px;">
  <span class="badge">EXPERT ESTUDIOS PROFESIONALES</span><br/>
  <h1>${title}</h1>
  <p class="subtitle">Fecha: ${d.contractDate} &nbsp;|&nbsp; Referencia: ${Date.now().toString(36).toUpperCase()}</p>
</div>

<h2>1. Partes del contrato</h2>
<p><strong>PRESTADOR DEL SERVICIO</strong></p>
<table>
  <tr><td>Denominación social</td><td>${EXPERT.name}</td></tr>
  <tr><td>CIF</td><td>${EXPERT.cif}</td></tr>
  <tr><td>Domicilio social</td><td>${EXPERT.address}</td></tr>
  <tr><td>Inscripción</td><td>${EXPERT.registro}</td></tr>
  <tr><td>Representante legal</td><td>${EXPERT.rep}</td></tr>
  <tr><td>Email</td><td>${EXPERT.email}</td></tr>
  <tr><td>Teléfono</td><td>${EXPERT.phone}</td></tr>
</table>

<p style="margin-top:16px"><strong>CLIENTE</strong></p>
<table>
  <tr><td>Nombre / Razón social</td><td>${d.clientName}${d.clientCompany ? ` — ${d.clientCompany}` : ''}</td></tr>
  ${d.clientTaxId ? `<tr><td>CIF / NIF</td><td>${d.clientTaxId}</td></tr>` : ''}
  <tr><td>Email</td><td>${d.clientEmail}</td></tr>
  ${d.clientAddress ? `<tr><td>Dirección</td><td>${d.clientAddress}</td></tr>` : ''}
</table>

<h2>2. Objeto del contrato</h2>
<p>${EXPERT.name} se compromete a prestar al cliente los siguientes servicios profesionales:</p>
<table>
  <tr><td>Servicio contratado</td><td><strong>${d.serviceTitle}</strong></td></tr>
  <tr><td>Descripción</td><td>${d.serviceDescription}</td></tr>
  ${isSubscription ? `<tr><td>Modalidad</td><td>Suscripción mensual renovable — ${d.planName ?? ''}</td></tr>` : '<tr><td>Modalidad</td><td>Servicio puntual (pago único)</td></tr>'}
</table>

<h2>3. Precio y forma de pago</h2>
<div class="amount">${fmt(d.amountEur)} € ${isSubscription ? '/mes' : ''} (IVA incluido si aplica)</div>
<p>El pago se realiza de forma segura a través de la plataforma <strong>Stripe</strong> (Stripe, Inc. — PCI-DSS Level 1 certificado). ${EXPERT.name} no almacena datos de tarjetas bancarias. ${isSubscription ? 'La suscripción se renueva automáticamente cada mes hasta su cancelación expresa.' : 'Este es un pago único no recurrente.'}</p>

<h2>4. Obligaciones del prestador</h2>
<p>${EXPERT.name} se compromete a:</p>
<ul style="padding-left:20px; margin-bottom:12px;">
  <li>Prestar el servicio con la diligencia profesional exigible.</li>
  <li>Mantener la confidencialidad de toda la información aportada por el cliente.</li>
  <li>Comunicar al cliente cualquier incidencia relevante en el desarrollo del servicio.</li>
  <li>Emitir la factura correspondiente en los plazos legalmente establecidos.</li>
</ul>

<h2>5. Obligaciones del cliente</h2>
<ul style="padding-left:20px; margin-bottom:12px;">
  <li>Proporcionar información veraz, completa y actualizada.</li>
  <li>Colaborar activamente facilitando la documentación requerida en los plazos acordados.</li>
  <li>Mantener la confidencialidad de sus credenciales de acceso al panel de cliente.</li>
  <li>Comunicar de inmediato cualquier error o incidencia en los datos o trámites gestionados.</li>
</ul>

${isSubscription ? `
<h2>6. Cancelación de la suscripción</h2>
<p>El cliente puede cancelar su suscripción en cualquier momento desde su panel de cliente en <strong>${EXPERT.web}/dashboard/suscripciones</strong>. La cancelación surte efecto al final del período de facturación en curso. No se realizarán devoluciones por períodos ya facturados salvo en los casos previstos en el derecho de desistimiento.</p>
` : `
<h2>6. Derecho de desistimiento</h2>
<p>De conformidad con el Real Decreto Legislativo 1/2007 (TRLGDCU, art. 102), el cliente consumidor dispone de un plazo de <strong>14 días naturales</strong> desde la contratación para ejercer el derecho de desistimiento sin necesidad de justificación. Si el cliente ha solicitado el inicio del servicio antes de que transcurra dicho plazo y el servicio ha sido ejecutado total o parcialmente, perderá el derecho de desistimiento en proporción a la parte ya prestada (art. 107.2 TRLGDCU).</p>
`}

<h2>${isSubscription ? '7' : '7'}. Protección de datos personales</h2>
<p>En cumplimiento del <strong>Reglamento (UE) 2016/679 (RGPD)</strong> y la <strong>Ley Orgánica 3/2018 (LOPDGDD)</strong>, ${EXPERT.name} informa al cliente de que sus datos personales serán tratados con la finalidad de gestionar la relación contractual, prestar los servicios contratados y cumplir las obligaciones legales aplicables.</p>
<p>Los datos serán conservados durante la vigencia de la relación contractual y, una vez finalizada, durante los plazos de prescripción legalmente establecidos. No se cederán a terceros salvo obligación legal o necesidad para la prestación del servicio (procesadores: Supabase, Stripe, Resend, Holded). El cliente puede ejercer sus derechos de acceso, rectificación, supresión, portabilidad, limitación y oposición dirigiéndose a <strong>${EXPERT.email}</strong>.</p>

<h2>${isSubscription ? '8' : '8'}. Legislación aplicable y jurisdicción</h2>
<p>El presente contrato se rige por la legislación española. Para la resolución de controversias, las partes se someten a los Juzgados y Tribunales del domicilio del consumidor. Para usuarios no consumidores, a los Juzgados y Tribunales de Alicante. Plataforma ODR de la Comisión Europea disponible en <strong>ec.europa.eu/consumers/odr</strong>.</p>

<div class="signatures">
  <div class="sig-block">
    <p><strong>Por ${EXPERT.name}</strong></p>
    <div class="sig-line">${EXPERT.rep} — Representante legal</div>
  </div>
  <div class="sig-block">
    <p><strong>El cliente</strong></p>
    <div class="sig-line">${d.clientName}</div>
  </div>
</div>

<div class="legal-notice">
  <p>Este documento constituye el contrato de prestación de servicios entre las partes. Se entiende aceptado en el momento en que el cliente realiza el pago o acepta expresamente el presupuesto. Para más información: <a href="${EXPERT.web}/condiciones">${EXPERT.web}/condiciones</a> | <a href="${EXPERT.web}/privacidad">${EXPERT.web}/privacidad</a></p>
</div>

</body>
</html>`;
}

export function contractToBuffer(html: string): string {
  return Buffer.from(html, 'utf-8').toString('base64');
}
