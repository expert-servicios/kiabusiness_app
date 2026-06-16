import { fetchWithCookies } from '@/lib/utils/server-fetch';
import { WhatsAppInbox } from '@/components/admin/WhatsAppInbox';

async function fetchConversations() {
  const data = await fetchWithCookies('/api/admin/whatsapp');
  return data?.conversations ?? [];
}

export default async function AdminWhatsAppPage() {
  const conversations = await fetchConversations();
  return <WhatsAppInbox initialConversations={conversations} />;
}
