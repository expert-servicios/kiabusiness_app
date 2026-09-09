import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getKiaPageContext } from '@/lib/ai/kia/kia-page-context';

describe('KIA proactive page context', () => {
  it('selects the most specific company creation context first', () => {
    const context = getKiaPageContext('/dashboard/empresa/nueva');
    expect(context.task).toBe('creating_company');
    expect(context.proactive).toContain('añadiendo una empresa');
    expect(context.quickReplies).toContain('Revisar datos de empresa');
  });

  it('maps reports, Holded, cases and subscriptions to bounded tasks', () => {
    expect(getKiaPageContext('/dashboard/informes/abc').task).toBe('viewing_report');
    expect(getKiaPageContext('/dashboard/informes').task).toBe('browsing_reports');
    expect(getKiaPageContext('/dashboard/integraciones/holded').task).toBe('holded_integration');
    expect(getKiaPageContext('/dashboard/expedientes/abc').task).toBe('viewing_case');
    expect(getKiaPageContext('/dashboard/expedientes').task).toBe('browsing_cases');
    expect(getKiaPageContext('/dashboard/suscripciones').task).toBe('viewing_subscriptions');
  });

  it('falls back safely outside known dashboard routes', () => {
    const context = getKiaPageContext('/admin/otra-cosa');
    expect(context.task).toBe('browsing_portal');
    expect(context.quickReplies.length).toBeGreaterThan(0);
  });
});

describe('canonical KIA page-context wiring', () => {
  const widget = readFileSync(resolve(process.cwd(), 'components/KiaCopilotWidget.tsx'), 'utf8');

  it('uses page context for the welcome state and sends currentTask to the server', () => {
    expect(widget).toContain("import { getKiaPageContext }");
    expect(widget).toContain('const pageContext = getKiaPageContext(pathname)');
    expect(widget).toContain('currentTask: pageContext.task');
    expect(widget).toContain('quickReplies: pageContext.quickReplies');
  });

  it('updates only the pristine welcome on navigation and preserves active conversations', () => {
    expect(widget).toContain("prev.length === 1 && prev[0]?.id === 'welcome'");
    expect(widget).toContain('return prev;');
  });
});
