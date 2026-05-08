import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { holdedDemoActivated, holdedOnboardingDone } from '@/lib/email/templates';

const CALENDLY_ONBOARDING =
  process.env.CALENDLY_ONBOARDING_URL ?? 'https://calendly.com/soy-kseniailicheva/onboarding-holded';
const CALENDLY_FORMACION =
  process.env.CALENDLY_FORMACION_URL ?? 'https://calendly.com/soy-kseniailicheva/formacion-holded';

const VALID_STATUSES = ['pending', 'demo_active', 'onboarding_done', 'training_done', 'converted', 'closed'] as const;
type DemoStatus = typeof VALID_STATUSES[number];

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: sessionData, error } = await supabase.auth.getSession();
  if (error || !sessionData.session?.user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles').select('role').eq('id', sessionData.session.user.id).single();
  if (profile?.role !== 'admin') return null;
  return admin;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Number(searchParams.get('limit') ?? '100');

    let query = admin
      .from('holded_demos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ demos: data ?? [] });
  } catch (err) {
    console.error('[admin/holded-demos] GET:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const body = await request.json();
    const newStatus = body.status as DemoStatus;

    if (!VALID_STATUSES.includes(newStatus)) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 });
    }

    const { data: demo, error: fetchErr } = await admin
      .from('holded_demos')
      .select('name, email, status')
      .eq('id', id)
      .single();

    if (fetchErr || !demo) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    await admin
      .from('holded_demos')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...(body.notes !== undefined ? { notes: body.notes } : {})
      })
      .eq('id', id);

    // Enviar email al cambiar a estados clave
    if (newStatus === 'demo_active' && demo.status === 'pending') {
      await sendEmail({
        to: demo.email,
        eventType: 'holded_demo.activated',
        ...holdedDemoActivated(demo.name, CALENDLY_ONBOARDING),
        metadata: { demo_id: id }
      });
    }

    if (newStatus === 'onboarding_done' && demo.status === 'demo_active') {
      await sendEmail({
        to: demo.email,
        eventType: 'holded_demo.onboarding_done',
        ...holdedOnboardingDone(demo.name, CALENDLY_FORMACION),
        metadata: { demo_id: id }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/holded-demos] PATCH:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
