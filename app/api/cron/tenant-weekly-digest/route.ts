import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { enqueueEmail } from '@/lib/email/email-queue';
import { tenantWeeklyDigest } from '@/lib/email/templates';
import { verifyCronRequest } from '@/lib/security/cron';
import { getPublicAppUrl } from '@/lib/utils/app-url';

// Vercel Cron: runs every Monday at 07:00 UTC
// Protected by CRON_SECRET header
export const maxDuration = 60;

function weekLabel(): string {
  const now  = new Date();
  const day  = now.getDay(); // 0=Sun, 1=Mon
  const diff = day === 0 ? -6 : 1 - day;
  const mon  = new Date(now); mon.setDate(now.getDate() + diff);
  const sun  = new Date(mon); sun.setDate(mon.getDate() + 6);
  const fmt  = (d: Date) => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  return `${fmt(mon)}–${fmt(sun)} ${sun.getFullYear()}`;
}

export async function GET(request: NextRequest) {
  const cronAuth = verifyCronRequest(request.headers, 'cron/tenant-weekly-digest');
  if (!cronAuth.ok) {
    return NextResponse.json({ error: cronAuth.error }, { status: cronAuth.status });
  }

  console.log(JSON.stringify({ cron: 'tenant-weekly-digest', event: 'start', at: new Date().toISOString() }));

  const admin  = getSupabaseAdmin();
  const now    = new Date();
  const wLabel = weekLabel();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const appUrl  = getPublicAppUrl();

  // ── 1. Get all active tenants that have at least one tenant_admin ──────────
  const { data: tenants } = await admin
    .from('tenants')
    .select('id, name, settings')
    .eq('active', true);

  if (!tenants?.length) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  let sent = 0;

  for (const tenant of tenants) {
    try {
      // Get tenant_admin profiles + emails
      const { data: adminProfiles } = await admin
        .from('profiles')
        .select('id, full_name')
        .eq('tenant_id', tenant.id)
        .eq('role', 'tenant_admin');

      if (!adminProfiles?.length) continue;

      const recipients: Array<{ email: string; name: string }> = [];
      for (const p of adminProfiles) {
        const { data: authUser } = await admin.auth.admin.getUserById(p.id);
        const email = authUser?.user?.email;
        if (email) recipients.push({ email, name: p.full_name ?? email });
      }
      if (!recipients.length) continue;

      // ── KPIs scoped to this tenant ─────────────────────────────────────────
      // New clients this week
      const { count: newClients } = await admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('role', 'client')
        .gte('created_at', weekAgo);

      // Active cases (not finalizado/bloqueado)
      const { count: activeCases } = await admin
        .from('cases')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .not('status', 'in', '("finalizado","bloqueado")');

      // Finalized this week
      const { count: finishedThisWeek } = await admin
        .from('cases')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('status', 'finalizado')
        .gte('updated_at', weekAgo);

      // Cases pending docs (pendiente_cliente)
      const { data: pendingDocsCases } = await admin
        .from('cases')
        .select('id, service, client_id, updated_at')
        .eq('tenant_id', tenant.id)
        .eq('status', 'pendiente_cliente')
        .order('updated_at', { ascending: true })
        .limit(5);

      const pendingDocs = pendingDocsCases?.length ?? 0;

      // Resolve client names for pending cases
      const clientIds = [...new Set((pendingDocsCases ?? []).map((c) => c.client_id).filter(Boolean))];
      const nameMap = new Map<string, string>();
      if (clientIds.length > 0) {
        const { data: profs } = await admin
          .from('profiles')
          .select('id, full_name')
          .in('id', clientIds);
        for (const p of profs ?? []) nameMap.set(p.id, p.full_name ?? '—');
      }

      const topPending = (pendingDocsCases ?? []).map((c) => ({
        service    : c.service ?? 'Trámite',
        client     : nameMap.get(c.client_id) ?? '—',
        daysPending: Math.floor((now.getTime() - new Date(c.updated_at).getTime()) / 86400000),
      }));

      // ── Send to each tenant admin ──────────────────────────────────────────
      const brand = (tenant.settings as Record<string, unknown> | null)?.branding as Record<string, string> | undefined;

      for (const { email, name } of recipients) {
        const tpl = tenantWeeklyDigest({
          adminName      : name,
          tenantName     : tenant.name,
          weekLabel      : wLabel,
          portalUrl      : `${appUrl}/tenant/dashboard`,
          newClients     : newClients ?? 0,
          activeCases    : activeCases ?? 0,
          finishedThisWeek: finishedThisWeek ?? 0,
          pendingDocs,
          topPending,
        }, brand ? {
          name           : brand.name,
          tagline        : brand.tagline,
          primary_color  : brand.primary_color,
          support_email  : brand.support_email,
        } : undefined);

        await enqueueEmail({
          to       : email,
          eventType: 'tenant.weekly_digest',
          subject  : tpl.subject,
          html     : tpl.html,
        });
        sent++;
      }

      console.log(JSON.stringify({ cron: 'tenant-weekly-digest', tenant: tenant.id, recipients: recipients.length }));
    } catch (err) {
      console.error(`[tenant-weekly-digest] tenant ${tenant.id}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(JSON.stringify({ cron: 'tenant-weekly-digest', event: 'done', sent }));
  return NextResponse.json({ ok: true, sent });
}
