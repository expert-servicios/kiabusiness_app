export type CaseStatus =
  | 'nuevo'
  | 'pendiente_cliente'
  | 'en_revision'
  | 'listo_para_presentar'
  | 'presentado'
  | 'finalizado'
  | 'bloqueado';

export type CasePriority = 'baja' | 'media' | 'alta' | 'critica';

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  nuevo:                 'Nuevo',
  pendiente_cliente:     'Pendiente cliente',
  en_revision:           'En revisión',
  listo_para_presentar:  'Listo para presentar',
  presentado:            'Presentado',
  finalizado:            'Finalizado',
  bloqueado:             'Bloqueado',
};

export const CASE_PRIORITY_LABELS: Record<CasePriority, string> = {
  baja:    'Baja',
  media:   'Media',
  alta:    'Alta',
  critica: 'Crítica',
};

// Transiciones permitidas. key = estado actual, value = estados a los que puede ir.
export const ALLOWED_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  nuevo:                ['pendiente_cliente', 'en_revision', 'bloqueado'],
  pendiente_cliente:    ['en_revision', 'bloqueado'],
  en_revision:          ['pendiente_cliente', 'listo_para_presentar', 'bloqueado'],
  listo_para_presentar: ['presentado', 'en_revision', 'bloqueado'],
  presentado:           ['finalizado', 'bloqueado'],
  finalizado:           [],
  bloqueado:            ['nuevo', 'pendiente_cliente', 'en_revision', 'listo_para_presentar', 'presentado'],
};

// Transiciones que SOLO puede hacer un humano (nunca automáticas)
export const HUMAN_ONLY_TRANSITIONS: Array<{ from: CaseStatus; to: CaseStatus }> = [
  { from: 'listo_para_presentar', to: 'presentado' },
  { from: 'presentado',           to: 'finalizado' },
];

export function canTransition(from: CaseStatus, to: CaseStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isHumanOnlyTransition(from: CaseStatus, to: CaseStatus): boolean {
  return HUMAN_ONLY_TRANSITIONS.some((t) => t.from === from && t.to === to);
}

export function isTerminalStatus(status: CaseStatus): boolean {
  return status === 'finalizado';
}

export function isActiveStatus(status: CaseStatus): boolean {
  return status !== 'finalizado' && status !== 'bloqueado';
}
