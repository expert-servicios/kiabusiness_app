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

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function isClosedCase(state: string | null | undefined): boolean {
  return ['cerrado', 'finalizado', 'entregado'].includes((state ?? '').toLowerCase());
}

// GET — list all conversations grouped by phone, with last message + unread count
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone'); // optional: fetch single thread

  const base = admin
    .from('whatsapp_conversations')
    .select('id,phone_number,client_id,case_id,direction,body,media_url,media_type,meta_media_id,created_at,needs_review,ai_responded,read_at,reply_to_message_id,reply_to_whatsapp_message_id,quoted_body_snapshot,quoted_direction,quoted_created_at')
    .order('created_at', { ascending: true });

  const { data: msgs, error: qErr } = phone
    ? await base.eq('phone_number', normalizePhone(phone))
    : await base;

  if (qErr) {
    console.error('[admin/whatsapp] GET:', qErr);
    return NextResponse.json({ error: qErr.message }, { status: 500 });
  }
  if (!msgs) return NextResponse.json({ conversations: [] });

  // Profiles (email column now exists after migration 20260520092000)
  const clientIds = [...new Set(msgs.filter((m) => m.client_id).map((m) => m.client_id as string))];
  const { data: profiles } = clientIds.length
    ? await admin.from('profiles').select('id,full_name,email,phone,role,whatsapp_number').in('id', clientIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Cases
  const caseIds = [...new Set(msgs.filter((m) => m.case_id).map((m) => m.case_id as string))];
  const { data: cases } = caseIds.length
    ? await admin.from('cases').select('id,service,state').in('id', caseIds)
    : { data: [] };
  const caseMap = new Map((cases ?? []).map((c) => [c.id, c]));

  // Open case counters per client, used to make the Cliente badge useful.
  const { data: openCases } = clientIds.length
    ? await admin.from('cases').select('id,client_id,state').in('client_id', clientIds)
    : { data: [] };
  const openCaseCountMap = new Map<string, number>();
  for (const c of openCases ?? []) {
    if (isClosedCase(c.state)) continue;
    openCaseCountMap.set(c.client_id, (openCaseCountMap.get(c.client_id) ?? 0) + 1);
  }

  // Group by phone
  type GroupedConv = {
    phone: string;
    clientId: string | null;
    clientName: string | null;
    clientEmail: string | null;
    clientRole: string | null;
    leadId: string | null;
    leadStatus: string | null;
    lastSelectedService: string | null;
    openCaseCount: number;
    messages: (typeof msgs)[number][];
    unread: number;
    needsReview: boolean;
    lastAt: string;
  };
  const grouped = new Map<string, GroupedConv>();

  for (const msg of msgs) {
    const p = msg.phone_number;
    if (!grouped.has(p)) {
      grouped.set(p, {
        phone: p,
        clientId: null,
        clientName: null,
        clientEmail: null,
        clientRole: null,
        leadId: null,
        leadStatus: null,
        lastSelectedService: null,
        openCaseCount: 0,
        messages: [],
        unread: 0,
        needsReview: false,
        lastAt: msg.created_at,
      });
    }
    const conv = grouped.get(p)!;

    // Update client info from any message that has a client_id (handles retroactive linking)
    if (msg.client_id && !conv.clientId) {
      const profile = profileMap.get(msg.client_id);
      conv.clientId    = msg.client_id;
      conv.clientName  = profile?.full_name ?? null;
      conv.clientEmail = profile?.email     ?? null;
      conv.clientRole  = profile?.role      ?? null;
      conv.openCaseCount = openCaseCountMap.get(msg.client_id) ?? 0;
    }

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

  // Lead metadata for conversations not linked to a client.
  const leadPhones = [...grouped.values()].filter((c) => !c.clientId).map((c) => c.phone);
  const { data: leads } = leadPhones.length
    ? await admin.from('leads').select('id,phone,state,service,created_at,updated_at').in('phone', leadPhones)
    : { data: [] };
  const leadMap = new Map<string, { id: string; state: string | null; service: string | null }>();
  for (const lead of leads ?? []) {
    const phoneKey = normalizePhone(lead.phone ?? '');
    if (!phoneKey || leadMap.has(phoneKey)) continue;
    leadMap.set(phoneKey, { id: lead.id, state: lead.state ?? null, service: lead.service ?? null });
  }
  for (const conv of grouped.values()) {
    if (conv.clientId) continue;
    const lead = leadMap.get(normalizePhone(conv.phone));
    conv.leadId = lead?.id ?? null;
    conv.leadStatus = lead?.state ?? null;
    conv.lastSelectedService = lead?.service ?? null;
  }

  const conversations = [...grouped.values()].sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
  );

  return NextResponse.json({ conversations });
}

