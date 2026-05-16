import { cookies } from 'next/headers';
import { GmailInbox } from '@/components/admin/GmailInbox';

async function fetchGmailData() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const base = process.env.NEXT_PUBLIC_APP_URL;
  const headers = { cookie: cookieHeader };

  const statusRes = await fetch(`${base}/api/admin/gmail?action=status`, {
    headers,
    cache: 'no-store',
  });

  if (!statusRes.ok) {
    return { connected: false, gmailEmail: null, initialEmails: [] };
  }

  const status = await statusRes.json();
  if (!status.connected) {
    return { connected: false, gmailEmail: null, initialEmails: [] };
  }

  const emailsRes = await fetch(`${base}/api/admin/gmail?action=list&q=in:inbox`, {
    headers,
    cache: 'no-store',
  });

  const emailsData = emailsRes.ok ? await emailsRes.json() : {};

  return {
    connected: true,
    gmailEmail: status.email ?? null,
    initialEmails: emailsData.emails ?? [],
  };
}

export default async function AdminGmailPage() {
  const { connected, gmailEmail, initialEmails } = await fetchGmailData();
  return (
    <GmailInbox
      connected={connected}
      gmailEmail={gmailEmail}
      initialEmails={initialEmails}
    />
  );
}
