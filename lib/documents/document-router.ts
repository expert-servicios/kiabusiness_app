import { classifyDocument, type DocumentSource } from './document-classifier';

export interface IncomingDocumentParams {
  fileName: string;
  mimeType?: string;
  caption?: string;
  source: DocumentSource;
  clientId?: string;
  caseId?: string;
  fileId?: string;
  sourceUrl?: string;
}

// Fire-and-forget entry point. Call this from webhooks without awaiting.
export async function routeIncomingDocument(params: IncomingDocumentParams): Promise<void> {
  // Skip audio — not classifiable as documents
  const ext = params.fileName.split('.').pop()?.toLowerCase() ?? '';
  if (['ogg', 'mp3', 'm4a', 'wav', 'aac', 'mp4', 'webm'].includes(ext)) return;
  if (params.mimeType?.startsWith('audio/') || params.mimeType?.startsWith('video/')) return;

  try {
    await classifyDocument({
      fileName:  params.fileName,
      mimeType:  params.mimeType,
      caption:   params.caption,
      source:    params.source,
      clientId:  params.clientId,
      caseId:    params.caseId,
      fileId:    params.fileId,
      sourceUrl: params.sourceUrl,
    });
  } catch (err) {
    console.error('[routeIncomingDocument]', params.fileName, err);
  }
}
