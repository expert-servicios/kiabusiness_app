import type { KiaAvatarState } from './kia-avatar-state';

export const KIA_AVATAR_MOTIONS = [
  'static',
  'thinking',
  'confirm',
  'celebrate',
  'attention',
] as const;

export type KiaAvatarMotion = (typeof KIA_AVATAR_MOTIONS)[number];

const STATE_MOTION: Partial<Record<KiaAvatarState, KiaAvatarMotion>> = {
  pensando: 'thinking',
  exito: 'confirm',
  celebracion: 'celebrate',
  aviso: 'attention',
  alerta_fiscal: 'attention',
};

/**
 * Presentation-only motion resolver.
 *
 * Repeated chat-message avatars keep `animateOnChange=false`, so they always
 * remain static. Only persistent KIA surfaces may opt into motion.
 */
export function resolveKiaAvatarMotion(
  state: KiaAvatarState,
  animateOnChange: boolean,
): KiaAvatarMotion {
  if (!animateOnChange) return 'static';
  return STATE_MOTION[state] ?? 'static';
}
