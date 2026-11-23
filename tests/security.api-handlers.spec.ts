import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const session = {
    userId: 'usuario-pruebas',
    roles: ['admin'],
  };

  const writes = {
    demandaCreate: vi.fn(),
    demandaUpdate: vi.fn(),
    demandaDelete: vi.fn(),
    usuarioCreate: vi.fn(),
    usuarioUpdate: vi.fn(),
    usuarioDelete: vi.fn(),
    abogadoCreate: vi.fn(),
    abogadoUpdate: vi.fn(),
    documentoUpsert: vi.fn(),
  };

  return {
    session,
    writes,
    requirePerm: vi.fn(
      async (_perm: string): Promise<{
        session?: typeof session;
        error?: Response;
      }> => ({ session })
    ),
    requireSession: vi.fn(async () => session),
    csrfCookie: vi.fn(async (): Promise<string | null> => 'csrf-token-correcto'),
  };
});

vi.mock('@/lib/auth.server', () => ({
  requireSession: mocks.requireSession,
  getCsrfTokenFromCookies: mocks.csrfCookie,
  revokeUserSessions: vi.fn(),
}));

vi.mock('@/lib/api-authz', () => ({
  requirePerm: mocks.requirePerm,
  isElevated: () => true,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    demanda: {
      create: mocks.writes.demandaCreate,
      update: mocks.writes.demandaUpdate,
      delete: mocks.writes.demandaDelete,
    },
    usuario: {
      create: mocks.writes.usuarioCreate,
      update: mocks.writes.usuarioUpdate,
      delete: mocks.writes.usuarioDelete,
    },
    abogado: {
      create: mocks.writes.abogadoCreate,
      update: mocks.writes.abogadoUpdate,
    },
    demandaDocumento: {
      upsert: mocks.writes.documentoUpsert,
    },
  },
}));

vi.mock(
  '@/lib/documents/demanda/server/generateDemandaDocx',
  () => ({
    MAX_DOCUMENT_SIZE: 10_000_000,
    prepareDemandaDocument: vi.fn(),
    renderDemandaDocx: vi.fn(),
  })
);

import * as demandas from '../app/api/demandas/route';
import * as demandaId from '../app/api/demandas/[id]/route';
import * as abogados from '../app/api/abogados/route';
import * as abogadoId from '../app/api/abogados/[id]/route';
import * as usuarios from '../app/api/usuario/route';
import * as usuarioId from '../app/api/usuario/[id]/route';
import { POST as generarDoc } from '../app/api/generate_doc/route.js';

const ctx = {
  params: Promise.resolve({
    id: '00000000-0000-4000-8000-000000000001',
  }),
};

function peticion(
  ruta: string,
  metodo: string,
  csrf?: string
): Request {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  if (csrf !== undefined) {
    headers['x-csrf-token'] = csrf;
  }

  return new Request('http://localhost:3003' + ruta, {
    method: metodo,
    headers,
    ...(metodo === 'DELETE' ? {} : { body: '{}' }),
  });
}

type Caso = {
  nombre: string;
  permiso?: string;
  ejecutar: (csrf?: string) => Promise<Response>;
};

const casos: Caso[] = [
  {
    nombre: 'POST /api/demandas',
    permiso: 'createDemanda',
    ejecutar: csrf =>
      demandas.POST(peticion('/api/demandas', 'POST', csrf)),
  },
  {
    nombre: 'PUT /api/demandas/:id',
    permiso: 'updateDemanda',
    ejecutar: csrf =>
      demandaId.PUT(peticion('/api/demandas/1', 'PUT', csrf), ctx),
  },
  {
    nombre: 'DELETE /api/demandas/:id',
    permiso: 'deleteDemanda',
    ejecutar: csrf =>
      demandaId.DELETE(peticion('/api/demandas/1', 'DELETE', csrf), ctx),
  },
  {
    nombre: 'POST /api/abogados',
    permiso: 'manageAbogados',
    ejecutar: csrf =>
      abogados.POST(peticion('/api/abogados', 'POST', csrf)),
  },
  {
    nombre: 'PATCH /api/abogados/:id',
    permiso: 'manageAbogados',
    ejecutar: csrf =>
      abogadoId.PATCH(
        peticion('/api/abogados/00000000-0000-4000-8000-000000000001', 'PATCH', csrf),
        ctx
      ),
  },
  {
    nombre: 'POST /api/usuario',
    ejecutar: csrf =>
      usuarios.POST(peticion('/api/usuario', 'POST', csrf)),
  },
  {
    nombre: 'PUT /api/usuario/:id',
    ejecutar: csrf =>
      usuarioId.PUT(peticion('/api/usuario/test', 'PUT', csrf), ctx),
  },
  {
    nombre: 'DELETE /api/usuario/:id',
    ejecutar: csrf =>
      usuarioId.DELETE(peticion('/api/usuario/test', 'DELETE', csrf), ctx),
  },
  {
    nombre: 'POST /api/generate_doc',
    permiso: 'generateDoc',
    ejecutar: csrf =>
      generarDoc(peticion('/api/generate_doc', 'POST', csrf)),
  },
];

