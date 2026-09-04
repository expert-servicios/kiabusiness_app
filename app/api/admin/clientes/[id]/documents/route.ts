import { NextRequest, NextResponse } from 'next/server';
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

  return profile?.role === 'admin' || profile?.role === 'owner' ? admin : null;
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
  created_at: string;
  doc_type: string | null;
  case_id: string | null;
  client_id: string | null;
  file_path: string | null;
  original_name: string | null;
  state: string | null;
  uploaded_by_role: string | null;
};

const DOCUMENT_SELECT = 'id,company_id,owner_type,owner_id,kind,drive_file_id,mime_type,title,created_at,doc_type,case_id,client_id,file_path,original_name,state,uploaded_by_role';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;
  const requestedCompany = request.nextUrl.searchParams.get('companyId');

  const [profileRes, authRes, casesRes, membershipsRes] = await Promise.all([
    admin.from('profiles').select('id,email,full_name').eq('id', id).single(),
    admin.auth.admin.getUserById(id),
    admin.from('cases').select('id,service,category,state,company_id').eq('client_id', id),
    admin.from('profile_companies').select('company_id').eq('profile_id', id),
  ]);

  if (profileRes.error || !profileRes.data) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
  }

  const companyIds = Array.from(new Set((membershipsRes.data ?? []).map((row) => row.company_id).filter(Boolean)));
  const companiesRes = companyIds.length
    ? await admin.from('companies').select('id,razon_social,nombre_comercial').in('id', companyIds)
    : { data: [] };

  const companies = (companiesRes.data ?? []).map((company) => ({
    id: company.id,
    name: company.razon_social || company.nombre_comercial || company.id,
  }));
  const allowedCompanyIds = new Set(companies.map((company) => company.id));

  if (requestedCompany && requestedCompany !== 'unassigned' && !allowedCompanyIds.has(requestedCompany)) {
    return NextResponse.json({ error: 'Entidad no vinculada a este cliente' }, { status: 400 });
  }

  const caseIds = (casesRes.data ?? []).map((row) => row.id);
  const caseById = new Map((casesRes.data ?? []).map((row) => [row.id, row]));
  const companyNameById = new Map(companies.map((company) => [company.id, company.name]));

  const [directRes, caseRes, companyRes, profileOwnerRes, companyOwnerRes] = await Promise.all([
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
  ]);

  const deduped = new Map<string, RawDocument>();
  for (const result of [directRes, caseRes, companyRes, profileOwnerRes, companyOwnerRes]) {
    for (const row of (result.data ?? []) as RawDocument[]) deduped.set(row.id, row);
  }

  const allMatched = Array.from(deduped.values());
  const technicalExcluded = allMatched.filter((doc) => doc.kind === 'internal').length;
  const operational = allMatched.filter((doc) => doc.kind !== 'internal');

  const normalized = await Promise.all(operational.map(async (doc) => {
    const caseRow = doc.case_id ? caseById.get(doc.case_id) : null;
    const ownerCompanyId = doc.owner_type === 'company' && doc.owner_id && allowedCompanyIds.has(doc.owner_id)
      ? doc.owner_id
      : null;
    const directCompanyId = doc.company_id && allowedCompanyIds.has(doc.company_id) ? doc.company_id : null;
    const caseCompanyId = caseRow?.company_id && allowedCompanyIds.has(caseRow.company_id) ? caseRow.company_id : null;
    const companyId = directCompanyId ?? caseCompanyId ?? ownerCompanyId ?? null;

    let downloadUrl: string | null = null;
    if (doc.file_path) {
      const { data: urlData } = await admin.storage
        .from('client-documents')
        .createSignedUrl(doc.file_path, 3600);
      downloadUrl = urlData?.signedUrl ?? null;
    }

    return {
      id: doc.id,
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
      downloadUrl,
      source: 'documents' as const,
    };
  }));

  normalized.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const filtered = requestedCompany === 'unassigned'
    ? normalized.filter((doc) => !doc.companyId)
    : requestedCompany
      ? normalized.filter((doc) => doc.companyId === requestedCompany)
      : normalized;

  const email = (authRes.data.user?.email ?? profileRes.data.email ?? '').trim().toLowerCase();

  return NextResponse.json({
    client: {
      id,
      name: profileRes.data.full_name ?? email,
      email,
    },
    companies,
    documents: filtered,
    counts: {
      total: filtered.length,
      withCase: filtered.filter((doc) => doc.caseId).length,
      withCompany: filtered.filter((doc) => doc.companyId).length,
      unassigned: normalized.filter((doc) => !doc.companyId).length,
      technicalExcluded,
    },
  });
}
