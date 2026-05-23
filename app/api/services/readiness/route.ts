import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import {
  getReadinessCheck,
  calculateReadinessResult,
} from '@/lib/data/service-readiness-checks';

const bodySchema = z.object({
  serviceSlug : z.string().min(1),
  answers     : z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  source      : z.enum(['web', 'dashboard', 'whatsapp', 'kia']).default('web'),
  email       : z.string().email().optional(),
  phone       : z.string().optional(),
  leadId      : z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const { serviceSlug, answers, source, email, phone, leadId } = parsed.data;

    const check = getReadinessCheck(serviceSlug);
    if (!check) {
      return NextResponse.json({ error: 'Servicio sin check de preparación' }, { status: 404 });
    }

    const result = calculateReadinessResult(check, answers);

    // Resolve authenticated user if any
    const supabase = createServerSupabaseClient(request);
    const { data: { user } } = await supabase.auth.getUser();

    // Persist assessment
    const adminSupabase = getSupabaseAdmin();
    const { data: assessment, error: insertError } = await adminSupabase
      .from('service_readiness_assessments')
      .insert({
        user_id           : user?.id ?? null,
        lead_id           : leadId ?? null,
        email             : email ?? user?.email ?? null,
        phone             : phone ?? null,
        service_slug      : serviceSlug,
        answers,
        result            : result.canCheckout ? 'ready' : result.nextAction === 'manual_review' ? 'partial' : 'not_ready',
        recommended_action: result.nextAction,
        source,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[readiness] insert error:', insertError);
    }

    return NextResponse.json({
      assessmentId       : assessment?.id ?? null,
      canCheckout        : result.canCheckout,
      nextAction         : result.nextAction,
      title              : result.title,
      message            : result.message,
    });
  } catch (error) {
    console.error('[readiness] unexpected error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
