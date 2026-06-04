import { describe, it, expect } from 'vitest';
import { safeRedirectPath } from '@/lib/auth/safe-redirect';

describe('safeRedirectPath', () => {
  // ── Rutas validas ──────────────────────────────────────────────────────────

  it('acepta ruta interna simple', () => {
    expect(safeRedirectPath('/dashboard')).toBe('/dashboard');
  });

  it('acepta ruta admin con subruta', () => {
    expect(safeRedirectPath('/admin/expedientes/123')).toBe('/admin/expedientes/123');
  });

  it('preserva query string en rutas validas', () => {
    expect(safeRedirectPath('/dashboard?tab=docs')).toBe('/dashboard?tab=docs');
  });

  it('preserva hash en rutas validas', () => {
    expect(safeRedirectPath('/planes#precios')).toBe('/planes#precios');
  });

  // ── Ataques de open-redirect ──────────────────────────────────────────────

  it('rechaza URL absoluta con dominio externo', () => {
    expect(safeRedirectPath('https://malicious.com/steal')).toBe('/dashboard');
  });

  it('rechaza protocol-relative URL (//dominio)', () => {
    expect(safeRedirectPath('//malicious.com/steal')).toBe('/dashboard');
  });

  it('rechaza backslash (bypass en algunos parsers)', () => {
    expect(safeRedirectPath('/\\malicious.com')).toBe('/dashboard');
  });

  it('rechaza valor null', () => {
    expect(safeRedirectPath(null)).toBe('/dashboard');
  });

  it('rechaza cadena vacia', () => {
    expect(safeRedirectPath('')).toBe('/dashboard');
  });

  it('rechaza ruta sin slash inicial', () => {
    expect(safeRedirectPath('dashboard')).toBe('/dashboard');
  });

  it('rechaza URL con esquema javascript:', () => {
    expect(safeRedirectPath('javascript:alert(1)')).toBe('/dashboard');
  });

  it('rechaza URL con esquema data:', () => {
    expect(safeRedirectPath('data:text/html,<script>alert(1)</script>')).toBe('/dashboard');
  });
});
