/**
 * Server-side secret encryption using AES-256-GCM.
 *
 * Used exclusively for storing client API keys (e.g. Holded) in client_integrations.
 * The decrypted key is NEVER sent to the frontend, logged, or stored in plain text.
 *
 * Required env var:
 *   SECRET_ENCRYPTION_KEY — 64 hex chars (32 bytes). Generate with:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * Ciphertext format: {iv_hex}:{authTag_hex}:{ciphertext_hex}
 * All three parts are required for decryption (authenticated encryption).
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM       = 'aes-256-gcm';
const KEY_BYTES       = 32;  // 256-bit key
const IV_BYTES        = 16;  // 128-bit IV
const AUTH_TAG_BYTES  = 16;  // 128-bit GCM auth tag
const SEPARATOR       = ':';

function loadKey(): Buffer {
  const hex = process.env.SECRET_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error(
      '[encryption] SECRET_ENCRYPTION_KEY is not set. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  const buf = Buffer.from(hex, 'hex');
  if (buf.length !== KEY_BYTES) {
    throw new Error(
      `[encryption] SECRET_ENCRYPTION_KEY must be ${KEY_BYTES * 2} hex chars (${KEY_BYTES} bytes), got ${buf.length} bytes.`
    );
  }
  return buf;
}

/**
 * Encrypts a plaintext string.
 * Returns a colon-separated string: iv:authTag:ciphertext (all hex-encoded).
 * Safe to store in the database.
 */
export function encryptSecret(value: string): string {
  const key    = loadKey();
  const iv     = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_BYTES });

  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag   = cipher.getAuthTag();

  return [
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(SEPARATOR);
}

/**
 * Decrypts a ciphertext produced by encryptSecret.
 * Throws if the ciphertext is malformed or authentication fails (tampered data).
 * NEVER call from client-side code — this is a server-only function.
 */
export function decryptSecret(ciphertext: string): string {
  const key    = loadKey();
  const parts  = ciphertext.split(SEPARATOR);

  if (parts.length !== 3) {
    throw new Error('[encryption] Invalid ciphertext format — expected iv:authTag:data');
  }

  const [ivHex, authTagHex, encryptedHex] = parts as [string, string, string];

  const iv        = Buffer.from(ivHex,        'hex');
  const authTag   = Buffer.from(authTagHex,   'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_BYTES });
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

/**
 * Returns the last N characters of the plaintext for display (e.g. "••••a3f9").
 * Call with the RAW key before encrypting, not with the ciphertext.
 */
export function keyLast4(rawKey: string): string {
  return rawKey.slice(-4);
}
