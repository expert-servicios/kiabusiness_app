import type { KiaDecision } from './kia-output-schema';

export const KIA_AVATAR_STATES = [
  'bienvenida',
  'ayuda',
  'explicacion',
  'confianza',
  'pensando',
  'aviso',
  'alerta_fiscal',
  'empatia',
  'exito',
  'seguimiento',
  'duda',
  'celebracion',
] as const;

export type KiaAvatarState = (typeof KIA_AVATAR_STATES)[number];

export const KIA_MVP_AVATAR_STATES = [
  'ayuda',
  'explicacion',
  'pensando',
  'aviso',
  'empatia',
  'exito',
] as const satisfies readonly KiaAvatarState[];

export const KIA_AVATAR_LABELS: Record<KiaAvatarState, string> = {
  bienvenida: 'Bienvenida',
  ayuda: 'Ayuda',
  explicacion: 'Explicación',
  confianza: 'Confianza',
  pensando: 'Pensando',
  aviso: 'Aviso',
  alerta_fiscal: 'Alerta fiscal',
  empatia: 'Empatía',
  exito: 'Éxito',
  seguimiento: 'Seguimiento',
  duda: 'Duda',
  celebracion: 'Celebración',
};

/**
 * Sprint 1 ships six production assets. Future states intentionally alias to
 * the closest approved MVP asset so API/UI contracts can stay stable while the
 * full visual set is prepared.
 */
export const KIA_AVATAR_ASSET_PATHS: Record<KiaAvatarState, string> = {
  bienvenida: '/avatars/kia/kia-ayuda.webp',
  ayuda: '/avatars/kia/kia-ayuda.webp',
  explicacion: '/avatars/kia/kia-explicacion.webp',
  confianza: '/avatars/kia/kia-explicacion.webp',
  pensando: '/avatars/kia/kia-pensando.webp',
  aviso: '/avatars/kia/kia-aviso.webp',
  alerta_fiscal: '/avatars/kia/kia-aviso.webp',
  empatia: '/avatars/kia/kia-empatia.webp',
  exito: '/avatars/kia/kia-exito.webp',
  seguimiento: '/avatars/kia/kia-explicacion.webp',
  duda: '/avatars/kia/kia-ayuda.webp',
  celebracion: '/avatars/kia/kia-exito.webp',
};

const EXPLANATION_INTENTS = new Set<KiaDecision['intent']>([
  'service_selection',
  'viability',
  'readiness',
  'case_status',
  'accounting_summary',
  'document_classification',
  'company_data_resolve',
  'report_request',
  'export_report',
]);

const EMPATHY_PATTERNS = [
  /\bestoy preocupad[oa]\b/i,
  /\bme preocupa\b/i,
  /\bestoy agobiad[oa]\b/i,
  /\bno entiendo nada\b/i,
  /\bestoy bloquead[oa]\b/i,
  /\bme siento bloquead[oa]\b/i,
];

export interface KiaAvatarResolutionInput {
  decision: KiaDecision;
  userMessage?: string | null;
}

/**
 * Presentation-only resolver. Critical structured signals always beat softer
 * emotional/contextual cues. It must not mutate KiaDecision or execute tools.
 */
export function resolveKiaAvatarState({
  decision,
  userMessage,
}: KiaAvatarResolutionInput): KiaAvatarState {
  if (
    decision.requiresManualReview ||
    decision.nextAction === 'needs_review' ||
    decision.warnings.length > 0 ||
    decision.intent === 'anomaly_review'
  ) {
    return 'aviso';
  }

  if (
    decision.intent === 'company_data_confirm' ||
    decision.nextAction === 'show_report_link'
  ) {
    return 'exito';
  }

  if (
    decision.nextAction === 'ask_one_question' ||
    decision.missingData.length > 0
  ) {
    return 'ayuda';
  }

  if (userMessage && EMPATHY_PATTERNS.some((pattern) => pattern.test(userMessage))) {
    return 'empatia';
  }

  if (EXPLANATION_INTENTS.has(decision.intent)) {
    return 'explicacion';
  }

  return 'ayuda';
}

export function getKiaLoadingAvatarState(): KiaAvatarState {
  return 'pensando';
}
