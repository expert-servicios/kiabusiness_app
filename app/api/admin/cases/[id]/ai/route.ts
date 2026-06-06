import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { summarizeCaseHistory, detectMissingDocuments, draftClientMessage } from '@/lib/integrations/ai';

const bodySchema = z.object({
  action: z.enum(['summary', 'missing-docs', 'draft']),
  goal  : z.string().min(5).max(500).optional(),
});

async function requireAdmin(request: NextRequest): Promise<string | null> {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (profile?.role === 'admin' || profile?.role === 'owner') ? user.id : null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actorId = await requireAdmin(request);
    if (!actorId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Acción inválida. Use "summary" o "missing-docs".' }, { status: 400 });
    }

    const { action } = parsed.data;
    const admin = getSupabaseAdmin();

    const { data: caseRow } = await admin
      .from('cases')
      .select('service')
      .eq('id', id)
      .single();

    if (!caseRow) return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });

    if (action === 'summary') {
      const result = await summarizeCaseHistory(id);
      return NextResponse.json({ action, result });
    }

    if (action === 'missing-docs') {
      const result = await detectMissingDocuments(id, caseRow.service);
      return NextResponse.json({ action, result });
    }

    // action === 'draft'
    const { goal } = parsed.data;
    if (!goal) return NextResponse.json({ error: 'Falta el campo "goal"' }, { status: 400 });
    const result = await draftClientMessage(id, goal);
    return NextResponse.json({ action, result });
  } catch (err) {
    console.error('[admin/cases/[id]/ai] POST error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
