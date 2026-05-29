'use client';

import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import type { MonthlyFlow } from '@/lib/reports/report-generator';

interface Props { data: MonthlyFlow[] }

function euroFormatter(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k €` : `${value} €`;
}

export function MonthlyFlowChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-[#e8dfc8] bg-[#faf9f6] text-sm text-[#a89880]">
        Sin datos de facturación en este periodo
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#c88b25" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#c88b25" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradPurch" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#d8cbb5" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#d8cbb5" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#7a6e5f' }} />
        <YAxis tickFormatter={euroFormatter} tick={{ fontSize: 11, fill: '#7a6e5f' }} width={52} />
        <Tooltip formatter={(v: unknown) => `${Number(v).toLocaleString('es-ES')} €`} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone" dataKey="sales" name="Ventas"
          stroke="#c88b25" fill="url(#gradSales)" strokeWidth={2}
        />
        <Area
          type="monotone" dataKey="purchases" name="Gastos"
          stroke="#d8cbb5" fill="url(#gradPurch)" strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
