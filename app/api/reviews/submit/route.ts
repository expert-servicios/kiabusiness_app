import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { checkRateLimit, getClientIp } from '@/lib/utils/spam-guard';
import { sendEmail } from '@/lib/email/send';
import { reviewReceived } from '@/lib/email/templates';

const REVIEW_TOKEN_RE = /^[a-f0-9]{64}$/i;
const MAX_COMMENT_LENGTH = 800;

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    if (!checkRateLimit(`review-submit:${ip}`)) {
      return NextResponse.json({ error: 'Demasiados intentos. Inténtalo más tarde.' }, { status: 429 });
    }

    const body = await request.json() as {
      token?: string;
      rating?: unknown;
      comment?: unknown;
      allow_publish?: boolean;
    };

    const { token, rating, comment, allow_publish } = body;

    if (!token || typeof token !== 'string' || !REVIEW_TOKEN_RE.test(token)) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
    }
    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json({ error: 'Valoración entre 1 y 5 requerida' }, { status: 400 });
    }
    const cleanedComment = typeof comment === 'string'
      ? comment.trim().slice(0, MAX_COMMENT_LENGTH)
      : '';

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
      rating: parsedRating,
      comment: cleanedComment || null,
      allow_publish: allow_publish === true,
      service_name: caseData?.service ?? null,
      status: 'pending',
    });

    if (insertErr) {
      console.error('[reviews/submit]', insertErr);
      return NextResponse.json({ error: 'Error al guardar la valoración' }, { status: 500 });
    }

    // Invalidate token by deleting the request row
    await admin.from('review_requests').delete().eq('id', req.id);

    // Confirm receipt to the client — best-effort, doesn't block the response.
    // profiles.email isn't reliably populated (handle_new_user() only sets
    // id/full_name/role) — Auth is the source of truth for the address to
    // actually notify, same pattern as the Stripe webhook's getClientEmail().
    try {
      const { data: profile } = await admin
        .from('profiles')
        .select('full_name')
        .eq('id', req.client_id)
        .maybeSingle();
      const { data: authUser } = await admin.auth.admin.getUserById(req.client_id);
      const email = authUser?.user?.email;
      if (email) {
        const tpl = reviewReceived(profile?.full_name ?? 'cliente');
        await sendEmail({ to: email, eventType: 'review.received', ...tpl });
      }
    } catch (emailErr) {
      console.error('[reviews/submit] confirmation email failed:', emailErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[reviews/submit]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
