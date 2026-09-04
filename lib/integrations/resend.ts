import { Resend } from 'resend';
import { appendExpertProfessionalSignature } from '@/lib/email/layout';

type ResendSend = Resend['emails']['send'];

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is required');
  }

  const client = new Resend(apiKey);
  const originalSend = client.emails.send.bind(client.emails);

  client.emails.send = ((
    payload: Parameters<ResendSend>[0],
    options?: Parameters<ResendSend>[1],
  ) => {
    const normalizedPayload =
      'html' in payload && typeof payload.html === 'string'
        ? { ...payload, html: appendExpertProfessionalSignature(payload.html) }
        : payload;

    return originalSend(normalizedPayload, options);
  }) as ResendSend;

  return client;
}
