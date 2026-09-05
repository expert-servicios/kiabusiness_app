import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

const querySchema = z.object({ documentId: z.string().uuid() });

type AuditMetadata = {
  client_id?: string;
  company_id?: string;
  previous?: Record<string, unknown>;
  next?: Record<string, unknown>;
};

type AuditRow = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_id: string | null;
  metadata: AuditMetadata | null;
  created_at: string;
};

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' || profile?.role === 'owner' ? admin : null;
}

function belongsToClient(
  document: { kind: string | null; client_id: string | null; case_id: string | null; company_id: string | null; owner_type: string | null; owner_id: string | null },
  clientId: string,
  caseIds: string[],
  companyIds: string[]
) {
  if (document.kind === 'internal') return false;
  return document.client_id === clientId
    || Boolean(document.case_id && caseIds.includes(document.case_id))
    || Boolean(document.company_id && companyIds.includes(document.company_id))
    || (document.owner_type === 'profile' && document.owner_id === clientId)
    || (document.owner_type === 'company' && Boolean(document.owner_id && companyIds.includes(document.owner_id)));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;
  const parsed = querySchema.safeParse({ documentId: request.nextUrl.searchParams.get('documentId') });
  if (!parsed.success) return NextResponse.json({ error: 'Documento inválido' }, { status: 400 });

  const [profileRes, casesRes, membershipsRes, documentRes] = await Promise.all([
    admin.from('profiles').select('id').eq('id', id).single(),
    admin.from('cases').select('id,service,category,company_id').eq('client_id', id),
    admin.from('profile_companies').select('company_id').eq('profile_id', id),
    admin.from('documents')
      .select('id,kind,client_id,case_id,company_id,owner_type,owner_id')
      .eq('id', parsed.data.documentId)
      .single(),
  ]);

  if (profileRes.error || !profileRes.data) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
  if (documentRes.error || !documentRes.data) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });

  const cases = casesRes.data ?? [];
  const caseIds = cases.map((row) => row.id);
  const companyIds = Array.from(new Set((membershipsRes.data ?? []).map((row) => row.company_id).filter(Boolean)));
  const document = documentRes.data;

  if (!belongsToClient(document, id, caseIds, companyIds)) {
    return NextResponse.json({ error: 'Documento no vinculado a este cliente' }, { status: 409 });
  }
  if (!document.company_id || !companyIds.includes(document.company_id)) {
    return NextResponse.json({ error: 'Entidad del documento no vinculada al cliente' }, { status: 409 });
  }

  const { data: rawAuditRows, error: auditError } = await admin
    .from('audit_logs')
    .select('id,actor_id,action,entity_id,metadata,created_at')
    .eq('entity', 'documents')
    .eq('entity_id', document.id)
    .eq('action', 'document.admin_updated')
    .order('created_at', { ascending: false })
    .limit(50);

  if (auditError) {
    console.error('[documents360 history] audit load failed', auditError);
    return NextResponse.json({ error: 'No se pudo cargar el historial' }, { status: 500 });
  }

  const auditRows = ((rawAuditRows ?? []) as AuditRow[]).filter((row) => {
    const metadata = row.metadata ?? {};
    return metadata.client_id === id && metadata.company_id === document.company_id;
  });

  const actorIds = Array.from(new Set(auditRows.map((row) => row.actor_id).filter((value): value is string => Boolean(value))));
  const actorsRes = actorIds.length
    ? await admin.from('profiles').select('id,full_name,email,role').in('id', actorIds)
    : { data: [] };
  const actorById = new Map((actorsRes.data ?? []).map((row) => [row.id, row]));
  const caseById = new Map(cases.map((row) => [row.id, row]));

  const history = auditRows.map((row) => {
    const previous = row.metadata?.previous ?? {};
    const next = row.metadata?.next ?? {};
    const fields = ['state', 'doc_type', 'title', 'case_id'] as const;
    const changes = fields.flatMap((field) => {
      const before = previous[field] ?? null;
      const after = next[field] ?? null;
      if (before === after) return [];
      const label = field === 'state' ? 'Estado' : field === 'doc_type' ? 'Tipo documental' : field === 'title' ? 'Título' : 'Expediente';
      const formatValue = (value: unknown) => {
        if (field !== 'case_id') return value === null || value === '' ? '—' : String(value);
        if (!value) return 'Sin expediente';
        const caseRow = caseById.get(String(value));
        return caseRow?.service || caseRow?.category || String(value);
      };
      return [{ field, label, before: formatValue(before), after: formatValue(after) }];
    });

    const actor = row.actor_id ? actorById.get(row.actor_id) : null;
    return {
      id: row.id,
      createdAt: row.created_at,
      actor: actor ? {
        id: actor.id,
        name: actor.full_name || actor.email || 'Administrador',
        email: actor.email ?? null,
        role: actor.role ?? null,
      } : null,
      changes,
    };
  });

  return NextResponse.json({ documentId: document.id, history });
}
