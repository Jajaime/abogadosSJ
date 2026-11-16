import { describe, expect, it } from 'vitest';
import { demandaPayloadSchema } from '../types/demanda.schema';

const demandaValida = () => ({
  nombres: 'Ana',
  apPaterno: 'Perez',
  apMaterno: 'Soto',
  run: '11111111-1',
  fechaNacimiento: '1990-01-10',
  nacionalidad: 'Chilena',
  correoElectronico: 'ana@example.com',
  estadoCivil: 'Soltera',
  domicilioParticular: 'Calle Uno 123',
  nombreRazonSocial: 'Empresa Demo',
  rutRazonSocial: '76123456-7',
  domicilioRazonSocial: 'Calle Dos 456',
  naturalezaContrato: 'Indefinido',
  funciones: 'Administracion',
  lugar: 'Antofagasta',
  jornada: 'Completa',
  registroAsistencia: 'sí',
  formaPago: 'Transferencia',
  liquidacionSueldo: true,
  fuero: 'No',
  motivoTermino: 'Renuncia',
  cotizacionSalud: ['2025-01', '2025-01']
});

describe('Compatibilidad Zod 4 - Demandas', () => {
  it('acepta una demanda valida y normaliza valores', () => {
    const resultado = demandaPayloadSchema.safeParse(
      demandaValida()
    );

    expect(resultado.success).toBe(true);

    if (!resultado.success) return;

    expect(resultado.data.registroAsistencia).toBe(true);
    expect(resultado.data.cotizacionSalud).toEqual(['2025-01']);
    expect(resultado.data.demandadoSols).toEqual([]);
    expect(resultado.data.fechaNacimiento).toBe(
      '1990-01-10T00:00:00.000Z'
    );
  });

  it('rechaza fechas con tipos incorrectos', () => {
    const resultado = demandaPayloadSchema.safeParse({
      ...demandaValida(),
      fechaNacimiento: []
    });

    expect(resultado.success).toBe(false);

    if (resultado.success) return;

    expect(resultado.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['fechaNacimiento'],
          message: "El campo 'fechaNacimiento' es obligatorio."
        })
      ])
    );
  });

  it('rechaza fechas invalidas', () => {
    const resultado = demandaPayloadSchema.safeParse({
      ...demandaValida(),
      fechaNacimiento: 'fecha-invalida'
    });

    expect(resultado.success).toBe(false);

    if (resultado.success) return;

    expect(resultado.error.issues.some(
      issue => issue.path.includes('fechaNacimiento')
    )).toBe(true);
  });

  it('rechaza arreglos que superan el limite', () => {
    const resultado = demandaPayloadSchema.safeParse({
      ...demandaValida(),
      cotizacionSalud: Array.from(
        { length: 51 },
        (_, i) => `mes-${i}`
      )
    });

    expect(resultado.success).toBe(false);

    if (resultado.success) return;

    expect(resultado.error.issues.some(
      issue => issue.path.includes('cotizacionSalud')
    )).toBe(true);
  });

  it('rechaza campos no definidos en el esquema', () => {
    const resultado = demandaPayloadSchema.safeParse({
      ...demandaValida(),
      campoInesperado: 'valor'
    });

    expect(resultado.success).toBe(false);
  });

  it('rechaza valores booleanos invalidos', () => {
    const resultado = demandaPayloadSchema.safeParse({
      ...demandaValida(),
      registroAsistencia: 'desconocido'
    });

    expect(resultado.success).toBe(false);

    if (resultado.success) return;

    expect(resultado.error.issues.some(
      issue => issue.path.includes('registroAsistencia')
    )).toBe(true);
  });
});


describe('Campos opcionales omitidos con Zod 4', () => {
  it('conserva valores predeterminados', () => {
    const entrada: Record<string, unknown> = {
      ...demandaValida()
    };

    delete entrada.cotizacionSalud;

    const resultado = demandaPayloadSchema.safeParse(entrada);

    expect(resultado.success).toBe(true);

    if (!resultado.success) return;

    const datos = resultado.data;

    expect(datos.fechaInicioRelacionLaboral).toBeNull();
    expect(datos.fechaTerminoRelaLaboral).toBeNull();
    expect(datos.remuneracion).toBeNull();
    expect(datos.vacaciones).toBeNull();

    expect(datos.cotizacionSalud).toEqual([]);
    expect(datos.cotizacionAfp).toEqual([]);
    expect(datos.cotizacionAfc).toEqual([]);
    expect(datos.prestacionesAdeudadas).toEqual([]);
    expect(datos.materias).toEqual([]);
  });
});
