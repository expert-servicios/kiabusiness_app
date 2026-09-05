import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CLIENT_DOCUMENT_MAX_BYTES, validateClientDocumentMetadata } from '@/lib/security/uploads';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Email attachments to Documents 360', () => {
  it('exposes real attachment metadata and provider download helpers for Gmail and Microsoft 365', () => {
    const gmail = source('lib/integrations/gmail.ts');
    const ms365 = source('lib/integrations/microsoft365.ts');

    expect(gmail).toContain('attachments: GmailAttachment[]');
    expect(gmail).toContain('collectAttachmentParts');
    expect(gmail).toContain('getGmailAttachmentSA');
    expect(gmail).toContain('getGmailAttachment(');

    expect(ms365).toContain('attachments: MailAttachment[]');
    expect(ms365).toContain('listMessageAttachments');
    expect(ms365).toContain('getMailAttachment(');
    expect(ms365).toContain('contentBytes');
  });

  it('downloads from the provider without persisting and materializes only by explicit POST', () => {
    const route = source('app/api/admin/correo/attachments/route.ts');
    expect(route).toContain('export async function GET');
    expect(route).toContain('Content-Disposition');
    expect(route).toContain('Cache-Control');
    expect(route).toContain('export async function POST');
    expect(route).toContain(".from('documents')");
    expect(route).toContain(".from('email_attachment_documents')");
  });

  it('requires a client-owned case with an explicitly linked company before saving', () => {
    const route = source('app/api/admin/correo/attachments/route.ts');
    expect(route).toContain('caseRow.client_id !== clientId');
    expect(route).toContain('case_company_required');
    expect(route).toContain(".from('profile_companies')");
    expect(route).toContain(".eq('company_id', caseRow.company_id)");
    expect(route).not.toContain('company_id: clientId');
  });

  it('requires the supplied conversation to be linked to the same case and validates message membership at the provider', () => {
    const route = source('app/api/admin/correo/attachments/route.ts');
    const page = source('app/(protected)/admin/correo/hilo/page.tsx');

    expect(route).toContain(".from('email_threads')");
    expect(route).toContain('linkedThread.case_id !== caseId');
    expect(route).toContain("code: 'thread_case_mismatch'");
    expect(route).toContain('message.conversationId !== conversationId');
    expect(route).toContain('attachment.id === attachmentId');
    expect(route).toContain('getGmailThreadSA(conversationId)');
    expect(route).toContain('getConversation(stored, conversationId)');
    expect(page).toContain('provider, conversationId, messageId, attachmentId, clientId, caseId');
  });

  it('uses the canonical private document bucket and an idempotent source mapping', () => {
    const route = source('app/api/admin/correo/attachments/route.ts');
    const migration = source('supabase/migrations/20260905131500_email_attachment_documents.sql');

    expect(route).toContain(".from('client-documents')");
    expect(route).toContain('upsert: false');
    expect(route).toContain("doc_type: 'email_attachment'");
    expect(route).toContain("sourceError.code === '23505'");
    expect(migration).toContain('unique (provider, account_email, message_id, attachment_id)');
    expect(migration).toContain('enable row level security');
  });

  it('persists deterministic email provenance for Documents 360', () => {
    const route = source('app/api/admin/correo/attachments/route.ts');
    const migration = source('supabase/migrations/20260905154500_email_attachment_provenance_context.sql');

    expect(route).toContain('conversation_id: conversationId');
    expect(route).toContain('subject: messageContext.message.subject');
    expect(route).toContain('from_email: messageContext.message.fromEmail');
    expect(route).toContain('message_date: messageContext.message.date');
    expect(migration).toContain('add column if not exists conversation_id text');
    expect(migration).toContain('email_attachment_documents_conversation_idx');
  });

  it('keeps provider attachments under the same 10 MB and MIME/extension validation as client documents', () => {
    expect(CLIENT_DOCUMENT_MAX_BYTES).toBe(10 * 1024 * 1024);
    expect(validateClientDocumentMetadata('factura.pdf', 'application/pdf', 1024).ok).toBe(true);
    expect(validateClientDocumentMetadata('factura.exe', 'application/octet-stream', 1024).ok).toBe(false);
    expect(validateClientDocumentMetadata('factura.pdf', 'image/png', 1024).ok).toBe(false);
    expect(validateClientDocumentMetadata('factura.pdf', 'application/pdf', CLIENT_DOCUMENT_MAX_BYTES + 1).ok).toBe(false);
  });

  it('shows download and explicit save actions in Correo 360 and blocks save until the thread has a case', () => {
    const page = source('app/(protected)/admin/correo/hilo/page.tsx');
    expect(page).toContain('/api/admin/correo/attachments');
    expect(page).toContain('Guardar en Documentos');
    expect(page).toContain('!linkedCaseId');
    expect(page).toContain('vincula este hilo a un expediente');
    expect(page).toContain(`/admin/clientes/${'${clientId}'}/documentos`);
  });
});
