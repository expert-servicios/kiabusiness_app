import type { SupabaseClient } from '@supabase/supabase-js';

export interface CommunicationMetrics {
  waSinResponder: number;
  emailSinResponder: number;
  totalSinResponder: number;
  conversacionesHoy: number;
  docsRecibidosWa7d: number;
}

export async function fetchCommunicationMetrics(
  admin: SupabaseClient
): Promise<CommunicationMetrics> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayIso = startOfToday.toISOString();
  const ago7d    = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const [waUnread, emailUnread, waHoy, waMedia7d] = await Promise.all([
    admin.from('whatsapp_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('direction', 'inbound')
      .eq('needs_review', true),
    admin.from('email_threads')
      .select('id', { count: 'exact', head: true })
      .eq('unread', true),
    admin.from('whatsapp_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('direction', 'inbound')
      .gte('created_at', todayIso),
    admin.from('whatsapp_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('direction', 'inbound')
      .not('media_type', 'is', null)
      .gte('created_at', ago7d),
  ]);

  const waSinResponder    = waUnread.count    ?? 0;
  const emailSinResponder = emailUnread.count ?? 0;

  return {
    waSinResponder,
    emailSinResponder,
    totalSinResponder:  waSinResponder + emailSinResponder,
    conversacionesHoy:  waHoy.count   ?? 0,
    docsRecibidosWa7d:  waMedia7d.count ?? 0,
  };
}
