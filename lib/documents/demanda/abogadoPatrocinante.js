/** Valida exclusivamente los datos del patrocinante proporcionados por Prisma. */
export function validarPatrocinanteDocx(abogado) {
  if (!abogado) {
    return {
      ok: false,
      detail: 'La demanda no tiene abogado patrocinante asignado.',
      faltantes: ['abogadoPatrocinante'],
    };
  }
  if (abogado.activo !== true) {
    return {
      ok: false,
      detail: 'El abogado patrocinante está inactivo.',
      faltantes: ['abogadoPatrocinante.activo'],
    };
  }

  const campos = ['nombreCompleto', 'run', 'domicilioProfesional'];
  const faltantes = campos.filter((campo) =>
    typeof abogado[campo] !== 'string' || !abogado[campo].trim()
  );
  if (faltantes.length > 0) {
    return {
      ok: false,
      detail: `Datos profesionales incompletos: ${faltantes.join(', ')}`,
      faltantes,
    };
  }
  return {
    ok: true,
    abogado: {
      nombreCompleto: abogado.nombreCompleto.trim(),
      run: abogado.run.trim(),
      domicilioProfesional: abogado.domicilioProfesional.trim(),
    },
    faltantes: [],
  };
}
