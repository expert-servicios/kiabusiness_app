import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Client 360 contextual operations', () => {
  const cockpit = source('app/(protected)/admin/clientes/[id]/ClientOnboardingCockpit.tsx');
  const empresas = source('app/(protected)/admin/empresas/page.tsx');
  const subscriptions = source('app/(protected)/admin/suscripciones/page.tsx');
  const holdedRoute = source('app/api/admin/clientes/[id]/holded/route.ts');
  const holdedPanel = source('app/(protected)/admin/clientes/[id]/integraciones/ClientHoldedAdminPanel.tsx');
  const clientHoldedRoute = source('app/api/integrations/holded/connect/route.ts');

  it('routes company, subscription and Holded actions with client context', () => {
    expect(cockpit).toContain('/admin/empresas?clientId=');
    expect(cockpit).toContain('/admin/suscripciones?clientId=');
    expect(cockpit).toContain(`/admin/clientes/${'${clientId}'}/integraciones`);
    expect(empresas).toContain("params.get('clientId')");
    expect(empresas).toContain("params.get('companyId')");
    expect(subscriptions).toContain('params.clientId');
    expect(subscriptions).toContain('params.companyId');
  });

  it('keeps the customer Holded endpoint membership guard unchanged', () => {
    expect(clientHoldedRoute).toContain(".eq('profile_id', user.id)");
    expect(clientHoldedRoute).toContain('No tienes acceso a esta empresa');
  });

  it('requires staff and verifies the target company belongs to the target client', () => {
    expect(holdedRoute).toContain('requireStaff(request)');
    expect(holdedRoute).toContain(".from('profile_companies')");
    expect(holdedRoute).toContain(".eq('profile_id', clientId)");
    expect(holdedRoute).toContain(".eq('company_id', companyId)");
    expect(holdedRoute).toContain('La empresa no está vinculada a este cliente');
  });

  it('requires explicit admin-side client authorization before persisting a new key', () => {
    expect(holdedRoute).toContain('consentConfirmed: z.literal(true)');
    expect(holdedRoute).toContain("consent_version: 'admin-client-360-v1'");
    expect(holdedPanel).toContain('Confirmo que el cliente ha autorizado la conexión');
  });

  it('encrypts secrets and only exposes the safe last-four identifier', () => {
    expect(holdedRoute).toContain('encryptSecret(parsed.data.apiKey)');
    expect(holdedRoute).toContain(".from('client_integration_secrets')");
    expect(holdedRoute).toContain("select('encrypted_api_key')");
    expect(holdedRoute).toContain('decryptSecret(secret.encrypted_api_key)');
    const safeColumns = (holdedRoute.match(/const SAFE_COLUMNS = '([^']+)'/)?.[1] ?? '').split(',');
    expect(safeColumns).not.toContain('encrypted_api_key');
    expect(safeColumns).not.toContain('api_key');
    expect(safeColumns).toContain('api_key_last4');
  });

  it('disconnects by deleting the secret while preserving a revoked audit row', () => {
    expect(holdedRoute).toContain(".from('client_integration_secrets').delete()");
    expect(holdedRoute).toContain("status: 'revoked'");
    expect(holdedRoute).toContain("action: 'holded.admin_disconnected'");
  });

  it('tests a stored credential server-side without sending it back to the browser', () => {
    expect(holdedRoute).toContain("action: z.literal('test_stored')");
    expect(holdedRoute).toContain('createHoldedClientFromRawKey(decryptSecret(secret.encrypted_api_key)).testConnection()');
    expect(holdedPanel).toContain("action: 'test_stored'");
  });
});
