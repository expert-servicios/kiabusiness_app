/**
 * Spanish AEAT fiscal template catalog.
 *
 * Critical rule: templates are never inferred from legal form, subscription plan,
 * or client type. An Admin must explicitly activate the applicable template for
 * a linked company before obligations are materialized.
 *
 * Dates below encode the general statutory filing deadline. AEAT may move a
 * deadline to the next working day when the nominal date is non-working. The
 * UI/API exposes whether the deadline falls inside a calendar year currently
 * verified against the published AEAT taxpayer calendar.
 */

export interface FiscalObligation {
  obligation_key: string;
  template_code: FiscalTemplateCode;
  modelo: string;
  description: string;
  period_label: string;
  deadline: string; // ISO date YYYY-MM-DD
  deadline_verified: boolean;
}

export interface FiscalTemplateDefinition {
  code: FiscalTemplateCode;
  modelo: string;
  title: string;
  cadence: 'quarterly' | 'triannual' | 'annual';
  description: string;
  warning: string;
}

export const FISCAL_TEMPLATE_CODES = [
  '303_quarterly',
  '111_quarterly',
  '115_quarterly',
  '130_quarterly',
  '202_triannual',
  '200_annual_calendar_year',
  '390_annual',
  '347_annual',
  '190_annual',
  '180_annual',
] as const;

export type FiscalTemplateCode = (typeof FISCAL_TEMPLATE_CODES)[number];

/** Latest AEAT taxpayer calendar explicitly verified in this code version. */
export const AEAT_VERIFIED_CALENDAR_YEAR = 2026;

export const FISCAL_TEMPLATE_CATALOG: readonly FiscalTemplateDefinition[] = [
  {
    code: '303_quarterly',
    modelo: '303',
    title: 'IVA trimestral',
    cadence: 'quarterly',
    description: 'Autoliquidación trimestral del IVA.',
    warning: 'Activar solo si el periodo de liquidación del IVA es trimestral. No usar para liquidación mensual/SII.',
  },
  {
    code: '111_quarterly',
    modelo: '111',
    title: 'Retenciones de trabajo y profesionales',
    cadence: 'quarterly',
    description: 'Retenciones e ingresos a cuenta de rendimientos del trabajo y determinadas actividades.',
    warning: 'Activar solo si existen retenciones sujetas al modelo 111 y la periodicidad aplicable es trimestral.',
  },
  {
    code: '115_quarterly',
    modelo: '115',
    title: 'Retenciones de arrendamientos',
    cadence: 'quarterly',
    description: 'Retenciones e ingresos a cuenta por arrendamiento o subarrendamiento de inmuebles urbanos.',
    warning: 'Activar solo si la entidad satisface alquileres sujetos a retención y la periodicidad aplicable es trimestral.',
  },
  {
    code: '130_quarterly',
    modelo: '130',
    title: 'Pago fraccionado IRPF',
    cadence: 'quarterly',
    description: 'Pago fraccionado para actividades económicas en estimación directa.',
    warning: 'No procede en todos los autónomos; revisar, entre otros requisitos, las reglas de ingresos sometidos a retención.',
  },
  {
    code: '202_triannual',
    modelo: '202',
    title: 'Pago fraccionado Impuesto sobre Sociedades',
    cadence: 'triannual',
    description: 'Pagos fraccionados del Impuesto sobre Sociedades en abril, octubre y diciembre.',
    warning: 'La obligación de presentar el modelo 202 depende de las circunstancias de la entidad. Confirmar antes de activar.',
  },
  {
    code: '200_annual_calendar_year',
    modelo: '200',
    title: 'Impuesto sobre Sociedades anual',
    cadence: 'annual',
    description: 'Declaración anual del Impuesto sobre Sociedades para periodo impositivo coincidente con el año natural.',
    warning: 'Esta plantilla presupone ejercicio fiscal coincidente con el año natural. Para cierres distintos se debe fijar el plazo manualmente.',
  },
  {
    code: '390_annual',
    modelo: '390',
    title: 'Resumen anual IVA',
    cadence: 'annual',
    description: 'Declaración-resumen anual del IVA.',
    warning: 'No todos los sujetos que presentan 303 están obligados al 390; por ejemplo, existen supuestos de exoneración. Confirmar antes de activar.',
  },
  {
    code: '347_annual',
    modelo: '347',
    title: 'Operaciones con terceras personas',
    cadence: 'annual',
    description: 'Declaración anual de operaciones con terceras personas.',
    warning: 'Confirmar obligación y exclusiones antes de activar; determinados sujetos, incluido SII en ciertos casos, pueden quedar excluidos.',
  },
  {
    code: '190_annual',
    modelo: '190',
    title: 'Resumen anual de retenciones de trabajo y profesionales',
    cadence: 'annual',
    description: 'Resumen anual relacionado con retenciones declaradas, entre otros supuestos, en el modelo 111.',
    warning: 'Activar únicamente cuando corresponda presentar el resumen anual.',
  },
  {
    code: '180_annual',
    modelo: '180',
    title: 'Resumen anual de retenciones de arrendamientos',
    cadence: 'annual',
    description: 'Resumen anual relacionado con retenciones declaradas en el modelo 115.',
    warning: 'Activar únicamente cuando corresponda presentar el resumen anual.',
  },
] as const;

