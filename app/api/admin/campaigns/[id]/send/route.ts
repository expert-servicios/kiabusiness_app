import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getResendClient } from '@/lib/integrations/resend';
import { getSegmentRecipients, type SegmentKey } from '@/lib/campaigns/segments';
import { getPublicAppUrl } from '@/lib/utils/app-url';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: p } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (p?.role === 'admin' || p?.role === 'owner') ? { admin, userId: user.id } : null;
}

function buildUnsubscribeFooter(email: string, campaignId: string, appUrl: string): string {
  const unsubUrl = `${appUrl}/api/unsubscribe?email=${encodeURIComponent(email)}&campaign=${campaignId}`;
  return `
    <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center;font-family:sans-serif">
      Estás recibiendo este email porque eres cliente de Expert Consulting.<br>
      <a href="${unsubUrl}" style="color:#9ca3af">Cancelar suscripción</a> · Expert Consulting, España
    </div>`;
}

function injectFooter(html: string, footer: string): string {
  const bodyEnd = html.toLowerCase().lastIndexOf('</body>');
  if (bodyEnd !== -1) return html.slice(0, bodyEnd) + footer + html.slice(bodyEnd);
  return html + footer;
}

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 1000; // 1s between batches to respect rate limits

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;
  const { admin } = ctx;

  // Load campaign
  const { data: campaign, error: campErr } = await admin
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (campErr || !campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 });
  if (campaign.status === 'sent') return NextResponse.json({ error: 'Campaña ya enviada' }, { status: 409 });
  if (campaign.status === 'sending') return NextResponse.json({ error: 'Envío en curso' }, { status: 409 });

  // Mark as sending
  await admin.from('campaigns').update({ status: 'sending', updated_at: new Date().toISOString() }).eq('id', id);

  const resend = getResendClient();
  const appUrl = getPublicAppUrl();
  const from = process.env.RESEND_FROM_EMAIL ?? 'EXPERT <info@expertconsulting.es>';

  // Get recipients for segment
  const recipients = await getSegmentRecipients(campaign.segment as SegmentKey);

  // Exclude already-sent recipients (idempotent)
  const { data: alreadySent } = await admin
    .from('campaign_sends')
    .select('recipient_email')
    .eq('campaign_id', id)
    .eq('status', 'sent');

  const sentEmails = new Set((alreadySent ?? []).map((r) => r.recipient_email));
  const toSend = recipients.filter((r) => !sentEmails.has(r.email));

  let sentCount = alreadySent?.length ?? 0;
  let failedCount = 0;

  // Send in batches
  for (let i = 0; i < toSend.length; i += BATCH_SIZE) {
    const batch = toSend.slice(i, i + BATCH_SIZE);

    for (const recipient of batch) {
      const footer = buildUnsubscribeFooter(recipient.email, id, appUrl);
      const html = injectFooter(campaign.body_html, footer);

      try {
        const { data, error } = await resend.emails.send({
          from,
          to: [recipient.email],
          subject: campaign.subject,
          html,
          ...(campaign.body_text ? { text: campaign.body_text } : {}),
        });

        await admin.from('campaign_sends').insert({
          campaign_id: id,
          recipient_email: recipient.email,
          recipient_name: recipient.name ?? null,
          status: error ? 'failed' : 'sent',
          resend_id: data?.id ?? null,
          error: error ? String(error) : null,
          sent_at: error ? null : new Date().toISOString(),
        });

        if (error) failedCount++; else sentCount++;
      } catch (err) {
        await admin.from('campaign_sends').insert({
          campaign_id: id,
          recipient_email: recipient.email,
          recipient_name: recipient.name ?? null,
          status: 'failed',
          error: String(err),
        });
        failedCount++;
      }
    }

    // Rate limit: wait between batches (except last)
    if (i + BATCH_SIZE < toSend.length) await sleep(BATCH_DELAY_MS);
  }

  // Finalize campaign
  await admin.from('campaigns').update({
    status: 'sent',
    sent_at: new Date().toISOString(),
    sent_count: sentCount,
    failed_count: failedCount,
    updated_at: new Date().toISOString(),
  }).eq('id', id);

  return NextResponse.json({ ok: true, sentCount, failedCount, total: toSend.length });
}
