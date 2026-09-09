import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA response-scoped motion lifecycle', () => {
  const widget = source('components/KiaCopilotWidget.tsx');
  const motionDoc = source('docs/kia-avatar-response-sprint4.md');

  it('keeps the panel subtree mounted so reopening cannot remount historical avatars', () => {
    expect(widget).toContain("${open ? 'flex' : 'hidden'} flex-col");
    expect(widget).toContain('aria-hidden={!open}');
    expect(widget).not.toContain('{open && (');
  });

  it('enables one-shot motion only after the newest assistant response is visible', () => {
    expect(widget).toContain('animatedMessageIds');
    expect(widget).toContain("scrollIntoView({ behavior: 'auto' })");
    expect(widget).toContain('window.requestAnimationFrame');
    expect(widget).toContain('animateResponse={animatedMessageIds.has(msg.id)}');
  });

  it('documents persistent-surface suppression and response-scoped one-shots', () => {
    expect(motionDoc).toContain('semantic one-shot motions (`confirm`, `celebrate`, `attention`) are suppressed there');
    expect(motionDoc).toContain('newly visible assistant response uses `animateResponse`');
    expect(motionDoc).toContain('closing and reopening it does not remount historical message avatars');
    expect(motionDoc).toContain('scrolled into view and then enabled for response motion');
  });
});
