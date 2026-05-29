'use client';

import { TrendingUp, TrendingDown, Euro, Landmark, AlertCircle } from 'lucide-react';
import type { ReportKPIs } from '@/lib/reports/report-generator';

function fmt(n: number) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Props { kpis: ReportKPIs }

export function FiscalKPIStrip({ kpis }: Props) {
  const vatPositive = kpis.vatBalance >= 0;

  const cards = [
    {
      label : 'Ventas totales',
      value : `${fmt(kpis.totalSales)} €`,
      icon  : TrendingUp,
      color : 'text-emerald-600',
      bg    : 'bg-emerald-50',
    },
    {
      label : 'Gastos totales',
      value : `${fmt(kpis.totalPurchases)} €`,
      icon  : TrendingDown,
      color : 'text-red-500',
      bg    : 'bg-red-50',
    },
    {
      label : vatPositive ? 'IVA estimado a pagar' : 'IVA estimado a devolver',
      value : `${fmt(Math.abs(kpis.vatBalance))} €`,
      icon  : Euro,
      color : vatPositive ? 'text-amber-600' : 'text-blue-600',
      bg    : vatPositive ? 'bg-amber-50' : 'bg-blue-50',
      note  : 'Estimación al 21% — sujeta a revisión',
    },
    {
      label : 'Saldo bancario',
      value : `${fmt(kpis.totalBankBalance)} €`,
      icon  : Landmark,
      color : 'text-[#c88b25]',
      bg    : 'bg-[#c88b25]/5',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className={`rounded-xl border border-[#e8dfc8] ${c.bg} p-4`}>
            <div className="flex items-center justify-between">
              <Icon className={`h-5 w-5 ${c.color}`} />
              {c.note && <span title={c.note}><AlertCircle className="h-3.5 w-3.5 text-[#a89880]" /></span>}
            </div>
            <p className="mt-3 text-lg font-bold text-[#07111d]">{c.value}</p>
            <p className="mt-0.5 text-xs text-[#7a6e5f]">{c.label}</p>
          </div>
        );
      })}

      {(kpis.unpaidInvoices > 0 || kpis.pendingPurchases > 0) && (
        <div className="col-span-2 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:col-span-4">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs text-amber-800">
            {kpis.unpaidInvoices > 0 && `${kpis.unpaidInvoices} factura${kpis.unpaidInvoices !== 1 ? 's' : ''} emitida${kpis.unpaidInvoices !== 1 ? 's' : ''} sin cobrar`}
            {kpis.unpaidInvoices > 0 && kpis.pendingPurchases > 0 && ' · '}
            {kpis.pendingPurchases > 0 && `${kpis.pendingPurchases} factura${kpis.pendingPurchases !== 1 ? 's' : ''} recibida${kpis.pendingPurchases !== 1 ? 's' : ''} pendiente${kpis.pendingPurchases !== 1 ? 's' : ''} de pago`}
          </p>
        </div>
      )}
    </div>
  );
}
