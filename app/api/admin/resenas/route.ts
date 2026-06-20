import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
    if (!['admin', 'owner'].includes(profile?.role ?? '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const status = request.nextUrl.searchParams.get('status') ?? 'all';

    let query = admin
      .from('reviews')
      .select('id,case_id,client_id,rating,comment,allow_publish,status,featured,created_at,service_name,profiles!reviews_client_id_fkey(full_name,email)')
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: reviews, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const enriched = (reviews ?? []).map((r) => {
      const prof = r.profiles as unknown as { full_name: string | null; email: string | null } | null;
      return {
        ...r,
        client_name: prof?.full_name ?? null,
        client_email: prof?.email ?? null,
      };
    });

    return NextResponse.json({ reviews: enriched });
  } catch (err) {
    console.error('[admin/resenas GET]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
