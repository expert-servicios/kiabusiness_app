/**
 * Spanish AEAT fiscal obligations generator.
 * Covers empresa (SL/SA), autonomo, and persona_fisica profiles.
 */

export type ClientType = 'empresa' | 'autonomo' | 'persona_fisica';

export interface FiscalObligation {
  obligation_key: string;
  modelo: string;
  description: string;
  period_label: string;
  deadline: string; // ISO date YYYY-MM-DD
}

function iso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function feb28(year: number): string {
  return iso(year, 2, new Date(year, 2, 0).getDate());
}

export function generateFiscalObligations(
  clientType: ClientType,
  year: number
): FiscalObligation[] {
  const obligations: FiscalObligation[] = [];

  // 303 — IVA trimestral
  if (clientType === 'empresa' || clientType === 'autonomo') {
    for (const [q, month] of [['1T', 1], ['2T', 4], ['3T', 7], ['4T', 10]] as [string, number][]) {
      obligations.push({ obligation_key: `303_${q}`, modelo: '303', description: `IVA trimestral — ${q} ${year}`, period_label: `${q} ${year}`, deadline: iso(year, month, 30) });
    }
  }

  // 390 — Resumen anual IVA
  if (clientType === 'empresa' || clientType === 'autonomo') {
    obligations.push({ obligation_key: '390_ANNUAL', modelo: '390', description: `Resumen anual IVA ${year - 1}`, period_label: `Anual ${year - 1}`, deadline: iso(year, 1, 30) });
  }

  // 111 — Retenciones IRPF trabajo trimestral
  if (clientType === 'empresa' || clientType === 'autonomo') {
    for (const [q, month] of [['1T', 1], ['2T', 4], ['3T', 7], ['4T', 10]] as [string, number][]) {
      obligations.push({ obligation_key: `111_${q}`, modelo: '111', description: `Retenciones IRPF trabajo — ${q} ${year}`, period_label: `${q} ${year}`, deadline: iso(year, month, 20) });
    }
  }

  // 190 — Resumen anual retenciones trabajo
  if (clientType === 'empresa' || clientType === 'autonomo') {
    obligations.push({ obligation_key: '190_ANNUAL', modelo: '190', description: `Resumen anual retenciones IRPF ${year - 1}`, period_label: `Anual ${year - 1}`, deadline: iso(year, 1, 31) });
  }

  // 115 — Retenciones alquileres trimestral (empresa)
  if (clientType === 'empresa') {
    for (const [q, month] of [['1T', 1], ['2T', 4], ['3T', 7], ['4T', 10]] as [string, number][]) {
      obligations.push({ obligation_key: `115_${q}`, modelo: '115', description: `Retenciones arrendamientos — ${q} ${year}`, period_label: `${q} ${year}`, deadline: iso(year, month, 20) });
    }
  }

  // 180 — Resumen anual retenciones alquileres (empresa)
  if (clientType === 'empresa') {
    obligations.push({ obligation_key: '180_ANNUAL', modelo: '180', description: `Resumen anual retenciones arrendamientos ${year - 1}`, period_label: `Anual ${year - 1}`, deadline: iso(year, 1, 31) });
  }

  // 202 — Pagos fraccionados IS (empresa)
  if (clientType === 'empresa') {
    obligations.push(
      { obligation_key: '202_1P', modelo: '202', description: `Pago fraccionado IS — 1.º plazo ${year}`, period_label: `1P ${year}`, deadline: iso(year, 4, 20) },
      { obligation_key: '202_2P', modelo: '202', description: `Pago fraccionado IS — 2.º plazo ${year}`, period_label: `2P ${year}`, deadline: iso(year, 10, 20) },
      { obligation_key: '202_3P', modelo: '202', description: `Pago fraccionado IS — 3.º plazo ${year}`, period_label: `3P ${year}`, deadline: iso(year, 12, 20) }
    );
  }

  // 200 — IS anual (empresa)
  if (clientType === 'empresa') {
    obligations.push({ obligation_key: '200_ANNUAL', modelo: '200', description: `Impuesto sobre Sociedades ${year - 1}`, period_label: `Anual ${year - 1}`, deadline: iso(year, 7, 25) });
  }

  // 347 — Operaciones con terceros (empresa + autonomo)
  if (clientType === 'empresa' || clientType === 'autonomo') {
    obligations.push({ obligation_key: '347_ANNUAL', modelo: '347', description: `Declaración anual operaciones con terceros ${year - 1}`, period_label: `Anual ${year - 1}`, deadline: feb28(year) });
  }

  // 720 — Bienes en el extranjero (todos)
  obligations.push({ obligation_key: '720_ANNUAL', modelo: '720', description: `Bienes y derechos en el extranjero ${year - 1}`, period_label: `Anual ${year - 1}`, deadline: iso(year, 3, 31) });

  // 130 — Pago fraccionado IRPF actividad económica (autonomo)
  if (clientType === 'autonomo') {
    for (const [q, month] of [['1T', 1], ['2T', 4], ['3T', 7], ['4T', 10]] as [string, number][]) {
      obligations.push({ obligation_key: `130_${q}`, modelo: '130', description: `Pago fraccionado IRPF — ${q} ${year}`, period_label: `${q} ${year}`, deadline: iso(year, month, 30) });
    }
  }

  // 100 — IRPF anual (autonomo + persona_fisica)
  if (clientType === 'autonomo' || clientType === 'persona_fisica') {
    obligations.push({ obligation_key: '100_ANNUAL', modelo: '100', description: `Declaración de la Renta (IRPF) ${year - 1}`, period_label: `Anual ${year - 1}`, deadline: iso(year, 6, 30) });
  }

  return obligations.sort((a, b) => a.deadline.localeCompare(b.deadline));
}

export type Urgency = 'overdue' | 'critical' | 'soon' | 'ok';

export function urgencyLevel(deadline: string): Urgency {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((new Date(deadline).getTime() - today.getTime()) / 86400000);
  if (diff < 0) return 'overdue';
  if (diff <= 7) return 'critical';
  if (diff <= 30) return 'soon';
  return 'ok';
}
