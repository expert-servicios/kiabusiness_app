import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

type ChecklistLink = {
  documentId: string;
  requirement: string;
  linkedAt: string;
  linkedBy: string;
};

type LinkStore = {
  version: 1;
  links: ChecklistLink[];
};

type RawCase = {
  id: string;
  service: string | null;
  category: string | null;
  state: string | null;
  company_id: string | null;
  docs_checklist: unknown;
  received_documents_json: unknown;
  updated_at: string;
};

type RawDocument = {
  id: string;
  title: string | null;
  original_name: string | null;
  doc_type: string | null;
  state: string | null;
  case_id: string | null;
  company_id: string | null;
  kind: string | null;
  created_at: string | null;
};

const linkSchema = z.object({
  documentId: z.string().uuid(),
  requirement: z.string().trim().min(1).max(240).nullable(),
});

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin' || profile?.role === 'owner'
    ? { admin, actorId: user.id }
    : null;
}

function checklistItems(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const items: string[] = [];
  for (const raw of value) {
    if (typeof raw !== 'string') continue;
    const item = raw.trim();
    if (!item || seen.has(item)) continue;
    seen.add(item);
    items.push(item);
  }
  return items;
}

function isEmptyObject(value: unknown) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value as Record<string, unknown>).length === 0);
}

function parseLinkStore(value: unknown): { store: LinkStore; supported: boolean } {
  if (value == null || isEmptyObject(value)) {
    return { store: { version: 1, links: [] }, supported: true };
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { store: { version: 1, links: [] }, supported: false };
  }

  const candidate = value as Record<string, unknown>;
  if (candidate.version !== 1 || !Array.isArray(candidate.links)) {
    return { store: { version: 1, links: [] }, supported: false };
  }

  const links: ChecklistLink[] = [];
  for (const raw of candidate.links) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const row = raw as Record<string, unknown>;
    if (
      typeof row.documentId !== 'string' ||
      typeof row.requirement !== 'string' ||
      typeof row.linkedAt !== 'string' ||
      typeof row.linkedBy !== 'string'
    ) continue;
    links.push({
      documentId: row.documentId,
      requirement: row.requirement,
      linkedAt: row.linkedAt,
      linkedBy: row.linkedBy,
    });
  }
  return { store: { version: 1, links }, supported: true };
}

