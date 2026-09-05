import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

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

type RawDocument = {
  id: string;
  company_id: string | null;
  owner_type: string | null;
  owner_id: string | null;
  kind: string | null;
  drive_file_id: string | null;
  mime_type: string | null;
  title: string | null;
  created_at: string | null;
  doc_type: string | null;
  case_id: string | null;
  client_id: string | null;
  file_path: string | null;
  original_name: string | null;
  state: string | null;
  uploaded_by_role: string | null;
};

type LegacyCaseDocument = {
  id: string;
  case_id: string;
  client_id: string;
  file_path: string;
  original_name: string;
  state: string;
  created_at: string;
};

type LegacyFile = {
  id: string;
  user_id: string | null;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  file_url: string;
  category: string | null;
  created_at: string | null;
};

type LegacyUserFile = {
  id: string;
  user_id: string | null;
  file_name: string | null;
  file_url: string | null;
  file_size: number | null;
  file_type: string | null;
  uploaded_at: string | null;
  created_at: string | null;
};

type ClientCase = {
  id: string;
  service: string | null;
  category: string | null;
  state: string | null;
  company_id: string | null;
};

type EmailProvenance = {
  document_id: string;
  provider: 'gmail' | 'ms365';
  account_email: string;
  conversation_id: string | null;
  message_id: string;
  attachment_id: string;
  subject: string | null;
  from_email: string | null;
  message_date: string | null;
};

const DOCUMENT_SELECT = 'id,company_id,owner_type,owner_id,kind,drive_file_id,mime_type,title,created_at,doc_type,case_id,client_id,file_path,original_name,state,uploaded_by_role';
const LEGACY_CASE_DOCUMENT_SELECT = 'id,case_id,client_id,file_path,original_name,state,created_at';
const LEGACY_FILE_SELECT = 'id,user_id,file_name,file_size,file_type,file_url,category,created_at';
const LEGACY_USER_FILE_SELECT = 'id,user_id,file_name,file_url,file_size,file_type,uploaded_at,created_at';

async function loadClientContext(admin: ReturnType<typeof getSupabaseAdmin>, id: string) {
  const [profileRes, authRes, casesRes, membershipsRes] = await Promise.all([
    admin.from('profiles').select('id,email,full_name').eq('id', id).single(),
    admin.auth.admin.getUserById(id),
    admin.from('cases').select('id,service,category,state,company_id').eq('client_id', id),
    admin.from('profile_companies').select('company_id').eq('profile_id', id),
  ]);

  if (profileRes.error || !profileRes.data) return null;

  const cases = (casesRes.data ?? []) as ClientCase[];
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
    authUser: authRes.data.user,
    cases,
    companies,
    companyIds,
    allowedCompanyIds: new Set(companies.map((company) => company.id)),
    caseIds: cases.map((row) => row.id),
  };
}

function documentBelongsToClient(doc: RawDocument, id: string, caseIds: string[], companyIds: string[]) {
  if (doc.kind === 'internal') return false;
  return doc.client_id === id
    || Boolean(doc.case_id && caseIds.includes(doc.case_id))
    || Boolean(doc.company_id && companyIds.includes(doc.company_id))
    || (doc.owner_type === 'profile' && doc.owner_id === id)
    || (doc.owner_type === 'company' && Boolean(doc.owner_id && companyIds.includes(doc.owner_id)));
}

function safeExternalUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

