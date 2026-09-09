'use client';

import Image from 'next/image';
import {
  KIA_AVATAR_ASSET_PATHS,
  KIA_AVATAR_LABELS,
  type KiaAvatarState,
} from '@/lib/ai/kia/kia-avatar-state';
import styles from './KiaAvatar.module.css';

const SIZE_MAP = {
  xs: 28,
  sm: 34,
  md: 44,
  lg: 56,
} as const;

type KiaAvatarSize = keyof typeof SIZE_MAP;

export interface KiaAvatarProps {
  state?: KiaAvatarState;
  size?: KiaAvatarSize;
  className?: string;
  priority?: boolean;
  alt?: string;
  /**
   * Avatars inside chat messages are presentation-only because the adjacent
   * response text carries the full meaning. This avoids repetitive screen
   * reader announcements such as "KIA — Ayuda" before every message.
   */
  decorative?: boolean;
  /**
   * Applies a short entrance transition when the state image changes. Keep it
   * off for repeated message avatars; header/launcher can opt in. The CSS
   * module disables the animation under prefers-reduced-motion.
   *
   * When the opted-in surface is in `pensando`, the outer avatar gets a very
   * small, slow vertical movement to indicate activity. Message avatars remain
   * static and the loading row already provides a spinner/text status.
   */
  animateOnChange?: boolean;
}

export function KiaAvatar({
  state = 'ayuda',
  size = 'sm',
  className = '',
  priority = false,
  alt,
  decorative = true,
  animateOnChange = false,
}: KiaAvatarProps) {
  const pixels = SIZE_MAP[size];
  const label = KIA_AVATAR_LABELS[state];
  const accessibleLabel = alt ?? `KIA — ${label}`;
  const thinkingMotion = animateOnChange && state === 'pensando';

  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden rounded-full border border-[#e8e0d4] bg-[#f5f1eb] ${thinkingMotion ? styles.thinkingMotion : ''} ${className}`}
      style={{ width: pixels, height: pixels }}
      data-kia-avatar-state={state}
      data-kia-avatar-motion={thinkingMotion ? 'thinking' : 'static'}
      aria-hidden={decorative || undefined}
      title={decorative ? undefined : accessibleLabel}
    >
      <Image
        key={animateOnChange ? state : 'static'}
        src={KIA_AVATAR_ASSET_PATHS[state]}
        alt={decorative ? '' : accessibleLabel}
        width={pixels}
        height={pixels}
        priority={priority}
        className={`h-full w-full object-cover ${animateOnChange ? styles.stateTransition : ''}`}
      />
    </span>
  );
}

export default KiaAvatar;
