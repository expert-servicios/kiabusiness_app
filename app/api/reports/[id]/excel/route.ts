/**
 * GET /api/reports/[id]/excel
 * Generates and streams an Excel workbook (.xlsx) of the company status report.
 */
import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import type { ReportData } from '@/lib/reports/report-generator';

export const runtime = 'nodejs';

type CellValue = string | number | boolean | Date | null;
type SheetRows = CellValue[][];

type SheetDefinition = {
  name: string;
  rows: SheetRows;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function columnName(index: number): string {
  let name = '';
  let value = index + 1;
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function safeSheetName(name: string, usedNames: Set<string>): string {
  const base = name.replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 31) || 'Hoja';
  let candidate = base;
  let suffix = 2;
  while (usedNames.has(candidate)) {
    const ending = ` ${suffix}`;
    candidate = `${base.slice(0, 31 - ending.length)}${ending}`;
    suffix++;
  }
  usedNames.add(candidate);
  return candidate;
}

function cellXml(value: CellValue, rowIndex: number, columnIndex: number): string {
  if (value === null) return '';
  const ref = `${columnName(columnIndex)}${rowIndex + 1}`;

  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<c r="${ref}"><v>${value}</v></c>`;
  }

  if (typeof value === 'boolean') {
    return `<c r="${ref}" t="b"><v>${value ? 1 : 0}</v></c>`;
  }

  const text = value instanceof Date ? value.toISOString() : String(value);
  return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(text)}</t></is></c>`;
}

function worksheetXml(rows: SheetRows): string {
  const sheetRows = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, columnIndex) => cellXml(value, rowIndex, columnIndex))
        .join('');
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${sheetRows}</sheetData>
</worksheet>`;
}

function workbookXml(sheets: SheetDefinition[]): string {
  const sheetEntries = sheets
    .map((sheet, index) => `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheetEntries}</sheets>
</workbook>`;
}

function workbookRelsXml(sheets: SheetDefinition[]): string {
  const sheetRels = sheets
    .map((_, index) =>
      `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheetRels}
</Relationships>`;
}

function contentTypesXml(sheets: SheetDefinition[]): string {
  const sheetOverrides = sheets
    .map((_, index) =>
      `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${sheetOverrides}
</Types>`;
}

function packageRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function buildSheets(data: ReportData): SheetDefinition[] {
  const usedNames = new Set<string>();
  const sheets: SheetDefinition[] = [
    {
      name: 'Resumen',
      rows: [
        ['Empresa', data.company.name],
        ['CIF/NIF', data.company.taxId ?? '-'],
        ['Periodo', data.period],
        ['Generado el', new Date(data.generatedAt).toLocaleDateString('es-ES')],
        [],
        ['Ventas totales (EUR)', data.kpis.totalSales],
        ['Gastos totales (EUR)', data.kpis.totalPurchases],
        ['IVA repercutido est. (EUR)', data.kpis.vatCollected],
        ['IVA soportado est. (EUR)', data.kpis.vatDeductible],
        ['Balance IVA est. (EUR)', data.kpis.vatBalance],
        ['Saldo bancario total (EUR)', data.kpis.totalBankBalance],
        ['Facturas emitidas sin cobrar', data.kpis.unpaidInvoices],
        ['Facturas recibidas pendientes', data.kpis.pendingPurchases],
        [],
        ['Resumen Kia'],
        [data.aiSummary ?? ''],
      ],
    },
    {
      name: 'Facturas emitidas',
      rows: [
        ['Numero', 'Fecha', 'Contacto', 'Total (EUR)', 'Estado'],
        ...data.salesInvoices.map((invoice) => [
          invoice.number,
          invoice.date,
          invoice.contact,
          invoice.total,
          invoice.status,
        ]),
      ],
    },
    {
      name: 'Facturas recibidas',
      rows: [
        ['Numero', 'Fecha', 'Contacto', 'Total (EUR)', 'Estado'],
        ...data.purchaseInvoices.map((invoice) => [
          invoice.number,
          invoice.date,
          invoice.contact,
          invoice.total,
          invoice.status,
        ]),
      ],
    },
    {
      name: 'Saldos bancarios',
      rows: [
        ['Cuenta', 'Saldo', 'Moneda'],
        ...data.bankAccounts.map((account) => [account.name, account.balance, account.currency]),
      ],
    },
  ];

  if (data.anomalies.length > 0) {
    sheets.push({
      name: 'Alertas',
      rows: [
        ['Tipo', 'Severidad', 'Detalle', 'Estado'],
        ...data.anomalies.map((anomaly) => [
          anomaly.type,
          anomaly.severity,
          anomaly.detail,
          anomaly.status,
        ]),
      ],
    });
  }

  return sheets.map((sheet) => ({
    ...sheet,
    name: safeSheetName(sheet.name, usedNames),
  }));
}

async function buildWorkbookBuffer(data: ReportData): Promise<Buffer> {
  const sheets = buildSheets(data);
  const zip = new JSZip();

  zip.file('[Content_Types].xml', contentTypesXml(sheets));
  zip.file('_rels/.rels', packageRelsXml());
  zip.file('xl/workbook.xml', workbookXml(sheets));
  zip.file('xl/_rels/workbook.xml.rels', workbookRelsXml(sheets));
  sheets.forEach((sheet, index) => {
    zip.file(`xl/worksheets/sheet${index + 1}.xml`, worksheetXml(sheet.rows));
  });

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const { data: report } = await getSupabaseAdmin()
    .from('kia_financial_reports')
    .select('title, data')
    .eq('id', id)
    .eq('client_id', user.id)
    .single();

  if (!report) return NextResponse.json({ error: 'Informe no encontrado' }, { status: 404 });

  const buffer = await buildWorkbookBuffer(report.data as ReportData);

  return new NextResponse(buffer as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="informe-${id.slice(0, 8)}.xlsx"`,
    },
  });
}
