import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getMetricoolConnectionStatus } from '@/lib/integrations/metricool';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin' || profile?.role === 'owner';
}

export async function GET(request: NextRequest) {
  const authorized = await requireAdmin(request);
  if (!authorized) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const status = await getMetricoolConnectionStatus();
  return NextResponse.json(status);
}
