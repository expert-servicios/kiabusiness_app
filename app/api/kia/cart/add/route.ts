import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { SERVICES } from '@/lib/integrations/kia-engine';

const bodySchema = z.object({
  service_id     : z.string().min(1),
  phone_number   : z.string().optional(),
  stripe_price_id: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const { service_id, phone_number, stripe_price_id } = parsed.data;
    const svc = SERVICES[service_id];

    const admin = getSupabaseAdmin();

    // Remove expired items for this user first
    await admin
      .from('kia_cart_items')
      .delete()
      .eq('client_id', user.id)
      .lt('expires_at', new Date().toISOString());

    const { data: inserted, error: insertError } = await admin
      .from('kia_cart_items')
      .insert({
        phone_number    : phone_number ?? null,
        client_id       : user.id,
        service_id,
        service_label   : svc?.label.es ?? service_id,
        service_area    : svc?.area ?? null,
        stripe_price_id : stripe_price_id ?? svc?.stripePriceId ?? null,
        expires_at      : new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      })
      .select('id, service_id, service_label, service_area, stripe_price_id, expires_at')
      .single();

    if (insertError || !inserted) {
      console.error('[kia/cart/add] insert error:', insertError?.message);
      return NextResponse.json({ error: 'Error añadiendo a la cesta' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, item: inserted });
  } catch (err) {
    console.error('[kia/cart/add] unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