describe('Protección CSRF de handlers HTTP', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  for (const caso of casos) {
    for (const [descripcion, token] of [
      ['sin encabezado CSRF', undefined],
      ['con encabezado CSRF incorrecto', 'token-invalido'],
    ] as const) {
      it(`${caso.nombre} ${descripcion}`, async () => {
        const response = await caso.ejecutar(token);

        expect(response.status).toBe(403);

        expect(await response.json()).toMatchObject({
          error: 'Token CSRF inválido',
        });

        if (caso.permiso) {
          expect(mocks.requirePerm).toHaveBeenCalledWith(
            caso.permiso
          );
        } else {
          expect(mocks.requireSession).toHaveBeenCalled();
        }

        expect(mocks.csrfCookie).toHaveBeenCalled();

        // Ninguna escritura simulada debe ejecutarse.
        for (const write of Object.values(mocks.writes)) {
          expect(write).not.toHaveBeenCalled();
        }
      });
    }
  }
});

describe('Orden de autenticación, permisos y CSRF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const noWrites = () => {
    for (const write of Object.values(mocks.writes)) {
      expect(write).not.toHaveBeenCalled();
    }
  };

  for (const caso of casos) {
    it(`${caso.nombre}: rechaza sesión ausente`, async () => {
      if (caso.permiso) {
        mocks.requirePerm.mockResolvedValueOnce({
          error: Response.json(
            { error: 'No autenticado' },
            { status: 401 }
          ),
        });
      } else {
        mocks.requireSession.mockRejectedValueOnce(
          new Error('UNAUTHENTICATED')
        );
      }

      const response = await caso.ejecutar(
        'csrf-token-correcto'
      );

      expect(response.status).toBe(401);
      expect(mocks.csrfCookie).not.toHaveBeenCalled();
      noWrites();
    });

    it(`${caso.nombre}: rechaza permisos insuficientes`, async () => {
      if (caso.permiso) {
        mocks.requirePerm.mockResolvedValueOnce({
          error: Response.json(
            { error: 'Prohibido' },
            { status: 403 }
          ),
        });
      } else {
        mocks.requireSession.mockResolvedValueOnce({
          userId: 'usuario-pruebas',
          roles: ['abogado_redactor'],
        });
      }

      const response = await caso.ejecutar(
        'csrf-token-correcto'
      );

      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({
        error: 'Prohibido',
      });

      expect(mocks.csrfCookie).not.toHaveBeenCalled();
      noWrites();
    });

    it(`${caso.nombre}: rechaza cookie CSRF ausente`, async () => {
      mocks.csrfCookie.mockResolvedValueOnce(null);

      const response = await caso.ejecutar(
        'csrf-token-correcto'
      );

      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({
        error: 'Token CSRF inválido',
      });

      expect(mocks.csrfCookie).toHaveBeenCalled();
      noWrites();
    });
  }

  const casosConValidacion = casos.filter(caso =>
    [
      'POST /api/demandas',
      'POST /api/abogados',
      'POST /api/usuario',
      'POST /api/generate_doc',
    ].includes(caso.nombre)
  );

  for (const caso of casosConValidacion) {
    it(`${caso.nombre}: CSRF válido supera protección`, async () => {
      const response = await caso.ejecutar(
        'csrf-token-correcto'
      );

      // El cuerpo '{}' es deliberadamente inválido.
      // Debe llegar a la validación del endpoint.
      expect(response.status).toBe(400);

      expect(mocks.csrfCookie).toHaveBeenCalled();
      noWrites();
    });
  }
});
