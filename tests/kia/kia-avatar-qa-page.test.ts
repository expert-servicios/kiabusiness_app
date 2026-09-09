import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA avatar QA gallery', () => {
  const page = source('app/(protected)/admin/kia-avatar-qa/page.tsx');
  const adminLayout = source('app/(protected)/admin/layout.tsx');

  it('lives under the protected admin layout', () => {
    expect(adminLayout).toContain("if (!user) redirect('/auth/login')");
    expect(adminLayout).toContain("profile?.role !== 'admin'");
    expect(adminLayout).toContain("profile?.role !== 'owner'");
  });

  it('renders the canonical state list and supports replay without backend calls', () => {
    expect(page).toContain('KIA_AVATAR_STATES.map');
    expect(page).toContain('Repetir animaciones');
    expect(page).toContain('setReplayKey');
    expect(page).toContain('animateResponse={!thinking}');
    expect(page).toContain('animateOnChange={thinking}');
    expect(page).not.toContain('fetch(');
  });

  it('documents reduced-motion expectations for visual QA', () => {
    expect(page).toContain('reducir movimiento');
    expect(page).toContain('one-shot');
    expect(page).toContain('Pensando');
  });
});
