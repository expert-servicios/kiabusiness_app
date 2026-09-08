import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('KIA company tool isolation', () => {
  const executor = source('lib/ai/kia/kia-tool-executor.ts');
  const copilot = source('app/api/kia/copilot/route.ts');

  it('scopes expediente preflight data to the active company', () => {
    expect(executor).toContain("case 'get_user_expedientes'");
    expect(executor).toContain('const companyId = context.company?.id ?? null');
    expect(executor).toContain("if (companyId) query = query.eq('company_id', companyId)");
    expect(executor).toContain(".select('id, service, category, status, priority, due_date, opened_at, company_id')");
  });

  it('scopes pending documents to the active company', () => {
    expect(executor).toContain("case 'get_user_pending_docs'");
    expect(executor).toContain(".select('id, original_name, state, case_id, created_at, company_id')");
    expect(executor).toContain(".eq('state', 'pendiente')");
    expect(executor.match(/if \(companyId\) query = query\.eq\('company_id', companyId\)/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('tells the streaming copilot about included-entity coverage', () => {
    expect(copilot).toContain("context.company.coverageSource === 'included_entity'");
    expect(copilot).toContain('No necesita una segunda suscripción.');
    expect(copilot).toContain('no le propongas una segunda suscripción');
    expect(copilot).toContain('coveragePrimaryCompanyName');
    expect(copilot).toContain('coveragePlanName');
  });
});
