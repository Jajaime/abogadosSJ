import { z } from 'zod';

/** El abogado es opcional al registrar demandas antiguas o borradores. */
export const abogadoPatrocinanteIdSchema = z.union([
  z.uuid(),
  z.null(),
  z.literal(''),
]).transform((value) => value || null);
