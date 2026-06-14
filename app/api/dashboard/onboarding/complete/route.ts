import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

// POST /api/dashboard/onboarding/complete
// Marks the authenticated user's onboarding as completed (idempotent).

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  // Use .is('onboarding_completed_at', null) to make this a true no-op on repeat calls
  await getSupabaseAdmin()
    .from('profiles')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', user.id)
    .is('onboarding_completed_at', null);

  return NextResponse.json({ ok: true });
}
