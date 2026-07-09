export interface ProfileReadinessInput {
  full_name?: string | null;
  phone?: string | null;
  client_type?: string | null;
  tax_id?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  habitual_address?: string | null;
  habitual_city?: string | null;
  habitual_postal_code?: string | null;
}

export interface ProfileReadiness {
  profileCompleted: boolean;
  billingReady: boolean;
  habitualAddressReady: boolean;
}

const has = (v: string | null | undefined) => typeof v === 'string' && v.trim().length > 0;

export function computeProfileReadiness(p: ProfileReadinessInput): ProfileReadiness {
  const profileCompleted = has(p.full_name) && has(p.phone);
  const billingReady = has(p.client_type) && has(p.tax_id) && has(p.address) && has(p.city) && has(p.postal_code);
  const habitualAddressReady = p.client_type === 'empresa'
    || (has(p.habitual_address) && has(p.habitual_city) && has(p.habitual_postal_code));
  return { profileCompleted, billingReady, habitualAddressReady };
}
