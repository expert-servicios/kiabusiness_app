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
    return {
      ms365Connected: false, ms365Email: null,
      gmailConnected: false, gmailEmail: null,
      initialMails: [], initialProvider: 'ms365' as const,
    };
  }

  const status = await statusRes.json();
  const ms365Connected: boolean = status.ms365Connected ?? false;
  const gmailConnected: boolean = status.gmailConnected ?? false;
  const gmailSA: boolean = status.gmailSA ?? false;

  // Determine which provider to show first
  const initialProvider: 'ms365' | 'gmail' = gmailConnected ? 'gmail' : 'ms365';
  const activeProvider = initialProvider;

  let initialMails: unknown[] = [];
  if (ms365Connected || gmailConnected) {
    const mailsRes = await fetch(
      `${base}/api/admin/correo?action=list&provider=${activeProvider}`,
      { headers, cache: 'no-store' }
    );
    if (mailsRes.ok) {
      const data = await mailsRes.json();
      initialMails = data.mails ?? [];
    }
  }

  return {
    ms365Connected,
    ms365Email: status.ms365Email ?? null,
    gmailConnected,
    gmailEmail:  status.gmailEmail ?? null,
    gmailSA,
    initialMails,
    initialProvider,
  };
}

export default async function AdminCorreoPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const params = await searchParams;
  const data = await fetchCorreoData();

  return (
    <CorreoInbox
      ms365Connected={data.ms365Connected}
      ms365Email={data.ms365Email}
      gmailConnected={data.gmailConnected}
      gmailEmail={data.gmailEmail}
      gmailSA={data.gmailSA}
      initialMails={data.initialMails as Parameters<typeof CorreoInbox>[0]['initialMails']}
      initialProvider={data.initialProvider}
      errorParam={params.error ?? null}
      connectedParam={params.connected ?? null}
    />
  );
}
