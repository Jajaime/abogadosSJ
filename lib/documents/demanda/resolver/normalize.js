/// lib/documents/demanda/resolver/normalize.js

export function trimText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeText(value) {
  return trimText(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function normalizeBoolean(value) {
  return typeof value === 'boolean' ? value : undefined;
}

/**
 * Normaliza los campos relevantes del término de relación laboral.
 */
export function normalizeTerminationData(demanda = {}) {
  return {
    motivoTerminoRaw: trimText(demanda.motivoTermino),
    tipoDespidoRaw: trimText(demanda.tipoDespido),
    despidoDisciplinarioRaw: trimText(demanda.despidoDisciplinario),
    otroDespidoDisciplinarioRaw: trimText(demanda.otroDespidoDisciplinario),

    motivoTermino: normalizeText(demanda.motivoTermino),
    tipoDespido: normalizeText(demanda.tipoDespido),
    despidoDisciplinario: normalizeText(demanda.despidoDisciplinario),
    otroDespidoDisciplinario: trimText(demanda.otroDespidoDisciplinario),

    fechaTerminoRelaLaboral: demanda.fechaTerminoRelaLaboral ?? '',
    anosServicios: normalizeBoolean(demanda.anosServicios),
    mesAviso: normalizeBoolean(demanda.mesAviso),
  };
}