import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient(request);
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles').select('role').eq('id', sessionData.session.user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const [caseResult, docsResult] = await Promise.all([
      admin.from('cases').select('id,category,service,state,opened_at,closed_at,client_id').eq('id', id).single(),
      admin.from('case_documents').select('id,original_name,state,created_at,file_path').eq('case_id', id).order('created_at', { ascending: false })
    ]);

    if (caseResult.error || !caseResult.data) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    const caseData = caseResult.data;

    // Fetch client info
    const [authUser, clientProfile] = await Promise.all([
      admin.auth.admin.getUserById(caseData.client_id),
      admin.from('profiles').select('full_name,phone').eq('id', caseData.client_id).single()
    ]);

    // Generate signed download URLs (1h validity)
    const docs = await Promise.all(
      (docsResult.data ?? []).map(async (doc) => {
        const { data: urlData } = await admin.storage
          .from('user-files')
          .createSignedUrl(doc.file_path, 3600);
        return { ...doc, downloadUrl: urlData?.signedUrl ?? null };
      })
    );

    return NextResponse.json({
      case: {
        ...caseData,
        client: {
          email: authUser.data.user?.email ?? '',
          full_name: clientProfile.data?.full_name ?? null,
          phone: clientProfile.data?.phone ?? null
        }
      },
      documents: docs
    });
  } catch (err) {
    console.error('[admin/cases/[id] GET]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
