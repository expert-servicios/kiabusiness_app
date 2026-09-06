import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Cal.com webhook signature compatibility', () => {
  const route = source('app/api/webhooks/cal/route.ts');

  it('accepts the current raw HMAC digest and the legacy sha256= prefixed form', () => {
    expect(route).toContain("const digest = createHmac('sha256', secret).update(body).digest('hex')");
    expect(route).toContain("const received = header.startsWith('sha256=') ? header.slice(7) : header");
    expect(route).toContain('timingSafeEqual(a, b)');
    expect(route).not.toContain("const expected = 'sha256=' + createHmac");
  });
});
