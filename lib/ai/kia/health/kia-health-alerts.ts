import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { createNba } from '@/lib/nba/create-nba';
import { redactJson } from '../kia-redaction';
import type { KiaBehaviorAnomalyInput, KiaHealthRunResult } from './kia-health-types';

export async function saveKiaBehaviorAnomalies(anomalies: KiaBehaviorAnomalyInput[]): Promise<void> {
  if (anomalies.length === 0) return;
  const admin = getSupabaseAdmin();
  const rows = anomalies.map((anomaly) => ({
    source: anomaly.source,
    severity: anomaly.severity,
    anomaly_type: anomaly.anomalyType,
    title: anomaly.title,
    description: anomaly.description,
    related_decision_log_id: anomaly.relatedDecisionLogId ?? null,
    related_conversation_id: anomaly.relatedConversationId ?? null,
    metadata: redactJson(anomaly.metadata ?? {}),
  }));

  const { error } = await admin.from('kia_behavior_anomalies').insert(rows);
  if (error) console.error('[Kia health anomalies]', error.message);

  if (process.env.KIA_HEALTH_ALERTS_ENABLED?.toLowerCase() !== 'false') {
    await createCriticalHealthNbas(anomalies);
  }
}

export async function createCriticalHealthNbas(anomalies: KiaBehaviorAnomalyInput[]): Promise<void> {
  for (const anomaly of anomalies.filter((item) => item.severity === 'critical')) {
    await createNba({
      action_type: 'kia_health_critical_anomaly',
      priority: 'critica',
      title: anomaly.title,
      description: anomaly.description,
      metadata: {
        source: anomaly.source,
        anomaly_type: anomaly.anomalyType,
        ...redactJson(anomaly.metadata ?? {}),
      },
    });
  }
}

export async function maybeAutoDisableStructuredAi(run: KiaHealthRunResult): Promise<void> {
  if (process.env.KIA_HEALTH_AUTO_DISABLE_STRUCTURED_AI?.toLowerCase() !== 'true') return;
  if (run.status !== 'failed') return;
  console.error('[Kia health] critical failure detected; auto-disable requested, but runtime env flags cannot be mutated safely from app code.', {
    runId: run.id,
    summary: run.summary,
  });
}

export function detectKiaProductionAnomalies(decisionLog: {
  id?: string | null;
  task_type?: string | null;
  channel?: string | null;
  output_json?: unknown;
  confidence?: number | null;
  requires_manual_review?: boolean | null;
  tool_calls?: unknown;
  error?: string | null;
  created_at?: string | null;
}): KiaBehaviorAnomalyInput[] {
  const output = decisionLog.output_json && typeof decisionLog.output_json === 'object'
    ? decisionLog.output_json as Record<string, unknown>
    : {};
  const text = JSON.stringify(redactJson(output)).toLowerCase();
  const nextAction = String(output.nextAction ?? output.next_action ?? '');
  const intent = String(output.intent ?? '');
  const rules = Array.isArray(output.rulesApplied) ? output.rulesApplied.map(String) : [];
  const confidence = typeof output.confidence === 'number' ? output.confidence : decisionLog.confidence ?? null;
  const anomalies: KiaBehaviorAnomalyInput[] = [];

  const push = (severity: KiaBehaviorAnomalyInput['severity'], anomalyType: KiaBehaviorAnomalyInput['anomalyType'], title: string, description: string) => {
    anomalies.push({
      source: 'production',
      severity,
      anomalyType,
      title,
      description,
      relatedDecisionLogId: decisionLog.id ?? null,
      metadata: {
        taskType: decisionLog.task_type,
        channel: decisionLog.channel,
        intent,
        nextAction,
        confidence,
      },
    });
  };

  if (decisionLog.error) push('high', 'provider_failure', 'Kia provider/decision error', decisionLog.error);
  if (confidence !== null && confidence < 0.45) push('medium', 'excessive_needs_review', 'Kia confidence baja', `Confidence ${confidence}`);
  if (/api key|clave api|token/.test(text) && !/panel seguro|portal seguro|no me envies|no env[ií]es/.test(text)) {
    push('critical', 'api_key_leak_risk', 'Riesgo de API key por canal inseguro', 'La respuesta menciona API key/token sin redirigir al panel seguro.');
  }
  if ((/holded|plan mensual|plan avanzado|plan colaborativo/.test(text) || decisionLog.task_type === 'readiness_reasoning') && nextAction === 'run_viability') {
    push('critical', 'wrong_flow', 'Holded/Planes usando viabilidad', 'Holded y planes mensuales deben usar readiness/conexión, no viabilidad jurídica.');
  }
  if (nextAction === 'send_checkout_link' && !rules.includes('checkout_requires_profile_and_billing') && !rules.includes('checkout_requirements_validated')) {
    push('critical', 'forbidden_checkout', 'Checkout sin reglas de validación', 'Kia propone checkout sin evidenciar login/perfil/billing/readiness.');
  }
  if (/he presentado|ya he presentado|present[eé] tu iva|present[eé] el impuesto/.test(text)) {
    push('critical', 'tax_presentation_claim', 'Kia afirma presentación fiscal', 'La IA no puede presentar impuestos automáticamente.');
  }
  if (/modifiqu[eé] contabilidad|he cambiado el asiento|actualic[eé] holded|borre el movimiento/.test(text)) {
    push('critical', 'unsafe_accounting_action', 'Acción contable insegura', 'La IA no puede modificar contabilidad sin backend y validación profesional.');
  }
  if (/possible repeated phrasing|anti_repetition_checked|respuesta parecida|demasiado parecida/.test(text)) {
    push('medium', 'repeated_answer_loop', 'Kia puede estar repitiendo respuestas', 'El sistema anti-repetición detectó una respuesta demasiado parecida al historial.');
  }

  return anomalies;
}
