import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAcademyProgram } from '@/lib/data/academy-catalog';
import { sendEmail } from '@/lib/email/send';
import { academyCertificationApproved } from '@/lib/email/templates';
import { requireAdminClient } from '@/lib/auth/require-admin';

const patchSchema = z.object({
  status: z.enum(['active', 'cancelled', 'completed']).optional(),
  certification_status: z.enum(['none', 'requested', 'under_review', 'approved', 'rejected', 'paid']).optional(),
  admin_note: z.string().max(500).optional().nullable(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminClient(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
  }

  const { data: updated, error } = await admin
    .from('academy_enrollments')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, client_id, program_slug, program_name')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (parsed.data.certification_status === 'approved' && updated) {
    const program = getAcademyProgram(updated.program_slug);
    const price = program?.officialCertification?.price ?? '';
    const { data: profile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', updated.client_id)
      .maybeSingle();
    // profiles.email isn't reliably populated for every account (only
    // backfilled once historically; the signup trigger doesn't set it) —
    // Auth is the source of truth for the address to actually notify.
    const { data: authUser } = await admin.auth.admin.getUserById(updated.client_id);
    const email = authUser?.user?.email;

    if (email) {
      const tpl = academyCertificationApproved(profile?.full_name ?? email.split('@')[0], updated.program_name, price);
      sendEmail({
        to: email,
        eventType: 'academy.certification.approved',
        ...tpl,
        metadata: { enrollment_id: updated.id },
      }).catch((err) => console.error('[admin/academy/enrollments PATCH] approval email failed:', err));
    }
  }

  return NextResponse.json({ ok: true });
}
