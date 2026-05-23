interface VatSummaryCardProps {
  vatRepercutido: number;
  vatSoportado: number;
  vatResult: number;
}

function fmt(n: number) {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
}

export function VatSummaryCard({ vatRepercutido, vatSoportado, vatResult }: VatSummaryCardProps) {
  const isPositive = vatResult >= 0;

  return (
    <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
      <p className="mb-4 text-xs font-bold uppercase tracking-widest text-[#c88b25]">
        Resumen IVA — Mod. 303 estimado
      </p>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-[#29384a]">IVA repercutido</p>
          <p className="mt-1 text-lg font-bold text-[#07111d]">{fmt(vatRepercutido)}</p>
          <p className="text-[10px] text-[#29384a]">Emitido a clientes</p>
        </div>
        <div>
          <p className="text-xs text-[#29384a]">IVA soportado</p>
          <p className="mt-1 text-lg font-bold text-[#07111d]">{fmt(vatSoportado)}</p>
          <p className="text-[10px] text-[#29384a]">Recibido de proveedores</p>
        </div>
        <div>
          <p className="text-xs text-[#29384a]">Resultado estimado</p>
          <p className={`mt-1 text-lg font-bold ${isPositive ? 'text-red-600' : 'text-emerald-600'}`}>
            {fmt(Math.abs(vatResult))}
          </p>
          <p className={`text-[10px] font-semibold ${isPositive ? 'text-red-500' : 'text-emerald-500'}`}>
            {isPositive ? 'A ingresar' : 'A compensar'}
          </p>
        </div>
      </div>
      <p className="mt-4 text-[10px] text-[#29384a]">
        Cálculo estimado basado en datos de Holded. No equivale a la liquidación oficial.
      </p>
    </div>
  );
}
