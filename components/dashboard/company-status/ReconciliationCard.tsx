import { Landmark } from 'lucide-react';

export function ReconciliationCard() {
  return (
    <div className="rounded-2xl border border-[#d8cbb5] bg-white p-5">
      <div className="flex items-center gap-2">
        <Landmark className="h-4 w-4 text-[#c88b25]" />
        <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Conciliación bancaria</p>
      </div>
      <p className="mt-2 text-sm text-[#29384a]">
        La conciliación automática de movimientos bancarios estará disponible próximamente.
      </p>
    </div>
  );
}
