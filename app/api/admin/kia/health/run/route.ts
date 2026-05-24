import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminClient } from '@/lib/auth/require-admin';
import { createServerSupabaseClient } from '@/lib/integrations/supabase';
import { runKiaHealthChecks } from '@/lib/ai/kia/health/kia-health-runner';

const schema = z.object({
  runType: z.enum(['canary', 'manual', 'nightly_eval', 'post_deploy', 'incident_check']).default('manual'),
});

export async function POST(request: NextRequest) {
  const admin = await requireAdminClient(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  try {
    const result = await runKiaHealthChecks({
      runType: parsed.data.runType,
      createdBy: user?.id ?? null,
      persist: true,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[POST /api/admin/kia/health/run]', error);
    return NextResponse.json({ error: 'No se pudo ejecutar Kia Health' }, { status: 500 });
  }
}
