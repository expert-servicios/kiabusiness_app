'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface MonthlySnapshot {
  month: string;
  sales: number;
  purchases: number;
}

function eurFormatter(value: number) {
  return value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export function SalesPurchasesChart({ monthlyData }: { monthlyData: MonthlySnapshot[] }) {
  if (monthlyData.every((m) => m.sales === 0 && m.purchases === 0)) {
    return (
      <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#c88b25]">Ventas vs Gastos</p>
        <p className="text-sm text-[#29384a]">Sin datos de facturación en este trimestre.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#c88b25]">Ventas vs Gastos</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={monthlyData} barGap={4} barCategoryGap="30%">
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#29384a' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#29384a' }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            formatter={(value, name) => [
              eurFormatter(typeof value === 'number' ? value : 0),
              name === 'sales' ? 'Ventas' : 'Gastos',
            ]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #d8cbb5' }}
          />
          <Legend
            formatter={(value) => value === 'sales' ? 'Ventas' : 'Gastos'}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="sales"     name="sales"     fill="#c88b25" radius={[4, 4, 0, 0]} />
          <Bar dataKey="purchases" name="purchases" fill="#d8cbb5" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
