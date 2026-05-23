import { AlertTriangle } from 'lucide-react';

interface Anomaly {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  created_at: string;
}

export function AnomaliesCard({ anomalies }: { anomalies: Anomaly[] }) {
  if (anomalies.length === 0) return null;

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <p className="text-xs font-bold uppercase tracking-widest text-red-700">
          Anomalías detectadas por Kia
        </p>
        <span className="ml-auto rounded-full bg-red-200 px-2 py-0.5 text-xs font-bold text-red-800">
          {anomalies.length}
        </span>
      </div>
      <div className="space-y-2">
        {anomalies.map((a) => (
          <div key={a.id} className="rounded-lg bg-white px-3 py-2.5">
            <p className="text-xs font-semibold text-[#07111d]">{a.title}</p>
            {a.description && (
              <p className="mt-0.5 text-xs text-[#29384a]">{a.description}</p>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-red-600">
        Nuestro equipo las revisará. Contacta con nosotros si tienes dudas.
      </p>
    </div>
  );
}
