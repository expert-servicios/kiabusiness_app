import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.join(process.cwd(), 'app/api/admin/quotes/route.ts'), 'utf8');

describe('admin quote company resolution', () => {
  it('does not read active_company_id from the client profile', () => {
    expect(source).not.toContain('active_company_id');
  });
});
