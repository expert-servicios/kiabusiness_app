import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getKiaLoadingAvatarState,
  KIA_AVATAR_ASSET_PATHS,
  KIA_AVATAR_STATES,
  resolveKiaAvatarState,
} from '@/lib/ai/kia/kia-avatar-state';
import { resolveKiaAvatarMotion } from '@/lib/ai/kia/kia-avatar-motion';
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
  it('prioritizes manual review over positive and fiscal presentation', () => {
    expect(resolveKiaAvatarState({
      decision: decision({
        intent: 'company_data_confirm',
        requiresManualReview: true,
      }),
      presentationContext: {
        fiscalRisk: { severity: 'critical', code: 'filing_overdue', source: 'case' },
        milestone: { kind: 'case_completed', source: 'case' },
      },
    })).toBe('aviso');
  });

  it('uses alerta_fiscal only for an authoritative fiscal-risk signal', () => {
    expect(resolveKiaAvatarState({
      decision: decision(),
      presentationContext: {
        fiscalRisk: { severity: 'high', code: 'deadline_risk', source: 'readiness' },
      },
    })).toBe('alerta_fiscal');

    expect(resolveKiaAvatarState({
      decision: decision({ warnings: ['generic warning'] }),
      presentationContext: {
        fiscalRisk: { severity: 'critical', code: 'material_tax_anomaly', source: 'accounting' },
      },
    })).toBe('alerta_fiscal');
  });

  it('uses aviso for generic structured warnings and anomaly review', () => {
    expect(resolveKiaAvatarState({
      decision: decision({ warnings: ['needs attention'] }),
    })).toBe('aviso');

    expect(resolveKiaAvatarState({
      decision: decision({ intent: 'anomaly_review' }),
    })).toBe('aviso');
  });

  it('uses celebracion for an authoritative exceptional milestone', () => {
    expect(resolveKiaAvatarState({
      decision: decision(),
      presentationContext: {
        milestone: { kind: 'payment_confirmed', source: 'payment' },
      },
    })).toBe('celebracion');
  });

  it('suppresses positive presentation while asking for missing data', () => {
    expect(resolveKiaAvatarState({
      decision: decision({ missingData: ['tax_id'] }),
      presentationContext: {
        milestone: { kind: 'service_completed', source: 'service' },
        assurance: { kind: 'verified_data', source: 'company' },
      },
    })).toBe('duda');
  });

  it('uses exito for explicit successful operational signals', () => {
    expect(resolveKiaAvatarState({
      decision: decision({ intent: 'company_data_confirm' }),
    })).toBe('exito');

    expect(resolveKiaAvatarState({
      decision: decision({ nextAction: 'show_report_link' }),
    })).toBe('exito');
  });

  it('uses confianza only for authoritative assurance, never model confidence alone', () => {
    expect(resolveKiaAvatarState({
      decision: decision({ confidence: 1 }),
    })).toBe('ayuda');

    expect(resolveKiaAvatarState({
      decision: decision(),
      presentationContext: {
        assurance: { kind: 'authoritative_source', source: 'official_source' },
      },
    })).toBe('confianza');

    expect(resolveKiaAvatarState({
      decision: decision({ warnings: ['needs attention'] }),
      presentationContext: {
        assurance: { kind: 'validated_status', source: 'case' },
      },
    })).toBe('aviso');
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

  it('does not infer reserved states from arbitrary wording', () => {
    expect(resolveKiaAvatarState({
      decision: decision(),
      userMessage: 'Tengo un plazo fiscal y me preocupa una posible sanción.',
    })).toBe('empatia');

    expect(resolveKiaAvatarState({
      decision: decision({ warnings: ['fiscal deadline requires review'] }),
      userMessage: 'Tengo un plazo fiscal.',
    })).toBe('aviso');

    expect(resolveKiaAvatarState({
      decision: decision(),
      userMessage: 'Todo está perfecto, confirmado y terminado. ¡Celebremos!',
    })).toBe('ayuda');
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

describe('KIA avatar motion resolver', () => {
  it('keeps all message avatars static unless the surface explicitly opts in', () => {
    expect(resolveKiaAvatarMotion('pensando', false)).toBe('static');
    expect(resolveKiaAvatarMotion('celebracion', false)).toBe('static');
    expect(resolveKiaAvatarMotion('alerta_fiscal', false)).toBe('static');
  });

  it('maps only approved states to restrained motion profiles', () => {
    expect(resolveKiaAvatarMotion('pensando', true)).toBe('thinking');
    expect(resolveKiaAvatarMotion('exito', true)).toBe('confirm');
    expect(resolveKiaAvatarMotion('celebracion', true)).toBe('celebrate');
    expect(resolveKiaAvatarMotion('aviso', true)).toBe('attention');
    expect(resolveKiaAvatarMotion('alerta_fiscal', true)).toBe('attention');
    expect(resolveKiaAvatarMotion('ayuda', true)).toBe('static');
    expect(resolveKiaAvatarMotion('empatia', true)).toBe('static');
  });
});

describe('KIA copilot avatar integration', () => {
  const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
  const api = source('app/api/ai/kia/route.ts');
  const widget = source('components/KiaCopilotWidget.tsx');
  const avatar = source('components/kia/KiaAvatar.tsx');
  const avatarStyles = source('components/kia/KiaAvatar.module.css');
  const presentationContract = source('lib/ai/kia/kia-presentation-context.ts');

  it('resolves avatar state server-side and persists it in session JSON', () => {
    expect(api).toContain('resolveKiaAvatarState({');
    expect(api).toContain('avatar_state: avatarState');
    expect(api).toContain('avatarState,');
  });

  it('keeps structured presentation signals separate from the LLM KiaDecision schema', () => {
    expect(presentationContract).toContain('export interface KiaPresentationContext');
    expect(presentationContract).toContain('Browser input and arbitrary response text must never');
    expect(api).not.toContain('presentationContext: parsed.data');
  });

  it('renders contextual assistant avatars, thinking and error states', () => {
    expect(widget).toContain("avatarState : data.avatarState ?? (data.error ? 'aviso' : 'ayuda')");
    expect(widget).toContain("state={msg.avatarState ?? 'ayuda'}");
    expect(widget).toContain('animateResponse');
    expect(widget).toContain('<KiaAvatar state="pensando"');
    expect(widget).toContain("avatarState: 'aviso'");
    expect(widget).toContain("avatarState: 'bienvenida'");
  });

  it('keeps repeated chat avatars decorative by default for screen readers', () => {
    expect(avatar).toContain('decorative = true');
    expect(avatar).toContain('aria-hidden={decorative || undefined}');
    expect(avatar).toContain("alt={decorative ? '' : accessibleLabel}");
  });

  it('limits semantic motion to explicit persistent or response surfaces', () => {
    expect(avatar).toContain('animateOnChange = false');
    expect(avatar).toContain('animateResponse = false');
    expect(avatar).toContain('resolveKiaAvatarMotion(state, animateOnChange || animateResponse)');
    expect(avatar).toContain('ONE_SHOT_MOTIONS.has(resolvedMotion)');
    expect(avatar).toContain('data-kia-avatar-motion={motion}');
    expect(widget).toContain('priority');
    expect(widget).toContain('animateOnChange');
    expect(widget).toContain('size="lg"');
    expect(widget).toContain('animateResponse');
    expect(widget).toContain('<KiaAvatar state="pensando" size="xs" className="mt-0.5" />');
    expect(avatarStyles).toContain('@keyframes kiaAvatarThinking');
    expect(avatarStyles).toContain('@keyframes kiaAvatarConfirm');
    expect(avatarStyles).toContain('@keyframes kiaAvatarCelebrate');
    expect(avatarStyles).toContain('@keyframes kiaAvatarAttention');
    expect(avatarStyles).toContain('1800ms ease-in-out infinite');
    expect(avatarStyles).toContain('420ms ease-out 1');
    expect(avatarStyles).toContain('560ms cubic-bezier(0.2, 0.75, 0.3, 1) 1');
    expect(avatarStyles).toContain('320ms ease-out 1');
    expect(avatarStyles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(avatarStyles).toContain('.confirmMotion,');
    expect(avatarStyles).toContain('.celebrateMotion,');
    expect(avatarStyles).toContain('.attentionMotion');
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
