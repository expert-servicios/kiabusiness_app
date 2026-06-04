import { createHmac, timingSafeEqual } from 'crypto';

const META_SIGNATURE_PREFIX = 'sha256=';

/**
 * Verifica la firma HMAC SHA-256 que Meta incluye en `x-hub-signature-256`.
 *
 * - Si META_APP_SECRET no está configurado en producción → falla cerrado (false).
 * - Si META_APP_SECRET no está configurado fuera de producción → permite (true) para desarrollo local.
 * - Si la firma es inválida o tiene formato incorrecto → false.
 */
export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret?: string
): boolean {
  const secret = (appSecret ?? process.env.META_APP_SECRET)?.trim();

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[webhook-signature] META_APP_SECRET not configured');
      return false;
    }
    return true; // allow in dev/test without secret configured
  }

  if (!signatureHeader?.startsWith(META_SIGNATURE_PREFIX)) {
    return false;
  }

  const receivedSignature = signatureHeader.slice(META_SIGNATURE_PREFIX.length);
  if (!/^[a-f0-9]{64}$/i.test(receivedSignature)) {
    return false;
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex');

  const expected = Buffer.from(expectedSignature, 'hex');
  const received = Buffer.from(receivedSignature, 'hex');

  return expected.length === received.length && timingSafeEqual(expected, received);
}
