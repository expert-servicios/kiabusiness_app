import type { KiaSession } from '@/lib/integrations/kia-engine';
import type { CompanySuggestion } from '@/lib/integrations/company-data-resolver';

export const COMPANY_CONFIRM_BUTTON = 'company_data_confirm';
export const COMPANY_REJECT_BUTTON = 'company_data_reject';
export const PENDING_COMPANY_DATA_KEY = 'pending_company_data';

export interface PendingCompanyData {
  taxId: string;
  proposed: {
    prof_nombre_empresa?: string;
    prof_direccion_fiscal?: string;
    prof_fecha_inicio?: string;
  };
  source: CompanySuggestion['source'];
  retrievedAt: string;
}

export function buildPendingCompanyData(
  suggestion: CompanySuggestion,
  taxId: string,
  currentData: KiaSession['data'],
): PendingCompanyData | null {
  const proposed: PendingCompanyData['proposed'] = {};
  if (suggestion.name && !currentData.prof_nombre_empresa) {
    proposed.prof_nombre_empresa = suggestion.name;
  }
  const fullAddress = [suggestion.registeredAddress, suggestion.city, suggestion.province]
    .filter(Boolean).join(', ');
  if (fullAddress && !currentData.prof_direccion_fiscal) {
    proposed.prof_direccion_fiscal = fullAddress;
  }
  if (suggestion.incorporationDate && !currentData.prof_fecha_inicio) {
    proposed.prof_fecha_inicio = suggestion.incorporationDate;
  }
  if (Object.keys(proposed).length === 0) return null;
  return {
    taxId,
    proposed,
    source: suggestion.source,
    retrievedAt: suggestion.retrievedAt,
  };
}

export function serializePendingCompanyData(pending: PendingCompanyData): string {
  return JSON.stringify(pending);
}

export function readPendingCompanyData(data: KiaSession['data']): PendingCompanyData | null {
  const raw = data[PENDING_COMPANY_DATA_KEY];
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PendingCompanyData>;
    if (!parsed.taxId || !parsed.proposed || !parsed.source || !parsed.retrievedAt) return null;
    return parsed as PendingCompanyData;
  } catch {
    return null;
  }
}

export function clearPendingCompanyData(data: KiaSession['data']): KiaSession['data'] {
  const next = { ...data };
  delete next[PENDING_COMPANY_DATA_KEY];
  return next;
}

export function acceptPendingCompanyData(data: KiaSession['data']): KiaSession['data'] | null {
  const pending = readPendingCompanyData(data);
  if (!pending) return null;
  return { ...clearPendingCompanyData(data), ...pending.proposed };
}
