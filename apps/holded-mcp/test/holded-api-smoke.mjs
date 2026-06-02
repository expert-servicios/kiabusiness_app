/**
 * Smoke test para todas las tools del conector Holded MCP.
 * Uso: node test/holded-api-smoke.mjs <API_KEY>
 *
 * Este fichero NO se commitea con datos reales — se ejecuta localmente.
 */

const API_KEY  = process.argv[2];
const BASE_URL = 'https://api.holded.com';

if (!API_KEY) {
  console.error('Uso: node test/holded-api-smoke.mjs <API_KEY>');
  process.exit(1);
}

const headers = {
  'key': API_KEY,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Accept-Encoding': 'identity',
};

async function call(label, path, opts = {}) {
  const url = BASE_URL + path;
  try {
    const res = await fetch(url, { headers, ...opts });
    const ct  = res.headers.get('content-type') ?? '';
    let body;
    if (ct.includes('application/json')) {
      body = await res.json();
    } else if (ct.includes('pdf')) {
      const buf = await res.arrayBuffer();
      body = `[PDF ${buf.byteLength} bytes]`;
    } else {
      body = await res.text();
    }

    const count = Array.isArray(body) ? body.length : (body && typeof body === 'object' ? Object.keys(body).length : '?');
    const status = res.ok ? '✅' : '❌';
    console.log(`${status} [${res.status}] ${label.padEnd(38)} → ${Array.isArray(body) ? `${count} items` : JSON.stringify(body)?.slice(0, 120)}`);

    // Si hay items, muestra el primero como muestra
    if (Array.isArray(body) && body.length > 0) {
      const sample = body[0];
      const id   = sample?.id ?? sample?._id ?? '?';
      const name = sample?.name ?? sample?.docNumber ?? sample?.socialName ?? sample?.denomination ?? '?';
      console.log(`   └─ Muestra: id=${id}, nombre/ref=${name}`);
      return { ok: res.ok, status: res.status, items: body, first: body[0] };
    }

    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    console.log(`💥 [ERR] ${label.padEnd(38)} → ${err.message}`);
    return { ok: false, error: err.message };
  }
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(' Holded MCP — Smoke test completo');
  console.log(`  API key: ${API_KEY.slice(0,8)}…${API_KEY.slice(-4)}`);
  console.log('══════════════════════════════════════════════════════════════\n');

  // ── 1. Contactos ──────────────────────────────────────────────────────────
  console.log('── Contactos ──────────────────────────────────────────────────');
  const contacts = await call('list_contacts', '/api/invoicing/v1/contacts');
  let firstContactId = contacts?.items?.[0]?.id;
  if (firstContactId) {
    await call('get_contact', `/api/invoicing/v1/contacts/${firstContactId}`);
  }

  // ── 2. Facturación (todos los docTypes) ───────────────────────────────────
  console.log('\n── Facturación / Documentos ──────────────────────────────────');
  const docTypes = [
    'invoice', 'salesreceipt', 'creditnote', 'salesorder',
    'proform', 'waybill', 'estimate', 'purchase', 'purchaseorder', 'purchaserefund'
  ];

  let firstInvoiceId, firstPurchaseId;
  for (const dt of docTypes) {
    const res = await call(`list_documents(${dt})`, `/api/invoicing/v1/documents/${dt}`);
    if (dt === 'invoice' && res?.items?.[0]?.id) firstInvoiceId = res.items[0].id;
    if (dt === 'purchase' && res?.items?.[0]?.id) firstPurchaseId = res.items[0].id;
  }

  if (firstInvoiceId) {
    await call('get_document(invoice)', `/api/invoicing/v1/documents/invoice/${firstInvoiceId}`);
    // PDF — solo verificamos que devuelva bytes, no lo imprimimos
    await call('get_document_pdf(invoice)', `/api/invoicing/v1/documents/invoice/${firstInvoiceId}/pdf`);
  }
  if (firstPurchaseId) {
    await call('get_document(purchase)', `/api/invoicing/v1/documents/purchase/${firstPurchaseId}`);
  }

  // ── 3. Productos y stock ───────────────────────────────────────────────────
  console.log('\n── Productos / Inventario ───────────────────────────────────');
  const products = await call('list_products', '/api/invoicing/v1/products');
  if (products?.items?.[0]?.id) {
    await call('get_product', `/api/invoicing/v1/products/${products.items[0].id}`);
  }
  await call('list_products_stock', '/api/invoicing/v1/products/stock');
  await call('list_warehouses', '/api/invoicing/v1/warehouses');

  // ── 4. Catálogos auxiliares ────────────────────────────────────────────────
  console.log('\n── Catálogos (taxes, series) ────────────────────────────────');
  await call('list_taxes', '/api/invoicing/v1/taxes');
  await call('list_numbering_series(invoice)', '/api/invoicing/v1/numberingseries/invoice');
  await call('list_numbering_series(estimate)', '/api/invoicing/v1/numberingseries/estimate');

  // ── 5. Contabilidad ────────────────────────────────────────────────────────
  console.log('\n── Contabilidad ────────────────────────────────────────────');
  await call('get_chart_of_accounts', '/api/accounting/v1/chartofaccounts?includeEmpty=1');

  // Libro diario — año en curso
  const year = new Date().getFullYear();
  const from = Math.floor(new Date(`${year}-01-01`).getTime() / 1000);
  const to   = Math.floor(new Date(`${year}-12-31`).getTime() / 1000);
  await call('get_journal (año actual)', `/api/accounting/v1/dailyledger?startp=${from}&endp=${to}`);

  // ── 6. CRM ────────────────────────────────────────────────────────────────
  console.log('\n── CRM ──────────────────────────────────────────────────────');
  const funnels = await call('list_crm_funnels', '/api/crm/v1/funnels');
  const firstFunnelId = funnels?.items?.[0]?.id ?? funnels?.body?.[0]?.id;
  await call('list_leads', '/api/crm/v1/leads');
  if (firstFunnelId) {
    await call('list_leads (por funnel)', `/api/crm/v1/leads?funnelId=${firstFunnelId}`);
  }

  // ── 7. Proyectos ──────────────────────────────────────────────────────────
  console.log('\n── Proyectos ────────────────────────────────────────────────');
  const projects = await call('list_projects', '/api/projects/v1/projects');
  const firstProjectId = projects?.items?.[0]?.id;
  if (firstProjectId) {
    await call('get_project', `/api/projects/v1/projects/${firstProjectId}`);
    await call('list_project_tasks', `/api/projects/v1/projects/${firstProjectId}/tasks`);
    await call('list_time_records', `/api/projects/v1/projects/${firstProjectId}/times`);
  }

  // ── 8. Equipo ─────────────────────────────────────────────────────────────
  console.log('\n── Equipo / Empleados ───────────────────────────────────────');
  const employees = await call('list_employees', '/api/team/v1/employees');
  if (employees?.items?.[0]?.id) {
    await call('get_employee', `/api/team/v1/employees/${employees.items[0].id}`);
  }

  // ── 9. Tesorería ──────────────────────────────────────────────────────────
  console.log('\n── Tesorería ────────────────────────────────────────────────');
  await call('list_treasury_accounts', '/api/invoicing/v1/treasury');

  // ── 10. Create invoice draft (write) ─────────────────────────────────────
  console.log('\n── Write: create_invoice_draft (borrador) ───────────────────');
  const draftBody = {
    contactId  : firstContactId ?? undefined,
    desc       : 'SMOKE TEST — borrador de prueba (no aprobar)',
    date       : Math.floor(Date.now() / 1000),
    items      : [{ name: 'Test item', units: 1, cost: 1, subtotal: 1 }],
    approveDoc : false,
  };
  await call('create_invoice_draft', '/api/invoicing/v1/documents/invoice', {
    method: 'POST',
    body: JSON.stringify(draftBody),
  });

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(' Smoke test completado');
  console.log('══════════════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