const TEMPLATE_BY_CODE = new Map(FISCAL_TEMPLATE_CATALOG.map((item) => [item.code, item]));

function iso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function lastDayOfFebruary(year: number): string {
  return iso(year, 2, new Date(year, 2, 0).getDate());
}

function verified(deadline: string): boolean {
  return Number(deadline.slice(0, 4)) <= AEAT_VERIFIED_CALENDAR_YEAR;
}

function obligation(
  template: FiscalTemplateDefinition,
  taxYear: number,
  key: string,
  periodLabel: string,
  deadline: string,
): FiscalObligation {
  return {
    obligation_key: `${template.code}:${taxYear}:${key}`,
    template_code: template.code,
    modelo: template.modelo,
    description: `${template.title} · ${periodLabel}`,
    period_label: periodLabel,
    deadline,
    deadline_verified: verified(deadline),
  };
}

function quarterly(
  template: FiscalTemplateDefinition,
  taxYear: number,
  fourthQuarterDay: 20 | 30,
): FiscalObligation[] {
  return [
    obligation(template, taxYear, '1T', `1T ${taxYear}`, iso(taxYear, 4, 20)),
    obligation(template, taxYear, '2T', `2T ${taxYear}`, iso(taxYear, 7, 20)),
    obligation(template, taxYear, '3T', `3T ${taxYear}`, iso(taxYear, 10, 20)),
    obligation(template, taxYear, '4T', `4T ${taxYear}`, iso(taxYear + 1, 1, fourthQuarterDay)),
  ];
}

export function getFiscalTemplate(code: string): FiscalTemplateDefinition | null {
  return TEMPLATE_BY_CODE.get(code as FiscalTemplateCode) ?? null;
}

export function generateFiscalTemplateObligations(
  templateCodes: readonly FiscalTemplateCode[],
  taxYear: number,
): FiscalObligation[] {
  const result: FiscalObligation[] = [];

  for (const code of templateCodes) {
    const template = TEMPLATE_BY_CODE.get(code);
    if (!template) continue;

    switch (code) {
      case '303_quarterly':
      case '130_quarterly':
        result.push(...quarterly(template, taxYear, 30));
        break;
      case '111_quarterly':
      case '115_quarterly':
        result.push(...quarterly(template, taxYear, 20));
        break;
      case '202_triannual':
        result.push(
          obligation(template, taxYear, '1P', `1P ${taxYear}`, iso(taxYear, 4, 20)),
          obligation(template, taxYear, '2P', `2P ${taxYear}`, iso(taxYear, 10, 20)),
          obligation(template, taxYear, '3P', `3P ${taxYear}`, iso(taxYear, 12, 20)),
        );
        break;
      case '200_annual_calendar_year':
        result.push(obligation(template, taxYear, 'ANNUAL', `Anual ${taxYear}`, iso(taxYear + 1, 7, 25)));
        break;
      case '390_annual':
        result.push(obligation(template, taxYear, 'ANNUAL', `Anual ${taxYear}`, iso(taxYear + 1, 1, 30)));
        break;
      case '347_annual':
        result.push(obligation(template, taxYear, 'ANNUAL', `Anual ${taxYear}`, lastDayOfFebruary(taxYear + 1)));
        break;
      case '190_annual':
      case '180_annual':
        result.push(obligation(template, taxYear, 'ANNUAL', `Anual ${taxYear}`, iso(taxYear + 1, 1, 31)));
        break;
    }
  }

  return result.sort((a, b) => a.deadline.localeCompare(b.deadline) || a.modelo.localeCompare(b.modelo));
}

export type Urgency = 'overdue' | 'critical' | 'soon' | 'ok';

export function urgencyLevel(deadline: string): Urgency {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Keep date-only comparison compatible with the existing fiscal calendar UI/tests.
  // Deadlines are stored as ISO dates and are not timestamps.
  const diff = Math.ceil((new Date(deadline).getTime() - today.getTime()) / 86400000);
  if (diff < 0) return 'overdue';
  if (diff <= 7) return 'critical';
  if (diff <= 30) return 'soon';
  return 'ok';
}
