import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.join(process.cwd(), 'app/(protected)/admin/onboarding/page.tsx'), 'utf8');

describe('admin onboarding company forwarding', () => {
  it('forwards the same explicit company to subscription and quote endpoints', () => {
    const count = (source.match(/companyId: createdCompanyId \|\| undefined/g) ?? []).length;
    expect(count).toBeGreaterThanOrEqual(2);
    expect(source).toContain("fetch('/api/admin/subscriptions/send-link'");
    expect(source).toContain("fetch('/api/admin/quotes'");
  });
});
