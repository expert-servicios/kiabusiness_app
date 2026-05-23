import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';
import { createServerSupabaseClient } from '@/lib/integrations/supabase';
import { closeNba } from '@/lib/nba/create-nba';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = await requireAdminClient(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get the acting admin's user id
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  const body = await request.json() as {
    detected_type?: string;
    detected_subtype?: string | null;
    case_id?: string | null;
    status?: 'corrected' | 'rejected';
  };

  // Fetch current record to check it exists and isn't already corrected
  const { data: existing } = await admin
    .from('document_classifications')
    .select('id, status, client_id, case_id')
    .eq('id', id)
    .single();

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updates: Record<string, unknown> = {
    updated_at:  new Date().toISOString(),
    reviewed_by: user?.id ?? null,
    reviewed_at: new Date().toISOString(),
    status:      body.status ?? 'corrected',
  };

  if (body.detected_type !== undefined)    updates.detected_type = body.detected_type;
  if (body.detected_subtype !== undefined) updates.detected_subtype = body.detected_subtype;
  if (body.case_id !== undefined)          updates.case_id = body.case_id;

  const { data: updated, error } = await admin
    .from('document_classifications')
    .update(updates)
    .eq('id', id)
    .select('id, status')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Close any open NBA for this classification
  await closeNba({
    action_type: 'documento_sin_clasificar',
    client_id: existing.client_id ?? undefined,
    case_id:   existing.case_id ?? undefined,
  });

  return NextResponse.json({ document: updated });
}
