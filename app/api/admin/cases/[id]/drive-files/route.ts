import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { listDriveFilesForClient } from '@/lib/integrations/google-drive';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
    if (!['admin', 'owner'].includes(profile?.role ?? '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;

    const { data: caseData } = await admin
      .from('cases')
      .select('id, service, category, client_id')
      .eq('id', id)
      .single();

    if (!caseData) return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });

    const { data: clientProfile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', caseData.client_id)
      .single();

    const { data: authUser } = await admin.auth.admin.getUserById(caseData.client_id);
    const clientName = clientProfile?.full_name ?? authUser?.user?.email?.split('@')[0] ?? 'Cliente';

    const files = await listDriveFilesForClient(clientName, caseData.service);

    return NextResponse.json({ files, clientName, serviceName: caseData.service });
  } catch (err) {
    console.error('[cases/[id]/drive-files]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
