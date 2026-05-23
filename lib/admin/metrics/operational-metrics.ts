import type { SupabaseClient } from '@supabase/supabase-js';

export interface OperationalMetrics {
  casesNuevo: number;
  casesPendienteCliente: number;
  casesEnRevision: number;
  casesListoParaPresentar: number;
  casesBloqueados: number;
  casesPresentadosMes: number;
  casesFinalizadosMes: number;
  tareasVencidas: number;
  tareasProximas7d: number;
  documentosPendientes: number;
}

export async function fetchOperationalMetrics(
  admin: SupabaseClient
): Promise<OperationalMetrics> {
  const now    = new Date();
  const today  = now.toISOString().split('T')[0];
  const in7d   = new Date(now.getTime() + 7  * 86_400_000).toISOString().split('T')[0];
  const ago30d = new Date(now.getTime() - 30 * 86_400_000).toISOString();

  const [
    cNuevo, cPendCliente, cRevision, cListo, cBloqueado,
    cPresentados, cFinalizados,
    tareasVencidas, tareasProximas,
    docsPendientes,
  ] = await Promise.all([
    admin.from('cases').select('id', { count: 'exact', head: true }).eq('status', 'nuevo'),
    admin.from('cases').select('id', { count: 'exact', head: true }).eq('status', 'pendiente_cliente'),
    admin.from('cases').select('id', { count: 'exact', head: true }).eq('status', 'en_revision'),
    admin.from('cases').select('id', { count: 'exact', head: true }).eq('status', 'listo_para_presentar'),
    admin.from('cases').select('id', { count: 'exact', head: true }).eq('status', 'bloqueado'),
    admin.from('cases').select('id', { count: 'exact', head: true }).eq('status', 'presentado').gte('updated_at', ago30d),
    admin.from('cases').select('id', { count: 'exact', head: true }).eq('status', 'finalizado').gte('updated_at', ago30d),
    admin.from('internal_tasks').select('id', { count: 'exact', head: true }).lt('due_date', today).neq('status', 'completada').neq('status', 'cancelada'),
    admin.from('internal_tasks').select('id', { count: 'exact', head: true }).gte('due_date', today).lte('due_date', in7d).eq('status', 'pendiente'),
    admin.from('document_classifications').select('id', { count: 'exact', head: true }).eq('status', 'needs_review'),
  ]);

  return {
    casesNuevo:              cNuevo.count        ?? 0,
    casesPendienteCliente:   cPendCliente.count  ?? 0,
    casesEnRevision:         cRevision.count     ?? 0,
    casesListoParaPresentar: cListo.count        ?? 0,
    casesBloqueados:         cBloqueado.count    ?? 0,
    casesPresentadosMes:     cPresentados.count  ?? 0,
    casesFinalizadosMes:     cFinalizados.count  ?? 0,
    tareasVencidas:          tareasVencidas.count ?? 0,
    tareasProximas7d:        tareasProximas.count ?? 0,
    documentosPendientes:    docsPendientes.count ?? 0,
  };
}
