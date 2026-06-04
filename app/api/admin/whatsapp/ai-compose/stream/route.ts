import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { buildOfficialSourceContext } from '@/lib/integrations/official-sources';
import { runKiaDecision } from '@/lib/ai/kia/kia-decision-engine';
import { normalizeKiaQuickReplies, quickRepliesToButtons } from '@/lib/ai/kia/kia-quick-replies';
import { buildNoRepeatInstruction } from '@/lib/ai/kia/kia-response-variation';
import { formatChecklistForPrompt, getChecklistsByCategory, getServiceChecklist } from '@/lib/utils/service-checklists';
import { resolveKiaContactContext } from '@/lib/integrations/kia-contact-resolver';
import type { KiaProgressEvent } from '@/lib/ai/kia/kia-progress';
import { z } from 'zod';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? admin : null;
}

const schema = z.object({
  clientId:  z.string().uuid().nullish(),
  phone:     z.string().min(1),
  history:   z.array(z.object({ direction: z.enum(['inbound', 'outbound']), body: z.string() })).max(40),
  intent:    z.string().max(2000).optional(),
  serviceId: z.string().optional(),
  replyTo:   z.object({
    direction:  z.enum(['inbound', 'outbound']),
    body:       z.string().max(500),
    created_at: z.string().optional(),
    media_type: z.string().nullable().optional(),
  }).optional(),
});

function cleanMarkdownForWhatsApp(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/gs, '*$1*')
    .replace(/__(.+?)__/gs, '_$1_')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/~~(.+?)~~/gs, '~$1~')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function detectLocale(text: string): 'es' | 'ru' {
  return /[А-Яа-яЁё]/.test(text) ? 'ru' : 'es';
}

function recentOutboundTexts(history: Array<{ direction: 'inbound' | 'outbound'; body: string }>): string[] {
  return history.filter((m) => m.direction === 'outbound').map((m) => m.body.trim()).filter(Boolean).slice(-6);
}

function fallbackQuickReplies(locale: 'es' | 'ru'): Array<{ id: string; title: string }> {
  return quickRepliesToButtons(normalizeKiaQuickReplies([
    { id: 'btn_write_here', title: locale === 'ru' ? 'Написать' : 'Escribir aquí', kind: 'secondary' },
    { id: 'btn_other', title: locale === 'ru' ? 'Другое' : 'Otro', kind: 'other' },
  ], locale, { ensureOther: true }));
}

function normalizeDraftQuickReplies(
  replies: Parameters<typeof normalizeKiaQuickReplies>[0],
  locale: 'es' | 'ru',
): Array<{ id: string; title: string }> {
  const normalized = quickRepliesToButtons(normalizeKiaQuickReplies(replies, locale, { ensureOther: true }));
  return normalized.length >= 2 ? normalized : fallbackQuickReplies(locale);
}

