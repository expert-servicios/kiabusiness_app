import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const files = [
  'app/api/subscriptions/checkout/route.ts',
  'app/api/admin/subscriptions/send-link/route.ts',
  'app/api/services/checkout/route.ts',
  'lib/checkout/plan-mensual-guard.ts',
];

describe('company billing readiness is canonical for new billing', () => {
  for (const file of files) {
    it(file, () => {
      const source = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
      expect(source).not.toContain('profile.billing_ready');
      expect(source).not.toContain('clientProfile.billing_ready');
    });
  }
});
