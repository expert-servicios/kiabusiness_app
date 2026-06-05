// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/**
 * GET /api/reports/[id]/pdf
 * Generates and streams a PDF of the company status report.
 */
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, Font,
} from '@react-pdf/renderer';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import type { ReportData } from '@/lib/reports/report-generator';

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page        : { fontFamily: 'Helvetica', fontSize: 10, padding: 40, color: '#3d3528', backgroundColor: '#ffffff' },
  header      : { marginBottom: 24 },
  headerTop   : { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  brand       : { fontSize: 7, color: '#c88b25', fontFamily: 'Helvetica-Bold', letterSpacing: 2, textTransform: 'uppercase' },
  title       : { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#07111d', marginBottom: 4 },
  subtitle    : { fontSize: 9, color: '#7a6e5f' },
  section     : { marginTop: 20, marginBottom: 8 },
  sectionTitle: { fontSize: 8, color: '#c88b25', fontFamily: 'Helvetica-Bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  kpiRow      : { flexDirection: 'row', gap: 8, marginBottom: 4 },
  kpiBox      : { flex: 1, backgroundColor: '#faf9f6', borderRadius: 6, padding: 10, border: '1 solid #e8dfc8' },
  kpiLabel    : { fontSize: 7, color: '#7a6e5f', marginBottom: 3 },
  kpiValue    : { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#07111d' },
  summaryBox  : { backgroundColor: '#faf9f6', border: '1 solid #e8dfc8', borderRadius: 6, padding: 12, marginTop: 4 },
  summaryText : { fontSize: 9, lineHeight: 1.6, color: '#3d3528' },
  tableHeader : { flexDirection: 'row', borderBottom: '1 solid #e8dfc8', paddingBottom: 4, marginBottom: 4 },
  tableRow    : { flexDirection: 'row', paddingVertical: 3, borderBottom: '0.5 solid #f0e8d8' },
  tableCell   : { fontSize: 8, color: '#3d3528' },
  tableCellGray: { fontSize: 8, color: '#7a6e5f' },
  footer      : { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 7, color: '#a89880', textAlign: 'center', borderTop: '0.5 solid #e8dfc8', paddingTop: 6 },
});

function fmt(n: number) {
  return `${n.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`;
}

function ReportPDF({ data }: { data: ReportData }) {
  return React.createElement(
    Document,
    { title: `Informe EXPERT — ${data.company.name}` },
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },

      // Header
      React.createElement(View, { style: styles.header },
        React.createElement(View, { style: styles.headerTop },
          React.createElement(View, null,
            React.createElement(Text, { style: styles.brand }, 'EXPERT Consulting · Informe de Empresa'),
            React.createElement(Text, { style: styles.title }, data.company.name),
            React.createElement(Text, { style: styles.subtitle },
              `Periodo: ${data.period}${data.company.taxId ? ` · ${data.company.taxId}` : ''} · ${new Date(data.generatedAt).toLocaleDateString('es-ES')}`
            ),
          ),
        ),
      ),

      // KPIs
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Resumen financiero'),
        React.createElement(View, { style: styles.kpiRow },
          ...[
            { label: 'Ventas totales',     value: fmt(data.kpis.totalSales) },
            { label: 'Gastos totales',     value: fmt(data.kpis.totalPurchases) },
            { label: 'IVA est. a pagar',   value: fmt(data.kpis.vatBalance) },
            { label: 'Saldo bancario',     value: fmt(data.kpis.totalBankBalance) },
          ].map(({ label, value }) =>
            React.createElement(View, { key: label, style: styles.kpiBox },
              React.createElement(Text, { style: styles.kpiLabel }, label),
              React.createElement(Text, { style: styles.kpiValue }, value),
            )
          ),
        ),
      ),

      // AI summary
      data.aiSummary ? React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Análisis Kia'),
        React.createElement(View, { style: styles.summaryBox },
          React.createElement(Text, { style: styles.summaryText }, data.aiSummary),
        ),
      ) : null,

      // Bank accounts
      data.bankAccounts.length > 0 ? React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Saldos bancarios'),
        React.createElement(View, { style: styles.tableHeader },
          React.createElement(Text, { style: { ...styles.tableCell, flex: 3 } }, 'Cuenta'),
          React.createElement(Text, { style: { ...styles.tableCell, flex: 1, textAlign: 'right' } }, 'Saldo'),
        ),
        ...data.bankAccounts.map((a) =>
          React.createElement(View, { key: a.id, style: styles.tableRow },
            React.createElement(Text, { style: { ...styles.tableCell, flex: 3 } }, a.name),
            React.createElement(Text, { style: { ...styles.tableCell, flex: 1, textAlign: 'right' } }, `${a.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })} ${a.currency}`),
          )
        ),
      ) : null,

      // Sales invoices
      data.salesInvoices.length > 0 ? React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Facturas emitidas (últimas 10)'),
        React.createElement(View, { style: styles.tableHeader },
          React.createElement(Text, { style: { ...styles.tableCell, flex: 1 } }, 'Nº'),
          React.createElement(Text, { style: { ...styles.tableCell, flex: 1 } }, 'Fecha'),
          React.createElement(Text, { style: { ...styles.tableCell, flex: 3 } }, 'Contacto'),
          React.createElement(Text, { style: { ...styles.tableCell, flex: 1, textAlign: 'right' } }, 'Total'),
          React.createElement(Text, { style: { ...styles.tableCell, flex: 1 } }, 'Estado'),
        ),
        ...data.salesInvoices.slice(0, 10).map((inv) =>
          React.createElement(View, { key: inv.id, style: styles.tableRow },
            React.createElement(Text, { style: { ...styles.tableCellGray, flex: 1 } }, inv.number),
            React.createElement(Text, { style: { ...styles.tableCellGray, flex: 1 } }, inv.date),
            React.createElement(Text, { style: { ...styles.tableCell, flex: 3 } }, inv.contact),
            React.createElement(Text, { style: { ...styles.tableCell, flex: 1, textAlign: 'right' } }, fmt(inv.total)),
            React.createElement(Text, { style: { ...styles.tableCellGray, flex: 1 } }, inv.status),
          )
        ),
      ) : null,

      // Anomalies
      data.anomalies.length > 0 ? React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, `Alertas contables (${data.anomalies.length})`),
        ...data.anomalies.slice(0, 10).map((a) =>
          React.createElement(View, { key: a.id, style: { ...styles.tableRow, flexDirection: 'column', paddingVertical: 5 } },
            React.createElement(Text, { style: { ...styles.tableCell, fontFamily: 'Helvetica-Bold', marginBottom: 2 } },
              `[${a.severity.toUpperCase()}] ${a.type}`
            ),
            React.createElement(Text, { style: styles.tableCellGray }, a.detail),
          )
        ),
      ) : null,

      // Footer
      React.createElement(View, { style: styles.footer, fixed: true },
        React.createElement(Text, null,
          `Generado por Kia · EXPERT Consulting · ${new Date(data.generatedAt).toLocaleDateString('es-ES')} · Datos orientativos, no constituyen asesoramiento fiscal`
        ),
      ),
    )
  );
}

// ── Route handler ─────────────────────────────────────────────────────────────

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

  const pdfBuffer = await renderToBuffer(React.createElement(ReportPDF, { data: report.data as ReportData }));

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type'       : 'application/pdf',
      'Content-Disposition': `attachment; filename="informe-${id.slice(0, 8)}.pdf"`,
    },
  });
}
