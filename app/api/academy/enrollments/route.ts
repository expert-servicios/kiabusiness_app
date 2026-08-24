import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

// Client-facing: returns only the current user's own enrollments. For the
// admin view of all enrollments, see /api/admin/academy/enrollments.
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: enrollments, error } = await getSupabaseAdmin()
    .from('academy_enrollments')
    .select('id, program_slug, program_name, amount_eur, status, certification_requested, certification_status, created_at')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ enrollments: enrollments ?? [] });
}
