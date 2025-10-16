import { z } from 'zod';

export interface DemandaPersistenceData {
  nombres: string;
  apPaterno: string;
  apMaterno: string;
  run: string;
  fechaNacimiento: Date;
  nacionalidad: string;
  correoElectronico: string;
  estadoCivil: string;
  domicilioParticular: string;
  nombreRazonSocial: string;
  rutRazonSocial: string;
  domicilioRazonSocial: string;
  fechaInicioRelacionLaboral: Date | null;
  naturalezaContrato: string;
  funciones: string;
  lugar: string;
  jornada: string;
  otraJornada: string | null;
  registroAsistencia: boolean;
  remuneracion: number | null;
  formaPago: string;
  liquidacionSueldo: boolean;
  cotizacionSalud: string[];
  cotizacionAfp: string[];
  cotizacionAfc: string[];
  vacaciones: number | null;
  fuero: string;
  fechaTerminoRelaLaboral: Date | null;
  motivoTermino: string | null;
  tipoDespido: string | null;
  despidoDisciplinario: string | null;
  otroDespidoDisciplinario: string | null;
  anosServicios: boolean;
  mesAviso: boolean;
  finiquito: boolean;
  prestacionesAdeudadas: string[];
  materias: string[];
}

export interface DemandadoSolPersistence {
  nombreRazonSocial: string;
  rut: string;
  domicilio: string;
  representanteLegal: string;
  runRepresentanteLegal: string;
}

const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/g;
const TRUE_VALUES = new Set(['true', '1', 'si', 'sí', 'yes', 'on']);
const FALSE_VALUES = new Set(['false', '0', 'no', 'off']);

const sanitizeText = (value: string, max = 255) =>
  value
    .replace(CONTROL_CHARS_REGEX, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

const requiredString = (field: string, max = 255) =>
  z
    .preprocess((input) => (input === undefined || input === null ? '' : String(input)), z.string())
    .transform((value, ctx) => {
      const sanitized = sanitizeText(value, max);
      if (!sanitized) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `El campo '${field}' es obligatorio.` });
        return z.NEVER;
      }
      return sanitized;
    });

const optionalString = (field: string, max = 255) =>
  z
    .preprocess((input) => {
      if (input === undefined || input === null) return undefined;
      const sanitized = sanitizeText(String(input), max);
      return sanitized.length === 0 ? undefined : sanitized;
    }, z.union([z.string(), z.undefined()]))
    .transform((value) => (value === undefined ? undefined : sanitizeText(value, max)));

const requiredEmail = (field: string, max = 320) =>
  z
    .preprocess((input) => (input === undefined || input === null ? '' : String(input)), z.string())
    .transform((value, ctx) => {
      const sanitized = sanitizeText(value, max);
      if (!sanitized) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `El campo '${field}' es obligatorio.` });
        return z.NEVER;
      }
      return sanitized;
    })
    .pipe(z.string().email({ message: 'El correo electrónico no tiene un formato válido.' }));

const rutField = (field: string) =>
  requiredString(field, 30).refine((value) => /^[0-9Kk.-]+$/.test(value), {
    message: `El campo '${field}' contiene caracteres inválidos (solo dígitos, 'K', puntos o guión).`,
  });

const optionalRutField = (field: string) =>
  z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((value, ctx) => {
      if (value === undefined || value === null || value === '') return undefined;
      const sanitized = sanitizeText(String(value).toUpperCase(), 30);
      if (!/^[0-9K.-]+$/.test(sanitized)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `El campo '${field}' contiene caracteres inválidos (solo dígitos, 'K', puntos o guión).`,
        });
        return z.NEVER;
      }
      return sanitized;
    })
    .optional();

const booleanField = (field: string) =>
  z
    .union([z.boolean(), z.string(), z.number()])
    .transform((value, ctx) => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value !== 0;
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (TRUE_VALUES.has(normalized)) return true;
        if (FALSE_VALUES.has(normalized)) return false;
      }
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `El campo '${field}' debe ser verdadero o falso.`,
      });
      return z.NEVER;
    });

const optionalBooleanField = (field: string) =>
  z
    .union([z.boolean(), z.string(), z.number(), z.null(), z.undefined()])
    .transform((value, ctx) => {
      if (value === undefined || value === null || value === '') return undefined;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value !== 0;
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (TRUE_VALUES.has(normalized)) return true;
        if (FALSE_VALUES.has(normalized)) return false;
      }
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `El campo '${field}' debe ser verdadero o falso.`,
      });
      return z.NEVER;
    })
    .optional();

