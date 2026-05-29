'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { ContactVolume } from '@/lib/reports/report-generator';

interface Props { contacts: ContactVolume[] }

export function TopContactsBar({ contacts }: Props) {
  if (!contacts.length) {
    return (
      <p className="text-sm text-[#a89880]">Sin datos de clientes en este periodo.</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(120, contacts.length * 36)}>
      <BarChart
        layout="vertical"
        data={contacts}
        margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
      >
        <XAxis
          type="number"
          tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
          tick={{ fontSize: 11, fill: '#7a6e5f' }}
        />
        <YAxis
          type="category" dataKey="name" width={120}
          tick={{ fontSize: 11, fill: '#3d3528' }}
        />
        <Tooltip formatter={(v: unknown) => `${Number(v).toLocaleString('es-ES')} €`} />
        <Bar dataKey="total" name="Facturado" fill="#c88b25" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
