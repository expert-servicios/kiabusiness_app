'use client';

import { useState } from 'react';
import { X, Send } from 'lucide-react';

export interface WaTemplate {
  name: string;
  label: string;
  description: string;
  params: { key: string; placeholder: string }[];
  preview: (params: string[]) => string;
}

export const WA_TEMPLATES: WaTemplate[] = [
  {
    name: 'expert_contacto_inicial',
    label: 'Primer contacto',
    description: 'Iniciar conversación con un cliente nuevo o inactivo',
    params: [{ key: 'nombre', placeholder: 'Nombre del cliente' }],
    preview: ([n]) => `Hola ${n || '[nombre]'}, soy Ksenia de EXPERT Asesoría. Me pongo en contacto en relación a sus gestiones. ¿Tiene disponibilidad para comentar?`,
  },
  {
    name: 'expert_solicitar_docs',
    label: 'Solicitar documentación',
    description: 'Pedir documentos necesarios para un trámite',
    params: [
      { key: 'nombre', placeholder: 'Nombre del cliente' },
      { key: 'documentos', placeholder: 'Ej: DNI, contrato de trabajo, últimas 3 nóminas' },
    ],
    preview: ([n, d]) => `Hola ${n || '[nombre]'}, para continuar con su trámite necesitamos: ${d || '[documentos]'}. Puede enviárnoslos por este WhatsApp o desde su portal.`,
  },
  {
    name: 'expert_recordatorio_vencimiento',
    label: 'Recordatorio fiscal',
    description: 'Avisar de una obligación fiscal próxima',
    params: [
      { key: 'nombre', placeholder: 'Nombre del cliente' },
      { key: 'obligacion', placeholder: 'Ej: Modelo 303 - IVA trimestral' },
      { key: 'fecha', placeholder: 'Ej: 20 de enero' },
    ],
    preview: ([n, o, f]) => `Hola ${n || '[nombre]'}, le recordamos que su obligación fiscal ${o || '[obligación]'} vence el ${f || '[fecha]'}. Contacte con nosotros si necesita que lo gestionemos.`,
  },
  {
    name: 'expert_estado_actualizado',
    label: 'Estado de expediente',
    description: 'Notificar cambio de estado en un trámite',
    params: [
      { key: 'nombre', placeholder: 'Nombre del cliente' },
      { key: 'estado', placeholder: 'Ej: en tramitación' },
    ],
    preview: ([n, e]) => `Hola ${n || '[nombre]'}, su expediente ha pasado al estado "${e || '[estado]'}". Acceda a su portal para más detalles: kseniailicheva.com/dashboard`,
  },
  {
    name: 'expert_seguimiento',
    label: 'Seguimiento',
    description: 'Check-in general con un cliente',
    params: [{ key: 'nombre', placeholder: 'Nombre del cliente' }],
    preview: ([n]) => `Hola ${n || '[nombre]'}, queríamos hacer un seguimiento de sus gestiones. ¿Todo va bien? ¿Necesita algo de nuestra parte?`,
  },
];

interface Props {
  defaultPhone?: string;
  onClose: () => void;
  onSent: (phone: string, previewText: string) => void;
}

export function WaTemplateModal({ defaultPhone, onClose, onSent }: Props) {
  const [step, setStep] = useState<'pick' | 'fill'>('pick');
  const [selected, setSelected] = useState<WaTemplate | null>(null);
  const [phone, setPhone] = useState(defaultPhone ?? '');
  const [paramValues, setParamValues] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = (tpl: WaTemplate) => {
    setSelected(tpl);
    setParamValues(tpl.params.map(() => ''));
    setStep('fill');
  };

  const handleSend = async () => {
    if (!selected || !phone.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/whatsapp/send-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phone.trim(), templateName: selected.name, params: paramValues }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al enviar'); return; }
      onSent(phone.trim(), selected.preview(paramValues));
      onClose();
    } catch {
      setError('Error de conexión.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-3xl bg-white sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0e9d8] px-5 py-4">
          <div>
            <p className="font-semibold text-[#07111d]">
              {step === 'pick' ? 'Seleccionar plantilla' : selected?.label}
            </p>
            <p className="text-xs text-[#29384a]">
              {step === 'pick' ? 'Plantillas aprobadas por Meta' : selected?.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {step === 'fill' && (
              <button type="button" onClick={() => setStep('pick')} className="text-xs text-[#c88b25] hover:underline">
                ← Cambiar
              </button>
            )}
            <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#29384a] hover:bg-[#f0e9d8]">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Step 1 — pick template */}
        {step === 'pick' && (
          <ul className="max-h-[60vh] divide-y divide-[#f0e9d8] overflow-y-auto">
            {WA_TEMPLATES.map((tpl) => (
              <li key={tpl.name}>
                <button
                  type="button"
                  onClick={() => handleSelect(tpl)}
                  className="w-full px-5 py-4 text-left transition hover:bg-[#faf8f2] active:bg-[#f0e9d8]"
                >
                  <p className="text-sm font-semibold text-[#07111d]">{tpl.label}</p>
                  <p className="mt-0.5 text-xs text-[#29384a]">{tpl.description}</p>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Step 2 — fill params */}
        {step === 'fill' && selected && (
          <div className="space-y-4 p-5">
            {/* Phone */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#07111d]">Número de teléfono</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="34612345678 (con prefijo)"
                className="w-full rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#25D366]"
              />
            </div>

            {/* Params */}
            {selected.params.map((p, i) => (
              <div key={p.key}>
                <label className="mb-1 block text-xs font-semibold text-[#07111d] capitalize">{p.key}</label>
                <input
                  type="text"
                  value={paramValues[i] ?? ''}
                  onChange={(e) => setParamValues((prev) => { const n = [...prev]; n[i] = e.target.value; return n; })}
                  placeholder={p.placeholder}
                  className="w-full rounded-xl border border-[#d8cbb5] px-4 py-2.5 text-sm outline-none focus:border-[#25D366]"
                />
              </div>
            ))}

            {/* Preview */}
            <div className="rounded-xl bg-[#dcf8c6] px-4 py-3 text-sm text-[#07111d]">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#1a9e4a]">Vista previa</p>
              {selected.preview(paramValues)}
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !phone.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 text-sm font-bold text-white transition hover:bg-[#1da851] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {sending ? 'Enviando...' : 'Enviar plantilla'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