const requiredISODate = (field: string) =>
  z
    .union([z.string(), z.date()], { invalid_type_error: `El campo '${field}' es obligatorio.` })
    .transform((value, ctx) => {
      const raw = value instanceof Date ? value.toISOString() : sanitizeText(String(value));
      if (!raw) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `El campo '${field}' es obligatorio.` });
        return z.NEVER;
      }
      const parsed = new Date(raw);
      if (Number.isNaN(parsed.getTime())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `El campo '${field}' debe ser una fecha válida.` });
        return z.NEVER;
      }
      return parsed.toISOString();
    });

const optionalISODate = (field: string) =>
  z
    .union([z.string(), z.date(), z.null(), z.undefined()])
    .transform((value, ctx) => {
      if (value === undefined || value === null || value === '') return null;
      const raw = value instanceof Date ? value.toISOString() : sanitizeText(String(value));
      if (!raw) return null;
      const parsed = new Date(raw);
      if (Number.isNaN(parsed.getTime())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `El campo '${field}' debe ser una fecha válida.` });
        return z.NEVER;
      }
      return parsed.toISOString();
    });

const optionalPositiveNumber = (field: string, { max } = { max: 1_000_000_000 }) =>
  z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((value, ctx) => {
      if (value === undefined || value === null || value === '') return null;
      const normalized = typeof value === 'number'
        ? value
        : Number(String(value).replace(/\./g, '').replace(',', '.'));
      if (!Number.isFinite(normalized)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `El campo '${field}' debe ser numérico.` });
        return z.NEVER;
      }
      if (normalized < 0 || normalized > max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `El campo '${field}' debe estar entre 0 y ${max.toLocaleString('es-CL')}.`,
        });
        return z.NEVER;
      }
      return Math.round(normalized);
    });

const stringArray = (field: string, { maxItems = 50, maxLength = 120 } = {}) =>
  z
    .array(requiredString(field, maxLength))
    .max(maxItems, { message: `El campo '${field}' supera el máximo de ${maxItems} elementos.` })
    .transform((items) => Array.from(new Set(items)));

export const MAX_DEMANDADO_SOLIDARIOS = 20;

export const demandadoSolSchema = z.object({
  id: z
    .union([z.string(), z.number()])
    .transform((value) => String(value))
    .pipe(z.string().trim().max(64))
    .optional(),
  nombreRazonSocial: requiredString('nombreRazonSocial'),
  rut: rutField('rut'),
  domicilio: requiredString('domicilio'),
  representanteLegal: requiredString('representanteLegal'),
  runRepresentanteLegal: rutField('runRepresentanteLegal'),
});

export const demandadoSolUpdateSchema = demandadoSolSchema.extend({
  id: z
    .union([z.string(), z.number()])
    .transform((value) => String(value))
    .pipe(z.string().trim().max(64))
    .optional(),
});

export const demandaPayloadSchema = z
  .object({
    id: optionalString('id', 64),
    // Cliente
    nombres: requiredString('nombres', 120),
    apPaterno: requiredString('apPaterno', 120),
    apMaterno: requiredString('apMaterno', 120),
    run: rutField('run'),
    fechaNacimiento: requiredISODate('fechaNacimiento'),
    nacionalidad: requiredString('nacionalidad', 120),
    correoElectronico: requiredEmail('correoElectronico', 320),
    estadoCivil: requiredString('estadoCivil', 120),
    domicilioParticular: requiredString('domicilioParticular'),

    // Demandado principal
    nombreRazonSocial: requiredString('nombreRazonSocial'),
    rutRazonSocial: rutField('rutRazonSocial'),
    domicilioRazonSocial: requiredString('domicilioRazonSocial'),
    representanteLegal: optionalString('representanteLegal'),
    runRepresentanteLegal: optionalRutField('runRepresentanteLegal'),

    // Relación laboral
    fechaInicioRelacionLaboral: optionalISODate('fechaInicioRelacionLaboral'),
    naturalezaContrato: requiredString('naturalezaContrato', 120),
    funciones: requiredString('funciones', 255),
    lugar: requiredString('lugar', 255),
    jornada: requiredString('jornada', 120),
    otraJornada: optionalString('otraJornada'),
    registroAsistencia: booleanField('registroAsistencia'),
    remuneracion: optionalPositiveNumber('remuneracion'),
    formaPago: requiredString('formaPago', 120),
    liquidacionSueldo: booleanField('liquidacionSueldo'),
    cotizacionSalud: z.union([
      stringArray('cotizacionSalud', { maxItems: 50 }),
      z.undefined(),
    ]).transform((value) => value ?? []),
    cotizacionAfp: z.union([
      stringArray('cotizacionAfp', { maxItems: 50 }),
      z.undefined(),
    ]).transform((value) => value ?? []),
    cotizacionAfc: z.union([
      stringArray('cotizacionAfc', { maxItems: 50 }),
      z.undefined(),
    ]).transform((value) => value ?? []),
    vacaciones: optionalPositiveNumber('vacaciones', { max: 365 }),
    fuero: requiredString('fuero', 120),

    // Término relación
    fechaTerminoRelaLaboral: optionalISODate('fechaTerminoRelaLaboral'),
    motivoTermino: requiredString('motivoTermino', 255),
    tipoDespido: optionalString('tipoDespido', 120),
    despidoDisciplinario: optionalString('despidoDisciplinario', 255),
    otroDespidoDisciplinario: optionalString('otroDespidoDisciplinario', 255),
    anosServicios: optionalBooleanField('anosServicios').transform((value) => value ?? false),
    mesAviso: optionalBooleanField('mesAviso').transform((value) => value ?? false),
    finiquito: optionalBooleanField('finiquito').transform((value) => value ?? false),

    prestacionesAdeudadas: z.union([
      stringArray('prestacionesAdeudadas', { maxItems: 25 }),
      z.undefined(),
    ]).transform((value) => value ?? []),
    materias: z
      .union([stringArray('materias', { maxItems: 50 }), z.undefined()])
      .transform((value) => value ?? []),

    demandadoSols: z
      .array(demandadoSolSchema)
      .max(MAX_DEMANDADO_SOLIDARIOS, {
        message: `Se permite un máximo de ${MAX_DEMANDADO_SOLIDARIOS} demandados solidarios.`,
      })
      .default([]),
  })
  .strict();

