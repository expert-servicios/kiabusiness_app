import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHmac } from 'crypto';
import { verifyMetaSignature } from '@/lib/security/webhook-signature';

const SECRET = 'test_secret_abc123';
const BODY   = '{"object":"whatsapp_business_account"}';

function makeSignature(body: string, secret: string): string {
  const hash = createHmac('sha256', secret).update(body, 'utf8').digest('hex');
  return `sha256=${hash}`;
}

describe('verifyMetaSignature', () => {
  beforeEach(() => {
    // Run tests as if in production so fail-closed behavior is active
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('META_APP_SECRET', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('acepta firma valida', () => {
    const sig = makeSignature(BODY, SECRET);
    expect(verifyMetaSignature(BODY, sig, SECRET)).toBe(true);
  });

  it('rechaza firma incorrecta', () => {
    const sig = makeSignature(BODY, 'wrong_secret');
    expect(verifyMetaSignature(BODY, sig, SECRET)).toBe(false);
  });

  it('rechaza firma ausente (null)', () => {
    expect(verifyMetaSignature(BODY, null, SECRET)).toBe(false);
  });

  it('rechaza firma sin prefijo sha256=', () => {
    const hash = createHmac('sha256', SECRET).update(BODY, 'utf8').digest('hex');
    expect(verifyMetaSignature(BODY, hash, SECRET)).toBe(false);
  });

  it('rechaza firma con formato hex invalido', () => {
    expect(verifyMetaSignature(BODY, 'sha256=not-a-hex-string!!', SECRET)).toBe(false);
  });

  it('rechaza firma valida con body modificado', () => {
    const sig = makeSignature(BODY, SECRET);
    expect(verifyMetaSignature(BODY + ' ', sig, SECRET)).toBe(false);
  });

  it('falla cerrado en produccion si META_APP_SECRET no esta configurado', () => {
    // NODE_ENV=production, no secret passed, no env var set
    expect(verifyMetaSignature(BODY, makeSignature(BODY, SECRET))).toBe(false);
  });

  it('permite en desarrollo si META_APP_SECRET no esta configurado', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(verifyMetaSignature(BODY, null)).toBe(true);
  });
});
