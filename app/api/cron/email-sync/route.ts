import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { listGmailMailsSA, hasGmailSA, getGmailUnreadCountSA } from '@/lib/integrations/gmail';

// Vercel Cron: runs every 5 minutes
// Fetches recent Gmail inbox for info@expertconsulting.es (SA) and caches results
// Also updates system_kv.email_unread_count for sidebar badge

function cronGuard(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // local dev
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!cronGuard(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const unreadCount = await getGmailUnreadCountSA();
    await admin
      .from('system_kv')
      .upsert(
        { key: 'email_unread_count', value: unreadCount, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

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