async function signedClientDocumentUrl(admin: ReturnType<typeof getSupabaseAdmin>, filePath: string | null) {
  if (!filePath) return null;
  const { data } = await admin.storage.from('client-documents').createSignedUrl(filePath, 3600);
  return data?.signedUrl ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { admin } = ctx;

  const { id } = await params;
  const requestedCompany = request.nextUrl.searchParams.get('companyId');
  const context = await loadClientContext(admin, id);
  if (!context) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

  const { profile, authUser, cases, companies, companyIds, allowedCompanyIds, caseIds } = context;

  if (requestedCompany && requestedCompany !== 'unassigned' && !allowedCompanyIds.has(requestedCompany)) {
    return NextResponse.json({ error: 'Entidad no vinculada a este cliente' }, { status: 400 });
  }

  const caseById = new Map(cases.map((row) => [row.id, row]));
  const companyNameById = new Map(companies.map((company) => [company.id, company.name]));

  const [directRes, caseRes, companyRes, profileOwnerRes, companyOwnerRes, legacyCaseRes, legacyFilesRes, legacyUserFilesRes] = await Promise.all([
    admin.from('documents').select(DOCUMENT_SELECT).eq('client_id', id),
    caseIds.length
      ? admin.from('documents').select(DOCUMENT_SELECT).in('case_id', caseIds)
      : Promise.resolve({ data: [] }),
    companyIds.length
      ? admin.from('documents').select(DOCUMENT_SELECT).in('company_id', companyIds)
      : Promise.resolve({ data: [] }),
    admin.from('documents').select(DOCUMENT_SELECT).eq('owner_type', 'profile').eq('owner_id', id),
    companyIds.length
      ? admin.from('documents').select(DOCUMENT_SELECT).eq('owner_type', 'company').in('owner_id', companyIds)
      : Promise.resolve({ data: [] }),
    admin.from('case_documents').select(LEGACY_CASE_DOCUMENT_SELECT).eq('client_id', id),
    admin.from('files').select(LEGACY_FILE_SELECT).eq('user_id', id),
    admin.from('user_files').select(LEGACY_USER_FILE_SELECT).eq('user_id', id),
  ]);

  if (legacyCaseRes.error || legacyFilesRes.error || legacyUserFilesRes.error) {
    console.error('[documents360] legacy inventory load failed', {
      caseDocuments: legacyCaseRes.error,
      files: legacyFilesRes.error,
      userFiles: legacyUserFilesRes.error,
    });
    return NextResponse.json({ error: 'No se pudo cargar el inventario documental completo' }, { status: 500 });
  }

  const deduped = new Map<string, RawDocument>();
  for (const result of [directRes, caseRes, companyRes, profileOwnerRes, companyOwnerRes]) {
    for (const row of (result.data ?? []) as RawDocument[]) deduped.set(row.id, row);
  }

  const allMatched = Array.from(deduped.values());
  const technicalExcluded = allMatched.filter((doc) => doc.kind === 'internal').length;
  const operational = allMatched.filter((doc) => doc.kind !== 'internal');
  const operationalIds = operational.map((doc) => doc.id);

  const provenanceRes = operationalIds.length
    ? await admin
      .from('email_attachment_documents')
      .select('document_id,provider,account_email,conversation_id,message_id,attachment_id,subject,from_email,message_date')
      .in('document_id', operationalIds)
    : { data: [] };
  const provenanceByDocument = new Map(
    ((provenanceRes.data ?? []) as EmailProvenance[]).map((row) => [row.document_id, row])
  );

  const canonicalDocuments = await Promise.all(operational.map(async (doc) => {
    const caseRow = doc.case_id ? caseById.get(doc.case_id) : null;
    const ownerCompanyId = doc.owner_type === 'company' && doc.owner_id && allowedCompanyIds.has(doc.owner_id)
      ? doc.owner_id
      : null;
    const directCompanyId = doc.company_id && allowedCompanyIds.has(doc.company_id) ? doc.company_id : null;
    const caseCompanyId = caseRow?.company_id && allowedCompanyIds.has(caseRow.company_id) ? caseRow.company_id : null;
    const companyId = directCompanyId ?? caseCompanyId ?? ownerCompanyId ?? null;
    const provenance = provenanceByDocument.get(doc.id) ?? null;

    return {
      id: doc.id,
      recordKey: `documents:${doc.id}`,
      name: doc.original_name || doc.title || doc.doc_type || 'Documento',
      title: doc.title,
      docType: doc.doc_type,
      mimeType: doc.mime_type,
      state: doc.state,
      kind: doc.kind,
      uploadedByRole: doc.uploaded_by_role,
      createdAt: doc.created_at,
      caseId: doc.case_id,
      caseName: caseRow?.service ?? null,
      companyId,
      companyName: companyId ? companyNameById.get(companyId) ?? null : null,
      driveFileId: doc.drive_file_id,
      downloadUrl: await signedClientDocumentUrl(admin, doc.file_path),
      source: 'documents' as const,
      sourceLabel: 'Documentos',
      editable: true,
      historyAvailable: true,
      provenance: provenance ? {
        type: 'email_attachment' as const,
        provider: provenance.provider,
        providerLabel: provenance.provider === 'gmail' ? 'Gmail' : 'Microsoft 365',
        accountEmail: provenance.account_email,
        conversationId: provenance.conversation_id,
        messageId: provenance.message_id,
        subject: provenance.subject,
        fromEmail: provenance.from_email,
        messageDate: provenance.message_date,
        threadUrl: provenance.conversation_id
          ? `/admin/correo/hilo?provider=${encodeURIComponent(provenance.provider)}&conversationId=${encodeURIComponent(provenance.conversation_id)}&clientId=${encodeURIComponent(id)}`
          : null,
      } : null,
    };
  }));

  const legacyCaseDocuments = await Promise.all(
    ((legacyCaseRes.data ?? []) as LegacyCaseDocument[])
      .filter((row) => row.client_id === id && caseIds.includes(row.case_id))
      .map(async (row) => {
        const caseRow = caseById.get(row.case_id) ?? null;
        const companyId = caseRow?.company_id && allowedCompanyIds.has(caseRow.company_id) ? caseRow.company_id : null;
        return {
          id: row.id,
          recordKey: `case_documents:${row.id}`,
          name: row.original_name || 'Documento de expediente',
          title: null,
          docType: null,
          mimeType: null,
          state: row.state,
          kind: 'legacy',
          uploadedByRole: null,
          createdAt: row.created_at,
          caseId: row.case_id,
          caseName: caseRow?.service ?? null,
          companyId,
          companyName: companyId ? companyNameById.get(companyId) ?? null : null,
          driveFileId: null,
          downloadUrl: await signedClientDocumentUrl(admin, row.file_path),
          source: 'case_documents' as const,
          sourceLabel: 'Expediente legacy',
          editable: false,
          historyAvailable: false,
          provenance: null,
        };
      })
  );

  const legacyFiles = ((legacyFilesRes.data ?? []) as LegacyFile[]).map((row) => ({
    id: row.id,
    recordKey: `files:${row.id}`,
    name: row.file_name || 'Archivo legacy',
    title: null,
    docType: row.category,
    mimeType: row.file_type,
    state: null,
    kind: 'legacy',
    uploadedByRole: null,
    createdAt: row.created_at,
    caseId: null,
    caseName: null,
    companyId: null,
    companyName: null,
    driveFileId: null,
    downloadUrl: safeExternalUrl(row.file_url),
    source: 'files' as const,
    sourceLabel: 'Archivos legacy',
    editable: false,
    historyAvailable: false,
    provenance: null,
  }));

  const legacyUserFiles = ((legacyUserFilesRes.data ?? []) as LegacyUserFile[]).map((row) => ({
    id: row.id,
    recordKey: `user_files:${row.id}`,
    name: row.file_name || 'Archivo de usuario legacy',
    title: null,
    docType: null,
    mimeType: row.file_type,
    state: null,
    kind: 'legacy',
    uploadedByRole: null,
    createdAt: row.uploaded_at ?? row.created_at,
    caseId: null,
    caseName: null,
    companyId: null,
    companyName: null,
    driveFileId: null,
    downloadUrl: safeExternalUrl(row.file_url),
    source: 'user_files' as const,
    sourceLabel: 'Portal legacy',
    editable: false,
    historyAvailable: false,
    provenance: null,
  }));

  const normalized = [
    ...canonicalDocuments,
    ...legacyCaseDocuments,
    ...legacyFiles,
    ...legacyUserFiles,
  ];

  normalized.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });

  const filtered = requestedCompany === 'unassigned'
    ? normalized.filter((doc) => !doc.companyId)
    : requestedCompany
      ? normalized.filter((doc) => doc.companyId === requestedCompany)
      : normalized;

  const email = (authUser?.email ?? profile.email ?? '').trim().toLowerCase();

  return NextResponse.json({
    client: { id, name: profile.full_name ?? email, email },
    companies,
    cases: cases.map((row) => ({
      id: row.id,
      service: row.service,
      category: row.category,
      state: row.state,
      companyId: row.company_id,
    })),
    documents: filtered,
    counts: {
      total: filtered.length,
      pending: filtered.filter((doc) => doc.state === 'pendiente').length,
      reviewed: filtered.filter((doc) => doc.state === 'revisado').length,
      rejected: filtered.filter((doc) => doc.state === 'rechazado').length,
      withCase: filtered.filter((doc) => doc.caseId).length,
      withCompany: filtered.filter((doc) => doc.companyId).length,
      unassigned: normalized.filter((doc) => !doc.companyId).length,
      technicalExcluded,
      legacyReadOnly: filtered.filter((doc) => !doc.editable).length,
      sources: {
        documents: filtered.filter((doc) => doc.source === 'documents').length,
        case_documents: filtered.filter((doc) => doc.source === 'case_documents').length,
        files: filtered.filter((doc) => doc.source === 'files').length,
        user_files: filtered.filter((doc) => doc.source === 'user_files').length,
      },
    },
  });
}

