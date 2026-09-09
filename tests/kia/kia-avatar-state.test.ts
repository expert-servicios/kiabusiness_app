import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getKiaLoadingAvatarState,
  KIA_AVATAR_ASSET_PATHS,
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

  it('uses ayuda when Kia must ask for missing data', () => {
    expect(resolveKiaAvatarState({
      decision: decision({ nextAction: 'ask_one_question' }),
    })).toBe('ayuda');

    expect(resolveKiaAvatarState({
      decision: decision({ missingData: ['tax_id'] }),
    })).toBe('ayuda');
  });

  it('uses empatia for a narrow set of user distress signals', () => {
    expect(resolveKiaAvatarState({
      decision: decision(),
      userMessage: 'Estoy preocupado porque no entiendo nada.',
    })).toBe('empatia');
  });

  it('uses explicacion for reasoning and status intents', () => {
    expect(resolveKiaAvatarState({
      decision: decision({ intent: 'readiness' }),
    })).toBe('explicacion');

    expect(resolveKiaAvatarState({
      decision: decision({ intent: 'case_status' }),
    })).toBe('explicacion');
  });

  it('falls back to ayuda and uses pensando only for loading UI', () => {
    expect(resolveKiaAvatarState({ decision: decision() })).toBe('ayuda');
    expect(getKiaLoadingAvatarState()).toBe('pensando');
  });

  it('aliases all future states to an available Sprint 1 asset path', () => {
    expect(KIA_AVATAR_ASSET_PATHS.bienvenida).toBe(KIA_AVATAR_ASSET_PATHS.ayuda);
    expect(KIA_AVATAR_ASSET_PATHS.alerta_fiscal).toBe(KIA_AVATAR_ASSET_PATHS.aviso);
    expect(KIA_AVATAR_ASSET_PATHS.seguimiento).toBe(KIA_AVATAR_ASSET_PATHS.explicacion);
    expect(KIA_AVATAR_ASSET_PATHS.duda).toBe(KIA_AVATAR_ASSET_PATHS.ayuda);
    expect(KIA_AVATAR_ASSET_PATHS.celebracion).toBe(KIA_AVATAR_ASSET_PATHS.exito);
  });
});

describe('KIA copilot avatar integration', () => {
  const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
  const api = source('app/api/ai/kia/route.ts');
  const widget = source('components/KiaCopilotWidget.tsx');

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
  });
});
