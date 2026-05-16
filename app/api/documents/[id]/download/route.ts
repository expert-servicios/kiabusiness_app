import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();

    const { data: doc, error: docError } = await admin
      .from('documents')
      .select('id, file_path, original_name, client_id, case_id')
      .eq('id', id)
      .single();

    if (docError || !doc || !doc.file_path) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin';

    if (!isAdmin && doc.client_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { data: signedData, error: signError } = await admin.storage
      .from('client-documents')
      .createSignedUrl(doc.file_path, 60 * 5); // 5 minutes

    if (signError || !signedData?.signedUrl) {
      return NextResponse.json({ error: 'Error al generar enlace de descarga' }, { status: 500 });
    }

    return NextResponse.json({ url: signedData.signedUrl, name: doc.original_name });
  } catch (error) {
    console.error('Document download error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
