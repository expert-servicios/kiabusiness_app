'use client';

import { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { getPublicAppUrl } from '@/lib/utils/app-url';

// ── Workflow stages ────────────────────────────────────────────────────────────

export type WorkflowStage =
  | 'ack'
  | 'data_request'
  | 'docs_request'
  | 'payment'
  | 'draft_confirm'
  | 'delivered';

const STAGE_LABELS: Record<WorkflowStage, { label: string; icon: string }> = {
  ack:           { label: '1. Solicitud recibida',     icon: '✅' },
  data_request:  { label: '2. Solicitar datos',         icon: '📋' },
  docs_request:  { label: '3. Solicitar documentación', icon: '📂' },
  payment:       { label: '4. Solicitar pago',          icon: '💶' },
  draft_confirm: { label: '5. Borrador para revisar',   icon: '📝' },
  delivered:     { label: '6. Documento tramitado',     icon: '🎉' },
};

const ALL_STAGES: WorkflowStage[] = ['ack', 'data_request', 'docs_request', 'payment', 'draft_confirm', 'delivered'];

// ── Services ──────────────────────────────────────────────────────────────────

interface ServiceOption {
  id: string;
  label: string;
  category: string;
  docs: string[];
  price?: string; // rough estimate for the payment stage
}

const WORKFLOW_SERVICES: ServiceOption[] = [
  {
    id: 'irpf', label: 'Declaración de la Renta (IRPF)', category: 'Fiscal',
    docs: ['DNI / NIE en vigor', 'Nº de referencia o Cl@ve PIN', 'Borrador de la renta (si lo tienes)', 'Certificado de ingresos del empleador', 'Extracto bancario si tienes cuentas extranjeras o inversiones'],
    price: '60–90 €',
  },
  {
    id: 'autonomo', label: 'Gestión Autónomo / IVA trimestral', category: 'Fiscal',
    docs: ['DNI / NIE', 'Alta en Hacienda (036/037) y RETA', 'Facturas emitidas del trimestre', 'Facturas recibidas (gastos)', 'Extracto bancario del trimestre'],
    price: '80–120 €/trimestre',
  },
  {
    id: 'no_residente', label: 'Declaración No Residente (IRNR)', category: 'Fiscal',
    docs: ['Pasaporte o NIE vigente', 'Escritura de la propiedad en España', 'Certificado de residencia fiscal del país de residencia', 'Recibos del IBI del año a declarar'],
    price: '90–150 €',
  },
  {
    id: 'residencia', label: 'Permiso de Residencia (TIE / TA)', category: 'Extranjería',
    docs: ['Pasaporte completo (todas las páginas)', 'TIE / NIE actual si es renovación', 'Empadronamiento (máx. 3 meses)', 'Contrato de trabajo o medios económicos', 'Seguro médico sin copago con cobertura en España', 'Foto en fondo blanco (tamaño carné)'],
    price: '150–250 €',
  },
  {
    id: 'nacionalidad', label: 'Nacionalidad Española', category: 'Extranjería',
    docs: ['Pasaporte vigente', 'TIE / NIE vigente', 'Certificado empadronamiento histórico', 'Antecedentes penales país de origen (apostillado y traducido)', 'Certificado de nacimiento apostillado y traducido', 'Certificado de matrimonio si aplica (apostillado)'],
    price: '350–500 €',
  },
  {
    id: 'arraigo', label: 'Arraigo / Reagrupación Familiar', category: 'Extranjería',
    docs: ['Pasaporte vigente', 'Empadronamiento histórico (2-3 años)', 'Contrato de trabajo o informe arraigo', 'Medios económicos (nóminas o extracto)'],
    price: '200–350 €',
  },
  {
    id: 'empresa_sl', label: 'Constitución de Empresa / SL', category: 'Empresa',
    docs: ['DNI / NIE de todos los socios', '3 opciones de nombre para la sociedad', 'Capital social (mínimo 3.000 €)', 'Actividad principal (CNAE o descripción)', 'Domicilio social en España'],
    price: '400–600 €',
  },
  {
    id: 'notaria', label: 'Notaría / Inmueble', category: 'Notaría',
    docs: ['DNI / NIE de todos los intervinientes', 'Escritura de propiedad actual', 'Nota simple del Registro de la Propiedad (< 3 meses)', 'Últimos recibos del IBI'],
    price: 'Consultar según operación',
  },
  {
    id: 'trafico', label: 'Gestión Tráfico / Certificado', category: 'Tráfico',
    docs: ['DNI / NIE vigente', 'Permiso de circulación o ficha técnica (si aplica)', 'Carnet de conducir (si aplica)', 'Descripción de la gestión'],
    price: '60–120 €',
  },
];

// ── Template generator ────────────────────────────────────────────────────────

function buildMessage(
  stage: WorkflowStage,
  service: ServiceOption,
  clientName: string,
  extraData?: { paymentUrl?: string; draftUrl?: string; deliveredUrl?: string },
): string {
  const name = clientName || 'cliente';
  const appUrl = getPublicAppUrl();

  switch (stage) {
    case 'ack':
      return `✅ Hola ${name}, hemos recibido tu solicitud para *${service.label}*.\n\nEstamos revisando tu caso y nos pondremos en contacto contigo en menos de 24 horas hábiles con los próximos pasos.\n\nGracias por confiar en EXPERT 💼`;

    case 'data_request':
      return `📋 Para abrir tu expediente de *${service.label}*, necesito los siguientes datos:\n\n• Nombre completo\n• NIE / DNI\n• Fecha de nacimiento\n• Email de contacto\n• Teléfono\n\nPuedes enviármelos directamente por aquí. Si ya tienes cuenta en nuestro panel, también puedes actualizarlos en ${appUrl}/dashboard`;

    case 'docs_request':
      return `📂 Para poder estudiar tu caso de *${service.label}* y preparar tu expediente, necesitamos la siguiente documentación:\n\n${service.docs.map((d) => `• ${d}`).join('\n')}\n\nPuedes enviarnos los documentos por aquí (foto o PDF) o subirlos directamente a tu área privada en ${appUrl}/dashboard\n\nSi tienes dudas sobre algún documento, dímelo y te ayudo. Asesoría EXPERT 💼`;

    case 'payment':
      return `💶 Hola ${name}, hemos revisado tu documentación y tu caso de *${service.label}* es viable ✅\n\n*Importe:* ${service.price ?? 'a consultar'}\n\nPuedes realizar el pago de forma segura aquí:\n${extraData?.paymentUrl ?? '[ Añadir enlace de pago ]'}\n\nEn cuanto confirmemos el pago, comenzamos con el trámite. ¿Tienes alguna pregunta antes de proceder? Asesoría EXPERT 💼`;

    case 'draft_confirm':
      return `📝 Hola ${name}, hemos preparado el borrador de tu *${service.label}*.\n\nPor favor, revísalo antes de que lo presentemos:\n${extraData?.draftUrl ?? '[ Añadir enlace al borrador ]'}\n\nSi todo está correcto, respóndeme confirmando y lo presentamos. Si hay algo que corregir, indícamelo y lo ajustamos. Asesoría EXPERT 💼`;

    case 'delivered':
      return `🎉 Hola ${name}, ¡tu trámite de *${service.label}* ha sido completado con éxito!\n\nPuedes descargar el documento tramitado aquí:\n${extraData?.deliveredUrl ?? '[ Añadir enlace al documento ]'}\n\nHa sido un placer trabajar contigo. Si en el futuro necesitas cualquier otro trámite, aquí estaremos.\n\n¡Muchas gracias por confiar en EXPERT! 💼`;

    default:
      return '';
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface WaServiceWorkflowProps {
  clientName: string;
  onInsert: (text: string) => void;
  onClose: () => void;
}

export function WaServiceWorkflow({ clientName, onInsert, onClose }: WaServiceWorkflowProps) {
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(null);
  const [selectedStage, setSelectedStage] = useState<WorkflowStage | null>(null);
  const [extraData, setExtraData] = useState({ paymentUrl: '', draftUrl: '', deliveredUrl: '' });

  const preview = selectedService && selectedStage
    ? buildMessage(selectedStage, selectedService, clientName, extraData)
    : null;

  const needsUrl = selectedStage === 'payment' || selectedStage === 'draft_confirm' || selectedStage === 'delivered';

  const urlLabel: Record<string, string> = {
    payment: 'Enlace de pago (Stripe)',
    draft_confirm: 'Enlace al borrador',
    delivered: 'Enlace al documento',
  };
  const urlField: Record<string, 'paymentUrl' | 'draftUrl' | 'deliveredUrl'> = {
    payment: 'paymentUrl',
    draft_confirm: 'draftUrl',
    delivered: 'deliveredUrl',
  };

  const categories = [...new Set(WORKFLOW_SERVICES.map((s) => s.category))];

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl border border-[#d8cbb5] overflow-hidden max-h-[90dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#d8cbb5] bg-[#07111d] px-4 py-3">
          <p className="text-sm font-bold text-white">Plantillas de servicio</p>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-white/60 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: service + stage selector */}
          <div className="w-48 shrink-0 overflow-y-auto border-r border-[#d8cbb5] bg-[#f8f4eb]">
            {/* Services grouped by category */}
            {categories.map((cat) => (
              <div key={cat}>
                <p className="sticky top-0 bg-[#f0e9d8] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#c88b25]">
                  {cat}
                </p>
                {WORKFLOW_SERVICES.filter((s) => s.category === cat).map((svc) => (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => { setSelectedService(svc); setSelectedStage(null); }}
                    className={`w-full px-3 py-2 text-left text-xs transition ${
                      selectedService?.id === svc.id
                        ? 'bg-[#07111d] font-semibold text-white'
                        : 'text-[#07111d] hover:bg-[#e8e0cc]'
                    }`}
                  >
                    {svc.label}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Right: stages + preview */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {!selectedService ? (
              <div className="flex flex-1 items-center justify-center text-sm text-[#29384a]">
                ← Selecciona un servicio
              </div>
            ) : (
              <>
                {/* Stages */}
                <div className="border-b border-[#d8cbb5] p-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#29384a]">Etapa</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_STAGES.map((stage) => {
                      const { label, icon } = STAGE_LABELS[stage];
                      return (
                        <button
                          key={stage}
                          type="button"
                          onClick={() => setSelectedStage(stage)}
                          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                            selectedStage === stage
                              ? 'bg-[#25D366] text-white'
                              : 'border border-[#d8cbb5] bg-white text-[#07111d] hover:border-[#25D366]'
                          }`}
                        >
                          {icon} {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* URL input if needed */}
                {needsUrl && selectedStage && (
                  <div className="border-b border-[#d8cbb5] px-3 py-2">
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#29384a]">
                      {urlLabel[selectedStage]}
                    </label>
                    <input
                      type="url"
                      value={extraData[urlField[selectedStage]]}
                      onChange={(e) => setExtraData((prev) => ({ ...prev, [urlField[selectedStage]]: e.target.value }))}
                      placeholder="https://…"
                      className="w-full rounded-lg border border-[#d8cbb5] px-2.5 py-1.5 text-xs outline-none focus:border-[#25D366]"
                    />
                  </div>
                )}

                {/* Message preview */}
                <div className="flex-1 overflow-y-auto p-3">
                  {preview ? (
                    <>
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#29384a]">Vista previa</p>
                      <div className="rounded-xl bg-[#dcf8c6] px-3 py-2.5 text-sm text-[#07111d] whitespace-pre-wrap leading-snug">
                        {preview}
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[#29384a]">
                      ↑ Selecciona una etapa
                    </div>
                  )}
                </div>

                {/* Action */}
                {preview && (
                  <div className="border-t border-[#d8cbb5] p-3">
                    <button
                      type="button"
                      onClick={() => { onInsert(preview); onClose(); }}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-2.5 text-sm font-bold text-white transition hover:bg-[#1da851]"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Insertar en el mensaje
                    </button>
                    <p className="mt-2 text-center text-[10px] text-[#29384a]">
                      Puedes editar el mensaje antes de enviar · IA puede mejorar y traducir
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
