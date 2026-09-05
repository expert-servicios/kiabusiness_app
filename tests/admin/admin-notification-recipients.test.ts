import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Admin notification recipients', () => {
  const helper = source('lib/admin/admin-notification-recipients.ts');
  const calWebhook = source('app/api/webhooks/cal/route.ts');
  const completeRoute = source('app/api/dashboard/post-compra/complete/route.ts');

  it('combines configured recipients with active Admin and owner accounts', () => {
    expect(helper).toContain("process.env.ADMIN_EMAILS ?? 'info@expertconsulting.es'");
    expect(helper).toContain(".in('role', ['admin', 'owner'])");
    expect(helper).toContain(".neq('status', 'inactive')");
    expect(helper).toContain('listAllAuthUsers()');
  });

  it('deduplicates recipients case-insensitively', () => {
    expect(helper).toContain('new Map<string, string>()');
    expect(helper).toContain('recipients.set(email.toLowerCase(), email)');
    expect(helper).toContain('return [...recipients.values()]');
  });

  it('uses active Admin recipient resolution for onboarding booking and completion alerts', () => {
    expect(calWebhook).toContain("import { getAdminNotificationEmails } from '@/lib/admin/admin-notification-recipients'");
    expect(calWebhook).toContain('const adminEmails = await getAdminNotificationEmails()');
    expect(completeRoute).toContain("import { getAdminNotificationEmails } from '@/lib/admin/admin-notification-recipients'");
    expect(completeRoute).toContain('const adminEmails = await getAdminNotificationEmails()');
  });
});
