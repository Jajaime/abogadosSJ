import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('?? Iniciando seed...');

  const email = process.env.SEED_USER_EMAIL ?? 'demo@example.com';
  const rawPassword = process.env.SEED_USER_PASSWORD ?? 'Demo1234!';
  const passwordHash = await bcrypt.hash(rawPassword, 12);

  const demoUser = await prisma.usuario.upsert({
    where: { email },
    update: { passwordHash, name: 'Demo User', roles: ['admin'] },
    create: {
      email,
      name: 'Demo User',
      passwordHash,
      roles: ['admin'],
    },
  });

  console.log(`?? Usuario seed: ${demoUser.email}`);

  // Demanda 1: sin demandados solidarios
  await prisma.demanda.create({
    data: {
      nombres: 'Juan',
      apPaterno: 'Pérez',
      apMaterno: 'González',
      run: '12.345.678-9',
      nacionalidad: 'Chilena',
      estadoCivil: 'Casado',
      fechaNacimiento: new Date('1985-06-15'),
      correoElectronico: 'juan.perez@example.com',
      domicilioParticular: 'Av. Libertador 123, Santiago',
      nombreRazonSocial: 'Constructora Andes Ltda.',
      rutRazonSocial: '76.123.456-7',
      domicilioRazonSocial: 'Av. Apoquindo 1234, Las Condes',
      fechaInicioRelacionLaboral: new Date('2010-03-01'),
      naturalezaContrato: 'Indefinido',
      funciones: 'Maestro de Obras',
      lugar: 'Santiago',
      jornada: 'Completa',
      registroAsistencia: true,
      remuneracion: new Prisma.Decimal(1200000.0),
      formaPago: 'Transferencia',
      liquidacionSueldo: true,
      cotizacionSalud: 'Fonasa',
      cotizacionAfp: 'AFP Habitat',
      cotizacionAfc: 'AFC',
      vacaciones: 10,
      fuero: 'No',
      motivoTermino: 'Vigente',
      anosServicios: true,
      mesAviso: true,
      finiquito: false,
      prestacionesAdeudadas: ['Gratificación', 'Vacaciones proporcionales'],
      materias: ['Laboral'],
      usuarioId: demoUser.id,
    },
  });

  // Demanda 2: con demandados solidarios
  await prisma.demanda.create({
    data: {
      nombres: 'María',
      apPaterno: 'López',
      apMaterno: 'Ramírez',
      run: '15.987.654-3',
      nacionalidad: 'Chilena',
      estadoCivil: 'Soltera',
      fechaNacimiento: new Date('1990-11-02'),
      correoElectronico: 'maria.lopez@example.com',
      domicilioParticular: 'Calle Los Olivos 456, Antofagasta',
      nombreRazonSocial: 'Servicios del Norte SPA',
      rutRazonSocial: '77.987.654-1',
      domicilioRazonSocial: 'Av. Brasil 1500, Antofagasta',
      fechaInicioRelacionLaboral: new Date('2018-08-01'),
      naturalezaContrato: 'Plazo Fijo',
      funciones: 'Analista',
      lugar: 'Antofagasta',
      jornada: 'Parcial',
      otraJornada: 'Lunes a Viernes 09:00-13:00',
      registroAsistencia: false,
      remuneracion: new Prisma.Decimal(650000.5),
      formaPago: 'Depósito',
      liquidacionSueldo: true,
      cotizacionSalud: 'Isapre',
      cotizacionAfp: 'AFP Modelo',
      cotizacionAfc: 'AFC',
      vacaciones: 5,
      fuero: 'No',
      fechaTerminoRelaLaboral: new Date('2024-12-31'),
      motivoTermino: 'Despido',
      tipoDespido: 'Necesidades de la empresa',
      anosServicios: true,
      mesAviso: false,
      finiquito: true,
      prestacionesAdeudadas: ['Indemnización por años de servicio'],
      materias: ['Laboral', 'Indemnizaciones'],
      usuarioId: demoUser.id,
      demandadoSolidario: {
        create: [
          {
            nombreRazonSocial: 'Subcontratista Norte Ltda.',
            rut: '78.111.222-3',
            domicilio: 'Av. Angamos 200, Antofagasta',
            representanteLegal: 'Carlos Sánchez',
            runRepresentanteLegal: '9.876.543-2',
          },
          {
            nombreRazonSocial: 'Holding Servicios SPA',
            rut: '79.333.444-5',
            domicilio: 'Av. Costanera 300, Antofagasta',
            representanteLegal: 'Ana Torres',
            runRepresentanteLegal: '1.234.567-8',
          },
        ],
      },
    },
  });

  console.log('? Seed completado.');
}

main()
  .catch((e) => {
    console.error('? Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
