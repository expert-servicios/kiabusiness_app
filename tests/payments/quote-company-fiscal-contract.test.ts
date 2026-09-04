import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.join(process.cwd(), 'app/api/admin/quotes/route.ts'), 'utf8');

describe('quote contracting fiscal identity', () => {
  it('builds contract identity from selected company', () => {
    expect(source).toContain('const contractingName = contractingCompany.razon_social!');
    expect(source).toContain('const contractingTaxId = contractingCompany.cif_nif!');
    expect(source).toContain('clientCompany: contractingName');
    expect(source).toContain('clientTaxId: contractingTaxId');
  });
});
