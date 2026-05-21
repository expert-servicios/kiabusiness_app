import { cookies } from 'next/headers';
import { WhatsAppInbox } from '@/components/admin/WhatsAppInbox';
import { absoluteAppUrl } from '@/lib/utils/app-url';

async function fetchConversations() {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
    const res = await fetch(absoluteAppUrl('/api/admin/whatsapp'), {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.conversations ?? [];
  } catch {
    return [];
  }
}

export default async function AdminWhatsAppPage() {
  const conversations = await fetchConversations();
  return <WhatsAppInbox initialConversations={conversations} />;
}
