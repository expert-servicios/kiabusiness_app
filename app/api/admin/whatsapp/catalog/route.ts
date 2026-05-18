import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendWhatsAppInteractive, logWhatsAppConversation, mapWhatsAppMessageToClient } from '@/lib/integrations/whatsapp';
import { SERVICES_CATALOG, CATALOG_BODY_DEFAULT, CATALOG_FOOTER } from '@/lib/data/services-catalog';
import { z } from 'zod';

function detectCatalogBody(recentInbound: string[]): string {
  const text = recentInbound.join(' ');
  if (/[А-Яа-яЁё]/.test(text)) {
    return 'Привет 👋 Ниже список наших услуг EXPERT Asesoría. Нажмите кнопку, чтобы выбрать нужную.';
  }
  return CATALOG_BODY_DEFAULT;
}

const schema = z.object({
  phone:      z.string().min(1),
  sectionIds: z.array(z.string()).min(1).max(4),
  bodyText:   z.string().max(1024).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

    const { phone, sectionIds, bodyText } = parsed.data;

    // Detect client language from recent inbound messages
    let catalogBody = bodyText?.trim() || CATALOG_BODY_DEFAULT;
    if (!bodyText?.trim()) {
      const { data: recentMsgs } = await admin
        .from('whatsapp_conversations')
        .select('body')
        .eq('phone_number', phone)
        .eq('direction', 'inbound')
        .order('created_at', { ascending: false })
        .limit(5);
      const inboundTexts = (recentMsgs ?? []).map((m: { body: string }) => m.body);
      catalogBody = detectCatalogBody(inboundTexts);
    }

    // Build list sections respecting WhatsApp 10-row limit
    let totalRows = 0;
    const sections: { title: string; rows: { id: string; title: string; description: string }[] }[] = [];

    for (const section of SERVICES_CATALOG) {
      if (!sectionIds.includes(section.id)) continue;
      const remaining = 10 - totalRows;
      if (remaining <= 0) break;
      const rows = section.services.slice(0, remaining).map((s) => ({
        id:          `cat_${s.id}`,
        title:       s.title.slice(0, 24),
        description: s.description.slice(0, 72),
      }));
      sections.push({ title: section.title.slice(0, 24), rows });
      totalRows += rows.length;
    }

    if (sections.length === 0) {
      return NextResponse.json({ error: 'Sin servicios seleccionados' }, { status: 400 });
    }

    const sent = await sendWhatsAppInteractive({
      to: phone,
      body: catalogBody.slice(0, 1024),
      footer: CATALOG_FOOTER,
      list: { buttonText: 'Ver servicios', sections },
    });

    if (!sent.success) {
      return NextResponse.json({ error: sent.error }, { status: 500 });
    }

    // Resolve clientId for logging
    const { data: profiles } = await admin.from('profiles').select('id, phone').not('phone', 'is', null);
    const clientId = mapWhatsAppMessageToClient(phone, profiles ?? []) ?? undefined;

    const sectionNames = SERVICES_CATALOG
      .filter((s) => sectionIds.includes(s.id))
      .map((s) => s.title)
      .join(', ');

    await logWhatsAppConversation({
      clientId,
      phoneNumber: phone,
      direction:   'outbound',
      body:        `[Catálogo] ${sectionNames}`,
      whatsappMessageId: sent.messageId,
      aiResponded: false,
      needsReview: false,
    });

    return NextResponse.json({ ok: true, messageId: sent.messageId });
  } catch (err) {
    console.error('[WA catalog]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
