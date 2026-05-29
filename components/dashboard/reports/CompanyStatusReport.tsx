'use client';

import { FiscalKPIStrip }   from './FiscalKPIStrip';
import { MonthlyFlowChart } from './MonthlyFlowChart';
import { TopContactsBar }   from './TopContactsBar';
import { AnomaliesTable }   from './AnomaliesTable';
import { ReportExportBar }  from './ReportExportBar';
import type { ReportData }  from '@/lib/reports/report-generator';

interface Props {
  reportId: string;
  data    : ReportData;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#c88b25]">{title}</h2>
      {children}
    </section>
  );
}

function InvoiceTable({ invoices, label }: { invoices: ReportData['salesInvoices']; label: string }) {
  if (!invoices.length) return (
    <p className="text-sm text-[#a89880]">Sin {label} en este periodo.</p>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#e8dfc8] text-left text-[#7a6e5f]">
            <th className="pb-2 pr-4 font-semibold">Nº</th>
            <th className="pb-2 pr-4 font-semibold">Fecha</th>
            <th className="pb-2 pr-4 font-semibold">Contacto</th>
            <th className="pb-2 pr-4 font-semibold text-right">Total</th>
            <th className="pb-2 font-semibold">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0e8d8]">
          {invoices.slice(0, 10).map((inv) => (
            <tr key={inv.id} className="hover:bg-[#faf7f0]">
              <td className="py-1.5 pr-4 font-mono text-[#3d3528]">{inv.number || '—'}</td>
              <td className="py-1.5 pr-4 text-[#7a6e5f]">{inv.date}</td>
              <td className="py-1.5 pr-4 text-[#3d3528]">{inv.contact || '—'}</td>
              <td className="py-1.5 pr-4 text-right font-semibold text-[#07111d]">
                {inv.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </td>
              <td className="py-1.5">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  inv.status === 'paid' || inv.status === 'pagada'
                    ? 'bg-emerald-100 text-emerald-700'
                    : inv.status === 'overdue' || inv.status === 'vencida'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                }`}>
                  {inv.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CompanyStatusReport({ reportId, data }: Props) {
  const genDate = new Date(data.generatedAt).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c88b25]">
            Informe de estado de empresa
          </p>
          <h1 className="mt-1 font-serif text-2xl font-bold text-[#07111d]">
            {data.company.name}
          </h1>
          <p className="mt-0.5 text-sm text-[#7a6e5f]">
            Periodo: <strong>{data.period}</strong>
            {data.company.taxId && ` · ${data.company.taxId}`}
            {' · '}Generado el {genDate}
          </p>
        </div>
        <ReportExportBar reportId={reportId} />
      </div>

      {/* KPIs */}
      <Section title="Resumen financiero">
        <FiscalKPIStrip kpis={data.kpis} />
      </Section>

      {/* AI summary */}
      {data.aiSummary && (
        <Section title="Análisis Kia">
          <div className="rounded-xl border border-[#e8dfc8] bg-[#faf9f6] px-5 py-4">
            <p className="text-sm leading-relaxed text-[#3d3528]">{data.aiSummary}</p>
            <p className="mt-2 text-[10px] text-[#a89880]">
              Generado por Kia · EXPERT — Estimación orientativa, no es asesoramiento fiscal.
            </p>
          </div>
        </Section>
      )}

      {/* Cash flow chart */}
      <Section title="Evolución mensual — Ventas vs. Gastos">
        <MonthlyFlowChart data={data.monthlyFlow} />
      </Section>

      {/* Saldos bancarios */}
      {data.bankAccounts.length > 0 && (
        <Section title="Saldos bancarios (Holded)">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.bankAccounts.map((a) => (
              <div key={a.id} className="rounded-xl border border-[#e8dfc8] bg-white p-4">
                <p className="text-xs text-[#7a6e5f]">{a.name}</p>
                <p className={`mt-1 text-lg font-bold ${a.balance >= 0 ? 'text-[#07111d]' : 'text-red-600'}`}>
                  {a.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })} {a.currency}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Top clientes */}
      {data.topContacts.length > 0 && (
        <Section title="Clientes principales por volumen facturado">
          <TopContactsBar contacts={data.topContacts} />
        </Section>
      )}

      {/* Facturas emitidas */}
      <Section title="Facturas emitidas (últimas 10)">
        <InvoiceTable invoices={data.salesInvoices} label="facturas emitidas" />
      </Section>

      {/* Facturas recibidas */}
      <Section title="Facturas recibidas (últimas 10)">
        <InvoiceTable invoices={data.purchaseInvoices} label="facturas recibidas" />
      </Section>

      {/* Anomalías */}
      <Section title={`Alertas contables${data.anomalies.length ? ` (${data.anomalies.length})` : ''}`}>
        <AnomaliesTable anomalies={data.anomalies} />
      </Section>

      {/* Footer */}
      <p className="border-t border-[#e8dfc8] pt-4 text-[10px] text-[#a89880]">
        Informe generado automáticamente por Kia · EXPERT Consulting.
        Los datos provienen directamente de Holded y son orientativos.
        No constituye asesoramiento fiscal, contable ni legal.
        Consulta con tu asesor de EXPERT antes de tomar decisiones basadas en este informe.
      </p>
    </div>
  );
}
