import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { dailyAdminSummary, type DailySummaryData } from '@/lib/email/templates';

// Vercel Cron: runs daily at 08:30 UTC (30 min after fiscal-reminders)
// Protected by CRON_SECRET header

const ADMIN_EMAIL = process.env.ADMIN_SUMMARY_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? 'info@expertconsulting.es';

// Cases blocking threshold: flag if awaiting docs or blocked for >3 days
const DAYS_PENDING_THRESHOLD = 3;
// Quotes: flag if open and no response for >5 days
const QUOTE_OPEN_DAYS = 5;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    console.error('[cron/daily-summary] CRON_SECRET not configured');
    return NextResponse.json({ error: 'Cron not configured' }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin  = getSupabaseAdmin();
  const now    = new Date();
  const today  = now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const thresholdDate = new Date(now.getTime() - DAYS_PENDING_THRESHOLD * 24 * 60 * 60 * 1000).toISOString();
  const quoteThresholdDate = new Date(now.getTime() - QUOTE_OPEN_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // ── 1. Cases blocked ───────────────────────────────────────────────────────
  const { data: blockedCases } = await admin
    .from('cases')
    .select('id, service, client_id, updated_at')
    .eq('status', 'bloqueado')
    .order('updated_at', { ascending: true });

  // ── 2. Cases awaiting docs > DAYS_PENDING_THRESHOLD ───────────────────────
  const { data: awaitingDocsCases } = await admin
    .from('cases')
    .select('id, service, client_id, updated_at')
    .eq('status', 'pendiente_cliente')
    .lt('updated_at', thresholdDate)
    .order('updated_at', { ascending: true });

  // ── 3. Resolve client names ────────────────────────────────────────────────
  const allCases = [...(blockedCases ?? []), ...(awaitingDocsCases ?? [])];
  const clientIds = [...new Set(allCases.map((c) => c.client_id).filter(Boolean))];

  const nameMap = new Map<string, string>();
  if (clientIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name')
      .in('id', clientIds);
    for (const p of profiles ?? []) {
      nameMap.set(p.id, p.full_name ?? p.id.slice(0, 8));
    }
  }

  const toCaseRow = (c: { id: string; service: string; client_id: string; updated_at: string }) => ({
    id: c.id,
    service: c.service ?? 'Trámite',
    client: nameMap.get(c.client_id) ?? '—',
    daysPending: Math.floor((now.getTime() - new Date(c.updated_at).getTime()) / 86400000),
  });

  // ── 4. Open quotes without response ───────────────────────────────────────
  const { data: openQuotes } = await admin
    .from('quotes')
    .select('id, title, client_id, amount, created_at')
    .in('status', ['pending', 'sent'])
    .lt('created_at', quoteThresholdDate)
    .order('created_at', { ascending: true })
    .limit(10);

  const quoteClientIds = [...new Set((openQuotes ?? []).map((q) => q.client_id).filter(Boolean))];
  if (quoteClientIds.length > 0) {
    const { data: qProfiles } = await admin
      .from('profiles')
      .select('id, full_name')
      .in('id', quoteClientIds);
    for (const p of qProfiles ?? []) {
      nameMap.set(p.id, p.full_name ?? p.id.slice(0, 8));
    }
  }

  const quotesOpen: DailySummaryData['quotesOpen'] = (openQuotes ?? []).map((q) => ({
    id: q.id,
    title: q.title ?? 'Presupuesto',
    client: nameMap.get(q.client_id) ?? '—',
    amount: Number(q.amount ?? 0),
    daysOpen: Math.floor((now.getTime() - new Date(q.created_at).getTime()) / 86400000),
  }));

  // ── 5. Failed subscription payments ───────────────────────────────────────
  const { data: failedSubs } = await admin
    .from('subscriptions')
    .select('client_id, plan_name')
    .in('status', ['past_due', 'unpaid']);

  const failedSubClientIds = [...new Set((failedSubs ?? []).map((s) => s.client_id).filter(Boolean))];
  if (failedSubClientIds.length > 0) {
    const { data: sProfiles } = await admin
      .from('profiles')
      .select('id, full_name')
      .in('id', failedSubClientIds);
    for (const p of sProfiles ?? []) {
      nameMap.set(p.id, p.full_name ?? p.id.slice(0, 8));
    }
  }

  const paymentsFailedSubs: DailySummaryData['paymentsFailedSubs'] = (failedSubs ?? []).map((s) => ({
    client: nameMap.get(s.client_id) ?? '—',
    plan: s.plan_name ?? 'Suscripción',
  }));

  // ── 6. New leads in last 24h ───────────────────────────────────────────────
  const { count: newLeads24h } = await admin
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since24h);

  // ── 7. New WhatsApp messages in last 24h ──────────────────────────────────
  const { count: newMessages24h } = await admin
    .from('whatsapp_conversations')
    .select('id', { count: 'exact', head: true })
    .eq('direction', 'inbound')
    .gte('created_at', since24h);

  // ── 8. Failed Holded sync jobs ─────────────────────────────────────────────
  const { count: holdedJobsFailed } = await admin
    .from('holded_sync_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'failed');

  // ── 9. Build and send summary ─────────────────────────────────────────────
  const summaryData: DailySummaryData = {
    date: today,
    casesBlocked     : (blockedCases ?? []).map(toCaseRow),
    casesAwaitingDocs: (awaitingDocsCases ?? []).map(toCaseRow),
    quotesOpen,
    paymentsFailedSubs,
    newLeads24h      : newLeads24h ?? 0,
    newMessages24h   : newMessages24h ?? 0,
    holdedJobsFailed : holdedJobsFailed ?? 0,
  };

  const tpl = dailyAdminSummary(summaryData);
  const recipient = Array.isArray(ADMIN_EMAIL) ? ADMIN_EMAIL : ADMIN_EMAIL.replace(/^[^<]+<|>$/g, '') || ADMIN_EMAIL;

  await sendEmail({
    to: recipient,
    eventType: 'admin.daily_summary',
    ...tpl,
    metadata: {
      date: today,
      blockedCount: summaryData.casesBlocked.length,
      awaitingDocsCount: summaryData.casesAwaitingDocs.length,
    },
  });

  console.info('[cron/daily-summary] sent to', recipient, summaryData);
  return NextResponse.json({ ok: true, ...summaryData });
}