async function loadClientContext(admin: ReturnType<typeof getSupabaseAdmin>, clientId: string) {
  const [profileRes, casesRes, membershipsRes] = await Promise.all([
    admin.from('profiles').select('id,email,full_name').eq('id', clientId).single(),
    admin
      .from('cases')
      .select('id,service,category,state,company_id,docs_checklist,received_documents_json,updated_at')
      .eq('client_id', clientId),
    admin.from('profile_companies').select('company_id').eq('profile_id', clientId),
  ]);

  if (profileRes.error || !profileRes.data) return null;
  if (casesRes.error) throw casesRes.error;

  const cases = (casesRes.data ?? []) as RawCase[];
  const companyIds = Array.from(new Set((membershipsRes.data ?? []).map((row) => row.company_id).filter(Boolean)));
  const companiesRes = companyIds.length
    ? await admin.from('companies').select('id,razon_social,nombre_comercial').in('id', companyIds)
    : { data: [] };

  const companies = (companiesRes.data ?? []).map((company) => ({
    id: company.id,
    name: company.razon_social || company.nombre_comercial || company.id,
  }));

  return {
    profile: profileRes.data,
    cases,
    companies,
    companyIds,
    companyNameById: new Map(companies.map((company) => [company.id, company.name])),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const { id: clientId } = await params;
    const context = await loadClientContext(ctx.admin, clientId);
    if (!context) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

    const caseIds = context.cases.map((row) => row.id);
    const docsRes = caseIds.length
      ? await ctx.admin
        .from('documents')
        .select('id,title,original_name,doc_type,state,case_id,company_id,kind,created_at')
        .in('case_id', caseIds)
        .neq('kind', 'internal')
        .order('created_at', { ascending: false })
      : { data: [], error: null };

    if (docsRes.error) {
      console.error('[documents360 checklist] document load failed', docsRes.error);
      return NextResponse.json({ error: 'No se pudieron cargar los documentos del checklist' }, { status: 500 });
    }

    const documents = (docsRes.data ?? []) as RawDocument[];
    const documentsByCase = new Map<string, RawDocument[]>();
    for (const doc of documents) {
      if (!doc.case_id) continue;
      const current = documentsByCase.get(doc.case_id) ?? [];
      current.push(doc);
      documentsByCase.set(doc.case_id, current);
    }

    const cases = context.cases.map((row) => {
      const requirements = checklistItems(row.docs_checklist);
      const { store, supported } = parseLinkStore(row.received_documents_json);
      const caseDocuments = (documentsByCase.get(row.id) ?? []).filter((doc) => doc.company_id === row.company_id);
      const validDocumentIds = new Set(caseDocuments.map((doc) => doc.id));
      const currentRequirementSet = new Set(requirements);
      const validLinks = store.links.filter((link) => validDocumentIds.has(link.documentId));
      const coveredRequirementSet = new Set(validLinks.filter((link) => currentRequirementSet.has(link.requirement)).map((link) => link.requirement));
      const orphanedLinks = validLinks.filter((link) => !currentRequirementSet.has(link.requirement));
      const linkByDocument = new Map(validLinks.map((link) => [link.documentId, link]));

      return {
        id: row.id,
        service: row.service,
        category: row.category,
        state: row.state,
        companyId: row.company_id,
        companyName: row.company_id ? context.companyNameById.get(row.company_id) ?? null : null,
        requirements: requirements.map((requirement) => ({
          requirement,
          covered: coveredRequirementSet.has(requirement),
          documents: validLinks
            .filter((link) => link.requirement === requirement)
            .map((link) => {
              const doc = caseDocuments.find((item) => item.id === link.documentId);
              return doc ? { id: doc.id, name: doc.title || doc.original_name || doc.doc_type || 'Documento' } : null;
            })
            .filter(Boolean),
        })),
        documents: caseDocuments.map((doc) => ({
          id: doc.id,
          name: doc.title || doc.original_name || doc.doc_type || 'Documento',
          state: doc.state,
          createdAt: doc.created_at,
          requirement: linkByDocument.get(doc.id)?.requirement ?? null,
        })),
        counts: {
          total: requirements.length,
          covered: coveredRequirementSet.size,
          missing: Math.max(requirements.length - coveredRequirementSet.size, 0),
          orphaned: orphanedLinks.length,
        },
        linkStoreSupported: supported,
      };
    });

    return NextResponse.json({
      client: {
        id: clientId,
        name: context.profile.full_name ?? context.profile.email ?? clientId,
      },
      cases,
    });
  } catch (error) {
    console.error('[documents360 checklist GET]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const { id: clientId } = await params;
    const body = await request.json().catch(() => null);
    const parsed = linkSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

    const { data: document, error: documentError } = await ctx.admin
      .from('documents')
      .select('id,title,original_name,doc_type,state,case_id,company_id,kind,created_at')
      .eq('id', parsed.data.documentId)
      .single();

    if (documentError || !document) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
    const doc = document as RawDocument;
    if (doc.kind === 'internal') return NextResponse.json({ error: 'Documento técnico no vinculable' }, { status: 409 });
    if (!doc.case_id) {
      return NextResponse.json({
        error: 'Primero vincula el documento a un expediente desde Gestionar.',
        code: 'document_case_required',
      }, { status: 409 });
    }

    const { data: caseRow, error: caseError } = await ctx.admin
      .from('cases')
      .select('id,client_id,service,category,state,company_id,docs_checklist,received_documents_json,updated_at')
      .eq('id', doc.case_id)
      .single();

    if (caseError || !caseRow || caseRow.client_id !== clientId) {
      return NextResponse.json({ error: 'El expediente no pertenece a este cliente' }, { status: 409 });
    }
    if (!caseRow.company_id || doc.company_id !== caseRow.company_id) {
      return NextResponse.json({
        error: 'Documento y expediente deben pertenecer a la misma entidad.',
        code: 'case_company_mismatch',
      }, { status: 409 });
    }

    const requirements = checklistItems(caseRow.docs_checklist);
    if (parsed.data.requirement !== null && !requirements.includes(parsed.data.requirement)) {
      return NextResponse.json({
        error: 'El requisito ya no existe en el checklist del expediente.',
        code: 'checklist_requirement_missing',
      }, { status: 409 });
    }

    const { store, supported } = parseLinkStore(caseRow.received_documents_json);
    if (!supported) {
      return NextResponse.json({
        error: 'El expediente contiene un formato histórico de documentos recibidos que requiere revisión manual.',
        code: 'unsupported_received_documents_format',
      }, { status: 409 });
    }

    const previousLink = store.links.find((link) => link.documentId === doc.id) ?? null;
    const nextLinks = store.links.filter((link) => link.documentId !== doc.id);
    if (parsed.data.requirement !== null) {
      nextLinks.push({
        documentId: doc.id,
        requirement: parsed.data.requirement,
        linkedAt: new Date().toISOString(),
        linkedBy: ctx.actorId,
      });
    }

    const nextStore: LinkStore = { version: 1, links: nextLinks };
    const { data: updatedCase, error: updateError } = await ctx.admin
      .from('cases')
      .update({
        received_documents_json: nextStore,
        updated_at: new Date().toISOString(),
      })
      .eq('id', caseRow.id)
      .eq('updated_at', caseRow.updated_at)
      .select('id')
      .maybeSingle();

    if (updateError) {
      console.error('[documents360 checklist] link update failed', updateError);
      return NextResponse.json({ error: 'No se pudo guardar el vínculo documental' }, { status: 500 });
    }
    if (!updatedCase) {
      return NextResponse.json({
        error: 'El expediente cambió mientras editabas. Actualiza la vista y vuelve a intentarlo.',
        code: 'case_concurrent_update',
      }, { status: 409 });
    }

    await ctx.admin.from('audit_logs').insert({
      actor_id: ctx.actorId,
      action: parsed.data.requirement === null ? 'case.document_requirement_unlinked' : 'case.document_requirement_linked',
      entity: 'cases',
      entity_id: caseRow.id,
      metadata: {
        client_id: clientId,
        company_id: caseRow.company_id,
        document_id: doc.id,
        document_name: doc.title || doc.original_name || doc.doc_type || 'Documento',
        previous_requirement: previousLink?.requirement ?? null,
        next_requirement: parsed.data.requirement,
      },
    }).then(() => {});

    return NextResponse.json({
      caseId: caseRow.id,
      documentId: doc.id,
      requirement: parsed.data.requirement,
    });
  } catch (error) {
    console.error('[documents360 checklist PATCH]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
