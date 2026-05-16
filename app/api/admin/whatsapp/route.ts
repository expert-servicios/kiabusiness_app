import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendWhatsAppMessage, logWhatsAppConversation } from '@/lib/integrations/whatsapp';
import { z } from 'zod';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? user : null;
}

// GET — list all conversations grouped by phone, with last message + unread count
export async function GET(request: NextRequest) {
  const user = await requireAdmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const admin = getSupabaseAdmin();

  // Get all messages ordered by created_at
  const { data: msgs } = await admin
    .from('whatsapp_conversations')
    .select('id, phone_number, client_id, direction, body, created_at, needs_review, ai_responded, read_at')
    .order('created_at', { ascending: true });

  if (!msgs) return NextResponse.json({ conversations: [] });

  // Get client profiles for known numbers
  const clientIds = [...new Set(msgs.filter((m) => m.client_id).map((m) => m.client_id as string))];
  const { data: profiles } = clientIds.length
    ? await admin.from('profiles').select('id, full_name, email, phone').in('id', clientIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Group by phone
  const grouped = new Map<string, {
    phone: string;
    clientId: string | null;
    clientName: string | null;
    clientEmail: string | null;
    messages: typeof msgs;
    unread: number;
    needsReview: boolean;
    lastAt: string;
  }>();

  for (const msg of msgs) {
    const phone = msg.phone_number;
    if (!grouped.has(phone)) {
      const profile = msg.client_id ? profileMap.get(msg.client_id) : null;
      grouped.set(phone, {
        phone,
        clientId: msg.client_id ?? null,
        clientName: profile?.full_name ?? null,
        clientEmail: profile?.email ?? null,
        messages: [],
        unread: 0,
        needsReview: false,
        lastAt: msg.created_at,
      });
    }
    const conv = grouped.get(phone)!;
    conv.messages.push(msg);
    conv.lastAt = msg.created_at;
    if (msg.direction === 'inbound' && !msg.read_at) conv.unread++;
    if (msg.needs_review) conv.needsReview = true;
  }

  const conversations = [...grouped.values()].sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
  );

  return NextResponse.json({ conversations });
}

const replySchema = z.object({
  phone: z.string().min(1),
  body: z.string().min(1).max(2000),
});

// POST — admin manual reply
export async function POST(request: NextRequest) {
  const user = await requireAdmin(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const json = await request.json();
  const parsed = replySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const { phone, body } = parsed.data;
  const admin = getSupabaseAdmin();

  // Find client_id for this phone
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .filter('phone', 'ilike', `%${phone.replace(/\D/g, '').slice(-9)}%`)
    .maybeSingle();

  const result = await sendWhatsAppMessage({ to: phone, body });
  if (!result.success) {
    return NextResponse.json({ error: result.error ?? 'Error al enviar' }, { status: 500 });
  }

  await logWhatsAppConversation({
    clientId: profile?.id,
    phoneNumber: phone,
    direction: 'outbound',
    body,
    whatsappMessageId: result.messageId,
  });

  // Mark inbound messages as read
  await admin
    .from('whatsapp_conversations')
    .update({ read_at: new Date().toISOString(), needs_review: false })
    .eq('phone_number', phone)
    .eq('direction', 'inbound')
    .is('read_at', null);

  return NextResponse.json({ success: true });
}
