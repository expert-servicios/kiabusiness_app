import { createHmac, timingSafeEqual } from 'crypto';

const META_SIGNATURE_PREFIX = 'sha256=';

export function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.META_APP_SECRET?.trim();

  if (!appSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[WhatsApp webhook] META_APP_SECRET not configured');
      return false;
    }
    return true;
  }

  if (!signatureHeader?.startsWith(META_SIGNATURE_PREFIX)) {
    return false;
  }

  const receivedSignature = signatureHeader.slice(META_SIGNATURE_PREFIX.length);
  if (!/^[a-f0-9]{64}$/i.test(receivedSignature)) {
    return false;
  }

  const expectedSignature = createHmac('sha256', appSecret)
    .update(rawBody, 'utf8')
    .digest('hex');

  const expected = Buffer.from(expectedSignature, 'hex');
  const received = Buffer.from(receivedSignature, 'hex');
  return expected.length === received.length && timingSafeEqual(expected, received);
}
