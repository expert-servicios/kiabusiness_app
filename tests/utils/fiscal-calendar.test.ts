import { describe, it, expect } from 'vitest';
import { generateFiscalTemplateObligations, urgencyLevel } from '@/lib/utils/fiscal-calendar';

describe('generateFiscalTemplateObligations', () => {
  it('genera solo las plantillas expresamente seleccionadas', () => {
    const items = generateFiscalTemplateObligations(['303_quarterly', '202_triannual'], 2026);
    const models = new Set(items.map((o) => o.modelo));
    expect(models).toEqual(new Set(['303', '202']));
    expect(items).toHaveLength(7);
  });

  it('usa los plazos trimestrales correctos para 303', () => {
    const items = generateFiscalTemplateObligations(['303_quarterly'], 2026);
    expect(items.map((o) => [o.period_label, o.deadline])).toEqual([
      ['1T 2026', '2026-04-20'],
      ['2T 2026', '2026-07-20'],
      ['3T 2026', '2026-10-20'],
      ['4T 2026', '2027-01-30'],
    ]);
  });

  it('usa enero dia 20 para el cuarto trimestre de 111/115', () => {
    const items = generateFiscalTemplateObligations(['111_quarterly', '115_quarterly'], 2026);
    const fourth = items.filter((o) => o.period_label === '4T 2026');
    expect(fourth).toHaveLength(2);
    expect(fourth.every((o) => o.deadline === '2027-01-20')).toBe(true);
  });

  it('genera 202 en abril, octubre y diciembre', () => {
    const items = generateFiscalTemplateObligations(['202_triannual'], 2026);
    expect(items.map((o) => o.deadline)).toEqual(['2026-04-20', '2026-10-20', '2026-12-20']);
  });

  it('respeta febrero bisiesto para 347', () => {
    const leap = generateFiscalTemplateObligations(['347_annual'], 2027)[0];
    const nonLeap = generateFiscalTemplateObligations(['347_annual'], 2026)[0];
    expect(leap.deadline).toBe('2028-02-29');
    expect(nonLeap.deadline).toBe('2027-02-28');
  });

  it('marca 2026 como verificado y ejercicios futuros como nominales pendientes de verificar', () => {
    const verified = generateFiscalTemplateObligations(['202_triannual'], 2026)[0];
    const future = generateFiscalTemplateObligations(['202_triannual'], 2027)[0];
    expect(verified.deadline_verified).toBe(true);
    expect(future.deadline_verified).toBe(false);
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
