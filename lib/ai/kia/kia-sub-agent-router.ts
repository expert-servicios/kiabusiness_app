import type { KiaTaskType } from './kia-output-schema';

export interface KiaSubAgentProfile {
  id: string;
  systemPromptAddendum: string;
  preferredModel?: string;
  maxTokensOverride?: number;
}

const FISCAL_ADDENDUM = `
<sub_agent_fiscal>
Eres el sub-agente fiscal de Kia. Especialización:
- IRPF: residencia habitual, rentas extranjeras, IRNR, Modelo 151/Beckham, Modelo 720.
- IVA y autónomo: altas/bajas, trimestrales, modelos 303/390.
- Sociedad Limitada: actas, impuesto de sociedades, dividendos, modelo 200.
- Extranjería fiscal: certificados de residencia, no-residentes, convenioss doble imposición.
Reglas adicionales:
- Si el cliente menciona un modelo fiscal específico, cítalo siempre.
- Si hay plazo inminente (menos de 7 días), URGENTE en decisionSummary y confidence >= 0.9.
- No presentes cifras fiscales como definitivas; añade "pendiente revisión profesional".
</sub_agent_fiscal>
`.trim();

const HOLDED_ADDENDUM = `
<sub_agent_holded>
Eres el sub-agente Holded/contabilidad de Kia. Especialización:
- Onboarding Holded: plan inicial, pack starter, alta de empresa, plan de cuentas.
- Migración Holded: desde A3, Sage, Excel; cierre de ejercicio previo.
- Formación Holded: módulos disponibles, horas contratadas, seguimiento.
- Diagnóstico de conexión: permisos, errores de sincronización, estado de integración.
- Resumen contable: anomalías, facturas pendientes, conciliación bancaria.
Reglas adicionales:
- Si la empresa no tiene Holded conectado, siempre ofrece el enlace de conexión.
- Si hay anomalías críticas en accounting context, menciónalas brevemente.
- Cita el nombre comercial de la empresa si está disponible en el contexto.
</sub_agent_holded>
`.trim();

const CASE_ADDENDUM = `
<sub_agent_case>
Eres el sub-agente de gestión de expedientes de Kia. Especialización:
- Estado de expedientes: tramitación, documentación pendiente, resolución.
- Documentos: qué falta, qué está pendiente de revisión, qué está aprobado.
- Plazos: fechas de presentación, renovaciones, caducidades.
- Extranjería: TIE, arraigo, reagrupación, nacionalidad — state machine de pasos.
Reglas adicionales:
- Si hay expedientes abiertos en el contexto, referéncialos siempre por nombre de servicio.
- Si faltan documentos (documents.pendingCount > 0), menciona el count y pide los docs.
- Si el estado es "bloqueado", urgente en decisionSummary.
- No inventes fechas de resolución; di "pendiente de resolución administrativa".
</sub_agent_case>
`.trim();

const SUB_AGENT_MAP: Record<string, KiaSubAgentProfile> = {
  fiscal: {
    id: 'fiscal',
    systemPromptAddendum: FISCAL_ADDENDUM,
    maxTokensOverride: 1100,
  },
  holded: {
    id: 'holded',
    systemPromptAddendum: HOLDED_ADDENDUM,
    maxTokensOverride: 1000,
  },
  case: {
    id: 'case',
    systemPromptAddendum: CASE_ADDENDUM,
    maxTokensOverride: 1000,
  },
};

const INTENT_TO_SUB_AGENT: Record<string, string> = {
  viability:              'fiscal',
  readiness:              'holded',
  connect_holded:         'holded',
  accounting_summary:     'holded',
  anomaly_review:         'holded',
  case_status:            'case',
  send_documents:         'case',
  document_classification: 'case',
};

const TASK_TYPE_TO_SUB_AGENT: Record<KiaTaskType, string | null> = {
  viability_reasoning:         'fiscal',
  accounting_anomaly_review:   'holded',
  company_status_summary:      'holded',
  readiness_reasoning:         'holded',
  document_classification:     'case',
  document_extraction:         'case',
  next_best_action:            null,
  checkout_decision:           null,
  lead_client_decision:        null,
  waba_reply:                  null,
  admin_ai_compose:            null,
};

export function selectSubAgentProfile(params: {
  taskType: KiaTaskType;
  detectedIntent?: string;
}): KiaSubAgentProfile | null {
  const byIntent = params.detectedIntent ? INTENT_TO_SUB_AGENT[params.detectedIntent] : null;
  const byTask = TASK_TYPE_TO_SUB_AGENT[params.taskType];
  const profileId = byIntent ?? byTask;
  return profileId ? (SUB_AGENT_MAP[profileId] ?? null) : null;
}
