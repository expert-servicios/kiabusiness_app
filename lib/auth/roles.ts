export const ROLES = {
  OWNER:  'owner',
  ADMIN:  'admin',
  CLIENT: 'client',
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

export function isStaffRole(role: string | null | undefined): boolean {
  return role === ROLES.OWNER || role === ROLES.ADMIN;
}

export function isOwner(role: string | null | undefined): boolean {
  return role === ROLES.OWNER;
}

export function canManageCases(role: string | null | undefined): boolean {
  return isStaffRole(role);
}

export function canViewFinancials(role: string | null | undefined): boolean {
  return isStaffRole(role);
}
