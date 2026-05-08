import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { holdedDemoRequested, holdedDemoRequestAdmin } from '@/lib/email/templates';
import { checkSpam, checkRateLimit, getClientIp } from '@/lib/utils/spam-guard';

const schema = z.object({
  hp_url: z.string().optional(),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(6).max(20),
  company_name: z.string().min(2).max(150),
  company_type: z.string().optional(),
  employees_count: z.string().optional(),
  current_software: z.string().optional(),
  needs: z.string().max(800).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (String(body.hp_url ?? '').trim()) {
      return NextResponse.json({ ok: true });
    }

    const ip = getClientIp(request.headers);
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Inténtalo más tarde.' }, { status: 429 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' },
        { status: 400 }
      );
    }

    const d = parsed.data;

    const spam = checkSpam({ name: d.name, email: d.email, message: d.needs });
    if (spam.isSpam) return NextResponse.json({ ok: true });

    const supabase = getSupabaseAdmin();
    const { data: demo, error } = await supabase
      .from('holded_demos')
      .insert({
        name: d.name,
        email: d.email,
        phone: d.phone,
        company_name: d.company_name,
        company_type: d.company_type ?? null,
        employees_count: d.employees_count ?? null,
        current_software: d.current_software ?? null,
        needs: d.needs ?? null,
        status: 'pending'
      })
      .select('id')
      .single();

    if (error || !demo?.id) {
      console.error('[holded-demo] insert:', error);
      return NextResponse.json({ error: 'No se pudo registrar la solicitud.' }, { status: 500 });
    }

    const adminEmails = (process.env.ADMIN_EMAILS ?? 'soy@kseniailicheva.com')
      .split(',').map((e) => e.trim()).filter(Boolean);

    await Promise.all([
      sendEmail({
        to: d.email,
        eventType: 'holded_demo.requested',
        ...holdedDemoRequested(d.name, d.company_name),
        metadata: { demo_id: demo.id }
      }),
      sendEmail({
        to: adminEmails,
        eventType: 'holded_demo.request.admin',
        ...holdedDemoRequestAdmin({
          name: d.name,
          email: d.email,
          phone: d.phone,
          companyName: d.company_name,
          companyType: d.company_type,
          employeesCount: d.employees_count,
          currentSoftware: d.current_software,
          needs: d.needs,
          demoId: demo.id
        }),
        metadata: { demo_id: demo.id }
      })
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[holded-demo]', err);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
