import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { logWhatsAppConversation } from '@/lib/integrations/whatsapp';
import { z } from 'zod';

const schema = z.object({
  to: z.string().min(1),
  templateName: z.string().min(1),
  params: z.array(z.string()),
  language: z.string().default('es'),
});

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const json = await request.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const { to, templateName, params, language } = parsed.data;
  const phone = to.replace(/\D/g, '');

  const body = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: language },
      components: params.length > 0
        ? [{ type: 'body', parameters: params.map((p) => ({ type: 'text', text: p })) }]
        : [],
    },
  };

  const res = await fetch(
    `https://graph.facebook.com/v20.0/${process.env.META_WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.META_WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    console.error('[WA template]', data);
    return NextResponse.json({ error: data?.error?.message ?? 'Error al enviar plantilla' }, { status: 500 });
  }

  // Find client
  const { data: clientProfile } = await admin.from('profiles').select('id').filter('phone', 'ilike', `%${phone.slice(-9)}%`).maybeSingle();

  // Build preview text for log
  const preview = `[Plantilla: ${templateName}] ${params.join(' · ')}`;
  await logWhatsAppConversation({
    clientId: clientProfile?.id,
    phoneNumber: phone,
    direction: 'outbound',
    body: preview,
    whatsappMessageId: data?.messages?.[0]?.id,
  });

  return NextResponse.json({ success: true, messageId: data?.messages?.[0]?.id });
}
