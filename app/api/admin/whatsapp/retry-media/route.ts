import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';
import { downloadAndStoreWhatsAppMedia } from '@/lib/integrations/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminClient(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { conversationId } = await request.json() as { conversationId: string };
    if (!conversationId) return NextResponse.json({ error: 'conversationId required' }, { status: 400 });

    const { data: conv, error } = await admin
      .from('whatsapp_conversations')
      .select('id, phone_number, client_id, media_type, meta_media_id, media_url')
      .eq('id', conversationId)
      .single();

    if (error || !conv) return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 });
    if (!conv.meta_media_id) return NextResponse.json({ error: 'Sin Meta media ID — no se puede reintentar' }, { status: 400 });
    if (conv.media_url) return NextResponse.json({ error: 'El archivo ya tiene URL válida' }, { status: 400 });

    const mediaType = conv.media_type as string;
    const ext = mediaType === 'image' ? 'jpg' : mediaType === 'audio' ? 'ogg' : mediaType === 'video' ? 'mp4' : 'pdf';
    const filename = `archivo.${ext}`;

    const storedUrl = await downloadAndStoreWhatsAppMedia(
      conv.meta_media_id,
      mediaType,
      filename,
      conv.phone_number,
      conv.client_id ?? undefined,
    );

    if (!storedUrl) return NextResponse.json({ error: 'Descarga fallida — el archivo puede haber expirado en Meta' }, { status: 502 });

    await admin
      .from('whatsapp_conversations')
      .update({ media_url: storedUrl })
      .eq('id', conversationId);

    return NextResponse.json({ ok: true, url: storedUrl });
  } catch (err) {
    console.error('[retry-media]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
