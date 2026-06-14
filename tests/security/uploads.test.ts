import { describe, expect, it } from 'vitest';
import {
  buildClientDocumentStoragePath,
  validateClientDocumentFile,
} from '@/lib/security/uploads';

describe('validateClientDocumentFile', () => {
  it('accepts a PDF document', () => {
    const file = new File(['%PDF-1.7'], 'factura.pdf', { type: 'application/pdf' });

    expect(validateClientDocumentFile(file)).toMatchObject({
      ok: true,
      safeName: 'factura.pdf',
      contentType: 'application/pdf',
    });
  });

  it('rejects HTML uploads', () => {
    const file = new File(['<script>alert(1)</script>'], 'payload.html', { type: 'text/html' });

    expect(validateClientDocumentFile(file)).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  it('rejects extension and MIME mismatches', () => {
    const file = new File(['<script>alert(1)</script>'], 'payload.pdf', { type: 'text/html' });

    expect(validateClientDocumentFile(file)).toMatchObject({
      ok: false,
      status: 400,
      error: 'El tipo MIME del archivo no coincide con su extension.',
    });
  });

  it('rejects files over the configured size', () => {
    const file = new File(['123456'], 'factura.pdf', { type: 'application/pdf' });

    expect(validateClientDocumentFile(file, 5)).toMatchObject({
      ok: false,
      status: 400,
      error: 'El archivo no puede superar 1 MB',
    });
  });

  it('sanitizes storage folder and file name', () => {
    const path = buildClientDocumentStoragePath('../case/id', 'mi factura.pdf');

    expect(path).toMatch(/^___case_id\/\d+-[a-f0-9-]+-mi_factura\.pdf$/);
  });
});
