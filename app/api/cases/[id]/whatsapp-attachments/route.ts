import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: caseId } = await params;
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const admin = getSupabaseAdmin();

  // Verify the user owns this case (or is admin)
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';
  const { data: caseData } = await admin.from('cases').select('client_id').eq('id', caseId).single();
  if (!caseData) return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
  if (!isAdmin && caseData.client_id !== user.id) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { data: attachments } = await admin
    .from('whatsapp_conversations')
    .select('id, direction, body, media_url, media_type, created_at')
    .eq('case_id', caseId)
    .not('media_url', 'is', null)
    .order('created_at', { ascending: true });

  return NextResponse.json({ attachments: attachments ?? [] });
}
