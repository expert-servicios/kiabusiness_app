import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getFirstAdminProfileId, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { sendEmail } from '@/lib/email/send';
import { academyLeadReceivedClient, academyLeadReceivedAdmin } from '@/lib/email/templates';
import { getAcademyProgram, getAcademyProgramPath } from '@/lib/data/academy-catalog';
import { verifyRecaptchaToken } from '@/lib/utils/recaptcha';
import { checkSpam, checkRateLimit, getClientIp } from '@/lib/utils/spam-guard';
import { notifyAdmins } from '@/lib/integrations/push';

const academyLeadSchema = z.object({
  hp_url: z.string().optional(),
  programSlug: z.string().min(1),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  currentRole: z.string().max(150).optional(),
  experience: z.string().max(500).optional(),
  language: z.enum(['es', 'ru']).default('es'),
  certificationInterest: z.boolean().default(false),
  recaptcha_token: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();

    if (String(requestBody.hp_url ?? '').trim()) {
      return NextResponse.json({ success: true });
    }

    const ip = getClientIp(request.headers);
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Inténtalo más tarde.' }, { status: 429 });
    }

    const validated = academyLeadSchema.parse(requestBody);

    const program = getAcademyProgram(validated.programSlug);
    if (!program) {
      return NextResponse.json({ error: 'Programa no encontrado' }, { status: 400 });
    }

    const spam = checkSpam({
      name: validated.name,
      email: validated.email,
      message: validated.experience,
    });
    if (spam.isSpam) {
      return NextResponse.json({ success: true });
    }

    const recaptcha = await verifyRecaptchaToken({
      token: String(validated.recaptcha_token ?? ''),
      action: 'academy_lead',
    });
    if (!recaptcha.ok) {
      return NextResponse.json({ error: 'Verificación anti-spam fallida. Inténtalo de nuevo.' }, { status: 400 });
    }

    const adminId = await getFirstAdminProfileId();
    if (!adminId) {
      return NextResponse.json(
        { error: 'No se encontró un perfil de administrador para asignar la solicitud' },
        { status: 500 }
      );
    }

    const admin = getSupabaseAdmin();
    const messageParts = [
      validated.currentRole ? `Puesto actual: ${validated.currentRole}` : null,
      validated.experience ? `Experiencia: ${validated.experience}` : null,
      `Idioma preferido: ${validated.language}`,
      `Interés certificación oficial ADGD0210: ${validated.certificationInterest ? 'Sí' : 'No'}`,
    ].filter(Boolean);

    const { data: lead, error: leadError } = await admin
      .from('leads')
      .insert({
        name: validated.name,
        email: validated.email,
        phone: validated.phone?.trim() || null,
        client_type: 'persona_fisica',
        category: 'Academy',
        service: program.name,
        country: 'ES',
        urgency: 'media',
        message: messageParts.join(' · '),
        state: 'new',
      })
      .select('id')
      .single();

    if (leadError || !lead) {
      console.error('[academy/leads] insert error:', leadError);
      return NextResponse.json({ error: 'Error al guardar la solicitud' }, { status: 500 });
    }

    const clientTpl = academyLeadReceivedClient(validated.name, program.name, getAcademyProgramPath(program.slug));
    await sendEmail({
      to: validated.email,
      eventType: 'academy.lead.received',
      ...clientTpl,
      metadata: { lead_id: lead.id },
    });

    const adminTpl = academyLeadReceivedAdmin({
      name: validated.name,
      email: validated.email,
      phone: validated.phone,
      programName: program.name,
      currentRole: validated.currentRole,
      experience: validated.experience,
      language: validated.language,
      certificationInterest: validated.certificationInterest,
    });
    await sendEmail({
      to: process.env.ADMIN_EMAILS?.split(',').map((e) => e.trim()).filter(Boolean) ?? [],
      eventType: 'academy.lead.received.admin',
      ...adminTpl,
      metadata: { lead_id: lead.id },
    });

    notifyAdmins({
      title: `🎓 Nueva solicitud Academy: ${validated.name}`,
      body: program.name,
      url: '/admin',
    }).catch((e: unknown) => console.error('[academy/leads] push notify:', e));

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos incorrectos.', details: err.issues }, { status: 400 });
    }
    console.error('[academy/leads] error:', err);
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}