const replySchema = z.object({
  phone:            z.string().min(1),
  body:             z.string().max(4096).optional(),
  mediaUrl:         z.string().url().optional(),
  mediaType:        z.enum(['image', 'document', 'audio', 'video']).optional(),
  mediaFilename:    z.string().max(255).optional(),
  caption:          z.string().max(1024).optional(),
  caseId:           z.string().uuid().optional(),
  replyToMessageId: z.string().uuid().optional(),
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

  const { phone, body, mediaUrl, mediaType, mediaFilename, caption, caseId, replyToMessageId } = parsed.data;

  if (!body && !mediaUrl) {
    return NextResponse.json({ error: 'Se requiere texto o adjunto' }, { status: 400 });
  }

  const normalized = normalizePhone(phone);

  // ── Resolve quote data if replyToMessageId provided ───────────────────────
  let quotedMsgId: string | undefined;
  let quotedWaId:  string | undefined;
  let quotedSnap:  string | undefined;
  let quotedDir:   string | undefined;
  let quotedAt:    string | undefined;
  let finalBody    = body;
  let finalCaption = caption;

  if (replyToMessageId) {
    const { data: original, error: origErr } = await admin
      .from('whatsapp_conversations')
      .select('id, phone_number, whatsapp_message_id, body, direction, created_at, media_type')
      .eq('id', replyToMessageId)
      .single();

    if (origErr || !original) {
      return NextResponse.json({ error: 'Mensaje original no encontrado' }, { status: 400 });
    }
    if (normalizePhone(original.phone_number as string) !== normalized) {
      return NextResponse.json({ error: 'El mensaje seleccionado no pertenece a este hilo' }, { status: 400 });
    }

    quotedMsgId = original.id as string;
    quotedWaId  = original.whatsapp_message_id as string | undefined;
    quotedDir   = original.direction as string;
    quotedAt    = original.created_at as string;

    const rawBody = original.body as string ?? '';
    const mediaType_ = original.media_type as string | null;
    const mediaIcon  = mediaType_ === 'image' ? '📷 Imagen' : mediaType_ === 'audio' ? '🎤 Audio' : mediaType_ === 'video' ? '🎥 Vídeo' : mediaType_ ? '📎 Documento' : null;
    const snapText   = mediaIcon ?? rawBody.replace(/\n+/g, ' ').trim();
    quotedSnap       = snapText.slice(0, 120);

    // Prepend visual quote to message body (WhatsApp Cloud API quote reply not always available)
    const who    = quotedDir === 'inbound' ? 'Cliente' : 'EXPERT';
    const prefix = `_Respondiendo a ${who}: «${quotedSnap}»_\n\n`;
    if (finalBody && finalBody.length + prefix.length <= 4096) {
      finalBody = prefix + finalBody;
    }
    if (finalCaption && finalCaption.length + prefix.length <= 1024) {
      finalCaption = prefix + finalCaption;
    }
  }

  // Find client_id
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .or(`phone.ilike.%${normalized.slice(-9)}%,whatsapp_number.ilike.%${normalized.slice(-9)}%`)
    .maybeSingle();

  const result = await sendWhatsAppMessage({
    to: phone,
    body:          finalBody,
    mediaUrl,
    mediaType,
    mediaFilename,
    caption:       finalCaption,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error, detail: result.detail }, { status: 500 });
  }

  await logWhatsAppConversation({
    clientId:                   profile?.id,
    phoneNumber:                normalized,
    direction:                  'outbound',
    body:                       finalBody ?? finalCaption ?? `[${mediaType}]`,
    whatsappMessageId:          result.messageId,
    caseId,
    mediaUrl,
    mediaType,
    replyToMessageId:           quotedMsgId,
    replyToWhatsAppMessageId:   quotedWaId,
    quotedBodySnapshot:         quotedSnap,
    quotedDirection:            quotedDir,
    quotedCreatedAt:            quotedAt,
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
  const normalized = normalizePhone(phone);

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
