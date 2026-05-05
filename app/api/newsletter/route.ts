import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email ?? '').toLowerCase().trim();
    const name = String(body.name ?? '').trim() || null;
    const source = String(body.source ?? 'website').trim();

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('newsletter_subscribers').upsert(
      { email, name, source },
      { onConflict: 'email', ignoreDuplicates: true }
    );

    if (error) {
      console.error('[newsletter]', error);
      return NextResponse.json({ error: 'No se pudo registrar el email.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[newsletter]', error);
    return NextResponse.json({ error: 'Error del servidor.' }, { status: 500 });
  }
}
