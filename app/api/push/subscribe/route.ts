import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { z } from 'zod';

async function getUser(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

const subSchema = z.object({
  endpoint: z.string().url(),
  keys:     z.object({ p256dh: z.string(), auth: z.string() }),
});

// Save subscription
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const body = await request.json();
    const parsed = subSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 });

    const { endpoint, keys } = parsed.data;
    const admin = getSupabaseAdmin();

    await admin.from('push_subscriptions').upsert({
      user_id:  user.id,
      endpoint,
      p256dh:   keys.p256dh,
      auth:     keys.auth,
    }, { onConflict: 'endpoint' });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[push/subscribe POST]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// Remove subscription
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const { endpoint } = await request.json();
    if (!endpoint) return NextResponse.json({ error: 'endpoint requerido' }, { status: 400 });

    const admin = getSupabaseAdmin();
    await admin.from('push_subscriptions').delete().eq('endpoint', endpoint).eq('user_id', user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[push/subscribe DELETE]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
