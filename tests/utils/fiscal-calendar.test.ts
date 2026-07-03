import { describe, it, expect } from 'vitest';
import { generateFiscalObligations, urgencyLevel } from '@/lib/utils/fiscal-calendar';

describe('generateFiscalObligations', () => {
  it('incluye modelos societarios para empresa y excluye los de autonomo/persona_fisica', () => {
    const keys = generateFiscalObligations('empresa', 2026).map((o) => o.obligation_key);
    expect(keys).toContain('202_1P');
    expect(keys).toContain('200_ANNUAL');
    expect(keys).toContain('180_ANNUAL');
    expect(keys.some((k) => k.startsWith('130_'))).toBe(false);
    expect(keys).not.toContain('100_ANNUAL');
  });

  it('incluye modelos de autonomo y excluye los exclusivos de empresa', () => {
    const keys = generateFiscalObligations('autonomo', 2026).map((o) => o.obligation_key);
    expect(keys.some((k) => k.startsWith('130_'))).toBe(true);
    expect(keys).toContain('100_ANNUAL');
    expect(keys.some((k) => k.startsWith('202_'))).toBe(false);
    expect(keys).not.toContain('200_ANNUAL');
  });

  it('persona_fisica solo tiene 100 (IRPF) y 720 (bienes en el extranjero)', () => {
    const keys = generateFiscalObligations('persona_fisica', 2026).map((o) => o.obligation_key);
    expect(keys.sort()).toEqual(['100_ANNUAL', '720_ANNUAL']);
  });

  it('ordena las obligaciones por fecha de vencimiento ascendente', () => {
    const deadlines = generateFiscalObligations('empresa', 2026).map((o) => o.deadline);
    const sorted = [...deadlines].sort();
    expect(deadlines).toEqual(sorted);
  });

  it('el modelo 347 respeta el ultimo dia de febrero segun sea ano bisiesto', () => {
    const leap = generateFiscalObligations('empresa', 2028).find((o) => o.obligation_key === '347_ANNUAL');
    const nonLeap = generateFiscalObligations('empresa', 2027).find((o) => o.obligation_key === '347_ANNUAL');
    expect(leap?.deadline).toBe('2028-02-29');
    expect(nonLeap?.deadline).toBe('2027-02-28');
  });
});

describe('urgencyLevel', () => {
  function daysFromToday(days: number): string {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  it('marca como overdue una fecha ya pasada', () => {
    expect(urgencyLevel(daysFromToday(-1))).toBe('overdue');
  });

  it('marca como critical dentro de los proximos 7 dias', () => {
    expect(urgencyLevel(daysFromToday(0))).toBe('critical');
    expect(urgencyLevel(daysFromToday(7))).toBe('critical');
  });

  it('marca como soon entre 8 y 30 dias', () => {
    expect(urgencyLevel(daysFromToday(8))).toBe('soon');
    expect(urgencyLevel(daysFromToday(30))).toBe('soon');
  });

  it('marca como ok mas alla de 30 dias', () => {
    expect(urgencyLevel(daysFromToday(31))).toBe('ok');
  });
});
