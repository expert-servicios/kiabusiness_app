export const CASE_STATE_LABELS: Record<string, string> = {
  nuevo: 'Nuevo',
  docs_pendientes: 'Documentacion pendiente',
  docs_recibidos: 'Documentacion recibida',
  en_tramitacion: 'En tramitacion',
  pendiente_externo: 'Pendiente de organismo',
  resolucion_recibida: 'Resolucion recibida',
  entregado: 'Entregado',
  finalizado: 'Finalizado',
  pendiente_documentacion: 'Pendiente documentacion',
  en_revision: 'En revision',
  en_proceso: 'En proceso',
  presentado: 'Presentado'
};

export const CASE_PROGRESS_STATES = [
  'nuevo',
  'docs_pendientes',
  'docs_recibidos',
  'en_tramitacion',
  'pendiente_externo',
  'resolucion_recibida',
  'entregado',
  'finalizado'
] as const;

export const CASE_LEGACY_TO_CURRENT_STATE: Record<string, string> = {
  pendiente_documentacion: 'docs_pendientes',
  en_revision: 'docs_recibidos',
  en_proceso: 'en_tramitacion',
  presentado: 'pendiente_externo'
};

export const CASE_ACTION_GROUPS = {
  pendingDocs: ['docs_pendientes', 'pendiente_documentacion'],
  docsToReview: ['docs_recibidos', 'en_revision'],
  inProgress: ['en_tramitacion', 'en_proceso'],
  waitingExternal: ['pendiente_externo', 'presentado'],
  readyToDeliver: ['resolucion_recibida'],
  delivered: ['entregado'],
  closed: ['finalizado']
} as const;

export function countCaseStates(counts: Record<string, number>, states: readonly string[]) {
  return states.reduce((total, state) => total + (counts[state] ?? 0), 0);
}

export function normalizeCaseStateForProgress(state: string) {
  return CASE_LEGACY_TO_CURRENT_STATE[state] ?? state;
}

export function isOperationallyActiveCase(state: string) {
  return ![...CASE_ACTION_GROUPS.delivered, ...CASE_ACTION_GROUPS.closed].some((finalState) => finalState === state);
}
