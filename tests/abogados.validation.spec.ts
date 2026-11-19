import { describe, expect, it } from 'vitest';
import { can } from '../lib/authz';
import {
  abogadoCreateSchema,
  abogadoUpdateSchema,
  normalizarRun,
  validarRunChileno,
} from '../lib/abogados/validation';

const valido = {
  nombreCompleto: 'Abogada de Prueba',
  run: '12.345.678-5',
  domicilioProfesional: 'Calle de Prueba 123, Antofagasta',
};

describe('Catálogo de abogados', () => {
  it('normaliza el RUN y valida dígito verificador', () => {
    expect(normalizarRun('12.345.678-5')).toBe('12345678-5');
    expect(validarRunChileno('12.345.678-5')).toBe(true);
    expect(validarRunChileno('12.345.678-6')).toBe(false);
  });
  it('acepta datos mínimos y normaliza opcionales', () => {
    expect(abogadoCreateSchema.parse(valido)).toMatchObject({
      ...valido,
      run: '12345678-5',
      correoElectronico: null,
      telefono: null,
    });
  });
  it('rechaza campos no permitidos', () => {
    expect(abogadoCreateSchema.safeParse({ ...valido, roles: ['admin'] }).success).toBe(false);
  });
  it('rechaza RUN incorrecto', () => {
    expect(abogadoCreateSchema.safeParse({ ...valido, run: '12.345.678-6' }).success).toBe(false);
  });
  it('permite desactivar un abogado sin eliminarlo', () => {
    expect(abogadoUpdateSchema.parse({ activo: false })).toEqual({ activo: false });
  });
  it('rechaza una actualización vacía', () => {
    expect(abogadoUpdateSchema.safeParse({}).success).toBe(false);
  });
  it('limita modificación a admin y jefe de estudio', () => {
    expect(can(['admin'], 'manageAbogados')).toBe(true);
    expect(can(['jefe_estudio'], 'manageAbogados')).toBe(true);
    expect(can(['abogado_redactor'], 'manageAbogados')).toBe(false);
    expect(can(['abogado_redactor'], 'listAbogados')).toBe(true);
  });
});
