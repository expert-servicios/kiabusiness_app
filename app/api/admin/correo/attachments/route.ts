import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import {
  GMAIL_SA_IMPERSONATE_EMAIL,
  getGmailAttachment,
  getGmailAttachmentSA,
  hasGmailSA,
  type GmailAttachmentData,
  type GmailTokens,
} from '@/lib/integrations/gmail';
import {
  getMailAttachment,
  type MailAttachmentData,
  type Ms365StoredTokens,
} from '@/lib/integrations/microsoft365';
import {
  buildClientDocumentStoragePath,
  CLIENT_DOCUMENT_MAX_BYTES,
  validateClientDocumentMetadata,
} from '@/lib/security/uploads';

type Provider = 'gmail' | 'ms365';
type AdminClient = ReturnType<typeof getSupabaseAdmin>;
type ProviderAttachment = GmailAttachmentData | MailAttachmentData;

type ProviderContext = {
  accountEmail: string;
  attachment: ProviderAttachment;
};

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'owner') return null;
  return { admin };
}

async function saveGmailRefresh(admin: AdminClient, refreshed: GmailTokens | null) {
  if (!refreshed) return;
  await admin.from('gmail_tokens').update({
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token,
    expiry_date: refreshed.expiry_date,
    updated_at: new Date().toISOString(),
  }).eq('id', 'admin');
}

async function saveMs365Refresh(admin: AdminClient, refreshed: Ms365StoredTokens | null) {
  if (!refreshed) return;
  await admin.from('ms365_tokens').update({
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token,
    expires_at: refreshed.expires_at,
    updated_at: new Date().toISOString(),
  }).eq('id', 'admin');
}

async function fetchProviderAttachment(
  admin: AdminClient,
  provider: Provider,
  messageId: string,
  attachmentId: string
): Promise<ProviderContext> {
  if (provider === 'gmail') {
    if (hasGmailSA()) {
      const attachment = await getGmailAttachmentSA(messageId, attachmentId);
      return { accountEmail: GMAIL_SA_IMPERSONATE_EMAIL.toLowerCase(), attachment };
    }

    const { data: gmailRow } = await admin.from('gmail_tokens').select('*').eq('id', 'admin').single();
    if (!gmailRow) throw new Error('Gmail no conectado');
    const stored: GmailTokens = {
      access_token: gmailRow.access_token,
      refresh_token: gmailRow.refresh_token,
      expiry_date: gmailRow.expiry_date,
      email: gmailRow.email,
    };
    const result = await getGmailAttachment(stored, messageId, attachmentId);
    await saveGmailRefresh(admin, result.refreshed);
    return { accountEmail: String(gmailRow.email ?? '').trim().toLowerCase(), attachment: result.attachment };
  }

  const { data: ms365Row } = await admin.from('ms365_tokens').select('*').eq('id', 'admin').single();
  if (!ms365Row) throw new Error('MS365 no conectado');
  const stored: Ms365StoredTokens = {
    access_token: ms365Row.access_token,
    refresh_token: ms365Row.refresh_token,
    expires_at: ms365Row.expires_at,
  };
  const result = await getMailAttachment(stored, messageId, attachmentId);
  await saveMs365Refresh(admin, result.refreshed);
  return { accountEmail: String(ms365Row.email ?? '').trim().toLowerCase(), attachment: result.attachment };
}

