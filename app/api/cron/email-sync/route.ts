import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { listGmailMailsSA, hasGmailSA, getGmailUnreadCountSA } from '@/lib/integrations/gmail';
import { notifyAdmins } from '@/lib/integrations/push';
import { verifyCronRequest } from '@/lib/security/cron';

// Vercel Cron: runs daily at 07:00 UTC
// Fetches recent Gmail inbox for info@expertconsulting.es (SA) and caches results
// Also updates system_kv.email_unread_count for sidebar badge
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const cronAuth = verifyCronRequest(request.headers, 'cron/email-sync');
  if (!cronAuth.ok) {
    return NextResponse.json({ error: cronAuth.error }, { status: cronAuth.status });
  }

  if (!hasGmailSA()) {
    return NextResponse.json({ skipped: true, reason: 'Gmail SA not configured' });
  }

  const admin = getSupabaseAdmin();

  try {
    // Fetch latest 50 threads from inbox
    const mails = await listGmailMailsSA({ maxResults: 50 });

    if (mails.length > 0) {
      const rows = mails.map((m) => ({
        thread_id:      m.conversationId,
        provider:       'gmail',
        subject:        m.subject,
        from_name:      m.from,
        from_email:     m.fromEmail,
        snippet:        m.snippet,
        date:           m.date,
        unread:         m.unread,
        has_attachment: m.hasAttachment,
        synced_at:      new Date().toISOString(),
      }));

      await admin
        .from('email_inbox_cache')
        .upsert(rows, { onConflict: 'thread_id' });
    }

    // Evict threads older than 30 days that are no longer in the inbox
    const activeIds = mails.map((m) => m.conversationId);
    if (activeIds.length > 0) {
      await admin
        .from('email_inbox_cache')
        .delete()
        .eq('provider', 'gmail')
        .lt('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .not('thread_id', 'in', `(${activeIds.map((id) => `"${id}"`).join(',')})`);
    }

    // Update unread count via dedicated function (uses resultSizeEstimate for speed)
    const { data: prevKv } = await admin
      .from('system_kv')
      .select('value')
      .eq('key', 'email_unread_count')
      .maybeSingle();
    const prevUnread = Number(prevKv?.value ?? 0);

    const unreadCount = await getGmailUnreadCountSA();
    await admin
      .from('system_kv')
      .upsert(
        { key: 'email_unread_count', value: unreadCount, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    // Push notification to admins when new unread emails arrive
    if (unreadCount > prevUnread) {
      const newCount = unreadCount - prevUnread;
      notifyAdmins({
        title: `📧 ${newCount} correo${newCount !== 1 ? 's' : ''} nuevo${newCount !== 1 ? 's' : ''}`,
        body : 'Nuevos mensajes en la bandeja de entrada',
        url  : '/admin/correo',
        tag  : 'email-unread',
      }).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      synced: mails.length,
      unread: unreadCount,
    });
  } catch (err) {
    console.error('[email-sync cron]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
