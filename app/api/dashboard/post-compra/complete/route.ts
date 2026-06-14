import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

// Marks post-purchase onboarding as complete for the user's current active subscription.
// Idempotent: only updates rows where post_purchase_onboarding_at IS NULL.
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { error } = await getSupabaseAdmin()
    .from('subscriptions')
    .update({ post_purchase_onboarding_at: new Date().toISOString() })
    .eq('client_id', user.id)
    .in('status', ['active', 'trialing'])
    .is('post_purchase_onboarding_at', null);

  if (error) {
    console.error('[post-compra/complete]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
