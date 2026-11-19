import { describe, expect, it } from 'vitest';
import { validarPatrocinanteDocx } from '../lib/documents/demanda/abogadoPatrocinante';
import { buildTemplateData } from '../lib/documents/demanda/template/buildTemplateData';

const activo = {
  nombreCompleto: 'Abogado QA Original',
  run: '12345678-5',
  domicilioProfesional: 'Calle QA 123',
  activo: true,
};

describe('QA-DOCX-5.6.5: patrocinante Word', () => {
  it('rechaza demandas sin abogado', () => {
    expect(validarPatrocinanteDocx(null)).toMatchObject({ ok: false });
  });
  it('rechaza abogados inactivos', () => {
    expect(validarPatrocinanteDocx({ ...activo, activo: false })).toMatchObject({ ok: false });
  });
  it('rechaza abogados sin nombre', () => {
    expect(validarPatrocinanteDocx({ ...activo, nombreCompleto: ' ' })).toMatchObject({ ok: false });
  });
  it('rechaza abogados sin RUN', () => {
    expect(validarPatrocinanteDocx({ ...activo, run: '' })).toMatchObject({ ok: false });
  });
  it('rechaza abogados sin domicilio', () => {
    expect(validarPatrocinanteDocx({ ...activo, domicilioProfesional: null })).toMatchObject({ ok: false });
  });
  it('acepta abogado activo y completo', () => {
    expect(validarPatrocinanteDocx(activo)).toMatchObject({ ok: true });
  });
  it('inserta los datos del abogado en la plantilla sin referencias fijas', () => {
    const resultado = validarPatrocinanteDocx(activo);
    if (!resultado.ok) throw new Error('Se esperaba un abogado válido');
    const data = buildTemplateData({
      ctx: {
        fechaEmision: '19 de noviembre de 2026',
        demanda: {}, demandaFmt: {},
        demandadoSolidarios: [], demandadoSolidariosFmt: [],
        abogadoPatrocinante: resultado.abogado,
      },
      clauseResult: { sections: { encabezado: [], hechos: [], derecho: [], peticiones: [], otrosi: [] } },
      hasDemandadoSolidarios: false,
      solidariosInline: '',
    });
    expect(data.abogado_nombre).toBe('ABOGADO QA ORIGINAL');
    expect(data.abogado_run).toBe('12345678-5');
    expect(data.abogado_domicilio).toBe('CALLE QA 123');
  });
});
