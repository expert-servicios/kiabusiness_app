import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
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
  email:     z.string().email().optional().or(z.literal('')),
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

      // Create auth user via admin (no password — they'll use magic link)
      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email: email || `wa_${normalized}@expertconsulting.es`,
        email_confirm: true,
        user_metadata: { full_name },
      });
      if (authError || !authData.user) {
        console.error('[WA create-contact]', authError);
        return NextResponse.json({ error: authError?.message ?? 'Error al crear usuario' }, { status: 400 });
      }

      const userId = authData.user.id;

      // Update profile with name, phone, role
      await admin.from('profiles').update({
        full_name,
        phone: normalized,
        role: 'client',
      }).eq('id', userId);

      // Link conversation
      await admin.from('whatsapp_conversations')
        .update({ client_id: userId })
        .eq('phone_number', normalized);

      const { data: client } = await admin
        .from('profiles')
        .select('id,full_name,email,phone')
        .eq('id', userId)
        .single();

      return NextResponse.json({ ok: true, client }, { status: 201 });
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
      .select('id,full_name,email,phone')
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
      .select('id,full_name,email,phone')
      .eq('role', 'client')
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(8);

    return NextResponse.json({ clients: data ?? [] });
  } catch (err) {
    console.error('[WA link-client GET]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
