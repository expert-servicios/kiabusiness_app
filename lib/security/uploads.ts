import { randomUUID } from 'crypto';

export const CLIENT_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const TENANT_DOCUMENT_MAX_BYTES = 20 * 1024 * 1024;

type AllowedUploadType = {
  extensions: readonly string[];
  mimes: readonly string[];
  contentType: string;
};

const ALLOWED_CLIENT_DOCUMENT_TYPES: readonly AllowedUploadType[] = [
  { extensions: ['pdf'], mimes: ['application/pdf'], contentType: 'application/pdf' },
  { extensions: ['jpg', 'jpeg'], mimes: ['image/jpeg'], contentType: 'image/jpeg' },
  { extensions: ['png'], mimes: ['image/png'], contentType: 'image/png' },
  { extensions: ['webp'], mimes: ['image/webp'], contentType: 'image/webp' },
  { extensions: ['heic'], mimes: ['image/heic', 'image/heif'], contentType: 'image/heic' },
  { extensions: ['doc'], mimes: ['application/msword'], contentType: 'application/msword' },
  {
    extensions: ['docx'],
    mimes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  { extensions: ['xls'], mimes: ['application/vnd.ms-excel'], contentType: 'application/vnd.ms-excel' },
  {
    extensions: ['xlsx'],
    mimes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  { extensions: ['csv'], mimes: ['text/csv', 'application/csv'], contentType: 'text/csv' },
];

export type UploadValidationResult =
  | { ok: true; safeName: string; contentType: string }
  | { ok: false; status: 400; error: string };

function getExtension(fileName: string): string {
  const cleanName = fileName.split(/[\\/]/).pop() ?? '';
  const ext = cleanName.split('.').pop()?.toLowerCase() ?? '';
  return /^[a-z0-9]{1,12}$/.test(ext) ? ext : '';
}

function sanitizeFileName(fileName: string, extension: string): string {
  const cleanName = (fileName.split(/[\\/]/).pop() ?? 'document').trim() || 'document';
  const sanitized = cleanName
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 120);

  if (!sanitized) return `document.${extension}`;
  return sanitized.includes('.') ? sanitized : `${sanitized}.${extension}`;
}

export function validateClientDocumentFile(
  file: File,
  maxBytes = CLIENT_DOCUMENT_MAX_BYTES
): UploadValidationResult {
  if (file.size <= 0) {
    return { ok: false, status: 400, error: 'Archivo requerido' };
  }

  if (file.size > maxBytes) {
    const maxMb = Math.max(1, Math.ceil(maxBytes / (1024 * 1024)));
    return { ok: false, status: 400, error: `El archivo no puede superar ${maxMb} MB` };
  }

  const extension = getExtension(file.name);
  const allowedType = ALLOWED_CLIENT_DOCUMENT_TYPES.find((entry) =>
    entry.extensions.includes(extension)
  );

  if (!allowedType) {
    return {
      ok: false,
      status: 400,
      error: 'Tipo de archivo no permitido. Sube PDF, imagen, Word, Excel o CSV.',
    };
  }

  const mime = file.type.split(';')[0].trim().toLowerCase();
  if (mime && !allowedType.mimes.includes(mime)) {
    return {
      ok: false,
      status: 400,
      error: 'El tipo MIME del archivo no coincide con su extension.',
    };
  }

  return {
    ok: true,
    safeName: sanitizeFileName(file.name, extension),
    contentType: allowedType.contentType,
  };
}

export function buildClientDocumentStoragePath(caseId: string, safeName: string): string {
  const folder = caseId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const extension = getExtension(safeName) || 'bin';
  const fileName = sanitizeFileName(safeName, extension);
  return `${folder}/${Date.now()}-${randomUUID()}-${fileName}`;
}
