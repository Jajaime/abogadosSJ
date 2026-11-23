import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireSession: vi.fn(),
  csrfCookie: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  documentoFindUnique: vi.fn(),
  documentoUpsert: vi.fn(),
  prepareDoc: vi.fn(),
  renderDoc: vi.fn(),
}));

vi.mock('@/lib/auth.server', () => ({
  requireSession: mocks.requireSession,
  getCsrfTokenFromCookies: mocks.csrfCookie,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    demanda: {
      findMany: mocks.findMany,
      findUnique: mocks.findUnique,
      update: mocks.update,
      delete: mocks.delete,
    },
    demandaDocumento: {
      findUnique: mocks.documentoFindUnique,
      upsert: mocks.documentoUpsert,
    },
  },
}));

vi.mock(
  '@/lib/documents/demanda/server/generateDemandaDocx',
  () => ({
    MAX_DOCUMENT_SIZE: 10000000,
    prepareDemandaDocument: mocks.prepareDoc,
    renderDemandaDocx: mocks.renderDoc,
  })
);

import { GET as listar } from '../app/api/demandas/route';
import {
  GET as consultar,
  PUT as actualizar,
  DELETE as eliminar,
} from '../app/api/demandas/[id]/route';
import { POST as generar } from '../app/api/generate_doc/route.js';
import { GET as descargar } from '../app/api/download_doc/route.js';

const demandas = [
  { id: 1, usuarioId: 'redactor-1', demandadoSolidario: [] },
  { id: 2, usuarioId: 'redactor-2', demandadoSolidario: [] },
];

function sesion(roles: string[], userId = 'redactor-1') {
  mocks.requireSession.mockResolvedValue({
    userId,
    roles,
  });
}

function contexto(id: number) {
  return {
    params: Promise.resolve({ id: String(id) }),
  };
}

function solicitudGet(id: number) {
  return new Request(`http://localhost:3003/api/demandas/${id}`);
}

function solicitudDoc(id: number) {
  return new Request('http://localhost:3003/api/generate_doc', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-csrf-token': 'csrf-prueba',
    },
    body: JSON.stringify({ demandaId: id }),
  });
}

function solicitudDescarga(id: number) {
  return new Request(
    `http://localhost:3003/api/download_doc?demandaId=${id}`
  );
}

beforeEach(() => {
  vi.resetAllMocks();

  sesion(['abogado_redactor']);

  mocks.csrfCookie.mockResolvedValue('csrf-prueba');

  mocks.findMany.mockImplementation(
    async ({ where }: { where: { usuarioId?: string } }) =>
      where.usuarioId
        ? demandas.filter(d => d.usuarioId === where.usuarioId)
        : demandas
  );

  mocks.findUnique.mockImplementation(
    async ({ where }: { where: { id: number } }) =>
      demandas.find(d => d.id === where.id) ?? null
  );

  mocks.documentoFindUnique.mockResolvedValue({
    nombre: 'prueba.docx',
    contenido: Uint8Array.from([80, 75, 3, 4]),
    tamano: 4,
  });

  // El documento no se genera realmente.
  // Simulamos una validación documental incompleta.
  mocks.prepareDoc.mockReturnValue({
    ok: false,
    code: 'DOCUMENT_BASE_VALIDATION',
    faltantes: ['campo-requerido'],
  });
});

describe('Propiedad: listado de demandas', () => {
  it('redactor solo recibe sus demandas', async () => {
    const response = await listar();

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.map((d: { id: number }) => d.id)).toEqual([1]);

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { usuarioId: 'redactor-1' },
      })
    );
  });

  for (const role of ['admin', 'jefe_estudio']) {
    it(`${role} puede listar todas`, async () => {
      sesion([role]);

      const response = await listar();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveLength(2);

      expect(mocks.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      );
    });
  }

  it('sin sesión no consulta la base de datos', async () => {
    mocks.requireSession.mockRejectedValueOnce(
      new Error('UNAUTHENTICATED')
    );

    const response = await listar();

    expect(response.status).toBe(401);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});

