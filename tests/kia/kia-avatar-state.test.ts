import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getKiaLoadingAvatarState,
  KIA_AVATAR_ASSET_PATHS,
  KIA_AVATAR_STATES,
  resolveKiaAvatarState,
} from '@/lib/ai/kia/kia-avatar-state';
import type { KiaDecision } from '@/lib/ai/kia/kia-output-schema';

function decision(overrides: Partial<KiaDecision> = {}): KiaDecision {
  return {
    version: '1.0',
    taskType: 'waba_reply',
    contactStatus: 'client',
    intent: 'unknown',
    userMessage: '',
    nextAction: 'reply_only',
    quickReplies: [],
    toolRequests: [],
    dataToSave: {},
    confidence: 0.9,
    requiresMeeting: false,
    requiresManualReview: false,
    decisionSummary: 'test',
    rulesApplied: ['test'],
    missingData: [],
    warnings: [],
    ...overrides,
  };
}

describe('KIA contextual avatar state resolver', () => {
  it('prioritizes manual review over positive presentation', () => {
    expect(resolveKiaAvatarState({
      decision: decision({
        intent: 'company_data_confirm',
        requiresManualReview: true,
      }),
    })).toBe('aviso');
  });

  it('uses aviso for structured warnings and anomaly review', () => {
    expect(resolveKiaAvatarState({
      decision: decision({ warnings: ['needs attention'] }),
    })).toBe('aviso');

    expect(resolveKiaAvatarState({
      decision: decision({ intent: 'anomaly_review' }),
    })).toBe('aviso');
  });

  it('uses exito only for explicit successful operational signals', () => {
    expect(resolveKiaAvatarState({
      decision: decision({ intent: 'company_data_confirm' }),
    })).toBe('exito');

    expect(resolveKiaAvatarState({
      decision: decision({ nextAction: 'show_report_link' }),
    })).toBe('exito');
  });

  it('uses duda when KIA must ask for missing data', () => {
    expect(resolveKiaAvatarState({
      decision: decision({ nextAction: 'ask_one_question' }),
    })).toBe('duda');

    expect(resolveKiaAvatarState({
      decision: decision({ missingData: ['tax_id'] }),
    })).toBe('duda');
  });

  it('uses empatia for a narrow set of user distress signals', () => {
    expect(resolveKiaAvatarState({
      decision: decision(),
      userMessage: 'Estoy preocupado porque no entiendo nada.',
    })).toBe('empatia');
  });

  it('uses bienvenida and seguimiento only from structured intents', () => {
    expect(resolveKiaAvatarState({
      decision: decision({ intent: 'greeting' }),
    })).toBe('bienvenida');

    expect(resolveKiaAvatarState({
      decision: decision({ intent: 'case_status' }),
    })).toBe('seguimiento');
  });

  it('uses explicacion for reasoning intents', () => {
    expect(resolveKiaAvatarState({
      decision: decision({ intent: 'readiness' }),
    })).toBe('explicacion');
  });

  it('does not infer alerta_fiscal from arbitrary fiscal wording', () => {
    expect(resolveKiaAvatarState({
      decision: decision(),
      userMessage: 'Tengo un plazo fiscal y me preocupa una posible sanción.',
    })).toBe('empatia');

    expect(resolveKiaAvatarState({
      decision: decision({ warnings: ['fiscal deadline requires review'] }),
      userMessage: 'Tengo un plazo fiscal.',
    })).toBe('aviso');
  });

  it('falls back to ayuda and uses pensando only for loading UI', () => {
    expect(resolveKiaAvatarState({ decision: decision() })).toBe('ayuda');
    expect(getKiaLoadingAvatarState()).toBe('pensando');
  });

  it('maps all 12 stable states to distinct production assets', () => {
    const paths = KIA_AVATAR_STATES.map((state) => KIA_AVATAR_ASSET_PATHS[state]);
    expect(new Set(paths).size).toBe(KIA_AVATAR_STATES.length);
    expect(KIA_AVATAR_ASSET_PATHS.alerta_fiscal).toBe('/avatars/kia/kia-alerta-fiscal.webp');
    expect(KIA_AVATAR_ASSET_PATHS.seguimiento).toBe('/avatars/kia/kia-seguimiento.webp');
    expect(KIA_AVATAR_ASSET_PATHS.celebracion).toBe('/avatars/kia/kia-celebracion.webp');
  });
});

describe('KIA copilot avatar integration', () => {
  const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
  const api = source('app/api/ai/kia/route.ts');
  const widget = source('components/KiaCopilotWidget.tsx');
  const avatar = source('components/kia/KiaAvatar.tsx');
  const avatarStyles = source('components/kia/KiaAvatar.module.css');

  it('resolves avatar state server-side and persists it in session JSON', () => {
    expect(api).toContain('resolveKiaAvatarState({');
    expect(api).toContain('avatar_state: avatarState');
    expect(api).toContain('avatarState,');
  });

  it('renders contextual assistant avatars, thinking and error states', () => {
    expect(widget).toContain("avatarState : data.avatarState ?? (data.error ? 'aviso' : 'ayuda')");
    expect(widget).toContain('<KiaAvatar state={msg.avatarState ?? \'ayuda\'}');
    expect(widget).toContain('<KiaAvatar state="pensando"');
    expect(widget).toContain("avatarState: 'aviso'");
    expect(widget).toContain("avatarState: 'bienvenida'");
  });

  it('keeps repeated chat avatars decorative by default for screen readers', () => {
    expect(avatar).toContain('decorative = true');
    expect(avatar).toContain('aria-hidden={decorative || undefined}');
    expect(avatar).toContain("alt={decorative ? '' : accessibleLabel}");
  });

  it('limits state transitions and thinking motion to opted-in persistent surfaces', () => {
    expect(avatar).toContain('animateOnChange = false');
    expect(avatar).toContain("const thinkingMotion = animateOnChange && state === 'pensando'");
    expect(avatar).toContain("data-kia-avatar-motion={thinkingMotion ? 'thinking' : 'static'}");
    expect(widget).toContain('priority animateOnChange');
    expect(widget).toContain('size="lg" animateOnChange');
    expect(widget).toContain('<KiaAvatar state="pensando" size="xs" className="mt-0.5" />');
    expect(avatarStyles).toContain('@keyframes kiaAvatarThinking');
    expect(avatarStyles).toContain('.thinkingMotion');
    expect(avatarStyles).toContain('1800ms ease-in-out infinite');
    expect(avatarStyles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(avatarStyles).toContain('.stateTransition,');
    expect(avatarStyles).toContain('.thinkingMotion');
    expect(avatarStyles).toContain('animation: none');
  });

  it('exposes the chat as an accessible non-modal dialog and live message log', () => {
    expect(widget).toContain('role="dialog"');
    expect(widget).toContain('aria-label="KIA copiloto"');
    expect(widget).toContain('role="log"');
    expect(widget).toContain('aria-live="polite"');
    expect(widget).toContain('aria-expanded={open}');
    expect(widget).toContain('aria-controls="kia-copilot-panel"');
    expect(widget).toContain('aria-label="Escribe tu consulta a KIA"');
  });
});
