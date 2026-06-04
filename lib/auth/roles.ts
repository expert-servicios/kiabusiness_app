export const ROLES = {
  OWNER:        'owner',
  ADMIN:        'admin',
  CLIENT:       'client',
  /** Admin de una asesoria/gestoria cliente del SaaS (multi-tenant). */
  TENANT_ADMIN: 'tenant_admin',
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

/** Roles con acceso de staff en la instancia EXPERT (owner/admin internos). */
export function isStaffRole(role: string | null | undefined): boolean {
  return role === ROLES.OWNER || role === ROLES.ADMIN;
}

/** Admin de un tenant externo (asesoria SaaS). Solo gestiona su propio tenant. */
export function isTenantAdmin(role: string | null | undefined): boolean {
  return role === ROLES.TENANT_ADMIN;
}

/** Cualquier rol con capacidad de administrar (staff EXPERT o admin de asesoria). */
export function isAnyAdmin(role: string | null | undefined): boolean {
  return isStaffRole(role) || isTenantAdmin(role);
}

export function isOwner(role: string | null | undefined): boolean {
  return role === ROLES.OWNER;
}

export function canManageCases(role: string | null | undefined): boolean {
  return isAnyAdmin(role);
}

export function canViewFinancials(role: string | null | undefined): boolean {
  return isAnyAdmin(role);
}
