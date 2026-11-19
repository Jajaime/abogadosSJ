import { z } from 'zod';

/** Normaliza las variantes 12.345.678-5 / 12345678-5 a un valor único. */
export function normalizarRun(input: string): string {
  const limpio = input.replace(/[.\s]/g, '').toUpperCase();
  const match = /^(\d{1,8})-([\dK])$/.exec(limpio);
  if (!match) return limpio;
  return `${Number(match[1])}-${match[2]}`;
}

export function validarRunChileno(input: string): boolean {
  const run = normalizarRun(input);
  const match = /^(\d{1,8})-([\dK])$/.exec(run);
  if (!match || Number(match[1]) === 0) return false;

  let suma = 0;
  let factor = 2;
  for (const digito of [...match[1]].reverse()) {
    suma += Number(digito) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  const verificador = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
  return match[2] === verificador;
}

const campoObligatorio = (minimo: number, maximo: number) =>
  z.string().trim().min(minimo).max(maximo);

const opcional = (maximo: number) =>
  z.union([z.string().trim().max(maximo), z.null()])
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null));

const correoOpcional = z.union([
  z.email().max(254),
  z.literal(''),
  z.null(),
]).optional().transform((v) => (v ? v.toLowerCase() : null));

export const abogadoCreateSchema = z.strictObject({
  nombreCompleto: campoObligatorio(3, 160),
  run: z.string().trim().transform(normalizarRun).refine(validarRunChileno, {
    message: 'RUN inválido: verifique el dígito verificador.',
  }),
  domicilioProfesional: campoObligatorio(5, 240),
  correoElectronico: correoOpcional,
  telefono: opcional(40),
  activo: z.boolean().optional(),
});

export const abogadoUpdateSchema = abogadoCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  'Debe indicar al menos un campo a modificar.',
);
