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
 * Sprint 2 ships one approved asset for every stable visual state. Critical
 * states can exist in the visual contract without being auto-selected until a
 * sufficiently strong structured signal exists in KiaDecision.
 */
export const KIA_AVATAR_ASSET_PATHS: Record<KiaAvatarState, string> = {
  bienvenida: '/avatars/kia/kia-bienvenida.webp',
  ayuda: '/avatars/kia/kia-ayuda.webp',
  explicacion: '/avatars/kia/kia-explicacion.webp',
  confianza: '/avatars/kia/kia-confianza.webp',
  pensando: '/avatars/kia/kia-pensando.webp',
  aviso: '/avatars/kia/kia-aviso.webp',
  alerta_fiscal: '/avatars/kia/kia-alerta-fiscal.webp',
  empatia: '/avatars/kia/kia-empatia.webp',
  exito: '/avatars/kia/kia-exito.webp',
  seguimiento: '/avatars/kia/kia-seguimiento.webp',
  duda: '/avatars/kia/kia-duda.webp',
  celebracion: '/avatars/kia/kia-celebracion.webp',
};

const EXPLANATION_INTENTS = new Set<KiaDecision['intent']>([
  'service_selection',
  'viability',
  'readiness',
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
 *
 * `alerta_fiscal` and `celebracion` deliberately remain reserved in Sprint 2:
 * the current KiaDecision contract does not expose a dedicated, authoritative
 * fiscal-risk or exceptional-milestone signal. They must never be inferred
 * from arbitrary wording alone.
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
    return 'duda';
  }

  if (userMessage && EMPATHY_PATTERNS.some((pattern) => pattern.test(userMessage))) {
    return 'empatia';
  }

  if (decision.intent === 'greeting') {
    return 'bienvenida';
  }

  if (decision.intent === 'case_status') {
    return 'seguimiento';
  }

  if (EXPLANATION_INTENTS.has(decision.intent)) {
    return 'explicacion';
  }

  return 'ayuda';
}

export function getKiaLoadingAvatarState(): KiaAvatarState {
  return 'pensando';
}
