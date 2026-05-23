import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { data: items, error } = await admin
      .from('kia_cart_items')
      .select('id, service_id, service_label, service_area, stripe_price_id, expires_at, created_at')
      .eq('client_id', user.id)
      .gt('expires_at', now)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[kia/cart] fetch error:', error.message);
      return NextResponse.json({ error: 'Error obteniendo la cesta' }, { status: 500 });
    }

    return NextResponse.json({ items: items ?? [] });
  } catch (err) {
    console.error('[kia/cart] unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');
    if (!itemId) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from('kia_cart_items')
      .delete()
      .eq('id', itemId)
      .eq('client_id', user.id);

    if (error) {
      console.error('[kia/cart] delete error:', error.message);
      return NextResponse.json({ error: 'Error eliminando item' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[kia/cart] unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
