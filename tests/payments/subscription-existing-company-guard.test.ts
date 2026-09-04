import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

for (const route of [
  'app/api/subscriptions/checkout/route.ts',
  'app/api/admin/subscriptions/send-link/route.ts',
]) {
  describe(route, () => {
    const source = fs.readFileSync(path.join(process.cwd(), route), 'utf8');
    it('blocks a second live subscription for the same company', () => {
      expect(source).toContain(".in('status', ['active', 'trialing', 'past_due', 'unpaid'])");
      expect(source).toContain("code: 'subscription_exists'");
    });
  });
}
