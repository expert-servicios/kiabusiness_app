import { getSupabaseAdmin, listAllAuthUsers } from '@/lib/integrations/supabase';

function configuredAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? 'info@expertconsulting.es')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

export async function getAdminNotificationEmails(): Promise<string[]> {
  const recipients = new Map<string, string>();
  for (const email of configuredAdminEmails()) recipients.set(email.toLowerCase(), email);

  try {
    const admin = getSupabaseAdmin();
    const [{ data: profiles, error }, authUsers] = await Promise.all([
      admin
        .from('profiles')
        .select('id,role,status')
        .in('role', ['admin', 'owner'])
        .neq('status', 'inactive'),
      listAllAuthUsers(),
    ]);

    if (error) throw error;
    const emailById = new Map(authUsers.map((user) => [user.id, user.email?.trim() ?? '']));
    for (const profile of profiles ?? []) {
      const email = emailById.get(profile.id);
      if (email) recipients.set(email.toLowerCase(), email);
    }
  } catch (error) {
    console.error('[admin-notifications] Could not resolve active Admin emails:', error instanceof Error ? error.message : error);
  }

  return [...recipients.values()];
}
