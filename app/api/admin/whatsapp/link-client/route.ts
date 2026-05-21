import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { clientInviteEmail, newClientAdminAlert } from '@/lib/email/templates';
import { z } from 'zod';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? admin : null;
}

const linkSchema = z.object({
  phone:    z.string().min(1),
  clientId: z.string().uuid(),
  savePhone: z.boolean().default(true),
});

const createSchema = z.object({
  phone:     z.string().min(1),
  full_name: z.string().min(1).max(200),
  email:     z.string().email(),
  create:    z.literal(true),
});

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const body = await request.json();

    // ── CREATE new contact ────────────────────────────────────────
    if (body.create === true) {
      const parsed = createSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

      const { phone, full_name, email } = parsed.data;
      const normalized = phone.replace(/\D/g, '');

      // Check if user already exists in auth — generateLink fails for existing emails
      const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const existingUser = listData?.users?.find((u) => u.email === email);

      let userId: string;
      let isNew = false;

      if (existingUser) {
        // Link existing user to this WhatsApp conversation
        userId = existingUser.id;
        await admin.from('profiles').update({
          ...(full_name ? { full_name } : {}),
          phone: normalized,
          email,
        }).eq('id', userId);
      } else {
        isNew = true;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://expertconsulting.es';
        const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
          type: 'invite',
          email,
          options: {
            data: { full_name },
            redirectTo: `${appUrl}/dashboard`,
          },
        });
        if (linkError || !linkData.user) {
          console.error('[WA create-contact]', linkError);
          return NextResponse.json({ error: linkError?.message ?? 'Error al crear usuario' }, { status: 400 });
        }
        userId = linkData.user.id;
        const inviteUrl = linkData.properties?.action_link ?? `${appUrl}/dashboard`;

        await admin.from('profiles').update({
          full_name,
          phone: normalized,
          role: 'client',
          email,
        }).eq('id', userId);

        // Send branded onboarding email (fire & forget)
        const adminEmail = process.env.ADMIN_EMAIL ?? 'info@expertconsulting.es';
        const inviteTpl = clientInviteEmail(full_name, inviteUrl);
        const adminTpl  = newClientAdminAlert({ name: full_name, email, phone: normalized || null, source: 'WhatsApp Inbox' });
        void Promise.all([
          sendEmail({ to: email, eventType: 'client_invite_wa', subject: inviteTpl.subject, html: inviteTpl.html }),
          sendEmail({ to: adminEmail, eventType: 'new_client_admin_alert', subject: adminTpl.subject, html: adminTpl.html }),
        ]);
      }

      // Link all conversations from this phone number to this user
      await admin.from('whatsapp_conversations')
        .update({ client_id: userId })
        .eq('phone_number', normalized);

      const { data: client } = await admin
        .from('profiles')
        .select('id,full_name,email,phone,role')
        .eq('id', userId)
        .single();

      return NextResponse.json({ ok: true, client, isNew }, { status: isNew ? 201 : 200 });
    }

    // ── LINK existing contact ─────────────────────────────────────
    const parsed = linkSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

    const { phone, clientId, savePhone } = parsed.data;
    const normalized = phone.replace(/\D/g, '');

    // Update all conversations from this phone to this client
    await admin
      .from('whatsapp_conversations')
      .update({ client_id: clientId })
      .eq('phone_number', normalized);

    // Optionally save phone on profile if not set
    if (savePhone) {
      const { data: profile } = await admin
        .from('profiles')
        .select('phone')
        .eq('id', clientId)
        .single();
      if (!profile?.phone) {
        await admin
          .from('profiles')
          .update({ phone: phone })
          .eq('id', clientId);
      }
    }

    // Return client info
    const { data: client } = await admin
      .from('profiles')
      .select('id,full_name,email,phone,role')
      .eq('id', clientId)
      .single();

    return NextResponse.json({ ok: true, client });
  } catch (err) {
    console.error('[WA link-client]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// GET — search clients for the link modal
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() ?? '';
    if (q.length < 2) return NextResponse.json({ clients: [] });

    const { data } = await admin
      .from('profiles')
      .select('id,full_name,email,phone,role')
      .neq('role', 'admin')
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(8);

    return NextResponse.json({ clients: data ?? [] });
  } catch (err) {
    console.error('[WA link-client GET]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
