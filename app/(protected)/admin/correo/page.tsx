import { cookies } from 'next/headers';
import { CorreoInbox } from '@/components/admin/CorreoInbox';

async function fetchCorreoData() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  const base = process.env.NEXT_PUBLIC_APP_URL;
  const headers = { cookie: cookieHeader };

  const statusRes = await fetch(`${base}/api/admin/correo?action=status`, {
    headers,
    cache: 'no-store',
  });

  if (!statusRes.ok) {
    return { connected: false, ms365Email: null, initialMails: [] };
  }

  const status = await statusRes.json();
  if (!status.connected) {
    return { connected: false, ms365Email: null, initialMails: [] };
  }

  const mailsRes = await fetch(`${base}/api/admin/correo?action=list`, {
    headers,
    cache: 'no-store',
  });

  const mailsData = mailsRes.ok ? await mailsRes.json() : {};

  return {
    connected: true,
    ms365Email: status.email ?? null,
    initialMails: mailsData.mails ?? [],
  };
}

export default async function AdminCorreoPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { connected, ms365Email, initialMails } = await fetchCorreoData();

  return (
    <CorreoInbox
      connected={connected}
      ms365Email={ms365Email}
      initialMails={initialMails}
      errorParam={params.error ?? null}
    />
  );
}
