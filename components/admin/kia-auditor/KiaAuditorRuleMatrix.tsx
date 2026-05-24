interface RuleWithStats {
  id:          string;
  label:       string;
  category:    string;
  severity:    string;
  evalType:    string;
  stats30d:    { passed: number; failed: number; warning: number; total: number; failRate: number | null };
}

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  warning:  'bg-amber-100 text-amber-800',
  info:     'bg-blue-100 text-blue-800',
};

export function KiaAuditorRuleMatrix({ rules }: { rules: RuleWithStats[] }) {
  return (
    <section className="rounded-2xl border border-[#d8cbb5] bg-white overflow-hidden">
      <div className="border-b border-[#d8cbb5] px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Matriz de reglas (30 días)</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#f0e9da] text-left">
              <th className="px-5 py-3 font-semibold uppercase tracking-wider text-[#29384a]/60">Regla</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[#29384a]/60">Categoría</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[#29384a]/60">Severidad</th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[#29384a]/60">Tipo</th>
              <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider text-[#29384a]/60">OK</th>
              <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider text-[#29384a]/60">Fallos</th>
              <th className="px-4 py-3 text-right font-semibold uppercase tracking-wider text-[#29384a]/60">Tasa fallo</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className="border-b border-[#f8f4eb] hover:bg-[#faf8f3]">
                <td className="px-5 py-2.5">
                  <p className="font-medium text-[#07111d]">{rule.label}</p>
                  <p className="text-[10px] text-[#29384a]/50">{rule.id}</p>
                </td>
                <td className="px-4 py-2.5 text-[#29384a]">{rule.category}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${SEVERITY_BADGE[rule.severity] ?? ''}`}>
                    {rule.severity}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-[#29384a]">{rule.evalType}</td>
                <td className="px-4 py-2.5 text-right text-emerald-700 font-semibold">{rule.stats30d.passed}</td>
                <td className="px-4 py-2.5 text-right text-red-700 font-semibold">{rule.stats30d.failed}</td>
                <td className="px-4 py-2.5 text-right">
                  {rule.stats30d.failRate !== null
                    ? <span className={rule.stats30d.failRate > 20 ? 'font-bold text-red-700' : 'text-[#29384a]'}>{rule.stats30d.failRate}%</span>
                    : <span className="text-[#29384a]/40">–</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
