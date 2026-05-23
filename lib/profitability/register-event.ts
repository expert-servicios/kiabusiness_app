import { getSupabaseAdmin } from '@/lib/integrations/supabase';

export type ProfitabilityEventType =
  | 'whatsapp_message_handled'
  | 'email_handled'
  | 'document_reviewed'
  | 'document_classified_manual'
  | 'case_status_changed'
  | 'form_submitted'
  | 'holded_sync_reviewed'
  | 'appointment_held'
  | 'tax_form_prepared'
  | 'tax_form_filed'
  | 'document_prepared'
  | 'client_call'
  | 'custom';

const DEFAULT_MINUTES: Record<ProfitabilityEventType, number> = {
  whatsapp_message_handled:    1,
  email_handled:               3,
  document_reviewed:           5,
  document_classified_manual:  8,
  case_status_changed:         2,
  form_submitted:              5,
  holded_sync_reviewed:       10,
  appointment_held:           30,
  tax_form_prepared:          45,
  tax_form_filed:             15,
  document_prepared:          20,
  client_call:                15,
  custom:                      0,
};

export interface RegisterEventParams {
  caseId: string;
  clientId?: string;
  serviceId: string;
  eventType: ProfitabilityEventType;
  source?: 'auto' | 'manual';
  operator?: 'kia' | 'admin' | 'system';
  customMinutes?: number;
  metadata?: Record<string, unknown>;
}

export async function registerProfitabilityEvent(params: RegisterEventParams): Promise<void> {
  const admin = getSupabaseAdmin();

  const minutes =
    params.eventType === 'custom'
      ? (params.customMinutes ?? 0)
      : (params.customMinutes ?? DEFAULT_MINUTES[params.eventType]);

  if (minutes <= 0) return;

  const { error } = await admin.from('service_profitability_events').insert({
    case_id:           params.caseId,
    client_id:         params.clientId ?? null,
    service_id:        params.serviceId,
    event_type:        params.eventType,
    estimated_minutes: minutes,
    source:            params.source ?? 'auto',
    operator:          params.operator ?? null,
    metadata:          params.metadata ?? {},
  });

  if (error) console.error('[registerProfitabilityEvent]', params.eventType, error.message);
}
