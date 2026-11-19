import { describe, expect, it } from 'vitest';
import { abogadoPatrocinanteIdSchema } from '../lib/abogados/asignacion';

const uuid = '4c07127b-615e-4a3b-8d14-397c911b726c';

describe('Identificador de abogado patrocinante', () => {
  it('acepta un UUID válido', () => {
    expect(abogadoPatrocinanteIdSchema.parse(uuid)).toBe(uuid);
  });
  it('acepta null para demandas sin asignar', () => {
    expect(abogadoPatrocinanteIdSchema.parse(null)).toBe(null);
  });
  it('convierte cadena vacía en null', () => {
    expect(abogadoPatrocinanteIdSchema.parse('')).toBe(null);
  });
  it('rechaza identificadores arbitrarios', () => {
    expect(abogadoPatrocinanteIdSchema.safeParse('otra-persona').success).toBe(false);
  });
});
