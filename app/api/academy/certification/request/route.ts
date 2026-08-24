import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getAcademyProgram } from '@/lib/data/academy-catalog';
import { sendEmail } from '@/lib/email/send';
import { academyCertificationRequestedAdmin } from '@/lib/email/templates';
import { notifyAdmins } from '@/lib/integrations/push';

const schema = z.object({ enrollmentId: z.string().uuid() });

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data: enrollment } = await admin
    .from('academy_enrollments')
    .select('id, client_id, program_slug, program_name, certification_status')
    .eq('id', parsed.data.enrollmentId)
    .maybeSingle();

  if (!enrollment || enrollment.client_id !== user.id) {
    return NextResponse.json({ error: 'Matrícula no encontrada' }, { status: 404 });
  }

  const program = getAcademyProgram(enrollment.program_slug);
  if (!program?.officialCertification) {
    return NextResponse.json({ error: 'Este programa no tiene certificación oficial disponible' }, { status: 400 });
  }

  if (enrollment.certification_status !== 'none') {
    return NextResponse.json({ error: 'Ya existe una solicitud de certificación para esta matrícula' }, { status: 409 });
  }

  const { error } = await admin
    .from('academy_enrollments')
    .update({ certification_requested: true, certification_status: 'requested', updated_at: new Date().toISOString() })
    .eq('id', enrollment.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: profile } = await admin.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
  const name = profile?.full_name ?? user.email?.split('@')[0] ?? 'Alumno';

  if (user.email) {
    const adminTpl = academyCertificationRequestedAdmin(name, user.email, enrollment.program_name);
    sendEmail({
      to: process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()).filter(Boolean) ?? [],
      eventType: 'academy.certification.requested.admin',
      ...adminTpl,
      metadata: { enrollment_id: enrollment.id },
    }).catch((err) => console.error('[academy/certification/request] admin email failed:', err));
  }

  notifyAdmins({
    title: `📋 Solicitud de certificación — ${name}`,
    body: enrollment.program_name,
    url: '/admin/academy-matriculas',
    tag: `cert-request-${enrollment.id}`,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
