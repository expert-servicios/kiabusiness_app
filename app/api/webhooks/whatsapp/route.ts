import { NextRequest, NextResponse } from 'next/server';
import {
  logWhatsAppConversation,
  mapWhatsAppMessageToClient,
  sendWhatsAppMessage,
  sendWhatsAppInteractive,
} from '@/lib/integrations/whatsapp';
import { buildOfficialSourceContext } from '@/lib/integrations/official-sources';
import { generateWabaAiText, type WabaAiMessage } from '@/lib/integrations/waba-ai';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { notifyAdmins } from '@/lib/integrations/push';
import { sendEmail } from '@/lib/email/send';
import { documentRequired } from '@/lib/email/templates';

// Meta webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

function extractMessageText(msg: Record<string, unknown>): string | null {
  const type = msg.type as string;

  if (type === 'text') {
    return (msg.text as { body?: string })?.body?.trim() || null;
  }

  if (type === 'interactive') {
    const interactive = msg.interactive as Record<string, unknown>;
    const iType = interactive?.type as string;
    if (iType === 'button_reply') {
      return (interactive.button_reply as { title?: string })?.title?.trim() || null;
    }
    if (iType === 'list_reply') {
      return (interactive.list_reply as { title?: string })?.title?.trim() || null;
    }
  }

  return null;
}

function extractButtonId(msg: Record<string, unknown>): string | null {
  if (msg.type !== 'interactive') return null;
  const interactive = msg.interactive as Record<string, unknown>;
  if (interactive?.type === 'button_reply') {
    return (interactive.button_reply as { id?: string })?.id?.trim() || null;
  }
  if (interactive?.type === 'list_reply') {
    return (interactive.list_reply as { id?: string })?.id?.trim() || null;
  }
  return null;
}

const GREETING_RE = /^(hola|buenos|buenas|hi|hello|hey|buon|salut|ola|привет|добрый|здравствуйте|доброе|добрый день|добрый вечер|доброе утро)[\s!,.]*$/i;

function isFirstContact(history: { direction: string }[]): boolean {
  return !history.some((h) => h.direction === 'outbound');
}

function isGreetingMessage(body: string): boolean {
  return GREETING_RE.test(body.trim());
}

interface MenuButton { id: string; title: string }
interface MenuConfig  { body: string; buttons: MenuButton[] }

const WELCOME_INTERACTIVE: Record<'es' | 'ru', MenuConfig> = {
  es: {
    body: '¡Hola! 👋 Soy el asistente de EXPERT Asesoría. ¿En qué área podemos ayudarte?',
    buttons: [
      { id: 'cat_fiscal',      title: 'Fiscal / Impuestos' },
      { id: 'cat_extranjeria', title: 'Extranjería / NIE'  },
      { id: 'cat_empresa',     title: 'Empresa / Otros'    },
    ],
  },
  ru: {
    body: 'Привет! 👋 Я помощник EXPERT Gestoría. Чем могу помочь?',
    buttons: [
      { id: 'cat_fiscal',      title: 'Налоги / НДФЛ'    },
      { id: 'cat_extranjeria', title: 'ВНЖ / Гражданство' },
      { id: 'cat_empresa',     title: 'Бизнес / Другое'  },
    ],
  },
};

const CATEGORY_SUBMENUS: Record<string, Record<'es' | 'ru', MenuConfig>> = {
  cat_fiscal: {
    es: {
      body: '¿Qué trámite fiscal necesitas?',
      buttons: [
        { id: 'svc_irpf',          title: 'Declaración Renta' },
        { id: 'svc_autonomo',      title: 'Autónomo / IVA'    },
        { id: 'svc_no_residente',  title: 'No Residente'      },
      ],
    },
    ru: {
      body: 'Какой налоговый вопрос вас интересует?',
      buttons: [
        { id: 'svc_irpf',         title: 'Декларация НДФЛ'    },
        { id: 'svc_autonomo',     title: 'Самозанятый / НДС'  },
        { id: 'svc_no_residente', title: 'Нерезидент'         },
      ],
    },
  },
  cat_extranjeria: {
    es: {
      body: '¿Qué trámite de extranjería necesitas?',
      buttons: [
        { id: 'svc_residencia',   title: 'Permiso residencia' },
        { id: 'svc_nacionalidad', title: 'Nacionalidad'       },
        { id: 'svc_arraigo',      title: 'Arraigo / Familia'  },
      ],
    },
    ru: {
      body: 'Какой документ или статус вам нужен?',
      buttons: [
        { id: 'svc_residencia',   title: 'ВНЖ / Разрешение' },
        { id: 'svc_nacionalidad', title: 'Гражданство'       },
        { id: 'svc_arraigo',      title: 'Воссоединение'     },
      ],
    },
  },
  cat_empresa: {
    es: {
      body: '¿En qué más podemos ayudarte?',
      buttons: [
        { id: 'svc_empresa_sl', title: 'Empresa / SL'      },
        { id: 'svc_notaria',    title: 'Notaría / Inmueble' },
        { id: 'svc_trafico',    title: 'Tráfico / Certif.' },
      ],
    },
    ru: {
      body: 'Что ещё вас интересует?',
      buttons: [
        { id: 'svc_empresa_sl', title: 'Открыть компанию' },
        { id: 'svc_notaria',    title: 'Недвижимость'     },
        { id: 'svc_trafico',    title: 'Транспорт / ЭЦП'  },
      ],
    },
  },
};

