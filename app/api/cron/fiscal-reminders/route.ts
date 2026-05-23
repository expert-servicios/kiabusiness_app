import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getResendClient } from '@/lib/integrations/resend';
import { getPublicAppUrl } from '@/lib/utils/app-url';

// Vercel Cron: runs daily at 08:00 UTC
// Protected by CRON_SECRET header (set in Vercel env vars)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    console.error('[cron/fiscal-reminders] CRON_SECRET not configured');
    return NextResponse.json({ error: 'Cron not configured' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const resend = getResendClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Load all pending obligations
  const { data: obligations, error } = await admin
    .from('fiscal_obligations')
    .select('*')
    .eq('status', 'pending')
    .gte('deadline', today.toISOString().slice(0, 10))
    .order('deadline');

  if (error) {
    console.error('Fiscal reminders cron error:', error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  // Group by user
  const byUser = new Map<string, typeof obligations>();
  for (const obl of obligations ?? []) {
    const list = byUser.get(obl.user_id) ?? [];
    list.push(obl);
    byUser.set(obl.user_id, list);
  }

  // Get auth users (emails)
  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = new Map((authData?.users ?? []).map((u) => [u.id, u.email ?? '']));
  const { data: profiles } = await admin.from('profiles').select('id,full_name');
  const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  let sent = 0;
  let skipped = 0;
  const updates: Array<{ id: string; field: string }> = [];

  for (const [userId, obls] of byUser) {
    const email = emailMap.get(userId);
    if (!email) { skipped++; continue; }
    const firstName = nameMap.get(userId)?.split(' ')[0] ?? email.split('@')[0];

    // Find which reminder tiers are needed
    const toRemind30: typeof obls = [];
    const toRemind7: typeof obls = [];
    const toRemind1: typeof obls = [];

    for (const obl of obls) {
      const diff = Math.ceil((new Date(obl.deadline).getTime() - today.getTime()) / 86400000);

      if (diff <= 1 && diff >= 0 && !obl.reminded_1d_at) {
        toRemind1.push(obl);
        updates.push({ id: obl.id, field: 'reminded_1d_at' });
      } else if (diff <= 7 && diff > 1 && !obl.reminded_7d_at) {
        toRemind7.push(obl);
        updates.push({ id: obl.id, field: 'reminded_7d_at' });
      } else if (diff <= 30 && diff > 7 && !obl.reminded_30d_at) {
        toRemind30.push(obl);
        updates.push({ id: obl.id, field: 'reminded_30d_at' });
      }
    }

    const allToRemind = [...toRemind1, ...toRemind7, ...toRemind30];
    if (allToRemind.length === 0) { skipped++; continue; }

    // Determine urgency label for subject
    const hasUrgent = toRemind1.length > 0;
    const hasSoon = toRemind7.length > 0;
    const subject = hasUrgent
      ? `⚠️ Plazo MAÑANA: ${toRemind1[0].description}`
      : hasSoon
      ? `📅 Plazo en 7 días: ${toRemind7[0].description}${toRemind7.length > 1 ? ` y ${toRemind7.length - 1} más` : ''}`
      : `📋 Recordatorio fiscal: ${toRemind30.length} obligación${toRemind30.length > 1 ? 'es' : ''} próxima${toRemind30.length > 1 ? 's' : ''}`;

    const html = buildEmailHtml(firstName, toRemind1, toRemind7, toRemind30);

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'EXPERT <info@expertconsulting.es>',
        to: email,
        subject,
        html,
      });
      sent++;
    } catch (err) {
      console.error(`Failed to send reminder to ${email}:`, err);
      skipped++;
    }
  }

  // Mark reminded timestamps
  const now = new Date().toISOString();
  for (const { id, field } of updates) {
    await admin.from('fiscal_obligations').update({ [field]: now, updated_at: now }).eq('id', id);
  }

  return NextResponse.json({ ok: true, sent, skipped, reminders: updates.length });
}

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

function obligationRows(obls: Array<{ modelo: string; description: string; deadline: string; period_label?: string | null }>, color: string) {
  return obls.map((o) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0e9d8;">
        <span style="display:inline-block;background:#07111d;color:#d7a33a;font-family:monospace;font-size:11px;font-weight:700;padding:2px 7px;border-radius:5px;">M-${o.modelo}</span>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0e9d8;font-size:13px;color:#07111d;">${o.description}${o.period_label ? `<br><span style="color:#29384a;font-size:11px;">${o.period_label}</span>` : ''}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0e9d8;font-size:12px;font-weight:600;color:${color};white-space:nowrap;">${formatDate(o.deadline)}</td>
    </tr>`).join('');
}

function buildEmailHtml(
  firstName: string,
  urgent: Array<{ modelo: string; description: string; deadline: string; period_label?: string | null }>,
  soon: typeof urgent,
  upcoming: typeof urgent
): string {
  const appUrl = getPublicAppUrl();
  const sections: string[] = [];

  if (urgent.length > 0) {
    sections.push(`
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#dc2626;">⚠️ Vence mañana</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #fecaca;margin-bottom:20px;">
        ${obligationRows(urgent, '#dc2626')}
      </table>`);
  }

  if (soon.length > 0) {
    sections.push(`
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#d97706;">📅 Vence en 7 días</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #fde68a;margin-bottom:20px;">
        ${obligationRows(soon, '#d97706')}
      </table>`);
  }

  if (upcoming.length > 0) {
    sections.push(`
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#29384a;">📋 Próximos 30 días</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px;overflow:hidden;border:1px solid #d8cbb5;margin-bottom:20px;">
        ${obligationRows(upcoming, '#29384a')}
      </table>`);
  }

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f4eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f4eb;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#07111d;border-radius:16px 16px 0 0;padding:24px 32px;">
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#d7a33a;">EXPERT Consulting</p>
          <h1 style="margin:4px 0 0;font-size:20px;color:#ffffff;">Recordatorio Fiscal</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:28px 32px;">
          <p style="margin:0 0 20px;font-size:15px;color:#07111d;">Hola, <strong>${firstName}</strong>.</p>
          <p style="margin:0 0 24px;font-size:13px;color:#29384a;line-height:1.6;">
            Tienes obligaciones fiscales que requieren tu atención. Recuerda presentar a tiempo para evitar sanciones de la AEAT.
          </p>

          ${sections.join('')}

          <div style="text-align:center;margin-top:8px;">
            <a href="${appUrl}/dashboard/calendario-fiscal"
               style="display:inline-block;background:#07111d;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;padding:12px 28px;border-radius:10px;">
              Ver mi calendario fiscal
            </a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8f4eb;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#29384a;">
            EXPERT Consulting · <a href="${appUrl}/dashboard/perfil" style="color:#c88b25;">Gestionar notificaciones</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
