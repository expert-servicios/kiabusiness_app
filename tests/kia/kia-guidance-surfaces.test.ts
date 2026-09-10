import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  resolveCaseListGuidance,
  resolveOnboardingGuidance,
} from '@/lib/ai/kia/kia-surface-guidance';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('KIA contextual guidance surfaces', () => {
  const card = source('components/kia/KiaGuidanceCard.tsx');
  const casesPage = source('app/(protected)/dashboard/expedientes/page.tsx');
  const onboardingPage = source('app/(protected)/dashboard/onboarding/page.tsx');

  it('keeps the guidance card presentation-only', () => {
    expect(card).toContain('data-kia-guidance-state={state}');
    expect(card).toContain('<KiaAvatar');
    expect(card).not.toContain("fetch('");
    expect(card).not.toContain('runKiaDecision');
    expect(card).not.toContain('getSupabaseAdmin');
  });

  it('maps expediente counts deterministically', () => {
    expect(resolveCaseListGuidance(2, 1).state).toBe('seguimiento');
    expect(resolveCaseListGuidance(0, 3).state).toBe('exito');
    expect(resolveCaseListGuidance(0, 0).state).toBe('ayuda');
  });

  it('keeps onboarding precedence safe', () => {
    expect(resolveOnboardingGuidance({ step: 'done', loading: false, hasError: true, companySkipped: false }).state).toBe('aviso');
    expect(resolveOnboardingGuidance({ step: 'done', loading: true, hasError: false, companySkipped: false }).state).toBe('pensando');
    expect(resolveOnboardingGuidance({ step: 'done', loading: false, hasError: false, companySkipped: false }).state).toBe('exito');
    expect(resolveOnboardingGuidance({ step: 'company', loading: false, hasError: false, companySkipped: true }).state).toBe('duda');
    expect(resolveOnboardingGuidance({ step: 'company', loading: false, hasError: false, companySkipped: false }).state).toBe('explicacion');
    expect(resolveOnboardingGuidance({ step: 'profile', loading: false, hasError: false, companySkipped: false }).state).toBe('bienvenida');
  });

  it('wires expediente guidance without adding an LLM call', () => {
    expect(casesPage).toContain('resolveCaseListGuidance(active.length, closed.length)');
    expect(casesPage).toContain('<KiaGuidanceCard');
    expect(casesPage).not.toContain('/api/ai/kia');
    expect(casesPage).not.toContain('runKiaDecision');
  });

  it('wires onboarding guidance to local UI state only', () => {
    expect(onboardingPage).toContain('resolveOnboardingGuidance({');
    expect(onboardingPage).toContain('hasError: Boolean(error)');
    expect(onboardingPage).toContain('companySkipped: companyData.skip');
    expect(onboardingPage).toContain('animateOnChange');
    expect(onboardingPage).not.toContain('/api/ai/kia');
    expect(onboardingPage).not.toContain('runKiaDecision');
  });
});