// ── Service definitions — map button IDs to service info + required docs ─────

interface ServiceDef {
  service: string;
  serviceRu: string;
  category: string;
  docs: string[];
}

const SERVICE_DEFINITIONS: Record<string, ServiceDef> = {
  svc_irpf: {
    service: 'Declaración de la Renta (IRPF)',
    serviceRu: 'Декларация НДФЛ (IRPF)',
    category: 'declaraciones-impuestos',
    docs: [
      'DNI / NIE en vigor',
      'Número de referencia o Cl@ve PIN',
      'Borrador de la renta (si tienes acceso a la Sede Electrónica)',
      'Certificado de ingresos del empleador (modelo 10T / certificado empresa)',
      'Extracto bancario del año (si tienes inversiones, alquiler o cuentas en el extranjero)',
    ],
  },
  svc_autonomo: {
    service: 'Gestión Autónomo / IVA',
    serviceRu: 'Самозанятый / НДС',
    category: 'declaraciones-impuestos',
    docs: [
      'DNI / NIE en vigor',
      'Alta en Hacienda y RETA (mod. 036 / 037 y certificado alta RETA)',
      'Facturas emitidas del trimestre',
      'Facturas recibidas del trimestre (gastos deducibles)',
      'Extracto bancario del trimestre',
    ],
  },
  svc_no_residente: {
    service: 'Declaración No Residente (IRNR)',
    serviceRu: 'Декларация нерезидента (IRNR)',
    category: 'declaraciones-impuestos',
    docs: [
      'Pasaporte o NIE en vigor',
      'Escritura de la propiedad en España (si tiene inmueble)',
      'Certificado de residencia fiscal del país de residencia',
      'Recibos del IBI del año a declarar',
    ],
  },
  svc_residencia: {
    service: 'Permiso de Residencia',
    serviceRu: 'Разрешение на проживание (ВНЖ)',
    category: 'extranjeria-nacionalidad',
    docs: [
      'Pasaporte en vigor (copia de todas las páginas)',
      'TIE / NIE actual (si es renovación)',
      'Empadronamiento actualizado (no más de 3 meses)',
      'Contrato de trabajo, nóminas o medios económicos suficientes',
      'Seguro médico privado sin copago con cobertura en España',
      'Foto reciente en fondo blanco (tamaño carné)',
    ],
  },
  svc_nacionalidad: {
    service: 'Nacionalidad Española',
    serviceRu: 'Испанское гражданство',
    category: 'extranjeria-nacionalidad',
    docs: [
      'Pasaporte en vigor',
      'TIE / NIE vigente',
      'Certificado de empadronamiento histórico (residencia continuada)',
      'Antecedentes penales del país de origen (apostillado y traducido)',
      'Certificado de nacimiento apostillado y con traducción jurada',
      'Certificado de matrimonio si aplica (apostillado y traducido)',
    ],
  },
  svc_arraigo: {
    service: 'Arraigo / Reagrupación Familiar',
    serviceRu: 'Укоренение / Воссоединение семьи',
    category: 'extranjeria-nacionalidad',
    docs: [
      'Pasaporte en vigor',
      'Empadronamiento histórico (últimos 2-3 años según tipo)',
      'Contrato de trabajo o informe arraigo social / familiar',
      'Medios económicos suficientes (nóminas o extracto bancario)',
    ],
  },
  svc_empresa_sl: {
    service: 'Constitución de Empresa / SL',
    serviceRu: 'Открытие компании (SL)',
    category: 'empresas-autonomos',
    docs: [
      'DNI / NIE en vigor de todos los socios',
      '3 opciones de nombre para la sociedad',
      'Capital social a aportar (mínimo 3.000 €)',
      'Actividad principal (descripción del negocio o CNAE)',
      'Domicilio social (dirección postal en España)',
    ],
  },
  svc_notaria: {
    service: 'Notaría / Gestión de Inmueble',
    serviceRu: 'Нотариат / Недвижимость',
    category: 'notaria-propiedades',
    docs: [
      'DNI / NIE en vigor de todos los intervinientes',
      'Escritura de propiedad actual',
      'Nota simple del Registro de la Propiedad (menos de 3 meses)',
      'Últimos recibos del IBI pagados',
    ],
  },
  svc_trafico: {
    service: 'Gestión Tráfico / Certificado',
    serviceRu: 'Tráfico / Сертификат',
    category: 'trafico-capitania-maritima',
    docs: [
      'DNI / NIE en vigor',
      'Permiso de circulación o ficha técnica del vehículo (si aplica)',
      'Carnet de conducir (si aplica)',
      'Descripción de la gestión a realizar (transferencia, baja, multa, etc.)',
    ],
  },
};

