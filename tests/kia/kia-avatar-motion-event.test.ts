import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA event-scoped avatar motion', () => {
  const avatar = source('components/kia/KiaAvatar.tsx');
  const widget = source('components/KiaCopilotWidget.tsx');

  it('suppresses semantic one-shot motion when a persistent surface merely remounts', () => {
    expect(avatar).toContain('motionEventChanged = true');
    expect(avatar).toContain('ONE_SHOT_MOTIONS.has(resolvedMotion) && !motionEventChanged');
    expect(avatar).toContain("? 'static'");
  });

  it('derives a stable visual event key in the persistent widget parent', () => {
    expect(widget).toContain('const currentKiaVisualEventKey = loading');
    expect(widget).toContain('const previousKiaVisualEventRef = useRef(currentKiaVisualEventKey)');
    expect(widget).toContain('const kiaVisualEventChanged = previousKiaVisualEventRef.current !== currentKiaVisualEventKey');
    expect(widget).toContain('previousKiaVisualEventRef.current = currentKiaVisualEventKey');
  });

  it('passes the same event-change guard to header and launcher avatars', () => {
    const matches = widget.match(/motionEventChanged=\{kiaVisualEventChanged\}/g) ?? [];
    expect(matches).toHaveLength(2);
  });

  it('keeps thinking as an activity loop while message avatars stay static', () => {
    expect(avatar).toContain("const resolvedMotion = resolveKiaAvatarMotion(state, animateOnChange)");
    expect(widget).toContain('<KiaAvatar state="pensando" size="xs" className="mt-0.5" />');
  });
});
