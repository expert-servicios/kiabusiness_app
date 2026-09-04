import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const service = fs.readFileSync(path.join(process.cwd(), 'app/api/services/checkout/route.ts'), 'utf8');
const quote = fs.readFileSync(path.join(process.cwd(), 'app/api/admin/quotes/route.ts'), 'utf8');

describe('new checkout entity context smoke', () => {
  it('requires company context in both user and admin payment flows', () => {
    expect(service).toContain('company_id: companyId');
    expect(quote).toContain('company_id: companyId');
  });
});
