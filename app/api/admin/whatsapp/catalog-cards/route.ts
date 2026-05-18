import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import {
  sendWhatsAppImageMessage,
  sendWhatsAppInteractive,
  logWhatsAppConversation,
  mapWhatsAppMessageToClient,
} from '@/lib/integrations/whatsapp';
import { SERVICES_CATALOG } from '@/lib/data/services-catalog';
import { z } from 'zod';

const schema = z.object({
  phone:      z.string().min(1),
  sectionIds: z.array(z.string()).min(1).max(7),
});

function detectCardLanguage(recentInbound: string[]): 'ru' | 'es' {
  return /[А-Яа-яЁё]/.test(recentInbound.join(' ')) ? 'ru' : 'es';
}

function translateCardBody(sectionId: string, cardBody: string, lang: 'ru' | 'es'): string {
  if (lang !== 'ru') return cardBody;
  const map: Record<string, string> = {
    'declaraciones-impuestos':    '🧾 Налоговые декларации: НДФЛ, НДС, Модель 151, нерезиденты и другое. Что вас интересует?',
    'extranjeria-nacionalidad':   '🌍 Оформим ваш статус в Испании: вид на жительство, гражданство, аррайго и другое. Что нужно?',
    'trafico-capitania-maritima': '🚗 Переоформление авто, постановка на учёт, дубликаты и суда. Какой трámite нужен?',
    'notaria-propiedades':        '🏠 Купля-продажа, наследство, дарение и ипотека. Чем можем помочь?',
    'gestiones-especializadas':   '🔐 Мы авторизованный партнёр Camerfirma. Для физического лица или компании?',
    'formacion':                  '🎓 Практическое обучение: налоги, трудовое право, РRHH и Holded. От 180 €/2 ч. Что интересует?',
  };
  return map[sectionId] ?? cardBody;
}

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

    const { phone, sectionIds } = parsed.data;

    // Detect language from recent inbound messages
    const { data: recentMsgs } = await admin
      .from('whatsapp_conversations')
      .select('body')
      .eq('phone_number', phone)
      .eq('direction', 'inbound')
      .order('created_at', { ascending: false })
      .limit(5);
    const lang = detectCardLanguage((recentMsgs ?? []).map((m: { body: string }) => m.body));

    // Resolve clientId for logging
    const { data: profiles } = await admin.from('profiles').select('id, phone').not('phone', 'is', null);
    const clientId = mapWhatsAppMessageToClient(phone, profiles ?? []) ?? undefined;

    const selectedSections = SERVICES_CATALOG.filter((s) => sectionIds.includes(s.id));
    const sentIds: string[] = [];
    const errors: string[] = [];

    for (const section of selectedSections) {
      // 1. Send image if configured
      if (section.imageUrl) {
        const imgResult = await sendWhatsAppImageMessage({
          to: phone,
          imageUrl: section.imageUrl,
        });
        if (imgResult.success && imgResult.messageId) sentIds.push(imgResult.messageId);
        else if (!imgResult.success) errors.push(`img:${section.id}`);
      }

      // 2. Send button card with up to 3 service quick-replies
      const cardBodyText = translateCardBody(section.id, section.cardBody, lang);
      const buttons = section.services.slice(0, 3).map((s) => ({
        id:    `card_${s.id}`,
        title: s.title.slice(0, 20),
      }));

      const btnResult = await sendWhatsAppInteractive({
        to: phone,
        header: { type: 'text', text: `${section.emoji} ${section.title}`.slice(0, 60) },
        body: cardBodyText,
        footer: 'expertconsulting.es/cita',
        buttons,
      });

      if (btnResult.success && btnResult.messageId) {
        sentIds.push(btnResult.messageId);
        await logWhatsAppConversation({
          clientId,
          phoneNumber: phone,
          direction: 'outbound',
          body: `[Tarjeta] ${section.emoji} ${section.title}`,
          whatsappMessageId: btnResult.messageId,
          aiResponded: false,
          needsReview: false,
        });
      } else {
        errors.push(`btn:${section.id}`);
      }
    }

    if (sentIds.length === 0) {
      return NextResponse.json({ error: errors.join(', ') || 'No se pudo enviar ninguna tarjeta' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, sent: sentIds.length, errors: errors.length > 0 ? errors : undefined });
  } catch (err) {
    console.error('[WA catalog-cards]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