export type DemandaPayload = z.infer<typeof demandaPayloadSchema>;

export const toDemandaPersistence = (payload: DemandaPayload) => {
  const {
    demandadoSols,
    fechaNacimiento,
    fechaInicioRelacionLaboral,
    fechaTerminoRelaLaboral,
    remuneracion,
    vacaciones,
    id,
    nombres,
    apPaterno,
    apMaterno,
    run,
    nacionalidad,
    correoElectronico,
    estadoCivil,
    domicilioParticular,
    nombreRazonSocial,
    rutRazonSocial,
    domicilioRazonSocial,
    representanteLegal,
    runRepresentanteLegal,
    naturalezaContrato,
    funciones,
    lugar,
    jornada,
    otraJornada,
    registroAsistencia,
    formaPago,
    liquidacionSueldo,
    cotizacionSalud,
    cotizacionAfp,
    cotizacionAfc,
    fuero,
    motivoTermino,
    tipoDespido,
    despidoDisciplinario,
    otroDespidoDisciplinario,
    anosServicios,
    mesAviso,
    finiquito,
    prestacionesAdeudadas,
    materias,
  } = payload;

  const data: DemandaPersistenceData = {
    nombres,
    apPaterno,
    apMaterno,
    run,
    fechaNacimiento: new Date(fechaNacimiento),
    nacionalidad,
    correoElectronico,
    estadoCivil,
    domicilioParticular,
    nombreRazonSocial,
    rutRazonSocial,
    domicilioRazonSocial,
    fechaInicioRelacionLaboral: fechaInicioRelacionLaboral ? new Date(fechaInicioRelacionLaboral) : null,
    naturalezaContrato,
    funciones,
    lugar,
    jornada,
    otraJornada: otraJornada ?? null,
    registroAsistencia,
    remuneracion: remuneracion ?? null,
    formaPago,
    liquidacionSueldo,
    cotizacionSalud,
    cotizacionAfp,
    cotizacionAfc,
    vacaciones: vacaciones ?? null,
    fuero,
    fechaTerminoRelaLaboral: fechaTerminoRelaLaboral ? new Date(fechaTerminoRelaLaboral) : null,
    motivoTermino: motivoTermino ?? null,
    tipoDespido: tipoDespido ?? null,
    despidoDisciplinario: despidoDisciplinario ?? null,
    otroDespidoDisciplinario: otroDespidoDisciplinario ?? null,
    anosServicios,
    mesAviso,
    finiquito,
    prestacionesAdeudadas,
    materias,
  };

  const demandadoSolsData: DemandadoSolPersistence[] = demandadoSols.map((item) => ({
    nombreRazonSocial: item.nombreRazonSocial,
    rut: item.rut,
    domicilio: item.domicilio,
    representanteLegal: item.representanteLegal,
    runRepresentanteLegal: item.runRepresentanteLegal,
  }));

  return {
    data,
    demandadoSols: demandadoSolsData,
  };
};

export const MAX_DEMANDA_BODY_SIZE = 64 * 1024; // 64KB
