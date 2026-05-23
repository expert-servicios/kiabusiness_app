interface KpiCardProps {
  label: string;
  value: number | string;
  sub?: string;
  alert?: boolean;
  warn?: boolean;
  href?: string;
}

export function KpiCard({ label, value, sub, alert, warn }: KpiCardProps) {
  const ring = alert ? 'border-red-200 bg-red-50' : warn ? 'border-amber-200 bg-amber-50' : 'border-[#d8cbb5] bg-white';
  const valueColor = alert ? 'text-red-700' : warn ? 'text-amber-700' : 'text-[#07111d]';

  return (
    <div className={`rounded-xl border p-3 ${ring}`}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#29384a]">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-[#29384a]">{sub}</p>}
    </div>
  );
}
