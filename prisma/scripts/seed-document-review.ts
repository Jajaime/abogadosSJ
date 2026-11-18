import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CONFIRM_ENV = 'ALLOW_DOCUMENT_REVIEW_SEED';
const USER_EMAIL_ENV = 'DOCUMENT_REVIEW_USER_EMAIL';
const REQUIRED_CONFIRMATION = 'YES';

const QA_EMAILS = [
  'qa.docx51.0@example.test',
  'qa.docx51.1@example.test',
  'qa.docx51.2@example.test',
];

const BASE_DEMANDA = {
  nombres: 'Valentina',
  apPaterno: 'Rojas',
  apMaterno: 'Morales',
  run: '18.876.543-2',
  nacionalidad: 'Chilena',
  estadoCivil: 'Soltera',
  fechaNacimiento: new Date('1992-04-18T12:00:00.000Z'),
  domicilioParticular: 'Avenida Angamos 1450, Antofagasta',
  nombreRazonSocial: 'Tecnología Portuaria Antofagasta SpA',
  rutRazonSocial: '76.123.456-0',
  domicilioRazonSocial: 'Avenida Pedro Aguirre Cerda 7850, Antofagasta',
  representanteLegal: 'María José Contreras Vega',
  runRepresentanteLegal: '16.543.210-K',
  fechaInicioRelacionLaboral: new Date('2019-02-01T12:00:00.000Z'),
  naturalezaContrato: 'Indefinido',
  funciones: 'Analista de control de gestión',
  lugar: 'Oficinas administrativas, Antofagasta',
  jornada: '44 horas jornada ordinaria',
  otraJornada: null,
  registroAsistencia: true,
  remuneracion: new Prisma.Decimal('1850000.00'),
  formaPago: 'Transferencia',
  liquidacionSueldo: true,
  cotizacionSalud: ['2026-08', '2026-09', '2026-10'],
  cotizacionAfp: ['2026-09', '2026-10'],
  cotizacionAfc: ['2026-08', '2026-09', '2026-10'],
  vacaciones: 8,
  fuero: 'No',
  fechaTerminoRelaLaboral: new Date('2026-10-31T12:00:00.000Z'),
  motivoTermino: 'Despido',
  tipoDespido: 'Necesidades de la Empresa',
  despidoDisciplinario: null,
  otroDespidoDisciplinario: null,
  anosServicios: true,
  mesAviso: false,
  finiquito: false,
  prestacionesAdeudadas: [
    'Feriado legal pendiente',
    'Feriado proporcional',
    'Cotizaciones previsionales',
  ],
  materias: [
    'Despido injustificado',
    'Indemnización por años de servicio',
    'Feriado legal y proporcional',
  ],
};

const SOLIDARIO_1 = {
  nombreRazonSocial: 'Constructora Costa Norte Ltda.',
  rut: '77.222.333-1',
  domicilio: 'Avenida Argentina 2240, Antofagasta',
  representanteLegal: 'Felipe Andrés Muñoz Rojas',
  runRepresentanteLegal: '9.876.543-3',
};

const SOLIDARIO_2 = {
  nombreRazonSocial: 'Servicios Industriales Desierto SpA',
  rut: '78.333.444-5',
  domicilio: 'Avenida Edmundo Pérez Zujovic 5580, Antofagasta',
  representanteLegal: 'Carolina Paz Soto Díaz',
  runRepresentanteLegal: '17.654.321-3',
};

async function resolveTargetUser() {
  const requestedEmail = process.env[USER_EMAIL_ENV]?.trim();

  if (requestedEmail) {
    const user = await prisma.usuario.findFirst({
      where: {
        email: {
          equals: requestedEmail,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      throw new Error(
        `No existe un usuario con correo "${requestedEmail}". Revisa ${USER_EMAIL_ENV}.`
      );
    }

    return user;
  }

  const users = await prisma.usuario.findMany({
    select: {
      id: true,
      email: true,
      name: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (users.length === 1) {
    return users[0];
  }

  if (users.length === 0) {
    throw new Error(
      'No existen usuarios en la base de datos. Crea uno o ejecuta el seed principal antes de este script.'
    );
  }

  const available = users
    .map((user) => `- ${user.email}${user.name ? ` (${user.name})` : ''}`)
    .join('\n');

  throw new Error(
    `Hay ${users.length} usuarios. Ejecuta nuevamente indicando el propietario:\n` +
    `${USER_EMAIL_ENV}=tu-correo@dominio.cl npm run seed:document-review\n\n` +
    `Usuarios disponibles:\n${available}`
  );
}

async function cleanupQaData(usuarioId: string) {
  const result = await prisma.demanda.deleteMany({
    where: {
      usuarioId,
      correoElectronico: {
        in: QA_EMAILS,
      },
    },
  });

  return result.count;
}

async function createScenario({
  label,
  correoElectronico,
  usuarioId,
  solidarios,
}: {
  label: string;
  correoElectronico: string;
  usuarioId: string;
  solidarios: Array<typeof SOLIDARIO_1>;
}) {
  const demanda = await prisma.demanda.create({
    data: {
      ...BASE_DEMANDA,
      correoElectronico,
      usuarioId,
      demandadoSolidario:
        solidarios.length > 0
          ? {
            create: solidarios,
          }
          : undefined,
    },
    include: {
      demandadoSolidario: true,
    },
  });

  return {
    label,
    demandaId: demanda.id,
    correoElectronico: demanda.correoElectronico,
    solidarios: demanda.demandadoSolidario.length,
  };
}

async function main() {
  if (process.env[CONFIRM_ENV] !== REQUIRED_CONFIRMATION) {
    throw new Error(
      `Protección de seguridad: define ${CONFIRM_ENV}=${REQUIRED_CONFIRMATION} para ejecutar este seed.`
    );
  }

  const cleanupOnly = process.argv.includes('--cleanup');

  const user = await resolveTargetUser();
  const deleted = await cleanupQaData(user.id);

  console.log(`🧹 Registros QA-DOCX-5.1 eliminados antes de continuar: ${deleted}`);

  if (cleanupOnly) {
    console.log('✅ Limpieza QA-DOCX-5.1 completada.');
    return;
  }

  console.log(`👤 Usuario propietario: ${user.email}`);
  console.log('🧪 Creando matriz documental QA-DOCX-5.1...');

  const scenarios = [
    await createScenario({
      label: 'QA-DOCX-5.1 / 0 solidarios',
      correoElectronico: QA_EMAILS[0],
      usuarioId: user.id,
      solidarios: [],
    }),
    await createScenario({
      label: 'QA-DOCX-5.1 / 1 solidario',
      correoElectronico: QA_EMAILS[1],
      usuarioId: user.id,
      solidarios: [SOLIDARIO_1],
    }),
    await createScenario({
      label: 'QA-DOCX-5.1 / 2 solidarios',
      correoElectronico: QA_EMAILS[2],
      usuarioId: user.id,
      solidarios: [SOLIDARIO_1, SOLIDARIO_2],
    }),
  ];

  console.log('');
  console.table(scenarios);
  console.log('');
  console.log(
    '✅ Datos creados. Usa los demandaId anteriores para generar los tres DOCX desde la aplicación.'
  );
  console.log(
    `ℹ️ Para eliminarlos: ${CONFIRM_ENV}=${REQUIRED_CONFIRMATION} npm run seed:document-review -- --cleanup`
  );
}

main()
  .catch((error) => {
    console.error('❌ Error en seed QA-DOCX-5.1:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
