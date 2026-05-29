/**
 * GET /api/reports/[id]/excel
 * Generates and streams an Excel workbook (.xlsx) of the company status report.
 */
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import type { ReportData } from '@/lib/reports/report-generator';

function buildWorkbook(data: ReportData): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Resumen ───────────────────────────────────────────────────────
  const summaryData = [
    ['Empresa',             data.company.name],
    ['CIF/NIF',             data.company.taxId ?? '—'],
    ['Periodo',             data.period],
    ['Generado el',         new Date(data.generatedAt).toLocaleDateString('es-ES')],
    [],
    ['Ventas totales (€)',          data.kpis.totalSales],
    ['Gastos totales (€)',          data.kpis.totalPurchases],
    ['IVA repercutido est. (€)',    data.kpis.vatCollected],
    ['IVA soportado est. (€)',      data.kpis.vatDeductible],
    ['Balance IVA est. (€)',        data.kpis.vatBalance],
    ['Saldo bancario total (€)',    data.kpis.totalBankBalance],
    ['Facturas emitidas sin cobrar',data.kpis.unpaidInvoices],
    ['Facturas recibidas pendientes',data.kpis.pendingPurchases],
    [],
    ['Resumen Kia'],
    [data.aiSummary ?? ''],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Resumen');

  // ── Sheet 2: Facturas emitidas ─────────────────────────────────────────────
  const salesRows = [
    ['Número', 'Fecha', 'Contacto', 'Total (€)', 'Estado'],
    ...data.salesInvoices.map((i) => [i.number, i.date, i.contact, i.total, i.status]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(salesRows), 'Facturas emitidas');

  // ── Sheet 3: Facturas recibidas ────────────────────────────────────────────
  const purchaseRows = [
    ['Número', 'Fecha', 'Contacto', 'Total (€)', 'Estado'],
    ...data.purchaseInvoices.map((i) => [i.number, i.date, i.contact, i.total, i.status]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(purchaseRows), 'Facturas recibidas');

  // ── Sheet 4: Saldos bancarios ──────────────────────────────────────────────
  const bankRows = [
    ['Cuenta', 'Saldo', 'Moneda'],
    ...data.bankAccounts.map((a) => [a.name, a.balance, a.currency]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(bankRows), 'Saldos bancarios');

  // ── Sheet 5: Alertas ───────────────────────────────────────────────────────
  if (data.anomalies.length > 0) {
    const anomalyRows = [
      ['Tipo', 'Severidad', 'Detalle', 'Estado'],
      ...data.anomalies.map((a) => [a.type, a.severity, a.detail, a.status]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(anomalyRows), 'Alertas');
  }

  return wb;
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

  const wb     = buildWorkbook(report.data as ReportData);
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type'       : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="informe-${id.slice(0, 8)}.xlsx"`,
    },
  });
}