function sseData(event: KiaProgressEvent): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return new Response(null, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return new Response(null, { status: 400 });
  }

  const { clientId, history, intent, serviceId, replyTo } = parsed.data;
  const { phone } = parsed.data;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: KiaProgressEvent) => {
        try { controller.enqueue(sseData(event)); } catch { /* stream already closed */ }
      };

      try {
        emit({ type: 'thinking' });

        const contactCtx = await resolveKiaContactContext(admin, phone);

        let checklistContext = '';
        if (serviceId) {
          const checklist = getServiceChecklist(serviceId);
          if (checklist) checklistContext = `\nCHECKLIST DEL SERVICIO:\n${formatChecklistForPrompt(checklist)}`;
        } else if (!serviceId && contactCtx.openCases.length > 0) {
          const latestService = contactCtx.openCases[0].service;
          const inferred = getServiceChecklist(latestService) ?? getChecklistsByCategory(latestService)[0];
          if (inferred) checklistContext = `\nCHECKLIST DEL SERVICIO (inferido del expediente más reciente):\n${formatChecklistForPrompt(inferred)}`;
        }

        const historyText = history.slice(-25)
          .map((m) => `${m.direction === 'inbound' ? 'Cliente' : 'EXPERT'}: ${m.body}`)
          .join('\n');
        const antiRepeatInstruction = buildNoRepeatInstruction(recentOutboundTexts(history));
        const lastInbound = [...history].reverse().find((m) => m.direction === 'inbound')?.body ?? '';

        const replyToBlock = replyTo
          ? (() => {
              const who = replyTo.direction === 'inbound' ? 'Cliente' : 'EXPERT';
              const mIcon = replyTo.media_type === 'image' ? '📷 Imagen'
                : replyTo.media_type === 'audio' ? '🎤 Audio'
                : replyTo.media_type === 'video' ? '🎥 Vídeo'
                : replyTo.media_type ? '📎 Documento' : null;
              const snap = (mIcon ?? replyTo.body.replace(/\n+/g, ' ').trim()).slice(0, 200);
              return `\nESTÁS RESPONDIENDO ESPECÍFICAMENTE A ESTE MENSAJE:\n${who}: «${snap}»\nRedacta una respuesta directa a ese punto concreto, sin ignorar el resto del historial.\n`;
            })()
          : '';

        const intentText = intent ? `\nInstrucción del asesor: ${intent}` : '';
        const officialSourceContext = await buildOfficialSourceContext(`${historyText}\n${intent ?? ''}`);

        const structuredMessage = [
          'Redacta un borrador breve de WhatsApp para que lo revise un asesor humano antes de enviarlo.',
          intentText.trim() ? intentText.trim() : 'No hay instruccion adicional del asesor.',
          replyTo
            ? 'Hay un mensaje seleccionado. Responde a ese mensaje concreto y usa el historial solo como contexto.'
            : 'No hay mensaje seleccionado. Responde al ultimo punto relevante del historial.',
          replyToBlock.trim(),
          officialSourceContext || 'FUENTES OFICIALES DISPONIBLES: ninguna para este mensaje.',
          antiRepeatInstruction,
          checklistContext.trim(),
          'CONTEXTO DEL CLIENTE:',
          `Tipo: ${contactCtx.status} | Perfil: ${contactCtx.profileCompleted ? 'completado' : 'incompleto'} | Facturación: ${contactCtx.billingReady ? 'lista' : 'pendiente'}`,
          'CONVERSACION RECIENTE:',
          historyText || 'Sin historial previo.',
          'Reglas de formato: WhatsApp breve, maximo 3 parrafos, sin markdown complejo, accion concreta.',
        ].filter(Boolean).join('\n\n');

        const locale = detectLocale(`${lastInbound}\n${intent ?? ''}`);
        const result = await runKiaDecision({
          taskType: 'admin_ai_compose',
          channel: 'admin',
          message: structuredMessage,
          contextInput: {
            channel: 'admin',
            phone,
            clientId: contactCtx.clientId ?? clientId ?? undefined,
            leadId: contactCtx.leadId ?? undefined,
            serviceSlug: serviceId,
            latestMessage: lastInbound || intent || '',
          },
          locale,
          allowTools: true,
          onProgress: emit,
        });

        const draft = cleanMarkdownForWhatsApp(result.userMessage);
        emit({
          type: 'complete',
          draft,
          structured: true,
          quickReplies: normalizeDraftQuickReplies(result.decision.quickReplies, locale),
          decision: {
            intent: result.decision.intent,
            nextAction: result.decision.nextAction,
            confidence: result.decision.confidence,
            requiresMeeting: result.decision.requiresMeeting,
            requiresManualReview: result.decision.requiresManualReview,
            decisionSummary: result.decision.decisionSummary,
            rulesApplied: result.decision.rulesApplied,
            warnings: result.decision.warnings,
          } as Record<string, unknown>,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error interno';
        emit({ type: 'error', message });
      } finally {
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
      'Connection': 'keep-alive',
    },
  });
}
