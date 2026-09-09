import type { KiaDecision } from './kia-output-schema';
import type { KiaPresentationContext } from './kia-presentation-context';

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

/**
 * Some KiaDecision warnings are backend trace/repair markers rather than a
 * user-facing risk. Treating every one as `aviso` made real case-status and
 * readiness responses look alarming even when nothing was wrong.
 *
 * This allowlist is deliberately narrow. Unknown warnings remain visible as
 * `aviso`; security, tax-review, tool-loop and judge warnings are not ignored.
 */
const PRESENTATION_NEUTRAL_WARNING_PATTERNS = [
  /^backend_policy_override_case_status$/,
  /^backend_policy_override_viability$/,
  /^backend_policy_override_holded_readiness$/,
  /^user_message_language_repaired_by_backend$/,
  /^extra_question_marks_repaired_by_backend$/,
  /^taskType corrected by backend$/,
  /^contactStatus corrected by backend$/,
  /^Possible repeated phrasing detected\b/,
];

function hasPresentationWarning(warnings: string[]): boolean {
  return warnings.some((warning) =>
    !PRESENTATION_NEUTRAL_WARNING_PATTERNS.some((pattern) => pattern.test(warning)),
  );
}

export interface KiaAvatarResolutionInput {
  decision: KiaDecision;
  userMessage?: string | null;
  /**
   * Optional trusted server context. The resolver never derives these signals
   * from browser input, user wording or model prose.
   */
  presentationContext?: KiaPresentationContext | null;
}

/**
 * Presentation-only resolver. Critical structured signals always beat softer
 * emotional/contextual cues. It must not mutate KiaDecision or execute tools.
 *
 * Reserved states (`alerta_fiscal`, `confianza`, `celebracion`) are reachable
 * only through trusted KiaPresentationContext signals. Arbitrary wording and
 * model confidence are never enough to select them.
 */
export function resolveKiaAvatarState({
  decision,
  userMessage,
  presentationContext,
}: KiaAvatarResolutionInput): KiaAvatarState {
  if (
    decision.requiresManualReview ||
    decision.nextAction === 'needs_review' ||
    decision.intent === 'anomaly_review'
  ) {
    return 'aviso';
  }

  if (presentationContext?.fiscalRisk) {
    return 'alerta_fiscal';
  }

  if (hasPresentationWarning(decision.warnings)) {
    return 'aviso';
  }

  const needsClarification =
    decision.nextAction === 'ask_one_question' ||
    decision.missingData.length > 0;

  // Positive structured presentation is suppressed while KIA is explicitly
  // asking for missing information, avoiding a celebratory/confident face next
  // to a clarification request.
  if (!needsClarification && presentationContext?.milestone) {
    return 'celebracion';
  }

  if (
    decision.intent === 'company_data_confirm' ||
    decision.nextAction === 'show_report_link'
  ) {
    return 'exito';
  }

  if (!needsClarification && presentationContext?.assurance) {
    return 'confianza';
  }

  if (needsClarification) {
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
