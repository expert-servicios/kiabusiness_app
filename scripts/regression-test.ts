#!/usr/bin/env tsx
/**
 * Security regression tests for Sprint 2/3 hardening.
 * Tests: WhatsApp signature verification, redirect safety, Stripe idempotency guard.
 * Usage: npx tsx scripts/regression-test.ts
 */

import { createHmac } from 'crypto';
import { verifyMetaSignature } from '../lib/utils/verify-meta-signature';
import { safeRedirectPath } from '../lib/utils/safe-redirect';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED   = '\x1b[31m';
const BOLD  = '\x1b[1m';

let passed = 0;
let failed = 0;

function assert(label: string, actual: unknown, expected: unknown) {
  const ok = actual === expected;
  if (ok) {
    console.log(`${GREEN}✓${RESET} ${label}`);
    passed++;
  } else {
    console.log(`${RED}✗${RESET} ${label}`);
    console.log(`  expected: ${JSON.stringify(expected)}`);
    console.log(`  actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

// ── WhatsApp HMAC signature verification ─────────────────────────────────────

console.log(`\n${BOLD}── WhatsApp signature verification ─────────────────────────────${RESET}`);

const TEST_SECRET = 'test_app_secret_1234';
const TEST_BODY   = '{"entry":[]}';

function makeSignature(secret: string, body: string): string {
  return 'sha256=' + createHmac('sha256', secret).update(body, 'utf8').digest('hex');
}

// Store original env and set test secret
const origSecret   = process.env.META_APP_SECRET;
const origNodeEnv  = process.env.NODE_ENV;

process.env.META_APP_SECRET = TEST_SECRET;
process.env.NODE_ENV = 'production';

assert(
  'valid signature accepted',
  verifyMetaSignature(TEST_BODY, makeSignature(TEST_SECRET, TEST_BODY)),
  true,
);

assert(
  'wrong signature rejected',
  verifyMetaSignature(TEST_BODY, makeSignature('wrong_secret', TEST_BODY)),
  false,
);

assert(
  'missing signature header rejected',
  verifyMetaSignature(TEST_BODY, null),
  false,
);

assert(
  'bad prefix rejected',
  verifyMetaSignature(TEST_BODY, 'md5=' + createHmac('sha256', TEST_SECRET).update(TEST_BODY).digest('hex')),
  false,
);

assert(
  'tampered body rejected',
  verifyMetaSignature('{"entry":[{"tampered":true}]}', makeSignature(TEST_SECRET, TEST_BODY)),
  false,
);

// No secret in dev → should pass (graceful skip)
process.env.META_APP_SECRET = '';
process.env.NODE_ENV = 'development';
assert(
  'missing secret in dev → allowed (graceful)',
  verifyMetaSignature(TEST_BODY, null),
  true,
);

// No secret in production → must reject
process.env.NODE_ENV = 'production';
assert(
  'missing secret in production → rejected',
  verifyMetaSignature(TEST_BODY, makeSignature(TEST_SECRET, TEST_BODY)),
  false,
);

// Restore env
process.env.META_APP_SECRET = origSecret;
process.env.NODE_ENV = origNodeEnv;

// ── Safe redirect path ────────────────────────────────────────────────────────

console.log(`\n${BOLD}── Safe redirect path (open-redirect guard) ────────────────────${RESET}`);

assert('null → /dashboard',        safeRedirectPath(null),                          '/dashboard');
assert('empty → /dashboard',       safeRedirectPath(''),                            '/dashboard');
assert('valid /admin',             safeRedirectPath('/admin'),                      '/admin');
assert('valid /admin/clientes',    safeRedirectPath('/admin/clientes'),             '/admin/clientes');
assert('query string preserved',   safeRedirectPath('/dashboard?ref=email'),        '/dashboard?ref=email');
assert(
  'external URL → /dashboard',
  safeRedirectPath('https://evil.example.com'),
  '/dashboard',
);
assert(
  'double-slash // → /dashboard',
  safeRedirectPath('//evil.example.com'),
  '/dashboard',
);
assert(
  'backslash → /dashboard',
  safeRedirectPath('/\\evil.example.com'),
  '/dashboard',
);
assert(
  'protocol-relative // → /dashboard',
  safeRedirectPath('//example.com/path'),
  '/dashboard',
);

// ── Stripe idempotency guard ──────────────────────────────────────────────────

console.log(`\n${BOLD}── Stripe event idempotency guard ──────────────────────────────${RESET}`);

// The guard condition: code === '23505' means duplicate PK — skip.
// Test the detection logic directly (no DB needed).
function isDuplicateEvent(error: { code?: string } | null): boolean {
  return error?.code === '23505';
}

assert('null error → not duplicate',            isDuplicateEvent(null),              false);
assert('code 23505 → duplicate detected',       isDuplicateEvent({ code: '23505' }), true);
assert('different code → not duplicate',        isDuplicateEvent({ code: '42501' }), false);
assert('empty object → not duplicate',          isDuplicateEvent({}),                false);

// ── Summary ───────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\n${BOLD}── Results ─────────────────────────────────────────────────────${RESET}`);
console.log(`${failed === 0 ? GREEN : RED}${passed}/${total} tests passed${RESET}\n`);

process.exit(failed > 0 ? 1 : 0);