const updateSchema = z.object({
  documentId: z.string().uuid(),
  state: z.enum(['pendiente', 'revisado', 'rechazado']).optional(),
  docType: z.string().trim().min(1).max(80).optional(),
  title: z.string().trim().min(1).max(160).optional(),
  caseId: z.string().uuid().nullable().optional(),
}).refine((value) => value.state !== undefined || value.docType !== undefined || value.title !== undefined || value.caseId !== undefined, {
  message: 'No hay cambios que guardar',
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { admin, actorId } = ctx;
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const context = await loadClientContext(admin, id);
  if (!context) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });

  const { data: document, error: documentError } = await admin
    .from('documents')
    .select(DOCUMENT_SELECT)
    .eq('id', parsed.data.documentId)
    .single();
  if (documentError || !document) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });

  const current = document as RawDocument;
  if (!documentBelongsToClient(current, id, context.caseIds, context.companyIds)) {
    return NextResponse.json({ error: 'Documento no vinculado a este cliente' }, { status: 409 });
  }
  if (!current.company_id || !context.allowedCompanyIds.has(current.company_id)) {
    return NextResponse.json({ error: 'La entidad del documento no está vinculada al cliente' }, { status: 409 });
  }

  let targetCase: ClientCase | null = null;
  if (parsed.data.caseId) {
    targetCase = context.cases.find((row) => row.id === parsed.data.caseId) ?? null;
    if (!targetCase) return NextResponse.json({ error: 'El expediente no pertenece a este cliente' }, { status: 409 });
    if (!targetCase.company_id || targetCase.company_id !== current.company_id) {
      return NextResponse.json({
        error: 'El expediente debe pertenecer a la misma entidad que el documento. No se cambia la entidad automáticamente.',
        code: 'case_company_mismatch',
      }, { status: 409 });
    }
  }

  const updates: Record<string, string | null> = {};
  if (parsed.data.state !== undefined) updates.state = parsed.data.state;
  if (parsed.data.docType !== undefined) updates.doc_type = parsed.data.docType;
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.caseId !== undefined) updates.case_id = parsed.data.caseId;

  const { data: updated, error: updateError } = await admin
    .from('documents')
    .update(updates)
    .eq('id', current.id)
    .select(DOCUMENT_SELECT)
    .single();
  if (updateError || !updated) {
    console.error('[documents360] update failed', updateError);
    return NextResponse.json({ error: 'No se pudo actualizar el documento' }, { status: 500 });
  }

  await admin.from('audit_logs').insert({
    actor_id: actorId,
    action: 'document.admin_updated',
    entity: 'documents',
    entity_id: current.id,
    metadata: {
      client_id: id,
      company_id: current.company_id,
      previous: {
        state: current.state,
        doc_type: current.doc_type,
        title: current.title,
        case_id: current.case_id,
      },
      next: {
        state: updated.state,
        doc_type: updated.doc_type,
        title: updated.title,
        case_id: updated.case_id,
      },
    },
  }).then(() => {});

  return NextResponse.json({
    document: {
      id: updated.id,
      state: updated.state,
      docType: updated.doc_type,
      title: updated.title,
      caseId: updated.case_id,
      caseName: targetCase?.service ?? (updated.case_id ? context.cases.find((row) => row.id === updated.case_id)?.service ?? null : null),
    },
  });
}
