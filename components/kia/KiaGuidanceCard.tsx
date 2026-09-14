'use client';

import { KiaAvatar } from './KiaAvatar';
import type { KiaAvatarState } from '@/lib/ai/kia/kia-avatar-state';

export interface KiaGuidanceCardProps {
  state: KiaAvatarState;
  title: string;
  message: string;
  eyebrow?: string;
  className?: string;
  compact?: boolean;
  animateOnChange?: boolean;
}

/**
 * Lightweight presentation surface for contextual KIA guidance outside chat.
 *
 * The caller must derive `state` from trusted UI/backend state. This component
 * never calls the LLM, executes tools, changes permissions or infers business
 * facts from free text.
 */
export function KiaGuidanceCard({
  state,
  title,
  message,
  eyebrow = 'KIA · Tu copiloto',
  className = '',
  compact = false,
  animateOnChange = false,
}: KiaGuidanceCardProps) {
  return (
    <aside
      aria-label="Orientación de KIA"
      data-kia-guidance-state={state}
      className={`flex items-center gap-4 rounded-2xl border border-[#d8cbb5] bg-[#fffdf8] ${compact ? 'p-4' : 'p-5'} ${className}`}
    >
      <KiaAvatar
        state={state}
        size={compact ? 'md' : 'lg'}
        decorative
        animateOnChange={animateOnChange}
      />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#c88b25]">{eyebrow}</p>
        <p className="mt-1 text-sm font-semibold text-[#07111d]">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-[#29384a]/75">{message}</p>
      </div>
    </aside>
  );
}

export default KiaGuidanceCard;
