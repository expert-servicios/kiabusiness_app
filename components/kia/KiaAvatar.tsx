'use client';

import Image from 'next/image';
import {
  KIA_AVATAR_ASSET_PATHS,
  KIA_AVATAR_LABELS,
  type KiaAvatarState,
} from '@/lib/ai/kia/kia-avatar-state';
import {
  resolveKiaAvatarMotion,
  type KiaAvatarMotion,
} from '@/lib/ai/kia/kia-avatar-motion';
import styles from './KiaAvatar.module.css';

const SIZE_MAP = {
  xs: 28,
  sm: 34,
  md: 44,
  lg: 56,
} as const;

type KiaAvatarSize = keyof typeof SIZE_MAP;

const MOTION_CLASSES: Record<Exclude<KiaAvatarMotion, 'static'>, string> = {
  thinking: styles.thinkingMotion,
  confirm: styles.confirmMotion,
  celebrate: styles.celebrateMotion,
  attention: styles.attentionMotion,
};

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
   * Enables the short state transition and state-aware microanimation on
   * persistent surfaces only. Repeated message avatars keep this disabled.
   * All motion is removed under prefers-reduced-motion.
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
  const motion = resolveKiaAvatarMotion(state, animateOnChange);
  const motionClass = motion === 'static' ? '' : MOTION_CLASSES[motion];

  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden rounded-full border border-[#e8e0d4] bg-[#f5f1eb] ${motionClass} ${className}`}
      style={{ width: pixels, height: pixels }}
      data-kia-avatar-state={state}
      data-kia-avatar-motion={motion}
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
