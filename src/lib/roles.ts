import { Role } from '@/types';

// Role hierarchy order (higher index = more senior)
export const ROLE_ORDER: Role[] = ['Associate', 'Manager', 'VH', 'SalesHead', 'Admin'];

export function getRoleLevel(role: Role): number {
  return ROLE_ORDER.indexOf(role);
}

export function isMoreSenior(a: Role, b: Role): boolean {
  return getRoleLevel(a) > getRoleLevel(b);
}

// Who can assign targets to whom
export const ASSIGNABLE_ROLES: Record<Role, Role[]> = {
  Admin:      ['SalesHead', 'VH', 'Manager', 'Associate'],
  SalesHead:  ['VH'],
  VH:         ['Manager'],
  Manager:    ['Associate'],
  Associate:  [],
};

export function canAssignTo(assignerRole: Role, targetRole: Role): boolean {
  return ASSIGNABLE_ROLES[assignerRole].includes(targetRole);
}

// Which roles can assign incentive structures
export const CAN_ASSIGN_INCENTIVE: Role[] = ['Admin', 'SalesHead', 'Manager'];

export function canAssignIncentive(role: Role): boolean {
  return CAN_ASSIGN_INCENTIVE.includes(role);
}

// Which roles can access user management
export const CAN_MANAGE_USERS: Role[] = ['Admin'];

export function canManageUsers(role: Role): boolean {
  return CAN_MANAGE_USERS.includes(role);
}

// Dashboard label per role
export const ROLE_LABELS: Record<Role, string> = {
  Admin:      'Admin',
  SalesHead:  'Sales Head',
  VH:         'Vertical Head',
  Manager:    'Manager',
  Associate:  'Associate',
};

// Role display color classes (Tailwind)
export const ROLE_COLORS: Record<Role, string> = {
  Admin:      'bg-purple-100 text-purple-800',
  SalesHead:  'bg-blue-100 text-blue-800',
  VH:         'bg-indigo-100 text-indigo-800',
  Manager:    'bg-green-100 text-green-800',
  Associate:  'bg-gray-100 text-gray-800',
};
