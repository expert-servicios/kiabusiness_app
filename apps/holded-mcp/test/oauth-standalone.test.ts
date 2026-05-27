import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPkcePair,
  startTestServer,
  withHoldedFetchMock,
  withVerifactuF1Mock,
} from './helpers.ts';

const STANDALONE_ENV = {
  EXPERT_OAUTH_BRIDGE_ENABLED: '0',
  EXPERT_CENTRAL_REGISTRY_ENABLED: '0',
};

test('standalone OAuth authorize renders local consent screen without bridge', async () => {
  const runtime = await startTestServer(STANDALONE_ENV);

  try {
    const state = `"><script>alert(1)</script>`;
    const response = await fetch(
      `${runtime.baseUrl}/oauth/authorize?response_type=code&client_id=test&redirect_uri=${encodeURIComponent(
        'https://claude.ai/api/mcp/auth_callback'
      )}&state=${encodeURIComponent(state)}`,
      { redirect: 'manual' }
    );

    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /Conecta Holded con Claude/i);
    assert.doesNotMatch(html, /"><script>alert\(1\)<\/script>/);
  } finally {
    await runtime.close();
  }
});

test('standalone OAuth validates Holded API key before issuing a code', async () => {
  const runtime = await startTestServer(STANDALONE_ENV);
  const restoreFetch = withHoldedFetchMock(false);

  try {
    const response = await fetch(`${runtime.baseUrl}/oauth/authorize`, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: 'client-invalid',
        redirect_uri: 'https://claude.ai/api/mcp/auth_callback',
        response_type: 'code',
        state: 'state-invalid',
        holded_api_key: 'invalid-key',
        personal_email: 'demo@example.com',
        accepted_terms: '1',
        accepted_privacy: '1',
      }),
    });

    assert.equal(response.status, 400);
    assert.equal(response.headers.get('location'), null);
    assert.match(await response.text(), /API key no es valida|API key invalida/i);
  } finally {
    restoreFetch();
    await runtime.close();
  }
});

test('standalone OAuth can issue a code without EXPERT central registry', async () => {
  const runtime = await startTestServer(STANDALONE_ENV);
  const f1 = withVerifactuF1Mock({ ok: true, userId: 'unused-user', tenantId: 'unused-tenant' });

  try {
    const pkce = buildPkcePair();
    const registerResponse = await fetch(`${runtime.baseUrl}/oauth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_name: 'Standalone test',
        redirect_uris: ['https://claude.ai/api/mcp/auth_callback'],
      }),
    });
    const client = (await registerResponse.json()) as Record<string, string>;

    const authorizeResponse = await fetch(`${runtime.baseUrl}/oauth/authorize`, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: client.client_id,
        redirect_uri: 'https://claude.ai/api/mcp/auth_callback',
        response_type: 'code',
        state: 'state-standalone',
        scope: 'holded:read holded:write',
        holded_api_key: 'apikey-real',
        personal_email: 'demo@example.com',
        accepted_terms: '1',
        accepted_privacy: '1',
        code_challenge: pkce.challenge,
        code_challenge_method: 'S256',
      }),
    });

    assert.equal(authorizeResponse.status, 302);
    assert.equal(f1.calls.length, 0);
    const location = authorizeResponse.headers.get('location');
    assert.ok(location);
    const callbackUrl = new URL(location);
    assert.ok(callbackUrl.searchParams.get('code'));
    assert.equal(callbackUrl.searchParams.get('state'), 'state-standalone');
  } finally {
    f1.restore();
    await runtime.close();
  }
});
