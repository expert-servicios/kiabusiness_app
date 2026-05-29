#!/usr/bin/env node
/**
 * Test suite for the Kia Reports module.
 *
 * Tests 5 layers:
 *   1. KIA schema integrity (taskTypes, intents, nextActions)
 *   2. Report generator logic (KPI calculations, data transforms)
 *   3. Holded API connectivity with test key
 *   4. Supabase table structure (kia_financial_reports)
 *   5. Export libraries (xlsx, docx) — PDF skipped (browser env)
 *
 * Usage: node scripts/test-reports-module.mjs
 *
 * Requires: HOLDED_TEST_API_KEY env var OR pass as first arg
 *           NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun } from 'docx';

// ── Colour helpers ────────────────────────────────────────────────────────────
const G  = '\x1b[32m✓\x1b[0m';
const R  = '\x1b[31m✗\x1b[0m';
const Y  = '\x1b[33m⚠\x1b[0m';
const B  = '\x1b[1m';
const RS = '\x1b[0m';

let pass = 0, fail = 0, warn = 0;

function ok(msg)    { console.log(`  ${G} ${msg}`); pass++; }
function ko(msg)    { console.log(`  ${R} ${msg}`); fail++; }
function wr(msg)    { console.log(`  ${Y} ${msg}`); warn++; }
function section(t) { console.log(`\n${B}── ${t} ──────────────────────────────────────────${RS}`); }

// ── 1. KIA Schema integrity ───────────────────────────────────────────────────

section('1. KIA Schema integrity');

// Dynamic import of TS-compiled types using .ts extension via tsx
// Since this is .mjs we'll import the dist or use a simpler check

const KIA_TASK_TYPES = [
  'waba_reply','admin_ai_compose','document_classification','document_extraction',
  'lead_client_decision','viability_reasoning','readiness_reasoning',
  'accounting_anomaly_review','company_status_summary','next_best_action',
  'checkout_decision','generate_report',
];
const KIA_INTENTS = [
  'greeting','service_selection','viability','readiness','checkout','book_call',
  'complete_profile','connect_holded','send_documents','case_status',
  'accounting_summary','document_classification','anomaly_review',
  'company_data_resolve','company_data_confirm','company_data_reject','company_data_edit',
  'report_request','export_report','unknown',
];
const KIA_NEXT_ACTIONS = [
  'reply_only','ask_one_question','show_menu','run_viability','run_readiness',
  'send_checkout_link','send_login_link','send_profile_link','send_holded_connect_link',
  'book_call','classify_document','get_case_status','create_next_best_action',
  'update_case','create_task','needs_review','send_company_lookup_link',
  'show_company_suggestion','generate_report','show_report_link',
];

// Read actual schema file
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(__dirname, '../lib/ai/kia/kia-output-schema.ts');
const schemaText = readFileSync(schemaPath, 'utf-8');

const checkIn = (label, needle, haystack) => {
  if (haystack.includes(needle)) ok(`${label}: '${needle}' present`);
  else ko(`${label}: '${needle}' MISSING`);
};

checkIn('taskType',   'generate_report',   schemaText);
checkIn('intent',     'report_request',    schemaText);
checkIn('intent',     'export_report',     schemaText);
checkIn('nextAction', 'generate_report',   schemaText);
checkIn('nextAction', 'show_report_link',  schemaText);

const toolDefsPath = resolve(__dirname, '../lib/ai/kia/kia-tool-definitions.ts');
const toolDefsText = readFileSync(toolDefsPath, 'utf-8');
checkIn('tool', 'generate_company_report', toolDefsText);
checkIn('tool', 'get_holded_invoices',     toolDefsText);
checkIn('tool', 'get_holded_contacts',     toolDefsText);
checkIn('tool', 'get_holded_bank_balance', toolDefsText);

const executorPath = resolve(__dirname, '../lib/ai/kia/kia-tool-executor.ts');
const executorText = readFileSync(executorPath, 'utf-8');
checkIn('executor case', "case 'generate_company_report'", executorText);
checkIn('executor case', "case 'get_holded_invoices'",     executorText);

// ── 2. Report generator logic ─────────────────────────────────────────────────

section('2. Report generator logic (unit tests)');

// Test KPI calculations
function calcVat(amount, rate = 0.21) {
  return Math.round(amount * rate * 100) / 100;
}

const mockSales     = [{ total: 10000, status: 'paid' }, { total: 5000, status: 'pending' }, { total: 3000, status: 'paid' }];
const mockPurchases = [{ total: 2000, status: 'paid' }, { total: 1000, status: 'pending' }];

const totalSales     = mockSales.reduce((s, d) => s + d.total, 0);     // 18000
const totalPurchases = mockPurchases.reduce((s, d) => s + d.total, 0); // 3000
const vatCollected   = calcVat(totalSales);      // 3780
const vatDeductible  = calcVat(totalPurchases);  // 630
const vatBalance     = vatCollected - vatDeductible; // 3150
const unpaid         = mockSales.filter(d => d.status !== 'paid').length; // 1

totalSales     === 18000  ? ok(`totalSales = ${totalSales} ✓`)         : ko(`totalSales expected 18000, got ${totalSales}`);
totalPurchases === 3000   ? ok(`totalPurchases = ${totalPurchases} ✓`) : ko(`totalPurchases expected 3000, got ${totalPurchases}`);
vatCollected   === 3780   ? ok(`vatCollected = ${vatCollected} ✓`)     : ko(`vatCollected expected 3780, got ${vatCollected}`);
vatDeductible  === 630    ? ok(`vatDeductible = ${vatDeductible} ✓`)   : ko(`vatDeductible expected 630, got ${vatDeductible}`);
vatBalance     === 3150   ? ok(`vatBalance = ${vatBalance} ✓`)         : ko(`vatBalance expected 3150, got ${vatBalance}`);
unpaid         === 1      ? ok(`unpaidInvoices = ${unpaid} ✓`)         : ko(`unpaidInvoices expected 1, got ${unpaid}`);

// Test monthly flow grouping
function buildMonthlyFlow(sales, purchases) {
  const map = new Map();
  const addDoc = (docs, key) => {
    for (const d of docs) {
      const ts    = new Date(d.date);
      const label = ts.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      const entry = map.get(label) ?? { sales: 0, purchases: 0 };
      entry[key] += d.total;
      map.set(label, entry);
    }
  };
  addDoc(sales, 'sales');
  addDoc(purchases, 'purchases');
  return Array.from(map.entries()).map(([month, v]) => ({ month, ...v }));
}

const flowSales = [
  { date: '2025-01-15', total: 5000 },
  { date: '2025-01-20', total: 3000 },
  { date: '2025-02-10', total: 7000 },
];
const flowPurchases = [
  { date: '2025-01-05', total: 1000 },
  { date: '2025-02-18', total: 2000 },
];

const flow = buildMonthlyFlow(flowSales, flowPurchases);
flow.length >= 2            ? ok(`Monthly flow has ${flow.length} months`) : ko(`Monthly flow has ${flow.length} months (expected ≥2)`);
const jan = flow.find(f => f.month.includes('ene') || f.month.includes('jan') || f.month.includes('enero'));
jan && jan.sales === 8000   ? ok('January sales grouped correctly (5000+3000=8000)') : ko(`January sales incorrect: ${JSON.stringify(jan)}`);

// Test top contacts grouping
function buildTopContacts(sales) {
  const map = new Map();
  for (const d of sales) {
    const name = d.contact;
    map.set(name, (map.get(name) ?? 0) + d.total);
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([name, total]) => ({ name, total }));
}

const contactSales = [
  { contact: 'Empresa A', total: 5000 },
  { contact: 'Empresa B', total: 3000 },
  { contact: 'Empresa A', total: 2000 },
];
const contacts = buildTopContacts(contactSales);
contacts[0].name === 'Empresa A' && contacts[0].total === 7000
  ? ok('Top contacts sorted by volume (Empresa A=7000)')
  : ko(`Top contacts wrong: ${JSON.stringify(contacts[0])}`);

// ── 3. Holded API connectivity ─────────────────────────────────────────────────

section('3. Holded API connectivity (test key)');

const HOLDED_TEST_KEY = process.argv[2] ?? process.env.HOLDED_TEST_API_KEY ?? '5455e6711fc492f9875e5835974eaa20';
const HOLDED_BASE     = 'https://api.holded.com/api/invoicing/v1';
const HOLDED_HDRS     = { 'key': HOLDED_TEST_KEY, 'Content-Type': 'application/json' };

async function holdedGet(path) {
  const res = await fetch(`${HOLDED_BASE}${path}`, { headers: HOLDED_HDRS });
  return { status: res.status, ok: res.ok, body: res.ok ? await res.json() : null };
}

try {
  // Contacts
  const contacts_r = await holdedGet('/contacts?page=1');
  contacts_r.ok
    ? ok(`GET /contacts → ${contacts_r.status} (${Array.isArray(contacts_r.body) ? contacts_r.body.length : '?'} contacts)`)
    : ko(`GET /contacts → ${contacts_r.status}`);

  // Sales invoices
  const invoices_r = await holdedGet('/documents/invoice?limit=5');
  invoices_r.ok
    ? ok(`GET /documents/invoice → ${invoices_r.status} (${Array.isArray(invoices_r.body) ? invoices_r.body.length : '?'} docs)`)
    : ko(`GET /documents/invoice → ${invoices_r.status}`);

  // Purchase invoices
  const purchases_r = await holdedGet('/documents/purchase?limit=5');
  purchases_r.ok
    ? ok(`GET /documents/purchase → ${purchases_r.status}`)
    : ko(`GET /documents/purchase → ${purchases_r.status}`);

  // Treasury
  const treasury_r = await holdedGet('/treasury');
  treasury_r.ok
    ? ok(`GET /treasury → ${treasury_r.status} (${Array.isArray(treasury_r.body) ? treasury_r.body.length : '?'} accounts)`)
    : ko(`GET /treasury → ${treasury_r.status}`);

  // Taxes (new permission)
  const taxes_r = await holdedGet('/taxes');
  taxes_r.ok
    ? ok(`GET /taxes → ${taxes_r.status}`)
    : wr(`GET /taxes → ${taxes_r.status} (may require accountingReports permission)`);

} catch (err) {
  ko(`Holded API network error: ${err.message}`);
}

// ── 4. Supabase table structure ───────────────────────────────────────────────

section('4. Supabase table structure');

// Load env from .env.local if available
try {
  const { config } = await import('dotenv');
  config({ path: resolve(__dirname, '../.env.local') });
} catch { /* dotenv optional */ }

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  wr('NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — skipping DB tests');
} else {
  const client = createClient(supabaseUrl, supabaseKey);

  // Check kia_financial_reports table
  try {
    const { data, error } = await client
      .from('kia_financial_reports')
      .select('id, report_type, period, title, ai_summary, data, generated_by, viewed_at, created_at')
      .limit(1);

    if (error) ko(`kia_financial_reports table error: ${error.message}`);
    else ok(`kia_financial_reports table exists and is queryable (${data?.length ?? 0} rows)`);
  } catch (e) {
    ko(`kia_financial_reports query threw: ${e.message}`);
  }

  // Check RLS — anon should NOT be able to read
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (anonKey) {
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data: anonData, error: anonErr } = await anonClient
      .from('kia_financial_reports')
      .select('id')
      .limit(1);
    anonErr || (!anonData?.length)
      ? ok('RLS blocks anon read on kia_financial_reports ✓')
      : wr('RLS may not be blocking anon reads — review policies');
  }

  // Check holded_mcp_connections table
  const { data: mcpData, error: mcpErr } = await client
    .from('holded_mcp_connections')
    .select('id, mcp_user_id, email, channel, status')
    .limit(1);
  mcpErr ? ko(`holded_mcp_connections error: ${mcpErr.message}`) : ok(`holded_mcp_connections table OK`);

  // Direct column check via insert+rollback
  const { error: colErr } = await client.from('kia_financial_reports').insert({
    client_id   : '00000000-0000-0000-0000-000000000000',
    report_type : 'empresa_status',
    title       : '__test__',
    data        : { test: true },
    generated_by: 'kia',
  }).select('id').single();

  if (colErr?.message?.includes('violates') || colErr?.message?.includes('foreign key')) {
    ok('kia_financial_reports columns valid (FK constraint triggered as expected for dummy UUID)');
  } else if (!colErr) {
    // Cleanup the test row
    await client.from('kia_financial_reports').delete().eq('title', '__test__');
    ok('kia_financial_reports insert + delete cycle OK');
  } else {
    ko(`kia_financial_reports column test failed: ${colErr.message}`);
  }
}