// ── Lead capture helpers ──────────────────────────────────────────────────────

const LEAD_CAPTURE_MSG: Record<'es' | 'ru', string> = {
  es: 'Para atenderte bien, ¿podrías indicarme tu *nombre completo* y tu *correo electrónico*? Así creo tu ficha en nuestro sistema. 📋',
  ru: 'Чтобы помочь вам эффективнее, укажите, пожалуйста, ваше *полное имя* и *адрес электронной почты* — так я создам вашу карточку в нашей системе. 📋',
};

function needsLeadCapture(history: { direction: string; body: string }[]): boolean {
  const hasMenuInteraction = history.some(
    (h) => h.direction === 'outbound' && (h.body.startsWith('[Bienvenida]') || h.body.startsWith('[Menú]'))
  );
  const alreadySent = history.some(
    (h) => h.direction === 'outbound' && h.body.startsWith('[Captando]')
  );
  return hasMenuInteraction && !alreadySent;
}

function isAnsweringLeadCapture(history: { direction: string; body: string }[]): boolean {
  const outbound = history.filter((h) => h.direction === 'outbound');
  const last = outbound[outbound.length - 1];
  return (last?.body ?? '').startsWith('[Captando]');
}

function extractLeadInfo(text: string): { name: string | null; email: string | null } {
  const emailMatch = text.match(/[\w.+%-]+@[\w-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch?.[0] ?? null;
  const cleaned = text.replace(email ?? '', '').replace(/[,;|]/g, ' ').trim();
  const words = cleaned.split(/\s+/).filter((w) => w.length > 1 && !/^[\d+()]+$/.test(w)).slice(0, 5);
  const name = words.length >= 1 ? words.join(' ').slice(0, 80) : null;
  return { name, email };
}

function extractLeadFromHistory(history: { direction: string; body: string }[]): { name: string | null; email: string | null } | null {
  const captandoIdx = history.map((h, i) => ({ h, i }))
    .filter(({ h }) => h.direction === 'outbound' && h.body.startsWith('[Captando]'))
    .pop()?.i ?? -1;
  if (captandoIdx < 0) return null;
  const responseAfter = history.slice(captandoIdx + 1).find((h) => h.direction === 'inbound');
  if (!responseAfter) return null;
  return extractLeadInfo(responseAfter.body);
}

async function saveWhatsAppLead(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  phone: string,
  name: string | null,
  email: string | null
) {
  try {
    await admin.from('leads').upsert(
      { phone, name, email, source: 'whatsapp', updated_at: new Date().toISOString() },
      { onConflict: 'phone' }
    );
  } catch (e) {
    console.error('[WA lead save]', e);
  }
}

function humanHasIntervened(history: { direction: string; body: string }[]): boolean {
  // If last outbound message is NOT a bot-tagged message, a human took over
  const outbound = history.filter((h) => h.direction === 'outbound');
  const last = outbound[outbound.length - 1];
  if (!last) return false;
  const botTags = ['[Bienvenida]', '[Menú]', '[Captando]', '[Botones]'];
  const isBot = botTags.some((tag) => last.body.startsWith(tag));
  // Heuristic: if last outbound is a long message not tagged as bot, it may be human
  return !isBot && last.body.length > 30;
}

// Extracts pending service ID from a [Captando:svc_X] tag in the last outbound message
function getPendingService(history: { direction: string; body: string }[]): string | null {
  const outbound = history.filter((h) => h.direction === 'outbound');
  const last = outbound[outbound.length - 1];
  const match = (last?.body ?? '').match(/^\[Captando:(svc_[a-z_]+)\]/);
  return match?.[1] ?? null;
}

// Opens an expediente (or updates lead) and sends WA + email confirmation
async function openExpediente({
  admin,
  clientId,
  phone,
  serviceDef,
  name,
  email,
  lang,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any;
  clientId?: string;
  phone: string;
  serviceDef: ServiceDef;
  name: string;
  email: string | null;
  lang: 'es' | 'ru';
}) {
  const displayService = lang === 'ru' ? serviceDef.serviceRu : serviceDef.service;

  if (clientId) {
    try {
      await admin.from('cases').insert({
        client_id: clientId,
        category: serviceDef.category,
        service: serviceDef.service,
        state: 'docs_pendientes',
        docs_checklist: serviceDef.docs,
      });
    } catch (e) {
      console.error('[WA case create]', e);
    }
  } else {
    try {
      await admin.from('leads').upsert(
        {
          phone,
          name,
          email,
          source: 'whatsapp',
          notes: `Interesado/a en: ${serviceDef.service}`,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'phone' }
      );
    } catch (e) {
      console.error('[WA lead update service]', e);
    }
  }

  if (email) {
    try {
      const tpl = documentRequired(name, serviceDef.service, serviceDef.docs);
      await sendEmail({
        to: email,
        eventType: 'case.docs_required',
        ...tpl,
        metadata: { service: serviceDef.service, source: 'whatsapp' },
      });
    } catch (e) {
      console.error('[WA case email]', e);
    }
  }

  const topDocs = serviceDef.docs.slice(0, 5).map((d) => `• ${d}`).join('\n');
  let confirmMsg: string;
  if (lang === 'ru') {
    const emailNote = email ? `\n\nТакже отправил(а) полный список на *${email}*.` : '';
    confirmMsg = `✅ Ваша заявка по *${displayService}* принята!\n\n*Документы, которые понадобятся:*\n${topDocs}\n${emailNote}\n\nЕсли есть вопросы по документам — пишите, я здесь. Asesoría EXPERT 💼`;
  } else {
    const emailNote = email ? `\n\nTambién te he enviado el listado completo a *${email}*.` : '';
    confirmMsg = `✅ He abierto tu expediente de *${displayService}*.\n\n*Documentos que necesitaremos:*\n${topDocs}\n${emailNote}\n\n¿Tienes dudas sobre algún documento? Estoy aquí para ayudarte. Asesoría EXPERT 💼`;
  }

  const sent = await sendWhatsAppMessage({ to: phone, body: confirmMsg });
  if (sent.success) {
    await logWhatsAppConversation({
      clientId,
      phoneNumber: phone,
      direction: 'outbound',
      body: confirmMsg,
      whatsappMessageId: sent.messageId,
      aiResponded: false,
      needsReview: false,
    });
  }
}

// Incoming messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages = body?.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages || messages.length === 0) {
      return NextResponse.json({ received: true });
    }

    const admin = getSupabaseAdmin();
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, phone, whatsapp_number, full_name')
      .or('phone.not.is.null,whatsapp_number.not.is.null');

    for (const msg of messages) {
      const msgType = msg.type as string;
      if (!['text', 'interactive'].includes(msgType)) continue;

      const from: string = msg.from;
      const msgBody = extractMessageText(msg as Record<string, unknown>);
      if (!msgBody) continue;

      const messageId: string = msg.id;
      const clientId = mapWhatsAppMessageToClient(from, profiles ?? []) ?? undefined;

      // Log inbound message
      await logWhatsAppConversation({
        clientId,
        phoneNumber: from,
        direction: 'inbound',
        body: msgBody,
        whatsappMessageId: messageId,
      });

      // Push notification to admins (non-blocking)
      const senderName = profiles?.find((p) => p.id === clientId)?.full_name ?? from;
      notifyAdmins({
        title: `WhatsApp de ${senderName}`,
        body: msgBody.length > 100 ? msgBody.slice(0, 97) + '…' : msgBody,
        url: '/admin/whatsapp',
        tag: `wa-${from}`,
      }).catch(() => {});

      // Fetch conversation history for context (last 8 turns, oldest first)
      const { data: history } = await admin
        .from('whatsapp_conversations')
        .select('direction, body, created_at')
        .eq('phone_number', from)
        .neq('whatsapp_message_id', messageId)
        .order('created_at', { ascending: false })
        .limit(8);

      const conversationHistory = (history ?? []).reverse() as { direction: string; body: string }[];

      // --- DETERMINISTIC MENU INTERCEPTION ---
      const buttonId = extractButtonId(msg as Record<string, unknown>);
      const menuLang: 'es' | 'ru' = /[А-Яа-яЁё]/.test(msgBody) ? 'ru' : 'es';

      // Level 2: category button tap → send specific service submenu
      if (buttonId && CATEGORY_SUBMENUS[buttonId]) {
        const submenu = CATEGORY_SUBMENUS[buttonId][menuLang];
        const sent = await sendWhatsAppInteractive({
          to: from,
          body: submenu.body,
          footer: 'Asesoría EXPERT 💼',
          buttons: submenu.buttons,
        });
        if (sent.success) {
          await logWhatsAppConversation({
            clientId,
            phoneNumber: from,
            direction: 'outbound',
            body: `[Menú] ${submenu.body} | ${submenu.buttons.map((b) => b.title).join(' / ')}`,
            whatsappMessageId: sent.messageId,
            aiResponded: false,
            needsReview: false,
          });
        }
        continue;
      }

      // Level 3: service button tap → open expediente or capture lead first
      if (buttonId && SERVICE_DEFINITIONS[buttonId]) {
        const serviceDef = SERVICE_DEFINITIONS[buttonId];
        const lang: 'es' | 'ru' = /[А-Яа-яЁё]/.test(msgBody) ? 'ru' : 'es';
        const leadInfo = extractLeadFromHistory(conversationHistory);

        if (!clientId && !leadInfo) {
          // No identity yet — ask for name+email tagging the selected service
          const captureMsg = LEAD_CAPTURE_MSG[lang];
          const sent = await sendWhatsAppMessage({ to: from, body: captureMsg });
          if (sent.success) {
            await logWhatsAppConversation({
              clientId,
              phoneNumber: from,
              direction: 'outbound',
              body: `[Captando:${buttonId}] ${captureMsg}`,
              whatsappMessageId: sent.messageId,
              aiResponded: false,
              needsReview: false,
            });
          }
        } else {
          const profileName = clientId
            ? (profiles?.find((p) => p.id === clientId)?.full_name ?? null)
            : null;
          const name = profileName ?? leadInfo?.name ?? 'cliente';
          const email = clientId ? null : (leadInfo?.email ?? null);
          await openExpediente({ admin, clientId, phone: from, serviceDef, name, email, lang });
        }
        continue;
      }

      // Level 1: first contact OR greeting → send welcome buttons
      if (isFirstContact(conversationHistory) || (!buttonId && isGreetingMessage(msgBody))) {
        const welcome = WELCOME_INTERACTIVE[menuLang];
        const sent = await sendWhatsAppInteractive({
          to: from,
          body: welcome.body,
          footer: 'Asesoría EXPERT 💼',
          buttons: welcome.buttons,
        });
        if (sent.success) {
          await logWhatsAppConversation({
            clientId,
            phoneNumber: from,
            direction: 'outbound',
            body: `[Bienvenida] ${welcome.body}`,
            whatsappMessageId: sent.messageId,
            aiResponded: false,
            needsReview: false,
          });
        }
        continue;
      }
      // --- END DETERMINISTIC MENU ---

      // --- LEAD CAPTURE ---
      // If Ksenia has manually taken over this conversation, suppress the bot entirely
      if (humanHasIntervened(conversationHistory)) continue;

      let extractedLead: { name: string | null; email: string | null } | null = null;

      if (isAnsweringLeadCapture(conversationHistory)) {
        // This message is the user's reply to the lead-capture question → persist it
        const info = extractLeadInfo(msgBody);
        extractedLead = info;
        await saveWhatsAppLead(admin, from, info.name, info.email);

        // If there was a pending service selection, open the expediente now
        const pendingServiceId = getPendingService(conversationHistory);
        if (pendingServiceId && SERVICE_DEFINITIONS[pendingServiceId]) {
          const serviceDef = SERVICE_DEFINITIONS[pendingServiceId];
          const lang: 'es' | 'ru' = /[А-Яа-яЁё]/.test(msgBody) ? 'ru' : 'es';
          await openExpediente({
            admin,
            clientId,
            phone: from,
            serviceDef,
            name: info.name ?? 'cliente',
            email: info.email ?? null,
            lang,
          });
          continue;
        }
      } else {
        extractedLead = extractLeadFromHistory(conversationHistory);
      }

      // No lead info yet and the contact is unknown → ask before calling AI
      if (!extractedLead && !clientId && needsLeadCapture(conversationHistory)) {
        const lang: 'es' | 'ru' = /[А-Яа-яЁё]/.test(msgBody) ? 'ru' : 'es';
        const captureMsg = LEAD_CAPTURE_MSG[lang];
        const sent = await sendWhatsAppMessage({ to: from, body: captureMsg });
        if (sent.success) {
          await logWhatsAppConversation({
            clientId,
            phoneNumber: from,
            direction: 'outbound',
            body: `[Captando] ${captureMsg}`,
            whatsappMessageId: sent.messageId,
            aiResponded: false,
            needsReview: false,
          });
        }
        continue;
      }
      // --- END LEAD CAPTURE ---

      // Generate AI response
      const aiResult = await generateAiResponse({ clientId, from, msgBody, admin, conversationHistory, extractedLead });

      if (aiResult.interactive) {
        const { body: interactiveBody, buttons } = aiResult.interactive;
        const waButtons = buttons.map((title, i) => ({ id: `opt_${i}`, title }));

        const sent = await sendWhatsAppInteractive({
          to: from,
          body: interactiveBody,
          footer: 'Asesoría EXPERT 💼',
          buttons: waButtons,
        });

        if (sent.success) {
          const loggedBody = `[Botones] ${interactiveBody} | ${waButtons.map((b) => b.title).join(' / ')}`;
          await logWhatsAppConversation({
            clientId,
            phoneNumber: from,
            direction: 'outbound',
            body: loggedBody,
            whatsappMessageId: sent.messageId,
            aiResponded: true,
            needsReview: false,
          });
        }
      } else if (aiResult.reply) {
        const sent = await sendWhatsAppMessage({ to: from, body: aiResult.reply });
        if (sent.success) {
          await logWhatsAppConversation({
            clientId,
            phoneNumber: from,
            direction: 'outbound',
            body: aiResult.reply,
            whatsappMessageId: sent.messageId,
            aiResponded: true,
            needsReview: false,
          });
        }
      } else {
        // AI couldn't answer — mark conversation as needs_review
        await admin
          .from('whatsapp_conversations')
          .update({ needs_review: true })
          .eq('phone_number', from)
          .eq('direction', 'inbound')
          .is('read_at', null);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[WhatsApp webhook] error:', error);
    return NextResponse.json({ received: true });
  }
}

interface AiContext {
  clientId?: string;
  from: string;
  msgBody: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any;
  conversationHistory: { direction: string; body: string }[];
  extractedLead?: { name: string | null; email: string | null } | null;
}

interface AiResult {
  reply: string | null;
  interactive?: { body: string; buttons: string[] };
}

function detectLanguageInstruction(text: string): string {
  if (/[А-Яа-яЁё]/.test(text)) {
    return 'ruso. Responde en ruso natural usando alfabeto cirilico. No respondas en espanol salvo que el cliente lo pida.';
  }
  if (/[À-ÿ¿¡]/.test(text) || /\b(hola|buenos|buenas|declaracion|declaración|renta|autonomo|autónomo|empresa)\b/i.test(text)) {
    return 'espanol. Responde en espanol.';
  }
  return 'el mismo idioma del ultimo mensaje del cliente. Si hay duda, usa espanol solo si el cliente uso espanol.';
}

async function generateAiResponse({ clientId, msgBody, admin, conversationHistory, extractedLead }: AiContext): Promise<AiResult> {
  let clientContext = '';
  const languageInstruction = detectLanguageInstruction(msgBody);
  const officialSourceContext = await buildOfficialSourceContext(
    [...conversationHistory.slice(-3).map((h) => `${h.direction}: ${h.body}`), `inbound: ${msgBody}`].join('\n')
  );

  if (clientId) {
    const [{ data: profile }, { data: cases }, { data: obligations }] = await Promise.all([
      admin.from('profiles').select('full_name, email, phone').eq('id', clientId).single(),
      admin.from('cases').select('service, category, state, opened_at').eq('client_id', clientId).order('opened_at', { ascending: false }).limit(5),
      admin.from('fiscal_obligations').select('modelo, description, deadline, status').eq('user_id', clientId).eq('status', 'pending').order('deadline').limit(5),
    ]);

    const name = profile?.full_name ?? extractedLead?.name ?? 'el cliente';
    const caseList = (cases ?? [])
      .map(
        (c: { service: string; category: string; state: string; opened_at: string }) =>
          `- ${c.service} (${c.category}): estado "${c.state}", abierto el ${new Date(c.opened_at).toLocaleDateString('es-ES')}`
      )
      .join('\n');
    const obList = (obligations ?? [])
      .map(
        (o: { modelo: string; description: string; deadline: string }) =>
          `- M${o.modelo} ${o.description}: vence ${new Date(o.deadline).toLocaleDateString('es-ES')}`
      )
      .join('\n');

    clientContext = `Cliente: ${name}
Expedientes activos:
${caseList || 'Ninguno'}
Obligaciones fiscales pendientes:
${obList || 'Ninguna'}`;
  } else if (extractedLead?.name || extractedLead?.email) {
    const name = extractedLead.name ?? 'cliente';
    const email = extractedLead.email ? ` · email: ${extractedLead.email}` : '';
    clientContext = `Contacto identificado por WhatsApp: ${name}${email}
Sin cuenta en el portal todavía. Dirígete a él/ella por su nombre.`;
  } else {
    clientContext = 'Número desconocido — no hay cliente registrado con este teléfono. Aún no sabemos su nombre.';
  }

  const systemPrompt = `Eres el asistente virtual de EXPERT Asesoría, gestoría española y Partner Oficial de Holded (ERP/CRM líder para pymes en España).
Nuestra web: https://expertconsulting.es

SERVICIOS:
• Fiscal: IRPF, IVA (Mod. 303/390), Sociedades (Mod. 200), RETA, altas/bajas censales
• Extranjería: NIE, permisos de residencia, arraigo, nacionalidad, reagrupación familiar
• Empresa: constitución SL, autónomo, cambios estatutarios, ampliaciones de capital
• Laboral: contratos, nóminas, Seguridad Social, despidos, ERTEs
• Contabilidad: libros oficiales, cuentas anuales
• Holded (Partner Oficial): implantación ERP, formación, módulos (facturación, contabilidad, inventario, proyectos, RRHH, CRM), integraciones, demo gratuita

PÁGINAS CLAVE (comparte el enlace completo cuando sea relevante):
• Servicios → https://expertconsulting.es/servicios
• Planes y precios → https://expertconsulting.es/planes
• Presupuesto → https://expertconsulting.es/solicitar-presupuesto
• Cita gratuita → https://expertconsulting.es/cita
• Holded → https://expertconsulting.es/holded
• Formación Holded → https://expertconsulting.es/servicios/formacion

═══════════════════════════════════════
FORMATO DE RESPUESTA — ELIGE UNO:
═══════════════════════════════════════

OPCIÓN A — TEXTO (la mayoría de casos):
Responde directamente con texto claro y conciso. Máximo 3 párrafos cortos.
Termina siempre con una CTA natural con enlace. Firma: "Asesoría EXPERT 💼"

OPCIÓN B — BOTONES INTERACTIVOS (solo cuando la consulta es demasiado vaga para responder):
Responde ÚNICAMENTE con este JSON exacto, sin texto antes ni después:
{"type":"btns","body":"Tu mensaje introductorio aquí","buttons":["Botón 1","Botón 2","Botón 3"]}

Reglas de botones:
- Mínimo 2, máximo 3 botones
- Cada botón: máximo 20 caracteres, sin emojis ni puntuación especial
- El campo "body" puede tener hasta 1024 caracteres

CUÁNDO usar botones — necesitas saber la situación del cliente antes de poder ayudar:
✓ Saludos genéricos: "Hola", "Buenos días", "Привет", "Здравствуйте"
✓ Ayuda sin contexto: "Necesito ayuda", "Tengo una pregunta", "Нужна помощь"
✓ Precio sin especificar: "¿Cuánto cuesta?" / "Сколько стоит?"
✓ Declaración de ingresos sin decir su situación: "quiero hacer la declaración de la renta", "Я хочу подать декларацию на доходы", "declaración IRPF"
  → botones: su situación laboral (empleado / autónomo / empresa)
✓ "¿Qué servicios tenéis?" / "Какие у вас услуги?"

EJEMPLO de respuesta con botones para "Я бы хотела подать декларацию на доходы":
{"type":"btns","body":"Чтобы подобрать нужную декларацию, уточните вашу ситуацию 👇","buttons":["Я работник","Самозанятый(ая)","Есть компания"]}

CUÁNDO NO usar botones (responde con texto directamente):
✗ "¿Cuánto cuesta montar una SL?" → responde sobre constitución de empresa
✗ "Soy autónomo y quiero llevar mi contabilidad" → responde directamente
✗ "¿Qué es Holded?" → responde sobre Holded
✗ Si el historial muestra "[Bienvenida]" o "[Menú]" → el cliente ya seleccionó categoría; responde con texto
✗ Si el usuario YA eligió un botón en el turno anterior → responde con texto, no pongas más botones
✗ Si hay historial de conversación y ya sabes qué quiere → responde con texto
IMPORTANTE: El sistema ya muestra menús interactivos de forma automática para saludos y primeras preguntas genéricas. NUNCA uses OPCIÓN B si el historial contiene "[Bienvenida]" o "[Menú]".

IDIOMA DE LOS BOTONES: los botones deben estar en el mismo idioma que el cliente. Si escribe en ruso, los botones en ruso (máx. 20 caracteres cirílicos). Si en español, en español.

ACTITUD PROACTIVA:
- Termina cada respuesta de texto con una CTA clara pero natural
- Varía la CTA: reservar cita, pedir presupuesto, ver planes, ver Holded...
- Si preguntan por Holded → menciona "Partner Oficial" y ofrece demo gratuita
- Adapta el tono: cercano pero profesional
- WhatsApp no sustituye el portal: orienta, recoge el mínimo contexto necesario y lleva al cliente a cita, presupuesto o panel seguro

CONTACTO DIRECTO:
- Email general: info@expertconsulting.es (compártelo si lo piden)
- Para hablar con una persona / asesora: soy@kseniailicheva.com o cita gratuita en https://expertconsulting.es/cita
- Si piden hablar con un humano, menciona ambas opciones (email + cita)

FORMATO WHATSAPP — NEGRITA:
- Para negrita usa UN solo asterisco: *texto* (NO doble: ~~**texto**~~)
- El formato markdown normal (doble asterisco) NO funciona en WhatsApp

PERSONALIZACIÓN:
- Si conoces el nombre del cliente (CONTEXTO DEL CLIENTE más abajo), úsalo en el saludo y al menos una vez más en la respuesta
- Si no tienes nombre, no inventes ninguno

REGLAS GENERALES:
- Idioma obligatorio para esta respuesta: ${languageInstruction}
- Si el cliente escribe en ruso/cirílico, toda la respuesta debe estar en ruso/cirílico, incluida la CTA y la firma
- Emojis con moderación: ✅ 👋 📋 📅 💼 🚀 😊
- Si hay fuentes oficiales disponibles, usalas para orientar y comparte 1 o 2 enlaces oficiales utiles
- No digas que has comprobado informacion oficial si no aparece en FUENTES OFICIALES DISPONIBLES
- Si requiere decisión profesional compleja o documentación específica → responde EXACTAMENTE: [NEEDS_REVIEW]
- Nunca inventes plazos, precios exactos ni documentos
- No hagas listas largas para una primera consulta. Máximo 2 preguntas de aclaración antes de enlazar a cita o presupuesto

${officialSourceContext || 'FUENTES OFICIALES DISPONIBLES: ninguna para este mensaje.'}

CONTEXTO DEL CLIENTE:
${clientContext}`;

  // Build messages array with conversation history
  const messages: WabaAiMessage[] = conversationHistory.map((h) => ({
    role: h.direction === 'inbound' ? 'user' : 'assistant',
    content: h.body,
  }));
  messages.push({ role: 'user', content: msgBody });

  try {
    const ai = await generateWabaAiText({ systemPrompt, messages, maxTokens: 500 });
    const text = ai?.text.trim() ?? '';

    if (!text || text.includes('[NEEDS_REVIEW]')) return { reply: null };

    // Normalize bold: AI sometimes outputs **text** but WhatsApp only renders *text*
    const normalizedText = text.replace(/\*\*(.+?)\*\*/gs, '*$1*');

    // Detect interactive button response (starts with { "type": "btns" ... })
    if (normalizedText.startsWith('{')) {
      try {
        const parsed = JSON.parse(normalizedText) as { type?: string; body?: string; buttons?: unknown[] };
        if (
          parsed.type === 'btns' &&
          typeof parsed.body === 'string' &&
          Array.isArray(parsed.buttons) &&
          parsed.buttons.length >= 2
        ) {
          const buttons = (parsed.buttons as unknown[])
            .filter((b): b is string => typeof b === 'string')
            .slice(0, 3)
            .map((b) => b.slice(0, 20));

          if (buttons.length >= 2) {
            return { reply: null, interactive: { body: parsed.body, buttons } };
          }
        }
      } catch {
        // Not valid JSON — fall through to text response
      }
    }

    return { reply: normalizedText };
  } catch (err) {
    console.error('[WhatsApp AI] error:', err);
    return { reply: null };
  }
}
