'use client';

const EVENT_LABELS: Record<string, string> = {
  whatsapp_message_handled:   'WhatsApp (cliente)',
  email_handled:              'Email',
  document_reviewed:          'Documento revisado',
  document_classified_manual: 'Clasificación manual',
  case_status_changed:        'Cambio estado expediente',
  form_submitted:             'Formulario enviado',
  holded_sync_reviewed:       'Revisión Holded',
  appointment_held:           'Cita',
  tax_form_prepared:          'Modelo preparado',
  tax_form_filed:             'Modelo presentado',
  document_prepared:          'Documento preparado',
  client_call:                'Llamada cliente',
  custom:                     'Otros',
};

interface Props {
  breakdown: Array<{ type: string; count: number; minutes: number }>;
  totalMinutes: number;
}

export function EventsBreakdown({ breakdown, totalMinutes }: Props) {
  if (breakdown.length === 0) {
    return (
      <section className="rounded-2xl border border-[#d8cbb5] bg-white p-6 text-center">
        <p className="text-sm font-semibold text-[#29384a]">Sin eventos registrados este mes</p>
        <p className="mt-1 text-xs text-[#29384a]/60">
          Los eventos se registran automáticamente cuando Kia atiende mensajes, se clasifican documentos o se cambia el estado de expedientes.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[#d8cbb5] bg-white overflow-hidden">
      <div className="border-b border-[#d8cbb5] px-5 py-4 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-[#c88b25]">Desglose de actividad</p>
        <span className="text-xs text-[#29384a]/60">
          {totalMinutes.toLocaleString('es-ES')} min · {(totalMinutes * 0.5).toLocaleString('es-ES', { minimumFractionDigits: 2 })} € coste total
        </span>
      </div>
      <ul className="divide-y divide-[#f8f4eb]">
        {breakdown.map(({ type, count, minutes }) => {
          const pct = totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0;
          return (
            <li key={type} className="flex items-center gap-4 px-5 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#07111d] truncate">
                  {EVENT_LABELS[type] ?? type}
                </p>
                <div className="mt-1 h-1.5 w-full rounded-full bg-[#f0e9da] overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-[#c88b25]"
                    style={{ width: `${pct.toFixed(1)}%` }}
                  />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-semibold text-[#29384a]">{minutes} min</p>
                <p className="text-[10px] text-[#29384a]/50">{count} eventos</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
