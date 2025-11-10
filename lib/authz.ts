// lib/authz.ts
export type Role = 'admin' | 'jefe_estudio' | 'abogado_redactor';

export const PERMISSIONS = {
  // USUARIOS
  viewUsersMenu: ['admin'],
  listUsers:     ['admin'] as const,
  createUser:    ['admin'] as const,
  updateUser:    ['admin'] as const,
  deleteUser:    ['admin'] as const,

  //DEMANDAS
  viewDemandaMenu:  ['admin', 'jefe_estudio', 'abogado_redactor'] as const,
  listDemandas:     ['admin', 'jefe_estudio', 'abogado_redactor'] as const,
  createDemanda:    ['admin', 'jefe_estudio', 'abogado_redactor'] as const,
  updateDemanda:    ['admin', 'jefe_estudio'] as const,
  deleteDemanda:    ['admin'] as const,
  generateDoc:      ['admin', 'jefe_estudio', 'abogado_redactor'] as const,
  downloadDoc:      ['admin', 'jefe_estudio', 'abogado_redactor'] as const,
} as const satisfies Record<string, readonly Role[]>;

export type PermKey = keyof typeof PERMISSIONS;

export const hasRole = (roles: string[] | undefined | null, role: Role) =>
  !!roles?.includes(role);

export const hasAnyRole = (roles: string[] | undefined | null, required: readonly Role[]) =>
  required.some(r => hasRole(roles, r));

export const can = (userRoles: string[] | undefined | null, permKey: PermKey) =>
  hasAnyRole(userRoles, PERMISSIONS[permKey]);
