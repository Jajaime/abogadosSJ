import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  can,
  PERMISSIONS,
  type PermKey,
  type Role,
} from '../lib/authz';

const mocks = vi.hoisted(() => ({
  requireSession: vi.fn(),
}));

vi.mock('@/lib/auth.server', () => ({
  requireSession: mocks.requireSession,
}));

import { requirePerm, isElevated } from '../lib/api-authz';

// Matriz esperada independiente de PERMISSIONS.
const expected = {
  admin: [
    'viewUsersMenu',
    'listUsers',
    'createUser',
    'updateUser',
    'deleteUser',
    'viewAbogadosMenu',
    'listAbogados',
    'manageAbogados',
    'viewDemandaMenu',
    'listDemandas',
    'createDemanda',
    'updateDemanda',
    'deleteDemanda',
    'generateDoc',
    'downloadDoc',
  ],
  jefe_estudio: [
    'viewAbogadosMenu',
    'listAbogados',
    'manageAbogados',
    'viewDemandaMenu',
    'listDemandas',
    'createDemanda',
    'updateDemanda',
    'generateDoc',
    'downloadDoc',
  ],
  abogado_redactor: [
    'listAbogados',
    'viewDemandaMenu',
    'listDemandas',
    'createDemanda',
    'generateDoc',
    'downloadDoc',
  ],
} satisfies Record<Role, readonly PermKey[]>;

describe('Matriz institucional de permisos', () => {
  const permissions = Object.keys(PERMISSIONS) as PermKey[];
  const roles = Object.keys(expected) as Role[];

  for (const role of roles) {
    for (const perm of permissions) {
      const allowed = expected[role].includes(perm as never);

      it(`${role} / ${perm}: ${
        allowed ? 'permitido' : 'denegado'
      }`, () => {
        expect(can([role], perm)).toBe(allowed);
      });
    }
  }

  it('rechaza una sesión sin roles', () => {
    expect(can([], 'listDemandas')).toBe(false);
  });

  it('rechaza roles desconocidos', () => {
    expect(can(['rol_desconocido'], 'deleteDemanda'))
      .toBe(false);
  });

  it('rechaza la ausencia de roles', () => {
    expect(can(null, 'listDemandas')).toBe(false);
    expect(can(undefined, 'listDemandas')).toBe(false);
  });

  it('acepta permisos combinados entre roles', () => {
    expect(
      can(['abogado_redactor', 'admin'], 'deleteDemanda')
    ).toBe(true);
  });
});

describe('Identificación de roles elevados', () => {
  it('admin es elevado', () => {
    expect(isElevated(['admin'])).toBe(true);
  });

  it('jefe de estudio es elevado', () => {
    expect(isElevated(['jefe_estudio'])).toBe(true);
  });

  it('abogado redactor no es elevado', () => {
    expect(isElevated(['abogado_redactor'])).toBe(false);
  });

  it('sin roles no es elevado', () => {
    expect(isElevated([])).toBe(false);
    expect(isElevated(null)).toBe(false);
  });
});

describe('Autorización real mediante requirePerm', () => {
  beforeEach(() => {
    mocks.requireSession.mockReset();
  });

  it('sin sesión devuelve HTTP 401', async () => {
    mocks.requireSession.mockRejectedValueOnce(
      new Error('UNAUTHENTICATED')
    );

    const resultado = await requirePerm('listDemandas');

    expect(resultado.error?.status).toBe(401);
    expect(resultado.session).toBeUndefined();
  });

  it('redactor no puede eliminar demandas', async () => {
    mocks.requireSession.mockResolvedValueOnce({
      userId: 'redactor-1',
      roles: ['abogado_redactor'],
    });

    const resultado = await requirePerm('deleteDemanda');

    expect(resultado.error?.status).toBe(403);
    expect(resultado.session).toBeUndefined();
  });

  it('jefe de estudio puede modificar demandas', async () => {
    mocks.requireSession.mockResolvedValueOnce({
      userId: 'jefe-1',
      roles: ['jefe_estudio'],
    });

    const resultado = await requirePerm('updateDemanda');

    expect(resultado.error).toBeUndefined();
    expect(resultado.session?.userId).toBe('jefe-1');
  });

  it('admin puede eliminar demandas', async () => {
    mocks.requireSession.mockResolvedValueOnce({
      userId: 'admin-1',
      roles: ['admin'],
    });

    const resultado = await requirePerm('deleteDemanda');

    expect(resultado.error).toBeUndefined();
    expect(resultado.session?.userId).toBe('admin-1');
  });
});
