import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';
import {
  getHoldedRuntimeConfig,
  listDocuments,
  listFunnels,
  listProjects,
  listTasks
} from '@/lib/integrations/holded';

async function probe(name: string, check: () => Promise<unknown>) {
  const started = Date.now();
  try {
    const data = await check();
    const count = Array.isArray(data) ? data.length : null;
    return { name, ok: true, count, ms: Date.now() - started };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return { name, ok: false, count: null, ms: Date.now() - started, error: message };
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminClient(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const config = getHoldedRuntimeConfig();
    if (!config.configured) {
      return NextResponse.json({
        config,
        checks: [],
        ok: false,
        error: 'HOLDED_API_KEY no configurada'
      });
    }

    const checks = await Promise.all([
      probe('crm.funnels', listFunnels),
      probe('projects.projects', listProjects),
      probe('projects.tasks', listTasks),
      probe('documents.estimate', () => listDocuments('estimate', { sort: 'created-desc' })),
      probe('documents.invoice', () => listDocuments('invoice', { sort: 'created-desc' }))
    ]);

    return NextResponse.json({
      config,
      checks,
      ok: checks.every((check) => check.ok)
    });
  } catch (error) {
    console.error('[admin/integrations/holded/status] error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
