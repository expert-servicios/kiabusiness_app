import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyRecaptchaToken } from '@/lib/utils/recaptcha';

describe('verifyRecaptchaToken', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('fails closed in production when RECAPTCHA_SECRET_KEY is missing', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RECAPTCHA_SECRET_KEY', '');

    await expect(verifyRecaptchaToken({ token: 'token', action: 'contact' })).resolves.toMatchObject({
      ok: false,
      reason: 'not_configured',
    });
  });

  it('skips verification in local development when the secret is missing', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('RECAPTCHA_SECRET_KEY', '');

    await expect(verifyRecaptchaToken({ token: 'token', action: 'contact' })).resolves.toMatchObject({
      ok: true,
      skipped: true,
      reason: 'not_configured',
    });
  });

  it('rejects a missing token when configured', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RECAPTCHA_SECRET_KEY', 'secret');

    await expect(verifyRecaptchaToken({ token: '', action: 'contact' })).resolves.toMatchObject({
      ok: false,
      reason: 'missing_token',
    });
  });

  it('accepts a valid response with the expected action and score', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RECAPTCHA_SECRET_KEY', 'secret');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, score: 0.9, action: 'contact' }),
    }));

    await expect(verifyRecaptchaToken({ token: 'token', action: 'contact' })).resolves.toMatchObject({
      ok: true,
      score: 0.9,
      action: 'contact',
    });
  });
});
