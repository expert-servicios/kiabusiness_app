import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminClient } from '@/lib/auth/require-admin';
import { syncProjectToHolded } from '@/lib/integrations/holded';

const schema = z.object({
  caseId: z.string().uuid()
});

function checklistFrom(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.length > 0) : [];
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminClient(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos invalidos' }, { status: 400 });
    }

    const { caseId } = parsed.data;
    const { data: caseData, error } = await admin
      .from('cases')
      .select('id,category,service,state,client_id,docs_checklist')
      .eq('id', caseId)
      .single();

    if (error || !caseData) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    const [authUser, profile] = await Promise.all([
      admin.auth.admin.getUserById(caseData.client_id),
      admin.from('profiles').select('full_name,phone').eq('id', caseData.client_id).maybeSingle()
    ]);

    const clientEmail = authUser.data.user?.email ?? null;
    const clientName = profile.data?.full_name ?? clientEmail?.split('@')[0] ?? 'Cliente';
    const clientPhone = profile.data?.phone ?? null;

    const result = await syncProjectToHolded({
      caseId: caseData.id,
      service: caseData.service,
      category: caseData.category,
      state: caseData.state,
      clientName,
      clientEmail,
      clientPhone,
      docsChecklist: checklistFrom(caseData.docs_checklist)
    });

    return NextResponse.json({ ok: !result.error, result });
  } catch (error) {
    console.error('[admin/integrations/holded/sync-project] error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