function safeDisposition(name: string) {
  const ascii = name.replace(/[\r\n"\\]/g, '_').replace(/[^\x20-\x7E]/g, '_').slice(0, 120) || 'adjunto';
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

const querySchema = z.object({
  provider: z.enum(['gmail', 'ms365']),
  messageId: z.string().min(1),
  attachmentId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const parsed = querySchema.safeParse({
    provider: request.nextUrl.searchParams.get('provider'),
    messageId: request.nextUrl.searchParams.get('messageId'),
    attachmentId: request.nextUrl.searchParams.get('attachmentId'),
  });
  if (!parsed.success) return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });

  try {
    const { provider, messageId, attachmentId } = parsed.data;
    const { attachment } = await fetchProviderAttachment(ctx.admin, provider, messageId, attachmentId);
    return new NextResponse(new Uint8Array(attachment.data), {
      status: 200,
      headers: {
        'Content-Type': attachment.mimeType || 'application/octet-stream',
        'Content-Length': String(attachment.data.length),
        'Content-Disposition': safeDisposition(attachment.name),
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[correo attachments] download failed', error);
    return NextResponse.json({ error: 'No se pudo descargar el adjunto' }, { status: 502 });
  }
}

const saveSchema = z.object({
  provider: z.enum(['gmail', 'ms365']),
  messageId: z.string().min(1),
  attachmentId: z.string().min(1),
  clientId: z.string().uuid(),
  caseId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });

  const { admin } = ctx;
  const { provider, messageId, attachmentId, clientId, caseId } = parsed.data;

  const { data: caseRow, error: caseError } = await admin
    .from('cases')
    .select('id,client_id,company_id,service')
    .eq('id', caseId)
    .single();
  if (caseError || !caseRow) return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
  if (caseRow.client_id !== clientId) {
    return NextResponse.json({ error: 'El expediente no pertenece a este cliente' }, { status: 409 });
  }
  if (!caseRow.company_id) {
    return NextResponse.json({
      error: 'Asigna una entidad al expediente antes de guardar adjuntos. No se infiere una entidad automáticamente.',
      code: 'case_company_required',
    }, { status: 409 });
  }

  const { data: membership, error: membershipError } = await admin
    .from('profile_companies')
    .select('company_id')
    .eq('profile_id', clientId)
    .eq('company_id', caseRow.company_id)
    .maybeSingle();
  if (membershipError || !membership) {
    return NextResponse.json({ error: 'La entidad del expediente no está vinculada al cliente' }, { status: 409 });
  }

  let providerContext: ProviderContext;
  try {
    providerContext = await fetchProviderAttachment(admin, provider, messageId, attachmentId);
  } catch (error) {
    console.error('[correo attachments] provider fetch failed', error);
    return NextResponse.json({ error: 'No se pudo recuperar el adjunto del proveedor' }, { status: 502 });
  }

  const { accountEmail, attachment } = providerContext;
  if (!accountEmail) return NextResponse.json({ error: 'No se pudo identificar la cuenta de correo' }, { status: 409 });

  const { data: existing } = await admin
    .from('email_attachment_documents')
    .select('document_id')
    .eq('provider', provider)
    .eq('account_email', accountEmail)
    .eq('message_id', messageId)
    .eq('attachment_id', attachmentId)
    .maybeSingle();
  if (existing?.document_id) {
    return NextResponse.json({ documentId: existing.document_id, existing: true });
  }

  const validation = validateClientDocumentMetadata(
    attachment.name,
    attachment.mimeType,
    attachment.data.length,
    CLIENT_DOCUMENT_MAX_BYTES
  );
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const storagePath = buildClientDocumentStoragePath(caseId, validation.safeName);
  const { data: uploadData, error: uploadError } = await admin.storage
    .from('client-documents')
    .upload(storagePath, attachment.data, { contentType: validation.contentType, upsert: false });
  if (uploadError || !uploadData?.path) {
    console.error('[correo attachments] storage upload failed', uploadError);
    return NextResponse.json({ error: 'No se pudo guardar el archivo' }, { status: 500 });
  }

  const { data: document, error: documentError } = await admin
    .from('documents')
    .insert({
      company_id: caseRow.company_id,
      owner_type: 'case',
      owner_id: caseId,
      kind: 'client_document',
      case_id: caseId,
      client_id: clientId,
      file_path: uploadData.path,
      original_name: attachment.name,
      title: attachment.name,
      mime_type: validation.contentType,
      doc_type: 'email_attachment',
      state: 'pendiente',
      uploaded_by_role: 'admin',
    })
    .select('id')
    .single();

  if (documentError || !document) {
    await admin.storage.from('client-documents').remove([uploadData.path]).catch(() => null);
    console.error('[correo attachments] document insert failed', documentError);
    return NextResponse.json({ error: 'No se pudo registrar el documento' }, { status: 500 });
  }

  const { error: sourceError } = await admin.from('email_attachment_documents').insert({
    provider,
    account_email: accountEmail,
    message_id: messageId,
    attachment_id: attachmentId,
    document_id: document.id,
    client_id: clientId,
    case_id: caseId,
    company_id: caseRow.company_id,
    original_name: attachment.name,
    mime_type: validation.contentType,
    size_bytes: attachment.data.length,
  });

  if (sourceError) {
    await admin.from('documents').delete().eq('id', document.id);
    await admin.storage.from('client-documents').remove([uploadData.path]).catch(() => null);

    if (sourceError.code === '23505') {
      const { data: concurrent } = await admin
        .from('email_attachment_documents')
        .select('document_id')
        .eq('provider', provider)
        .eq('account_email', accountEmail)
        .eq('message_id', messageId)
        .eq('attachment_id', attachmentId)
        .maybeSingle();
      if (concurrent?.document_id) {
        return NextResponse.json({ documentId: concurrent.document_id, existing: true });
      }
    }

    console.error('[correo attachments] provenance insert failed', sourceError);
    return NextResponse.json({ error: 'No se pudo registrar la procedencia del adjunto' }, { status: 500 });
  }

  return NextResponse.json({ documentId: document.id, existing: false }, { status: 201 });
}