describe('Propiedad: consulta por ID', () => {
  it('redactor puede consultar su demanda', async () => {
    const response = await consultar(
      solicitudGet(1), contexto(1)
    );

    expect(response.status).toBe(200);
    expect((await response.json()).id).toBe(1);
  });

  it('redactor no puede consultar demanda ajena', async () => {
    const response = await consultar(
      solicitudGet(2), contexto(2)
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      error: 'Prohibido',
    });
  });

  for (const role of ['admin', 'jefe_estudio']) {
    it(`${role} puede consultar demanda ajena`, async () => {
      sesion([role]);

      const response = await consultar(
        solicitudGet(2), contexto(2)
      );

      expect(response.status).toBe(200);
      expect((await response.json()).id).toBe(2);
    });
  }

  it('demanda inexistente devuelve 404', async () => {
    const response = await consultar(
      solicitudGet(999), contexto(999)
    );

    expect(response.status).toBe(404);
  });
});

describe('Propiedad: generación DOCX', () => {
  it('redactor no puede generar DOCX ajeno', async () => {
    const response = await generar(solicitudDoc(2));

    expect(response.status).toBe(403);
    expect(mocks.prepareDoc).not.toHaveBeenCalled();
    expect(mocks.renderDoc).not.toHaveBeenCalled();
    expect(mocks.documentoUpsert).not.toHaveBeenCalled();
  });

  it('redactor supera propiedad para su demanda', async () => {
    const response = await generar(solicitudDoc(1));

    // Se detiene en la validación documental simulada.
    expect(response.status).toBe(422);
    expect(mocks.prepareDoc).toHaveBeenCalledOnce();
    expect(mocks.documentoUpsert).not.toHaveBeenCalled();
  });

  for (const role of ['admin', 'jefe_estudio']) {
    it(`${role} supera propiedad para demanda ajena`, async () => {
      sesion([role]);

      const response = await generar(solicitudDoc(2));

      expect(response.status).toBe(422);
      expect(mocks.prepareDoc).toHaveBeenCalledOnce();
      expect(mocks.documentoUpsert).not.toHaveBeenCalled();
    });
  }
});

describe('Propiedad: descarga DOCX', () => {
  it('redactor no puede descargar documento ajeno', async () => {
    const response = await descargar(solicitudDescarga(2));

    expect(response.status).toBe(403);
    expect(mocks.documentoFindUnique).not.toHaveBeenCalled();
  });

  it('redactor puede descargar su documento', async () => {
    const response = await descargar(solicitudDescarga(1));

    expect(response.status).toBe(200);
    expect(
      response.headers.get('content-type')
    ).toContain('wordprocessingml.document');

    expect(mocks.documentoFindUnique).toHaveBeenCalledOnce();
  });

  for (const role of ['admin', 'jefe_estudio']) {
    it(`${role} puede descargar documento ajeno`, async () => {
      sesion([role]);

      const response = await descargar(solicitudDescarga(2));

      expect(response.status).toBe(200);
      expect(mocks.documentoFindUnique).toHaveBeenCalledOnce();
    });
  }
});

describe('Restricciones de escritura para redactores', () => {
  it('redactor no puede actualizar demandas', async () => {
    const request = new Request(
      'http://localhost:3003/api/demandas/1',
      {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': 'csrf-prueba',
        },
        body: '{}',
      }
    );

    const response = await actualizar(request, contexto(1));

    expect(response.status).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('redactor no puede eliminar demandas', async () => {
    const request = new Request(
      'http://localhost:3003/api/demandas/1',
      {
        method: 'DELETE',
        headers: { 'x-csrf-token': 'csrf-prueba' },
      }
    );

    const response = await eliminar(request, contexto(1));

    expect(response.status).toBe(403);
    expect(mocks.delete).not.toHaveBeenCalled();
  });
});