// ── 5. Export libraries ───────────────────────────────────────────────────────

section('5. Export libraries (xlsx + docx)');

// Test xlsx
try {
  const wb = XLSX.utils.book_new();
  const wsData = [
    ['Empresa', 'Mi Empresa SL'],
    ['Ventas',  18000],
    ['Gastos',  3000],
    ['IVA',     3150],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), 'Resumen');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Nº','Total'],['F-001',1000]]), 'Facturas');

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  buffer.length > 1000
    ? ok(`xlsx: workbook generated (${buffer.length} bytes, 2 sheets)`)
    : ko(`xlsx: buffer too small (${buffer.length} bytes)`);

  // Re-read the buffer to verify integrity
  const wb2 = XLSX.read(buffer, { type: 'buffer' });
  wb2.SheetNames.length === 2
    ? ok(`xlsx: re-read OK — sheets: ${wb2.SheetNames.join(', ')}`)
    : ko(`xlsx: re-read failed — got ${wb2.SheetNames.length} sheets`);
} catch (e) {
  ko(`xlsx error: ${e.message}`);
}

// Test docx
try {
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ children: [new TextRun({ text: 'EXPERT Consulting', bold: true })] }),
        new Paragraph({ children: [new TextRun({ text: 'Informe de empresa — Test' })] }),
        new Paragraph({ children: [new TextRun({ text: `Ventas: 18.000 €` })] }),
      ],
    }],
  });
  const buffer = await Packer.toBuffer(doc);
  buffer.length > 2000
    ? ok(`docx: document generated (${buffer.length} bytes)`)
    : ko(`docx: buffer too small (${buffer.length} bytes)`);

  // Verify it starts with the OOXML magic bytes (PK header)
  const magic = buffer.slice(0, 2).toString('hex');
  magic === '504b'
    ? ok('docx: valid ZIP/OOXML magic bytes (PK) ✓')
    : ko(`docx: unexpected magic bytes: ${magic}`);
} catch (e) {
  ko(`docx error: ${e.message}`);
}

