import { randomUUID } from 'node:crypto';
import { readdirSync } from 'node:fs';
import {
  PrismaClient,
  type Prisma,
} from '@prisma/client';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';

const enabled =
  process.env.RUN_POSTGRES_INTEGRATION === '1';

const integration = enabled ? describe : describe.skip;

integration('PostgreSQL de integración real', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    const raw = process.env.DATABASE_URL;

    if (!raw) {
      throw new Error('DATABASE_URL ausente');
    }

    const url = new URL(raw);

    const safe =
      url.protocol === 'postgresql:' &&
      url.hostname === '127.0.0.1' &&
      url.port === '5434' &&
      url.username === 'abogadossj_it' &&
      url.pathname === '/abogadossj_it';

    if (!safe) {
      throw new Error(
        'SEGURIDAD: destino PostgreSQL no autorizado'
      );
    }

    prisma = new PrismaClient();
    await prisma.$connect();

    const identity = await prisma.$queryRaw<
      Array<{ db: string; usuario: string }>
    >`
      SELECT
        current_database() AS db,
        current_user AS usuario
    `;

    if (
      identity[0]?.db !== 'abogadossj_it' ||
      identity[0]?.usuario !== 'abogadossj_it'
    ) {
      throw new Error(
        'SEGURIDAD: identidad de base inesperada'
      );
    }

    const migrations = await prisma.$queryRaw<
      Array<{ total: bigint }>
    >`
      SELECT COUNT(*) AS total
      FROM "_prisma_migrations"
      WHERE finished_at IS NOT NULL
        AND rolled_back_at IS NULL
    `;

    const esperadas = readdirSync('prisma/migrations', {
      withFileTypes: true,
    }).filter(
      entry => entry.isDirectory() && /^\d+_/.test(entry.name)
    ).length;

    if (Number(migrations[0]?.total) !== esperadas) {
      throw new Error(
        `Se esperaban ${esperadas} migraciones aplicadas`
      );
    }
  }, 30000);

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  // Ejecuta operaciones reales y revierte
  // incluso cuando las afirmaciones son correctas.
  async function conRollback(
    ejecutar: (tx: Prisma.TransactionClient) => Promise<void>
  ) {
    const rollback = new Error('ROLLBACK_PRUEBA');

    try {
      await prisma.$transaction(
        async tx => {
          await ejecutar(tx);
          throw rollback;
        },
        { timeout: 15000 }
      );
    } catch (error) {
      if (error !== rollback) throw error;
    }
  }

  const crearUsuario = (
    tx: Prisma.TransactionClient
  ) =>
    tx.usuario.create({
      data: {
        email: `it-${randomUUID()}@example.test`,
        name: 'Usuario Integración',
        roles: ['abogado_redactor'],
      },
    });

  const crearDemanda = (
    tx: Prisma.TransactionClient,
    usuarioId: string,
    abogadoPatrocinanteId?: string
  ) =>
    tx.demanda.create({
      data: {
        nombres: 'Caso',
        apPaterno: 'Prueba',
        apMaterno: 'Integración',
        run: `IT-${randomUUID()}`,
        nacionalidad: 'Chilena',
        estadoCivil: 'Soltera',
        fechaNacimiento: new Date('1995-01-01'),
        correoElectronico:
          `it-${randomUUID()}@example.test`,
        domicilioParticular: 'Domicilio de prueba',
        nombreRazonSocial: 'Empresa de prueba',
        rutRazonSocial: `IT-${randomUUID()}`,
        domicilioRazonSocial: 'Domicilio empresa',
        naturalezaContrato: 'Indefinido',
        funciones: 'Administrativas',
        lugar: 'Oficina',
        jornada: 'Completa',
        registroAsistencia: true,
        formaPago: 'Transferencia',
        liquidacionSueldo: true,
        cotizacionSalud: [],
        cotizacionAfp: [],
        cotizacionAfc: [],
        fuero: 'No',
        usuarioId,
        abogadoPatrocinanteId,
      },
    });

  it('crea relaciones y respeta eliminación en cascada', async () => {
    await conRollback(async tx => {
      const usuario = await crearUsuario(tx);

      const abogado = await tx.abogado.create({
        data: {
          nombreCompleto: 'Abogado Integración',
          run: `IT-${randomUUID()}`,
          domicilioProfesional: 'Oficina de prueba',
        },
      });

      const demanda = await crearDemanda(
        tx,
        usuario.id,
        abogado.id
      );

      await tx.session.create({
        data: {
          userId: usuario.id,
          refreshTokenHash: `hash-${randomUUID()}`,
          expiresAt: new Date(
            Date.now() + 86400000
          ),
        },
      });

      await tx.demandadoSolidario.create({
        data: {
          demandaId: demanda.id,
          nombreRazonSocial: 'Empresa Solidaria',
          rut: `IT-${randomUUID()}`,
          domicilio: 'Domicilio prueba',
          representanteLegal: 'Representante',
          runRepresentanteLegal: 'RUN de prueba',
        },
      });

      await tx.demandaDocumento.create({
        data: {
          demandaId: demanda.id,
          usuarioId: usuario.id,
          nombre: 'integracion.docx',
          contenido: Uint8Array.from([80, 75, 3, 4]),
          tamano: 4,
        },
      });

      const resultado = await tx.demanda.findUnique({
        where: { id: demanda.id },
        include: {
          usuario: true,
          abogadoPatrocinante: true,
          demandadoSolidario: true,
          documentos: true,
        },
      });

      expect(resultado?.usuario?.id)
        .toBe(usuario.id);

      expect(resultado?.abogadoPatrocinante?.id)
        .toBe(abogado.id);

      expect(resultado?.demandadoSolidario)
        .toHaveLength(1);

      expect(resultado?.documentos)
        .toHaveLength(1);

      await tx.demanda.delete({
        where: { id: demanda.id },
      });

      expect(
        await tx.demandaDocumento.count({
          where: { demandaId: demanda.id },
        })
      ).toBe(0);

      expect(
        await tx.demandadoSolidario.count({
          where: { demandaId: demanda.id },
        })
      ).toBe(0);

      await tx.usuario.delete({
        where: { id: usuario.id },
      });

      expect(
        await tx.session.count({
          where: { userId: usuario.id },
        })
      ).toBe(0);
    });
  });

  it('impide correos de usuario duplicados', async () => {
    await expect(
      prisma.$transaction(async tx => {
        const usuario = await crearUsuario(tx);

        await tx.usuario.create({
          data: {
            email: usuario.email,
            roles: ['admin'],
          },
        });
      })
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('impide RUN duplicados de abogados', async () => {
    await expect(
      prisma.$transaction(async tx => {
        const run = `IT-${randomUUID()}`;

        for (let i = 0; i < 2; i++) {
          await tx.abogado.create({
            data: {
              nombreCompleto: 'Abogado Prueba',
              run,
              domicilioProfesional: 'Oficina',
            },
          });
        }
      })
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('impide sesiones con usuarios inexistentes', async () => {
    await expect(
      prisma.session.create({
        data: {
          userId: randomUUID(),
          refreshTokenHash: 'hash-prueba',
          expiresAt: new Date(
            Date.now() + 86400000
          ),
        },
      })
    ).rejects.toMatchObject({ code: 'P2003' });
  });

  it('permite un único documento por demanda', async () => {
    await expect(
      prisma.$transaction(async tx => {
        const usuario = await crearUsuario(tx);
        const demanda = await crearDemanda(
          tx,
          usuario.id
        );

        for (let i = 0; i < 2; i++) {
          await tx.demandaDocumento.create({
            data: {
              demandaId: demanda.id,
              usuarioId: usuario.id,
              nombre: `documento-${i}.docx`,
              contenido: Uint8Array.from([80, 75]),
              tamano: 2,
            },
          });
        }
      })
    ).rejects.toMatchObject({ code: 'P2002' });
  });
});
