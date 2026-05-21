import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendWhatsAppInteractive, logWhatsAppConversation, mapWhatsAppMessageToClient } from '@/lib/integrations/whatsapp';
import { SERVICES_CATALOG, CATALOG_FOOTER } from '@/lib/data/services-catalog';
import { z } from 'zod';

function detectLang(texts: string[]): 'ru' | 'es' {
  return /[А-Яа-яЁё]/.test(texts.join(' ')) ? 'ru' : 'es';
}

const schema = z.object({
  phone:      z.string().min(1),
  sectionIds: z.array(z.string()).min(1).max(7).optional(),
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
    const normalized = phone.replace(/\D/g, '');

    // Detect language from recent inbound messages
    const { data: recentMsgs } = await admin
      .from('whatsapp_conversations')
      .select('body')
      .eq('phone_number', normalized)
      .eq('direction', 'inbound')
      .order('created_at', { ascending: false })
      .limit(5);
    const lang = detectLang((recentMsgs ?? []).map((m: { body: string }) => m.body));

    const catalogBody = bodyText?.trim() || (
      lang === 'ru'
        ? 'Привет 👋 Выберите нужную категорию услуг EXPERT Asesoría:'
        : 'Hola 👋 Selecciona la categoría de servicio que necesitas:'
    );

    // Build category rows — max 7, always within WhatsApp's 10-row limit
    const selectedSections = sectionIds
      ? SERVICES_CATALOG.filter((s) => sectionIds.includes(s.id))
      : SERVICES_CATALOG;

    if (selectedSections.length === 0) {
      return NextResponse.json({ error: 'Sin categorías seleccionadas' }, { status: 400 });
    }

    const rows = selectedSections.map((section) => ({
      id:          `menu_cat_${section.id}`,
      title:       `${section.emoji} ${section.title}`.slice(0, 24),
      description: section.services.slice(0, 3).map((s) => s.title).join(' · ').slice(0, 72),
    }));

    const sent = await sendWhatsAppInteractive({
      to: phone,
      header: { type: 'text', text: 'EXPERT Asesoría 💼' },
      body: catalogBody.slice(0, 1024),
      footer: CATALOG_FOOTER,
      list: {
        buttonText: lang === 'ru' ? 'Ver categorías' : 'Ver categorías',
        sections:   [{ title: lang === 'ru' ? 'Categorías' : 'Categorías', rows }],
      },
    });

    if (!sent.success) {
      return NextResponse.json({ error: sent.error }, { status: 500 });
    }

    // Resolve clientId for logging
    const { data: profiles } = await admin.from('profiles').select('id, phone').not('phone', 'is', null);
    const clientId = mapWhatsAppMessageToClient(phone, profiles ?? []) ?? undefined;

    await logWhatsAppConversation({
      clientId,
      phoneNumber: normalized,
      direction:   'outbound',
      body:        `[Catálogo] ${selectedSections.map((s) => `${s.emoji} ${s.title}`).join(', ')}`,
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
