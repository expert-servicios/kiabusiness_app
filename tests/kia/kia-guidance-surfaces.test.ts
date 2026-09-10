import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('KIA contextual guidance surfaces', () => {
  const card = source('components/kia/KiaGuidanceCard.tsx');
  const casesPage = source('app/(protected)/dashboard/expedientes/page.tsx');

  it('keeps the guidance card presentation-only', () => {
    expect(card).toContain('data-kia-guidance-state={state}');
    expect(card).toContain('<KiaAvatar');
    expect(card).not.toContain("fetch('");
    expect(card).not.toContain('runKiaDecision');
    expect(card).not.toContain('getSupabaseAdmin');
  });

  it('derives expediente guidance from authoritative case counts', () => {
    expect(casesPage).toContain("guidanceState = 'seguimiento'");
    expect(casesPage).toContain("guidanceState = 'exito'");
    expect(casesPage).toContain("let guidanceState: KiaAvatarState = 'ayuda'");
    expect(casesPage).toContain('active.length > 0');
    expect(casesPage).toContain('closed.length > 0');
    expect(casesPage).toContain('<KiaGuidanceCard');
  });

  it('does not add an LLM call to the expediente page', () => {
    expect(casesPage).not.toContain('/api/ai/kia');
    expect(casesPage).not.toContain('runKiaDecision');
  });
});
