import type { SupabaseClient } from '@supabase/supabase-js';

export interface FiscalMetrics {
  clientesPlanMensual: number;
  holdedConectados: number;
  holdedConError: number;
  holdedSinSyncReciente: number;
  anomaliasCriticas: number;
  documentosContablesPendientes: number;
}

const DOC_CONTABLE_TYPES = ['factura_emitida', 'factura_recibida', 'excel_contable'];

export async function fetchFiscalMetrics(
  admin: SupabaseClient
): Promise<FiscalMetrics> {
  const ago7d = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const [
    planMensual, holdedOk, holdedErr, holdedSinSync,
    anomalias, docsContables,
  ] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('has_monthly_plan', true),
    admin.from('client_integrations').select('id', { count: 'exact', head: true }).eq('provider', 'holded').eq('status', 'active'),
    admin.from('client_integrations').select('id', { count: 'exact', head: true }).eq('provider', 'holded').eq('status', 'failed'),
    admin.from('client_integrations').select('id', { count: 'exact', head: true }).eq('provider', 'holded').eq('status', 'active').lt('last_sync_at', ago7d),
    admin.from('next_best_actions').select('id', { count: 'exact', head: true }).eq('action_type', 'review_anomaly').eq('priority', 'critica').eq('status', 'open'),
    admin.from('document_classifications').select('id', { count: 'exact', head: true }).in('detected_type', DOC_CONTABLE_TYPES).eq('status', 'needs_review'),
  ]);

  return {
    clientesPlanMensual:          planMensual.count    ?? 0,
    holdedConectados:             holdedOk.count       ?? 0,
    holdedConError:               holdedErr.count      ?? 0,
    holdedSinSyncReciente:        holdedSinSync.count  ?? 0,
    anomaliasCriticas:            anomalias.count      ?? 0,
    documentosContablesPendientes: docsContables.count ?? 0,
  };
}