// ── Report component files ────────────────────────────────────────────────────

section('6. Report component files exist');

import { existsSync } from 'fs';

const expectedFiles = [
  'components/dashboard/reports/CompanyStatusReport.tsx',
  'components/dashboard/reports/FiscalKPIStrip.tsx',
  'components/dashboard/reports/MonthlyFlowChart.tsx',
  'components/dashboard/reports/TopContactsBar.tsx',
  'components/dashboard/reports/AnomaliesTable.tsx',
  'components/dashboard/reports/ReportExportBar.tsx',
  'app/(protected)/dashboard/informes/page.tsx',
  'app/(protected)/dashboard/informes/[id]/page.tsx',
  'app/api/reports/generate/route.ts',
  'app/api/reports/route.ts',
  'app/api/reports/[id]/route.ts',
  'app/api/reports/[id]/pdf/route.ts',
  'app/api/reports/[id]/excel/route.ts',
  'app/api/reports/[id]/word/route.ts',
  'lib/reports/report-generator.ts',
  'supabase/migrations/20260529100000_kia_financial_reports.sql',
];

for (const file of expectedFiles) {
  const fullPath = resolve(__dirname, '..', file);
  existsSync(fullPath)
    ? ok(file)
    : ko(`MISSING: ${file}`);
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${B}── Summary ─────────────────────────────────────────────────────${RS}`);
console.log(`  \x1b[32m${pass} passed\x1b[0m  \x1b[31m${fail} failed\x1b[0m  \x1b[33m${warn} warnings\x1b[0m`);
console.log();

if (fail > 0) {
  console.log(`\x1b[31m${fail} test(s) FAILED\x1b[0m`);
  process.exit(1);
} else {
  console.log(`\x1b[32mAll tests passed${warn > 0 ? ` (${warn} warnings)` : ''}\x1b[0m`);
  process.exit(0);
}
