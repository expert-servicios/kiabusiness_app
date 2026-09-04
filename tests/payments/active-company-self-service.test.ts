import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

for (const route of ['app/api/subscriptions/checkout/route.ts', 'app/api/services/checkout/route.ts']) {
  describe(route, () => {
    const source = fs.readFileSync(path.join(process.cwd(), route), 'utf8');
    it('uses active_company_id only in the authenticated self-service context', () => {
      expect(source).toContain('profile.active_company_id');
      expect(source).toContain(".eq('profile_id', user.id)");
      expect(source).toContain(".eq('company_id', companyId)");
    });
  });
}
