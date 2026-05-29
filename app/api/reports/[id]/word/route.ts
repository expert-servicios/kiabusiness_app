/**
 * GET /api/reports/[id]/word
 * Generates and streams a Word document (.docx) of the company status report.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, ShadingType,
} from 'docx';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import type { ReportData, InvoiceSummaryItem } from '@/lib/reports/report-generator';

function fmtEur(n: number) {
  return `${n.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`;
}

function heading1(text: string): Paragraph {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 300, after: 120 } });
}

function heading2(text: string): Paragraph {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 80 } });
}

function para(text: string, bold = false): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold, size: 20 })],
    spacing : { after: 60 },
  });
}

function kpiTable(kpis: ReportData['kpis']): Table {
  const rows = [
    ['Ventas totales',              fmtEur(kpis.totalSales)],
    ['Gastos totales',              fmtEur(kpis.totalPurchases)],
    ['IVA repercutido estimado',    fmtEur(kpis.vatCollected)],
    ['IVA soportado estimado',      fmtEur(kpis.vatDeductible)],
    ['Balance IVA estimado',        fmtEur(kpis.vatBalance)],
    ['Saldo bancario total',        fmtEur(kpis.totalBankBalance)],
    ['Facturas emitidas sin cobrar',String(kpis.unpaidInvoices)],
  ];

  return new Table({
    rows: rows.map(([label, value]) =>
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: value, size: 18 })] })] }),
        ],
      })
    ),
    width: { size: 100, type: 'pct' },
  });
}

function invoiceTable(invoices: InvoiceSummaryItem[], title: string): (Paragraph | Table)[] {
  if (!invoices.length) return [para(`Sin ${title} en este periodo.`)];

  const headerRow = new TableRow({
    tableHeader: true,
    children   : ['Número', 'Fecha', 'Contacto', 'Total', 'Estado'].map((h) =>
      new TableCell({
        shading : { type: ShadingType.SOLID, color: 'f8f4eb' },
        children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 16 })] })],
      })
    ),
  });

  const dataRows = invoices.slice(0, 10).map((inv) =>
    new TableRow({
      children: [inv.number, inv.date, inv.contact, fmtEur(inv.total), inv.status].map((v) =>
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: v, size: 16 })] })] })
      ),
    })
  );

  return [
    heading2(title),
    new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: 'pct' } }),
  ];
}

function buildDoc(data: ReportData): Document {
  const sections: (Paragraph | Table)[] = [
    // Cover
    new Paragraph({
      children: [new TextRun({ text: 'EXPERT Consulting', bold: true, size: 16, color: 'c88b25' })],
    }),
    new Paragraph({
      children : [new TextRun({ text: `Informe de estado de empresa — ${data.company.name}`, bold: true, size: 36 })],
      heading  : HeadingLevel.TITLE,
      alignment: AlignmentType.LEFT,
      spacing  : { after: 120 },
    }),
    para(`Periodo: ${data.period}  ·  ${data.company.taxId ?? ''}  ·  ${new Date(data.generatedAt).toLocaleDateString('es-ES')}`),
    new Paragraph({ text: '', spacing: { after: 400 } }),

    // KPIs
    heading1('Resumen financiero'),
    kpiTable(data.kpis),
    new Paragraph({ text: '', spacing: { after: 200 } }),

    // AI summary
    ...(data.aiSummary ? [
      heading1('Análisis Kia'),
      para(data.aiSummary),
      new Paragraph({ text: '', spacing: { after: 200 } }),
    ] : []),

    // Bank accounts
    ...(data.bankAccounts.length > 0 ? [
      heading1('Saldos bancarios'),
      new Table({
        rows: [
          new TableRow({
            tableHeader: true,
            children   : ['Cuenta', 'Saldo', 'Moneda'].map((h) =>
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 16 })] })] })
            ),
          }),
          ...data.bankAccounts.map((a) =>
            new TableRow({
              children: [a.name, fmtEur(a.balance), a.currency].map((v) =>
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: v, size: 16 })] })] })
              ),
            })
          ),
        ],
        width: { size: 100, type: 'pct' },
      }),
      new Paragraph({ text: '', spacing: { after: 200 } }),
    ] : []),

    // Invoices
    ...invoiceTable(data.salesInvoices, 'Facturas emitidas (últimas 10)'),
    new Paragraph({ text: '', spacing: { after: 200 } }),
    ...invoiceTable(data.purchaseInvoices, 'Facturas recibidas (últimas 10)'),
    new Paragraph({ text: '', spacing: { after: 200 } }),

    // Anomalies
    ...(data.anomalies.length > 0 ? [
      heading1(`Alertas contables (${data.anomalies.length})`),
      ...data.anomalies.slice(0, 15).flatMap((a) => [
        para(`[${a.severity.toUpperCase()}] ${a.type}`, true),
        para(a.detail),
      ]),
    ] : []),

    // Footer
    new Paragraph({ text: '', spacing: { before: 600 } }),
    new Paragraph({
      children : [new TextRun({ text: `Generado por Kia · EXPERT Consulting · ${new Date(data.generatedAt).toLocaleDateString('es-ES')} · Datos orientativos, no constituyen asesoramiento fiscal`, size: 14, color: 'a89880' })],
      alignment: AlignmentType.CENTER,
    }),
  ];

  return new Document({
    sections: [{ children: sections }],
    creator : 'Kia — EXPERT Consulting',
    title   : `Informe de empresa — ${data.company.name} — ${data.period}`,
  });
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

  const doc    = buildDoc(report.data as ReportData);
  const buffer = await Packer.toBuffer(doc);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type'       : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="informe-${id.slice(0, 8)}.docx"`,
    },
  });
}
