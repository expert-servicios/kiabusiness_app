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
  return profile?.role === 'admin' ? admin : null;
}

// GET — list all conversations grouped by phone, with last message + unread count
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone'); // optional: fetch single thread

  const base = admin
    .from('whatsapp_conversations')
    .select('id,phone_number,client_id,case_id,direction,body,media_url,media_type,created_at,needs_review,ai_responded,read_at')
    .order('created_at', { ascending: true });

  const { data: msgs, error: qErr } = phone
    ? await base.eq('phone_number', phone.replace(/\D/g, ''))
    : await base;

  if (qErr) {
    console.error('[admin/whatsapp] GET:', qErr);
    return NextResponse.json({ error: qErr.message }, { status: 500 });
  }
  if (!msgs) return NextResponse.json({ conversations: [] });

  // Profiles
  const clientIds = [...new Set(msgs.filter((m) => m.client_id).map((m) => m.client_id as string))];
  const { data: profiles } = clientIds.length
    ? await admin.from('profiles').select('id,full_name,email,phone').in('id', clientIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Cases
  const caseIds = [...new Set(msgs.filter((m) => m.case_id).map((m) => m.case_id as string))];
  const { data: cases } = caseIds.length
    ? await admin.from('cases').select('id,service,state').in('id', caseIds)
    : { data: [] };
  const caseMap = new Map((cases ?? []).map((c) => [c.id, c]));

  // Group by phone
  type GroupedConv = {
    phone: string;
    clientId: string | null;
    clientName: string | null;
    clientEmail: string | null;
    messages: (typeof msgs)[number][];
    unread: number;
    needsReview: boolean;
    lastAt: string;
  };
  const grouped = new Map<string, GroupedConv>();

  for (const msg of msgs) {
    const p = msg.phone_number;
    if (!grouped.has(p)) {
      const profile = msg.client_id ? profileMap.get(msg.client_id) : null;
      grouped.set(p, {
        phone: p,
        clientId: msg.client_id ?? null,
        clientName: profile?.full_name ?? null,
        clientEmail: profile?.email ?? null,
        messages: [],
        unread: 0,
        needsReview: false,
        lastAt: msg.created_at,
      });
    }
    const conv = grouped.get(p)!;
    // Attach case info inline
    const enriched = {
      ...msg,
      case: msg.case_id ? (caseMap.get(msg.case_id) ?? null) : null,
    };
    conv.messages.push(enriched as typeof msgs[number]);
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
  phone:        z.string().min(1),
  body:         z.string().max(4096).optional(),
  mediaUrl:     z.string().url().optional(),
  mediaType:    z.enum(['image', 'document', 'audio', 'video']).optional(),
  mediaFilename: z.string().max(255).optional(),
  caption:      z.string().max(1024).optional(),
  caseId:       z.string().uuid().optional(),
});

// POST — admin manual reply (text or media)
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const json = await request.json();
  const parsed = replySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
  }

  const { phone, body, mediaUrl, mediaType, mediaFilename, caption, caseId } = parsed.data;

  if (!body && !mediaUrl) {
    return NextResponse.json({ error: 'Se requiere texto o adjunto' }, { status: 400 });
  }

  // Find client_id
  const normalized = phone.replace(/\D/g, '');
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .filter('phone', 'ilike', `%${normalized.slice(-9)}%`)
    .maybeSingle();

  const result = await sendWhatsAppMessage({
    to: phone,
    body,
    mediaUrl,
    mediaType,
    mediaFilename,
    caption,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error, detail: result.detail }, { status: 500 });
  }

  await logWhatsAppConversation({
    clientId:   profile?.id,
    phoneNumber: normalized,
    direction:  'outbound',
    body:       body ?? caption ?? `[${mediaType}]`,
    whatsappMessageId: result.messageId,
    caseId,
    mediaUrl,
    mediaType,
  });

  // Mark inbound as read
  await admin
    .from('whatsapp_conversations')
    .update({ read_at: new Date().toISOString(), needs_review: false })
    .eq('phone_number', normalized)
    .eq('direction', 'inbound')
    .is('read_at', null);

  return NextResponse.json({ success: true, messageId: result.messageId });
}

// PATCH — update case assignment or mark messages as read
const patchSchema = z.object({
  phone:   z.string().min(1),
  caseId:  z.string().uuid().nullable().optional(),
  markRead: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const json = await request.json();
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const { phone, caseId, markRead } = parsed.data;
  const normalized = phone.replace(/\D/g, '');

  if (caseId !== undefined) {
    await admin
      .from('whatsapp_conversations')
      .update({ case_id: caseId })
      .eq('phone_number', normalized);
  }

  if (markRead) {
    await admin
      .from('whatsapp_conversations')
      .update({ read_at: new Date().toISOString(), needs_review: false })
      .eq('phone_number', normalized)
      .eq('direction', 'inbound')
      .is('read_at', null);
  }

  return NextResponse.json({ ok: true });
}
