import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { documentRejected } from '@/lib/email/templates';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin';

    const { data: doc, error: docError } = await admin
      .from('documents')
      .select('id, file_path, client_id')
      .eq('id', id)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    }

    if (!isAdmin && doc.client_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (doc.file_path) {
      await admin.storage.from('client-documents').remove([doc.file_path]);
    }

    await admin.from('documents').delete().eq('id', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Document DELETE error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

const docUpdateSchema = z.object({
  state: z.enum(['pendiente', 'revisado', 'rechazado'])
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sessionSupabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await sessionSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const adminSupabase = getSupabaseAdmin();
    const { data: profile } = await adminSupabase
      .from('profiles').select('role').eq('id', user.id).single();

    if (profile?.role !== 'admin' && profile?.role !== 'owner') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const parseResult = docUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    const { data: doc, error: updateError } = await adminSupabase
      .from('documents')
      .update({ state: parseResult.data.state })
      .eq('id', id)
      .select('id,original_name,state,case_id,client_id')
      .single();

    if (updateError || !doc) {
      return NextResponse.json({ error: 'No se pudo actualizar el documento' }, { status: 500 });
    }

    // Notify client when their document is rejected so they can re-upload
    if (parseResult.data.state === 'rechazado' && doc.case_id && doc.client_id) {
      (async () => {
        try {
          const [caseRes, profileRes, authRes] = await Promise.all([
            adminSupabase.from('cases').select('service').eq('id', doc.case_id!).single(),
            adminSupabase.from('profiles').select('full_name').eq('id', doc.client_id!).single(),
            adminSupabase.auth.admin.getUserById(doc.client_id!),
          ]);
          const clientEmail = authRes.data?.user?.email;
          if (clientEmail) {
            const clientName = profileRes.data?.full_name ?? clientEmail.split('@')[0];
            const service = caseRes.data?.service ?? 'Trámite';
            await sendEmail({
              to: clientEmail,
              eventType: 'case.document_rejected',
              ...documentRejected(clientName, doc.original_name, service, doc.case_id!),
              metadata: { docId: doc.id, caseId: doc.case_id },
            });
          }
        } catch (e) {
          console.error('[documents PATCH] rejection email:', e);
        }
      })();
    }

    return NextResponse.json({ document: doc });
  } catch (error) {
    console.error('Document PATCH error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
