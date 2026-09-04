import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.join(process.cwd(), 'app/api/services/checkout/route.ts'), 'utf8');

describe('one-time checkout persistence ordering', () => {
  it('persists checkout context before returning the Stripe URL', () => {
    const persistIndex = source.indexOf("from('checkout_sessions').insert");
    const returnIndex = source.indexOf('return NextResponse.json({ url: session.url, sessionId: session.id, companyId });');
    expect(persistIndex).toBeGreaterThan(0);
    expect(returnIndex).toBeGreaterThan(persistIndex);
  });
});
