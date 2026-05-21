import { cookies } from 'next/headers';
import { CorreoInbox } from '@/components/admin/CorreoInbox';
import { absoluteAppUrl } from '@/lib/utils/app-url';

const CORREO_FALLBACK = {
  ms365Connected: false, ms365Email: null,
  gmailConnected: false, gmailEmail: null,
  gmailSA: false, initialMails: [], initialProvider: 'ms365' as const,
};

async function fetchCorreoData() {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
    const headers = { cookie: cookieHeader };

    const statusRes = await fetch(absoluteAppUrl('/api/admin/correo?action=status'), {
      headers,
      cache: 'no-store',
    });

    if (!statusRes.ok) return CORREO_FALLBACK;

    const status = await statusRes.json();
    const ms365Connected: boolean = status.ms365Connected ?? false;
    const gmailConnected: boolean = status.gmailConnected ?? false;
    const gmailSA: boolean = status.gmailSA ?? false;

    const initialProvider: 'ms365' | 'gmail' = gmailConnected ? 'gmail' : 'ms365';

    let initialMails: unknown[] = [];
    if (ms365Connected || gmailConnected) {
      const mailsRes = await fetch(
        absoluteAppUrl(`/api/admin/correo?action=list&provider=${initialProvider}`),
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
      gmailEmail: status.gmailEmail ?? null,
      gmailSA,
      initialMails,
      initialProvider,
    };
  } catch {
    return CORREO_FALLBACK;
  }
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
