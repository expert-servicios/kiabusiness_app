export interface CompanyBillingFields {
  razon_social?: string | null;
  cif_nif?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  codigo_postal?: string | null;
  pais?: string | null;
}

function present(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

export function isCompanyBillingReady(company: CompanyBillingFields | null | undefined): boolean {
  if (!company) return false;
  return (
    present(company.razon_social) &&
    present(company.cif_nif) &&
    present(company.direccion) &&
    present(company.ciudad) &&
    present(company.codigo_postal) &&
    present(company.pais ?? 'ES')
  );
}

export function missingCompanyBillingFields(company: CompanyBillingFields | null | undefined): string[] {
  if (!company) return ['razon_social', 'cif_nif', 'direccion', 'ciudad', 'codigo_postal'];
  const missing: string[] = [];
  if (!present(company.razon_social)) missing.push('razon_social');
  if (!present(company.cif_nif)) missing.push('cif_nif');
  if (!present(company.direccion)) missing.push('direccion');
  if (!present(company.ciudad)) missing.push('ciudad');
  if (!present(company.codigo_postal)) missing.push('codigo_postal');
  if (!present(company.pais ?? 'ES')) missing.push('pais');
  return missing;
}
