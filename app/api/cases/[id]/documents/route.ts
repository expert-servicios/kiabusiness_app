import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { syncDocumentToDrive } from '@/lib/integrations/google-drive';
import { notifyTenantAdminDocUploaded } from '@/lib/email/notify-tenant-admins';
import { notifyAdmins } from '@/lib/integrations/push';
import {
  buildClientDocumentStoragePath,
  CLIENT_DOCUMENT_MAX_BYTES,
  validateClientDocumentFile,
} from '@/lib/security/uploads';

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
      .select('id,original_name,state,created_at,file_path,uploaded_by_role,company_id,drive_file_id,mime_type')
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

async function resolveDocumentCompany(
  admin: ReturnType<typeof getSupabaseAdmin>,
  clientId: string,
  caseCompanyId: string | null,
): Promise<string | null> {
  if (caseCompanyId) return caseCompanyId;

  const { data: memberships, error } = await admin
    .from('profile_companies')
    .select('company_id')
    .eq('profile_id', clientId);
  if (error) throw new Error(`Could not resolve document company: ${error.message}`);

  const companyIds = Array.from(new Set((memberships ?? []).map((row) => row.company_id).filter(Boolean)));
  return companyIds.length === 1 ? companyIds[0] : null;
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
    const adminSupabase = getSupabaseAdmin();
    const { data: profile } = await adminSupabase.from('profiles').select('role').eq('id', userId).single();
    const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';

    const { data: caseData, error: caseError } = await adminSupabase
      .from('cases')
      .select('id,client_id,company_id,service')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    if (!caseData.client_id) {
      return NextResponse.json({ error: 'El expediente no tiene cliente asociado' }, { status: 409 });
    }

    if (!isAdmin && caseData.client_id !== userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const clientId = caseData.client_id;
    const companyId = await resolveDocumentCompany(adminSupabase, clientId, caseData.company_id ?? null);
    if (!companyId) {
      return NextResponse.json({
        error: 'Asigna una entidad al expediente antes de subir documentación. No se puede inferir con seguridad entre varias entidades.',
        code: 'case_company_required',
      }, { status: 409 });
    }

    const { data: membership, error: membershipError } = await adminSupabase
      .from('profile_companies')
      .select('company_id')
      .eq('profile_id', clientId)
      .eq('company_id', companyId)
      .maybeSingle();
    if (membershipError || !membership) {
      return NextResponse.json({ error: 'La entidad del expediente no está vinculada al cliente' }, { status: 409 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    const validation = validateClientDocumentFile(file, CLIENT_DOCUMENT_MAX_BYTES);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const storagePath = buildClientDocumentStoragePath(caseId, validation.safeName);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await adminSupabase.storage
      .from('client-documents')
      .upload(storagePath, buffer, { contentType: validation.contentType, upsert: false });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 });
    }

    const { data: doc, error: docError } = await adminSupabase
      .from('documents')
      .insert({
        company_id: companyId,
        owner_type: 'case',
        owner_id: caseId,
        kind: 'client_document',
        case_id: caseId,
        client_id: clientId,
        file_path: uploadData.path,
        original_name: file.name,
        title: file.name,
        mime_type: validation.contentType,
        state: 'pendiente',
        uploaded_by_role: isAdmin ? 'admin' : 'client',
      })
      .select('id,original_name,state,created_at,file_path,uploaded_by_role,company_id,drive_file_id,mime_type')
      .single();

    if (docError || !doc) {
      try {
        await adminSupabase.storage.from('client-documents').remove([uploadData.path]);
      } catch (cleanupError) {
        console.error('[documents] storage cleanup failed:', cleanupError);
      }
      console.error('[documents] database insert failed:', docError?.message);
      return NextResponse.json({ error: 'Error al registrar el documento' }, { status: 500 });
    }

    if (!isAdmin) {
      notifyAdmins({
        title: '📄 Nuevo documento de cliente',
        body: `${file.name} — ${caseData.service ?? 'Expediente'}`,
        url: `/admin/expedientes/${caseId}`,
        tag: `doc-upload-${caseId}`,
      }).catch(() => {});
    }

    // Drive is a secondary copy. Storage + documents remains the canonical record.
    if (process.env.GOOGLE_DRIVE_CLIENTS_FOLDER_ID) {
      void (async () => {
        try {
          const { data: clientProfile } = await adminSupabase
            .from('profiles')
            .select('full_name,email')
            .eq('id', clientId)
            .maybeSingle();
          const clientName = clientProfile?.full_name ?? clientProfile?.email ?? `cliente-${clientId}`;
          const serviceName = caseData.service ?? 'Expediente';

          const driveResult = await syncDocumentToDrive({
            fileBuffer: buffer,
            fileName: validation.safeName,
            mimeType: validation.contentType,
            clientName,
            serviceName,
          });

          if (driveResult) {
            const { error: drivePersistError } = await adminSupabase
              .from('documents')
              .update({ drive_file_id: driveResult.fileId })
              .eq('id', doc.id);
            if (drivePersistError) console.error('[Drive sync] file id persistence:', drivePersistError.message);
          }
        } catch (error) {
          console.error('[Drive sync]', error);
        }
      })();
    }

    if (!isAdmin) {
      const fallbackName = String(clientId).slice(0, 8);
      void (async () => {
        try {
          const { data: clientProfile } = await adminSupabase
            .from('profiles')
            .select('full_name')
            .eq('id', clientId)
            .maybeSingle();
          await notifyTenantAdminDocUploaded({
            clientId,
            clientName: clientProfile?.full_name ?? fallbackName,
            service: caseData.service ?? 'Expediente',
            docName: file.name,
          });
        } catch {
          // Notification is non-blocking.
        }
      })();
    }

    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
