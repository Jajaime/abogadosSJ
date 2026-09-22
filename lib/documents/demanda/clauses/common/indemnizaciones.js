/// lib/documents/demanda/clauses/common/indemnizaciones.js

export function getIndemnizacion50Block(ctx) {
  return [
    `• Indemnización sustitutiva del aviso previo: ${ctx?.demandaFmt?.remuneracion_clp ?? '____________________'}`,
    `• Indemnización por años de servicios: ${ctx?.demandaFmt?.indemnizacion_monto_clp ?? '____________________'} y es procedente que esta sea incrementada en un 50% siendo esta suma según apreciación de S.S. si el despido es declarado con aplicación indebida de las causales del Artículo 160 del CT.`,
  ];
}

export function getIndemnizacion80Block(ctx) {
  return [
    `En consecuencia, procede otorgar la indemnización sustitutiva del aviso previo, que asciende en concreto a la suma de ${ctx?.demandaFmt?.remuneracion_clp ?? '____________________'}.`,
    `También, por tanto, procede otorgar indemnización por años de servicio, correspondiente a: ${ctx?.demandaFmt?.indemnizacion_monto_clp ?? '____________________'} y es procedente que esta sea incrementada en un 80% siendo esta suma según apreciación de S.S. si el despido es declarado con aplicación indebida de las causales del Artículo 160 del CT.`,
  ];
}

export function getRecargo30NecesidadesEmpresaBlock(ctx) {
  return [
    `• Indemnización sustitutiva del aviso previo: ${ctx?.demandaFmt?.remuneracion_clp ?? '____________________'}`,
    `• Indemnización por años de servicios: ${ctx?.demandaFmt?.indemnizacion_monto_clp ?? '____________________'}`,
    `• Recargo legal conforme a la causal legal invocada (30%): ${ctx?.demandaFmt?.indemnizacion_recargo30_clp ?? '____________________'}`,
  ];
}