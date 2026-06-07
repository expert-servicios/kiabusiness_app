import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (profile?.role === 'admin' || profile?.role === 'owner') ? admin : null;
}

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg':       'image',
  'image/png':        'image',
  'image/gif':        'image',
  'image/webp':       'image',
  'application/pdf':  'document',
  'audio/ogg':        'audio',
  'audio/mpeg':       'audio',
};

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });

    const waType = ALLOWED_TYPES[file.type];
    if (!waType) {
      return NextResponse.json({ error: `Tipo no permitido: ${file.type}` }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo supera 10 MB' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() ?? 'bin';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { data, error } = await admin.storage
      .from('whatsapp-attachments')
      .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

    if (error || !data) {
      console.error('[WA upload]', error);
      return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 });
    }

    const { data: { publicUrl } } = admin.storage
      .from('whatsapp-attachments')
      .getPublicUrl(data.path);

    return NextResponse.json({
      url: publicUrl,
      waType,
      filename: file.name,
      mimeType: file.type,
    });
  } catch (err) {
    console.error('[WA upload]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
