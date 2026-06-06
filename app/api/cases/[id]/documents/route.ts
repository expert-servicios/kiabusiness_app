import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { syncDocumentToDrive } from '@/lib/integrations/google-drive';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: documents, error } = await supabase
      .from('documents')
      .select('id,original_name,state,created_at,file_path,uploaded_by_role')
      .eq('case_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Error al obtener documentos' }, { status: 500 });
    }

    return NextResponse.json({ documents: documents ?? [] });
  } catch (error) {
    console.error('Documents GET error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: caseId } = await params;
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userId = user.id;

    // Verify the case belongs to this user (or user is admin)
    const adminSupabase = getSupabaseAdmin();
    const { data: profile } = await adminSupabase.from('profiles').select('role').eq('id', userId).single();
    const isAdmin = profile?.role === 'admin';

    const { data: caseData, error: caseError } = await adminSupabase
      .from('cases')
      .select('id,client_id,service')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    if (!isAdmin && caseData.client_id !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo no puede superar 10 MB' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() ?? 'bin';
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${caseId}/${Date.now()}_${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await adminSupabase.storage
      .from('client-documents')
      .upload(storagePath, buffer, { contentType: file.type || `application/${ext}`, upsert: false });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 });
    }

    const clientId = isAdmin ? caseData.client_id : userId;
    const { data: doc, error: docError } = await adminSupabase
      .from('documents')
      .insert({
        case_id: caseId,
        client_id: clientId,
        file_path: uploadData.path,
        original_name: file.name,
        state: 'pendiente',
        uploaded_by_role: isAdmin ? 'admin' : 'client'
      })
      .select('id,original_name,state,created_at,file_path,uploaded_by_role')
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: 'Error al registrar el documento' }, { status: 500 });
    }

    // Non-blocking Drive sync — fetch client name then upload
    if (process.env.GOOGLE_DRIVE_CLIENTS_FOLDER_ID) {
      (async () => {
        try {
          const { data: profile } = await adminSupabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', clientId)
            .maybeSingle();
          const clientName = profile?.full_name ?? profile?.email ?? `cliente-${clientId}`;
          const serviceName = (caseData as { service?: string }).service ?? 'Expediente';

          const driveResult = await syncDocumentToDrive({
            fileBuffer: buffer,
            fileName: file.name,
            mimeType: file.type || `application/${ext}`,
            clientName,
            serviceName,
          });

          if (driveResult) {
            await adminSupabase
              .from('documents')
              .update({ metadata: { drive_file_id: driveResult.fileId, drive_url: driveResult.webViewLink } })
              .eq('id', doc.id);
          }
        } catch (e) {
          console.error('[Drive sync]', e);
        }
      })();
    }

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
