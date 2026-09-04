import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const modal = fs.readFileSync(path.join(process.cwd(), 'components/admin/NuevaCotizacionModal.tsx'), 'utf8');

describe('quote company selector UI', () => {
  it('shows zero-company warning and explicit entity choices', () => {
    expect(modal).toContain('Este cliente no tiene ninguna entidad fiscal vinculada.');
    expect(modal).toContain('Entidad contratante *');
    expect(modal).toContain('selectedCompanyId === company.id');
  });
});
