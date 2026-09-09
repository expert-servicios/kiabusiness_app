import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA response-scoped avatar motion', () => {
  const avatar = source('components/kia/KiaAvatar.tsx');
  const widget = source('components/KiaCopilotWidget.tsx');

  it('suppresses semantic one-shot motion on persistent header and launcher surfaces', () => {
    expect(avatar).toContain('animateResponse = false');
    expect(avatar).toContain("ONE_SHOT_MOTIONS.has(resolvedMotion) ? 'static' : resolvedMotion");
    expect(widget).toContain('state={currentKiaState} size="sm" priority animateOnChange');
    expect(widget).toContain('state={currentKiaState} size="lg" animateOnChange');
  });

  it('plays one-shot motion on the assistant response avatar, which mounts once per message', () => {
    expect(widget).toContain('animateResponse');
    expect(avatar).toContain('animateOnChange || animateResponse');
    expect(avatar).toContain("resolvedMotion === 'thinking' ? 'static' : resolvedMotion");
  });

  it('keeps the continuous thinking loop only on persistent opted-in surfaces', () => {
    expect(avatar).toContain('resolveKiaAvatarMotion(state, animateOnChange || animateResponse)');
    expect(widget).toContain('<KiaAvatar state="pensando" size="xs" className="mt-0.5" />');
  });

  it('does not use render-time refs to decide whether motion should replay', () => {
    expect(widget).not.toContain('previousKiaVisualEventRef');
    expect(widget).not.toContain('kiaVisualEventChanged');
    expect(widget).not.toContain('motionEventChanged');
  });
});
