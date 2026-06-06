import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      token?: string;
      rating?: number;
      comment?: string;
      allow_publish?: boolean;
    };

    const { token, rating, comment, allow_publish } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
    }
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Valoración entre 1 y 5 requerida' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Validate token
    const { data: req, error: reqErr } = await admin
      .from('review_requests')
      .select('id,case_id,client_id,expires_at')
      .eq('token', token)
      .single();

    if (reqErr || !req) {
      return NextResponse.json({ error: 'Enlace inválido o ya utilizado' }, { status: 400 });
    }

    if (new Date(req.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Este enlace ha expirado. Contacta con nosotros si deseas dejarnos tu opinión.' }, { status: 410 });
    }

    // Check no review already submitted for this token
    const { data: existing } = await admin
      .from('reviews')
      .select('id')
      .eq('case_id', req.case_id)
      .eq('client_id', req.client_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Ya has enviado tu valoración para este expediente.' }, { status: 409 });
    }

    // Fetch service name from case
    const { data: caseData } = await admin
      .from('cases')
      .select('service')
      .eq('id', req.case_id)
      .single();

    // Insert review
    const { error: insertErr } = await admin.from('reviews').insert({
      case_id: req.case_id,
      client_id: req.client_id,
      rating,
      comment: comment?.trim() || null,
      allow_publish: allow_publish ?? false,
      service_name: caseData?.service ?? null,
      status: 'pending',
    });

    if (insertErr) {
      console.error('[reviews/submit]', insertErr);
      return NextResponse.json({ error: 'Error al guardar la valoración' }, { status: 500 });
    }

    // Invalidate token by deleting the request row
    await admin.from('review_requests').delete().eq('id', req.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[reviews/submit]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
