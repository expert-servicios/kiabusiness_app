import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: caseId } = await params;
    const supabase = createServerSupabaseClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const admin = getSupabaseAdmin();

    const { data: adminProfile } = await admin
      .from('profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (adminProfile?.role !== 'tenant_admin' || !adminProfile.tenant_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { data: caseData } = await admin
      .from('cases')
      .select('id, client_id, service')
      .eq('id', caseId)
      .single();

    if (!caseData) return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });

    const { data: clientProfile } = await admin
      .from('profiles')
      .select('tenant_id')
      .eq('id', caseData.client_id)
      .single();

    if (clientProfile?.tenant_id !== adminProfile.tenant_id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.size === 0) return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: 'El archivo no puede superar 20 MB' }, { status: 400 });

    const ext = file.name.split('.').pop() ?? 'bin';
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${caseId}/${Date.now()}_${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await admin.storage
      .from('client-documents')
      .upload(storagePath, buffer, { contentType: file.type || `application/${ext}`, upsert: false });

    if (uploadError) {
      console.error('[tenant docs upload]', uploadError);
      return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 });
    }

    const { data: doc, error: docError } = await admin
      .from('documents')
      .insert({
        case_id: caseId,
        client_id: caseData.client_id,
        file_path: uploadData.path,
        original_name: file.name,
        state: 'pendiente',
        uploaded_by_role: 'admin',
      })
      .select('id, original_name, state, created_at, file_path, uploaded_by_role')
      .single();

    if (docError || !doc) return NextResponse.json({ error: 'Error al registrar el documento' }, { status: 500 });

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err) {
    console.error('[tenant docs POST]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
