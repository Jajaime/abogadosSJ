// app/api/generate_doc/route.js
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { createReport } from 'docx-templates';
import { z } from 'zod';

// OJO: si usas alias "@/..." en JS, asegúrate de tener jsconfig.json/tsconfig.json con "paths".
import { safeSerializeDemanda, safeSerializeDemandados } from '@/utils/serializeDemanda';
import { decorateDemandaForDocx, decorateDemandadoSolidarioForDocx } from '@/utils/decorateDemanda';
import { formatFechaLargaDate } from '@/utils/formatters';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/auth';

export const runtime = 'nodejs';

const MAX_DOCUMENT_SIZE = 2 * 1024 * 1024; // 2MB
const SAFE_FILENAME_REGEX = /^[^<>:"/\\|?*\r\n]+$/;
const numberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const debug = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[generate_doc]', ...args);
  }
};

/* =========================
   0) Generador de cláusulas
   ========================= */

const TRIM = (s) => (typeof s === 'string' ? s.trim() : '');
const norm = (s) =>
  TRIM(s)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/**
 * Construye UNA cláusula legal según motivo/tipo/subcausal.
 * Devuelve { faltantes: string[], clausulas: string[], flags: Record<string, boolean> }
 */
function buildClausulas(d, ctx = {}) {
  const falta = [];
  const clauses = [];

  // Normalizaciones
  const motivo = norm(d.motivoTermino);
  const tipo = norm(d.tipoDespido);
  const sub = norm(d.despidoDisciplinario);
  const otro = TRIM(d.otroDespidoDisciplinario);

  const fechaTermino = d.fechaTerminoRelaLaboral
    ? new Date(d.fechaTerminoRelaLaboral).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
    : '_________________________';

  // Validaciones de dependencia (solo lo que corresponde al camino elegido)
  if (!motivo) {
    falta.push('motivoTermino');
  } else if (motivo === 'despido') {
    if (!tipo) falta.push('tipoDespido');
    if (norm(tipo) === 'disciplinario') {
      if (!sub) falta.push('despidoDisciplinario');
      if (sub === 'otros especificar' && !otro) falta.push('otroDespidoDisciplinario');
    }
    if (norm(tipo) === 'necesidades de la empresa') {
      if (typeof d.anosServicios !== 'boolean') falta.push('anosServicios');
      if (typeof d.mesAviso !== 'boolean') falta.push('mesAviso');
    }
  }

  if (falta.length > 0) {
    return { faltantes: falta, clausulas: [], flags: {} };
  }

  // Bloques base reutilizables
  const TXT = {
    base162:
      'El empleador debe acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del Artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido.',
    baseNotif: `Con fecha ${fechaTermino}, el empleador me comunicó verbalmente que estaba despedido y que la comunicación del despido me sería hecha llegar el mismo día, situación que a la fecha de esta presentación aún no he recepcionado en mi domicilio.`,
    base454:
      'Conforme mandata el Artículo 454, número uno inciso segundo, “..., en los juicios sobre despido corresponderá en primer lugar al demandado la rendición de la prueba, debiendo acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido”.',
    baseConclusion162:
      'Entonces, no habiéndose cumplido con el Artículo 162 del Código del Trabajo, no tiene la contraria elementos de hecho que acreditar en estrados, ni puede agregar nuevos.',
    indemnizacion80:
      'En consecuencia, procede otorgar la indemnización sustitutiva del aviso previo, que asciende en concreto a la suma de ____________________. También, por tanto, procede otorgar indemnización por años de servicio, correspondiente a: __________________ y es procedente que esta sea incrementada en un 80% siendo esta suma según apreciación de S.S. si el despido es declarado con aplicación indebida de las causales del Artículo 160 del CT.',
    indemnizacion50:
      'En consecuencia, procede otorgar la indemnización sustitutiva del aviso previo, que asciende en concreto a la suma de ____________________. También procede indemnización por años de servicio, correspondiente a: __________________ y es procedente que esta sea incrementada en un 50% siendo esta suma según apreciación de S.S. si el despido es declarado con aplicación indebida de las causales del Artículo 160 del CT.',
    soloFeriado: 'Solo genera el pago del feriado legal o proporcional.',
  };

  // 1) Motivo -> Renuncia
  if (motivo === 'renuncia') {
    return {
      faltantes: [],
      clausulas: ['1) Motivo Término -> Renuncia', TXT.soloFeriado],
      flags: { isRenuncia: true },
    };
  }

  // 2) Motivo -> Mutuo Acuerdo
  if (motivo === 'mutuo acuerdo' || motivo === 'mutuoacuerdo') {
    return {
      faltantes: [],
      clausulas: ['2) Motivo Término -> Mutuo Acuerdo', TXT.soloFeriado],
      flags: { isMutuoAcuerdo: true },
    };
  }

  // 3) Motivo -> Despido
  if (motivo === 'despido') {
    const flags = { isDespido: true };

    // 3.a) Tipo -> Disciplinario
    if (tipo === 'disciplinario') {
      flags.isDespidoDisciplinario = true;

      const DISC_MAP = {
        'incumplimiento grave': [
          '3) Motivo Término -> Despido',
          'a) Tipo Despido -> Disciplinario',
          '1) Disciplinario -> Incumplimiento Grave',
          'Incumplimiento Grave',
          'El empleador debe acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del Artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido',
          `Con fecha ${fechaTermino}, el empleador me comunicó verbalmente que estaba despedido y que la comunicación del despido me sería hecha llegar el mismo día, situación que a la fecha de esta presentación aún no he recepcionado en mi domicilio.`,
          'Conforme mandata el Artículo 454, número uno inciso segundo, “..., en los juicios sobre despido corresponderá en primer lugar al demandado la rendición de la prueba, debiendo acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido”.',
          'Entonces, no habiéndose cumplido con el Artículo 162 del Código del Trabajo, no tiene la contraria elementos de hecho que acreditar en estrados, ni puede agregar nuevos.',
          '7. Incumplimiento grave de las obligaciones que impone el contrato.',
          'El incumplimiento grave de las obligaciones que impone el contrato es la causal genérica del despido disciplinario e implica un incumplimiento de tal entidad que el empleador puede poner fin al contrato. Como tal, sus requisitos identificados por la doctrina son los siguientes:',
          '● Se trata de un incumplimiento de las obligaciones del contrato. Dentro de lo que no queda comprendida cualquier obligación integrante del contrato de trabajo, siendo este un contrato de adhesión, expresión de la voluntad unilateral del empleador, que por lo mismo se encuentra limitado por ley con normativa de orden público. Por tanto, este incumplimiento grave de obligaciones del contrato sólo puede provenir de obligaciones de la esencia del contrato, lo cual deberá ser estimado casuísticamente por el juez al tenor de la razonabilidad del caso y del principio de protección del trabajador. Es en esta evaluación, en que el juez deberá ponderar que el Código del Trabajo establece un singular sistema de sanciones para el trabajador, otras aplicadas por el empleador, de lo que se deduce que el mismo legislador laboral considera que numerosos incumplimientos contractuales pueden ser sancionados con amonestaciones o multas y no necesariamente con la determinación de un despido. Es decir, conclusivamente, no todo incumplimiento faculta para llegar a la decisión de despedir a un trabajador.',
          '● El incumplimiento debe ser grave. Esto es, de un peso o entidad considerable, de una magnitud tal que afecte la continuidad del contrato.',
          '● Ruptura de la confianza que requiere el trabajo. Circunstancia que, en el caso, no genera una afectación a la confianza y que en la misma comunicación no existe ninguna mención a la voz confianza en ningún sentido posible en la comunicación del término, · Daño efectivamente producido.',
          '● Peligro provocado con la conducta. Para el caso expuesto no existe peligro mencionado con ocasión del despido de 26 de septiembre de 2025.',
          '● Habitualidad de la misma o reiterada en el tiempo. Que, la situación que se imputa obedece a un evento único, de fecha 26 de septiembre de 2025.',
          '● El incumplimiento debe ser injustificado. Circunstancia que como esta parte ya ha referido, no ha habido incumplimiento, y de haber existido estaría del todo justificado atendiendo a las circunstancias, en cuanto se le habiamos solicitado reiteradas veces a mi empleador soluciones  respecto al pago del bono trimestral y estas fueron ignoradas.',
          '● La decisión del despido disciplinario debe ser adoptada con proporcionalidad. La consecuencia de despedir en esta forma al trabajador, haciendo que el trabajador pierda las indemnizaciones del caso, deben basarse en una causa razonablemente proporcional; es, por tanto, que la demandada debe explicar el fundamento de su excesivo obrar, donde podría haber ejercido su poder disciplinario a través de cualquier otra sanción conservativa contemplada.',
          '● Es en este entendido que mi despido se encuentra del todo injustificado en cuanto a su fondo, pues el presupuesto que habrían dado lugar a aquel no cumpliría con la totalidad de los requisitos exigidos.',
          'No se cumplen con ninguno de los dos elementos del tipo disciplinario.',
          'No hubo configuración que haga que el presupuesto fáctico satisfaga la causal legal, por tanto, desde luego, no puede haber gravedad en los mismos, pues la gravedad no se encuentra demostrada en lo que sostiene la comunicación realizada el día de mi despido, a saber, 26 de septiembre de 2025.',
          'Conforme mandata el Artículo 454, número uno inciso segundo, " ... , en los juicios sobre despido corresponderá en primer lugar al demandado la rendición de la prueba, debiendo acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido".',
          'La Corte Suprema sobre el presente ha indicado:',
          '“19°. En esas perspectivas hermenéuticas a las que bien cabría incorporar la dimensión histórica de un extenso peregrinar hacia la consolidación lo que se viene presentando el esclarecimiento de la cuestión no merece mayores dificultades. Así, estos jueces asumen que, en todo evento, la legitimidad del despido de un trabajador pasa por la comunicación escrita, debida y oportunamente efectuada, del motivo legal en que se apoya, con expresión detallada de los hechos que lo configuran, al punto que si el exonerado reclama judicialmente de ello, lo primero que en la audiencia de rigor la judicatura ha de obrar, es la receptación de la prueba ofrecida por quien tomó la iniciativa exoneratoria, que no podrá recaer sobre hechos y circunstancia de esa índole que no hayan sido expresamente incluidos en tal comunicación, prohibiéndose presentar evidencias que apunten a dicha justificación, durante el curso del señalado procedimiento”.',
          'En virtud del principio de estabilidad laboral, y entendiendo que el término de un vínculo laboral debe ser excepcional y por cumplirse con las causales previamente establecidas por el legislador, se ha consensuado tanto en la jurisprudencia como la doctrina el hecho de que toda carta de aviso de término de un vínculo laboral debe venir acompañado de los hechos y circunstancias que lo fundan.',
          'En este punto, el Artículo 168 del Código del Trabajo señala que “El trabajador cuyo contrato termine por aplicación de una o más de las causales establecidas en los artículos 159, 160 y 161, y que considere que dicha aplicación es injustificada, indebida o improcedente, o que no se haya invocado ninguna causal legal, podrá recurrir al juzgado competente, dentro del plazo de sesenta días hábiles, contado desde la separación, a fin de que éste así lo declare. En este caso, el juez ordenará el pago de la indemnización a que se refiere el inciso cuarto del artículo 162 y la de los incisos primero o segundo del artículo 163, según correspondiere, aumentada esta última de acuerdo a las siguientes reglas: … …Si el juez estableciere que la aplicación de una o más de las causales de terminación del contrato establecidas en los artículos 159 y 160 no ha sido acreditada, de conformidad a lo dispuesto en este artículo, se entenderá que el término del contrato se ha producido por alguna de las causales señaladas en el artículo 161, en la fecha en que se invocó la causal, y habrá derecho a los incrementos legales que corresponda en conformidad a lo dispuesto en los incisos anteriores. (Destacado propio). El plazo contemplado en el inciso primero se suspenderá cuando, dentro de éste, el trabajador interponga un reclamo por cualquiera de las causales indicadas, ante la Inspección del Trabajo respectiva. Dicho plazo seguirá corriendo una vez concluido este trámite ante dicha Inspección. No obstante, lo anterior, en ningún caso podrá recurrirse al tribunal transcurridos noventa días hábiles desde la separación del trabajador”.',
          'Que, de las razones señaladas y latamente tratadas en acápites anteriores, se reclama el despido injustificado pues en el caso particular se trata de un despido injustificado y sin una investigación previa particular como señala el propio Reglamento Interno de la empresa demandada.',
          'En consecuencia, procede otorgar la indemnización sustitutiva del aviso previo, que asciende en concreto a la suma de {{demandaFmt.remuneracion_clp}}.',
          'También, por tanto, procede otorgar indemnización por años de servicio, correspondiente a: {{demandaFmt.indemnizacion_monto_clp}} y es procedente que esta sea incrementada en un 80% siendo esta suma según apreciación de S.S. a si el despido es declarado con aplicación indebida de las causales del Artículo 160 del CT.'
        ],

        'ausencia injustificadas': [
          '3) Motivo Término -> Despido',
          'a) Tipo Despido -> Disciplinario',
          '2) Disciplinario -> Ausencia Injustificadas',
          'El empleador debe acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del Artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido',
          `Con fecha ${fechaTermino}, el empleador me comunicó verbalmente que estaba despedido y que la comunicación del despido me sería hecha llegar el mismo día, situación que a la fecha de esta presentación aún no he recepcionado en mi domicilio.`,
          'Conforme mandata el Artículo 454, número uno inciso segundo, “..., en los juicios sobre despido corresponderá en primer lugar al demandado la rendición de la prueba, debiendo acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido”.',
          'Entonces, no habiéndose cumplido con el Artículo 162 del Código del Trabajo, no tiene la contraria elementos de hecho que acreditar en estrados, ni puede agregar nuevos.',
          '● Se trata de un incumplimiento de las obligaciones del contrato. Dentro de lo que no queda comprendida cualquier obligación integrante del contrato de trabajo, siendo este un contrato de adhesión, expresión de la voluntad unilateral del empleador, que por lo mismo se encuentra limitado por ley con normativa de orden público. Por tanto, este incumplimiento grave de obligaciones del contrato sólo puede provenir de obligaciones de la esencia del contrato, lo cual deberá ser estimado casuísticamente por el juez al tenor de la razonabilidad del caso y del principio de protección del trabajador. Es en esta evaluación, en que el juez deberá ponderar que el Código del Trabajo establece un singular sistema de sanciones para el trabajador, otras aplicadas por el empleador, de lo que se deduce que el mismo legislador laboral considera que numerosos incumplimientos contractuales pueden ser sancionados con amonestaciones o multas y no necesariamente con la determinación de un despido. Es decir, conclusivamente, no todo incumplimiento faculta para llegar a la decisión de despedir a un trabajador.',
          '● El incumplimiento debe ser grave. Esto es, de un peso o entidad considerable, de una magnitud tal que afecte la continuidad del contrato.',
          '● Ruptura de la confianza que requiere el trabajo. Circunstancia que, en el caso, no genera una afectación a la confianza y que en la misma comunicación no existe ninguna mención a la voz confianza en ningún sentido posible en la comunicación del término, · Daño efectivamente producido.',
          '● Peligro provocado con la conducta. Para el caso expuesto no existe peligro mencionado con ocasión del despido de 26 de septiembre de 2025.',
          '● Habitualidad de la misma o reiterada en el tiempo. Que, la situación que se imputa obedece a un evento único, de fecha 26 de septiembre de 2025.',
          '● El incumplimiento debe ser injustificado. Circunstancia que como esta parte ya ha referido, no ha habido incumplimiento, y de haber existido estaría del todo justificado atendiendo a las circunstancias, en cuanto se le habiamos solicitado reiteradas veces a mi empleador soluciones  respecto al pago del bono trimestral y estas fueron ignoradas.',
          '● La decisión del despido disciplinario debe ser adoptada con proporcionalidad. La consecuencia de despedir en esta forma al trabajador, haciendo que el trabajador pierda las indemnizaciones del caso, deben basarse en una causa razonablemente proporcional; es, por tanto, que la demandada debe explicar el fundamento de su excesivo obrar, donde podría haber ejercido su poder disciplinario a través de cualquier otra sanción conservativa contemplada.',
          '● Es en este entendido que mi despido se encuentra del todo injustificado en cuanto a su fondo, pues el presupuesto que habrían dado lugar a aquel no cumpliría con la totalidad de los requisitos exigidos.',
          'No se cumplen con ninguno de los dos elementos del tipo disciplinario.',
          'No hubo configuración que haga que el presupuesto fáctico satisfaga la causal legal, por tanto, desde luego, no puede haber gravedad en los mismos, pues la gravedad no se encuentra demostrada en lo que sostiene la comunicación realizada el día de mi despido, a saber, 26 de septiembre de 2025.',
          'En consecuencia, procede otorgar la indemnización sustitutiva del aviso previo, que asciende en concreto a la suma de {{demandaFmt.remuneracion_clp}}.',
          'También, por tanto, procede otorgar indemnización por años de servicio, correspondiente a: {{demandaFmt.indemnizacion_monto_clp}} y es procedente que esta sea incrementada en un 80% siendo esta suma según apreciación de S.S. a si el despido es declarado con aplicación indebida de las causales del Artículo 160 del CT.'
        ],

        'acoso sexual': [
          '3) Motivo Término -> Despido',
          'a) Tipo Despido -> Disciplinario',
          '3) Disciplinario -> Acoso Sexual',
          'El empleador debe acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del Artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido',
          `Con fecha ${fechaTermino}, el empleador me comunicó verbalmente que estaba despedido y que la comunicación del despido me sería hecha llegar el mismo día, situación que a la fecha de esta presentación aún no he recepcionado en mi domicilio.`,
          'Conforme mandata el Artículo 454, número uno inciso segundo, “..., en los juicios sobre despido corresponderá en primer lugar al demandado la rendición de la prueba, debiendo acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido”.',
          'Entonces, no habiéndose cumplido con el Artículo 162 del Código del Trabajo, no tiene la contraria elementos de hecho que acreditar en estrados, ni puede agregar nuevos.',
          'En el caso presente niego todas las imputaciones realizadas por el empleador, pues son falsas.',
          'En consecuencia, procede otorgar la indemnización sustitutiva del aviso previo, que asciende en concreto a la suma de {{demandaFmt.remuneracion_clp}}.',
          'También, por tanto, procede otorgar indemnización por años de servicio, correspondiente a: {{demandaFmt.indemnizacion_monto_clp}} y es procedente que esta sea incrementada en un 80% siendo esta suma según apreciación de S.S. a si el despido es declarado con aplicación indebida de las causales del Artículo 160 del CT.'
        ],

        'acoso laboral': [
          '3) Motivo Término -> Despido',
          'a) Tipo Despido -> Disciplinario',
          '4) Disciplinario -> Acoso Laboral',
          'El empleador debe acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del Artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido',
          `Con fecha ${fechaTermino}, el empleador me comunicó verbalmente que estaba despedido y que la comunicación del despido me sería hecha llegar el mismo día, situación que a la fecha de esta presentación aún no he recepcionado en mi domicilio.`,
          'Conforme mandata el Artículo 454, número uno inciso segundo, “..., en los juicios sobre despido corresponderá en primer lugar al demandado la rendición de la prueba, debiendo acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido”.',
          'En el caso presente niego todas las imputaciones realizadas por el empleador, pues son falsas.',
          'Entonces, no habiéndose cumplido con el Artículo 162 del Código del Trabajo, no tiene la contraria elementos de hecho que acreditar en estrados, ni puede agregar nuevos.',
          'En consecuencia, procede otorgar la indemnización sustitutiva del aviso previo, que asciende en concreto a la suma de {{demandaFmt.remuneracion_clp}}.',
          'También, por tanto, procede otorgar indemnización por años de servicio, correspondiente a: {{demandaFmt.indemnizacion_monto_clp}} y es procedente que esta sea incrementada en un 80% siendo esta suma según apreciación de S.S. a si el despido es declarado con aplicación indebida de las causales del Artículo 160 del CT.'
        ],

        'injurias': [
          '3) Motivo Término -> Despido',
          'a) Tipo Despido -> Disciplinario',
          '5) Disciplinario -> Injurias',
          'El empleador debe acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del Artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido',
          `Con fecha ${fechaTermino}, el empleador me comunicó verbalmente que estaba despedido y que la comunicación del despido me sería hecha llegar el mismo día, situación que a la fecha de esta presentación aún no he recepcionado en mi domicilio.`,
          'Conforme mandata el Artículo 454, número uno inciso segundo, “..., en los juicios sobre despido corresponderá en primer lugar al demandado la rendición de la prueba, debiendo acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido”.',
          'Entonces, no habiéndose cumplido con el Artículo 162 del Código del Trabajo, no tiene la contraria elementos de hecho que acreditar en estrados, ni puede agregar nuevos.',
          'En el caso presente niego todas las imputaciones realizadas por el empleador, pues son falsas.',
          'En consecuencia, procede otorgar la indemnización sustitutiva del aviso previo, que asciende en concreto a la suma de {{demandaFmt.remuneracion_clp}}.',
          'También, por tanto, procede otorgar indemnización por años de servicio, correspondiente a: {{demandaFmt.indemnizacion_monto_clp}} y es procedente que esta sea incrementada en un 80% siendo esta suma según apreciación de S.S. a si el despido es declarado con aplicación indebida de las causales del Artículo 160 del CT.'
        ],

        'negociacion incompatible': [
          '3) Motivo Término -> Despido',
          'a) Tipo Despido -> Disciplinario',
          '6) Disciplinario -> Negociación Incompatible',
          'El empleador debe acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del Artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido',
          `Con fecha ${fechaTermino}, el empleador me comunicó verbalmente que estaba despedido y que la comunicación del despido me sería hecha llegar el mismo día, situación que a la fecha de esta presentación aún no he recepcionado en mi domicilio.`,
          'Conforme mandata el Artículo 454, número uno inciso segundo, “..., en los juicios sobre despido corresponderá en primer lugar al demandado la rendición de la prueba, debiendo acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido”.',
          'Entonces, no habiéndose cumplido con el Artículo 162 del Código del Trabajo, no tiene la contraria elementos de hecho que acreditar en estrados, ni puede agregar nuevos.',
          'En el caso presente niego todas las imputaciones realizadas por el empleador, pues son falsas.',
          'En consecuencia, procede otorgar la indemnización sustitutiva del aviso previo, que asciende en concreto a la suma de {{demandaFmt.remuneracion_clp}}.',
          'También, por tanto, procede otorgar indemnización por años de servicio, correspondiente a: {{demandaFmt.indemnizacion_monto_clp}} y es procedente que esta sea incrementada en un 80% siendo esta suma según apreciación de S.S. a si el despido es declarado con aplicación indebida de las causales del Artículo 160 del CT.'
        ],

        'actos o imprudencia temeraria': [
          '3) Motivo Término -> Despido',
          'a) Tipo Despido -> Disciplinario',
          '7) Disciplinario -> Actos o Imprudencias Temeraria',
          'El empleador debe acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del Artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido',
          `Con fecha ${fechaTermino}, el empleador me comunicó verbalmente que estaba despedido y que la comunicación del despido me sería hecha llegar el mismo día, situación que a la fecha de esta presentación aún no he recepcionado en mi domicilio.`,
          'Conforme mandata el Artículo 454, número uno inciso segundo, “..., en los juicios sobre despido corresponderá en primer lugar al demandado la rendición de la prueba, debiendo acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido”.',
          'Entonces, no habiéndose cumplido con el Artículo 162 del Código del Trabajo, no tiene la contraria elementos de hecho que acreditar en estrados, ni puede agregar nuevos.',
          'En el caso presente niego todas las imputaciones realizadas por el empleador, pues son falsas.',
          'En consecuencia, procede otorgar la indemnización sustitutiva del aviso previo, que asciende en concreto a la suma de {{demandaFmt.remuneracion_clp}}.',
          'También, por tanto, procede otorgar indemnización por años de servicio, correspondiente a: {{demandaFmt.indemnizacion_monto_clp}} y es procedente que esta sea incrementada en un 80% siendo esta suma según apreciación de S.S. a si el despido es declarado con aplicación indebida de las causales del Artículo 160 del CT.'
        ],

        'abandono de trabajo': [
          '3) Motivo Término -> Despido',
          'a) Tipo Despido -> Disciplinario',
          '8) Disciplinario -> Abandono de Trabajo',
          'El empleador debe acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del Artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido',
          `Con fecha ${fechaTermino}, el empleador me comunicó verbalmente que estaba despedido y que la comunicación del despido me sería hecha llegar el mismo día, situación que a la fecha de esta presentación aún no he recepcionado en mi domicilio.`,
          'Conforme mandata el Artículo 454, número uno inciso segundo, “..., en los juicios sobre despido corresponderá en primer lugar al demandado la rendición de la prueba, debiendo acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido”.',
          'Entonces, no habiéndose cumplido con el Artículo 162 del Código del Trabajo, no tiene la contraria elementos de hecho que acreditar en estrados, ni puede agregar nuevos.',
          'En el caso presente niego todas las imputaciones realizadas por el empleador, pues son falsas.',
          'En consecuencia, procede otorgar la indemnización sustitutiva del aviso previo, que asciende en concreto a la suma de {{demandaFmt.remuneracion_clp}}.',
          'También, por tanto, procede otorgar indemnización por años de servicio, correspondiente a: {{demandaFmt.indemnizacion_monto_clp}} y es procedente que esta sea incrementada en un 80% siendo esta suma según apreciación de S.S. a si el despido es declarado con aplicación indebida de las causales del Artículo 160 del CT.'
        ],

        'falta de probidad': [
          '3) Motivo Término -> Despido',
          'a) Tipo Despido -> Disciplinario',
          '9) Disciplinario -> Falta de Probidad',
          'El empleador debe acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del Artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido',
          `Con fecha ${fechaTermino}, el empleador me comunicó verbalmente que estaba despedido y que la comunicación del despido me sería hecha llegar el mismo día, situación que a la fecha de esta presentación aún no he recepcionado en mi domicilio.`,
          'Conforme mandata el Artículo 454, número uno inciso segundo, “..., en los juicios sobre despido corresponderá en primer lugar al demandado la rendición de la prueba, debiendo acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido”.',
          'Entonces, no habiéndose cumplido con el Artículo 162 del Código del Trabajo, no tiene la contraria elementos de hecho que acreditar en estrados, ni puede agregar nuevos.',
          'En el caso presente niego todas las imputaciones realizadas por el empleador, pues son falsas.',
          'En consecuencia, procede otorgar la indemnización sustitutiva del aviso previo, que asciende en concreto a la suma de {{demandaFmt.remuneracion_clp}}.',
          'También, por tanto, procede otorgar indemnización por años de servicio, correspondiente a: {{demandaFmt.indemnizacion_monto_clp}} y es procedente que esta sea incrementada en un 80% siendo esta suma según apreciación de S.S. a si el despido es declarado con aplicación indebida de las causales del Artículo 160 del CT.'
        ],

        'otros especificar': [
          '3) Motivo Término -> Despido',
          'a) Tipo Despido -> Disciplinario',
          '10) Disciplinario -> Otros Especificar',
          'El empleador debe acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del Artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido',
          `Con fecha ${fechaTermino}, el empleador me comunicó verbalmente que estaba despedido y que la comunicación del despido me sería hecha llegar el mismo día, situación que a la fecha de esta presentación aún no he recepcionado en mi domicilio.`,
          'Conforme mandata el Artículo 454, número uno inciso segundo, “..., en los juicios sobre despido corresponderá en primer lugar al demandado la rendición de la prueba, debiendo acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido”.',
          'Entonces, no habiéndose cumplido con el Artículo 162 del Código del Trabajo, no tiene la contraria elementos de hecho que acreditar en estrados, ni puede agregar nuevos.',
          'En el caso presente niego todas las imputaciones realizadas por el empleador, pues son falsas.',
          'En consecuencia, procede otorgar la indemnización sustitutiva del aviso previo, que asciende en concreto a la suma de {{demandaFmt.remuneracion_clp}}.',
          'También, por tanto, procede otorgar indemnización por años de servicio, correspondiente a: {{demandaFmt.indemnizacion_monto_clp}} y es procedente que esta sea incrementada en un 80% siendo esta suma según apreciación de S.S. a si el despido es declarado con aplicación indebida de las causales del Artículo 160 del CT.'
        ],
      };


      const pack = DISC_MAP[sub] ?? [
        '3) Motivo Término -> Despido',
        'a) Tipo Despido -> Disciplinario',
        TXT.base162,
        TXT.base454,
        TXT.indemnizacion80,
      ];
      clauses.push(...pack);
      const rendered = cleanup(clauses).map(s => renderTpl(s, ctx));
      return { faltantes: [], clausulas: rendered, flags };
    }

    // 3.b) Tipo -> Necesidades de la Empresa
    if (tipo === 'necesidades de la empresa') {
      flags.isNecesidadesEmpresa = true;

      // Inyecta el estado de pago de años/mes aviso si te lo entregó el formulario
      // const pagoAnos =
      //   d.anosServicios === true
      //     ? 'Se pagaron años de servicio.'
      //     : d.anosServicios === false
      //       ? 'NO se pagaron años de servicio.'
      //       : '';
      // const pagoMesAviso =
      //   d.mesAviso === true
      //     ? 'Se pagó mes de aviso.'
      //     : d.mesAviso === false
      //       ? 'NO se pagó mes de aviso.'
      //       : '';

      const clause = [
        '3) Motivo Término -> Despido',
        'b) Tipo Despido -> Necesidades de la Empresa',
        'Que, no hay medidas de racionalización o reestructuración alguna, ni cambios en condiciones que justifiquen suficientemente mi despido y si así fuere, no se sostiene en ningún análisis expuesto a ningún nivel, ni informado o acreditado hacia mi persona. Por lo que, conclusivamente al no existir relación con lo informado, es que solamente resta que el sustento de la medida es solamente la mera voluntad del empleador; es decir, generada por su decisión libre, en pro de la optimización de sus recursos y funcionamiento, decisión legítima que la ley no objeta, pero cuyas consecuencias deben ser asumidas por el titular de la misma; Asimismo, esto en situaciones que den cuenta que debe verse compelido a adoptarla, y, que en el tiempo presente y con los antecedentes conocidos pudiera hacer imprescindible, por tanto, forzosa y que la demandada debió adoptar estos procesos, circunstancia que no es del caso de marras.\n',
        'Circunstancias que tampoco por sí solas, no expone haber ocasionado merma en las condiciones económicas del empleador, y que, no puede ser traspasada estas consecuencias al dependiente, por cuanto, el legislador protege la estabilidad en el empleo y la mantención de las fuentes laborales; que, además categóricamente S.S., estas al no ser acreditadas, es imposible vincularlas a situaciones o circunstancias externas y que no han sido exhibidos como condiciones de objetividad ajenas a la empresa.',
        'Que, previamente se debe tener presente, que uno de los principios del Derecho Laboral, es el de protección del trabajador, puesto que contiene normas de orden público que establecen prerrogativas irrenunciables en materia de remuneraciones, descansos y feriados, además de aquellas que reglamentan la forma de término del respectivo contrato, constituyendo una manifestación concreta de aquel principio la continuidad o estabilidad en el empleo, que en la relación contractual se proyecta en la preferencia de la ley en que sea indefinidas y en la regulación de causales específicas para su término, por lo que la sola voluntad del empleador, es excepcional.',
        'Que, nuestra doctrina al examinar esta materia ha señalado, que la razón del despido debe centrarse en necesidades de carácter económico o tecnológico, que autorizan al empleador a despedir al dependiente cuando no puede mantener su fuente laboral por motivos de naturaleza objetiva; es decir, los hechos que la constituyen deben ser ajenos a la voluntad de las partes.',
        'Otros sostienen, que , la causal analizada debe constituir una situación objetiva que afecte a la empresa, establecimiento o servicio, por ende, no puede obedecer por simple arbitrio del empleador, caso en el que operaría un despido libre o desahucio; la necesidad, tiene que ser grave, por lo que debe tratarse de una situación de tal amplitud que ponga en peligro la subsistencia de la empresa y no meramente una rebaja en sus ganancias, y también permanente, entonces, si es transitoria o puede recurrirse a otros medios o medidas que permitan alcanzar el mismo objetivo sin despedir trabajadores, no aplica la causal; y ha de existir una relación de causalidad entre las necesidades y el despido, porque es la situación de la empresa la que hace necesaria la separación de uno o más trabajadores.\n',
        'Asimismo, se explica, que las necesidades de la empresa que justifican el despido pueden ser de índole económica y tecnológica, también una combinación de ambos factores, entendidos de modo amplio, y siempre deben tener alguna gravedad; en tal sentido se entiende que un pasajero mal estado económico, es riesgo del empresario y no configura la causal, y que, entre las necesidades económicas o tecnológicas, por una parte, y el despido, por la otra, debe comprobarse una relación de causalidad.',
        'Que, al respecto en este sentido, nuestra Excelentísima Corte Suprema, ha señalado en diversas ocasiones y en una de sus manifestaciones más recientes, autos rol 87286-2021; que:\n',
        '“Noveno: Que, por lo expuesto, se debe concluir que la causal de despido reglada en el inciso primero del artículo 161 del Código del Trabajo, exige la concurrencia de aspectos técnicos o económicos, y al ser objetiva, no puede fundarse en la simple voluntad del empleador, sino que en situaciones graves que den cuenta que forzosamente debió adoptar procesos de modernización o de racionalización en el funcionamiento de la empresa, en circunstancias financieras adversas, como bajas en la productividad o cambios en las condiciones del mercado; tal como se sostuvo en las sentencias de contraste y en los fallos dictados por esta Corte en los autos Rol N°35.742-2017, 1.073-2018, 76.715-2020 y 63.480-2021, por lo que no basta la simple decisión patronal para justificar la desvinculación del dependiente, puesto que se requiere de una razón adicional, grave y exterior a su intención para sostenerla, conjunto de exigencias que en este caso no concurren.”',
        'Asimismo en el mismo orden de ideas se ha pronunciado la Ilustrísima Corte de Apelaciones de Santiago teniendo presente en relación a Recurso de Nulidad Rol 478-2024:\n',
        '“DÉCIMO CUARTO: Respecto de la infracción que se acusa es dable señalar que la causal de “necesidades de la empresa” resulta ser una excepción a la estabilidad del empleo que se funda en elementos objetivos que permiten trasladar el riesgo de la empresa al propio trabajador, contrariamente a la ajenidad que rige las relaciones laborales. De allí que resulte tan importante resguardar que sus fundamentos sean realmente aquellos provenientes de motivos objetivos ajenos al desempeño del propio actor, a fin de que no se convierta en una causal de libre despido pagado, otorgando una flexibilidad de salida, ajena a la normativa legal.\n',
        'DÉCIMO QUINTO: En efecto, es dable tener presente que, uno de los principios del derecho laboral, es la protección del trabajador, puesto que se contienen normas de orden público que establecen prerrogativas irrenunciables en materia de remuneraciones, descansos y feriados, además de aquellas que reglamentan la forma de término del respectivo contrato, constituyendo una manifestación concreta de aquel principio la continuidad o estabilidad en el empleo, que en la relación contractual se proyecta en la preferencia de la ley en que sean indefinidas y en la regulación de causales específicas para su término, por lo que la sola voluntad del empleador, manifestada en ese sentido, se debe considerar excepcional.',
        'Bajo tal premisa, el artículo 161 del Código del ramo autoriza al empleador a poner término al contrato de trabajo invocando la causal de necesidades de la empresa, originadas por las circunstancias que indica a modo ejemplar, derivadas de la racionalización o modernización de los servicios, bajas en la productividad, cambios en las condiciones del mercado o de la economía, que hacen necesaria la separación de uno o más dependientes.',
        'La doctrina (Lanata F., Gabriela, “Contrato individual de trabajo”, 4° ed. Actualizada, Santiago, Chile, Legal Publishing, 2010, p. 283), al examinar esta materia, explica que la razón del despido debe centrarse en necesidades de carácter económico o tecnológico, que autorizan al empleador a despedir al dependiente cuando no puede mantener su fuente laboral por motivos de naturaleza objetiva; en razón de lo anterior, los hechos que la constituyen deben ser ajenos a la voluntad de las partes.\n',
        'Por su parte, otros autores sostienen que la causal que se analiza debe constituir una situación objetiva que afecte a la empresa, establecimiento o servicio, por ende, no puede invocarse por un simple arbitrio del empleador, caso en el que operaría como un despido libre o desahucio; la necesidad tiene que ser grave, por lo que debe tratarse de una situación de tal amplitud que ponga en peligro la subsistencia de la empresa y no meramente una rebaja en sus ganancias, y también permanente, entonces, si es transitoria o puede recurrirse a otros medios o medidas que permitan alcanzar el mismo objetivo sin despedir trabajadores, no aplica la causal; y ha de existir una relación de causalidad entre las necesidades y el despido, porque es la situación de la empresa la que hace necesaria la separación de uno o más trabajadores. (Gamonal, Sergio y Guidi Caterina, Manual del contrato de trabajo, 4° edición revisada, Santiago, Chile, Thomson Reuters, 2015, pp, 387 y 388)',
        'Finalmente, las necesidades de la empresa que justifican el despido pueden ser de índole económica y tecnológica, también una combinación de ambos factores, entendidos de modo amplio, y siempre deben tener alguna gravedad; en tal sentido se entiende que un pasajero mal estado económico, es riesgo del empresario y no configura la causal, y que, entre las necesidades económicas o tecnológicas, por una parte, y el despido, por la otra, debe comprobarse una relación de causalidad. (Thayer, William y Novoa, Patricio, Manual de Derecho del Trabajo, Tomo IV, 5° edición actualizada, Santiago, Chile, Editorial Jurídica, 2010, p. 47-48).\n',
        'De esta forma se debe concluir que la causal de despido reglada en el inciso primero del artículo 161 del Código del Trabajo, exige la concurrencia de aspectos técnicos o económicos, y al ser objetiva, no puede fundarse en la simple voluntad del empleador, sino que en situaciones graves que den cuenta que forzosamente debió adoptar procesos de modernización o de racionalización en el funcionamiento de la empresa, en circunstancias financieras adversas, como bajas en la productividad o cambios en las condiciones del mercado, lo que no ha ocurrido en la especie, de acuerdo a los presupuestos fácticos tenidos por ciertos por el sentenciador.\n',
        'DÉCIMO SEXTO: Que, de la sola redacción de la carta, se desprende que la racionalización ha sido bastante acotada, puesto que, además de circunscribir la baja de productividad al área del demandante, describe que ésta tenía como objetivo reestructurar los servicios que prestaba en un área determinada como consecuencia de la fusión acaecida. Esto es relevante desde que más que una necesidad, atienden a una conveniencia que no tiene que ver con el mercado ni la economía en general, sino con una simple decisión de eficiencia, por lo que los presupuestos fácticos contenidos en la signada misiva no pueden subsumirse en la hipótesis de necesidades de la empresa, prevista en el artículo 161 del Código del Trabajo.\n',
        'DÉCIMO SÉPTIMO: Asimismo, en la sentencia que se revisa, no se contextualiza la razón por la que la desvinculación cumpliría con el estándar necesario para hacer procedente formalmente el despido o que el contenido de la misiva fuera suficiente o que se hubieren explicitado suficientemente, dado que se contiene la siguiente expresión en el mentado motivo quinto que “por el contrario, se ha explicado en la carta de manera pormenorizada los hechos que configuran la causal de despido, mismos que fueron debidamente acreditados en la audiencia única”.\n',
        'DÉCIMO OCTAVO: Valga además señalar que, es en condiciones de crisis cuando resulta más atingente exigir a la causal de necesidades de la empresa, la objetividad que la fundamenta, a fin de que no baste sólo con invocar la restructuración o fusión de las empresas, esto es, como una habilitación genérica y a priori para legitimar despidos que tengan en vista la mera reducción de costos o la posibilidad de deshacerse de trabajadores con un desempeño inferior al esperado.\n',
        'DÉCIMO NOVENO: Que en este orden de ideas la Corte Suprema con fecha 22 de marzo de 2023, en causa Rol N° 119.179-2020 resolvió:\n',
        '“Sexto: Que, para dilucidar lo anterior, se debe tener presente que esta Corte ya se ha pronunciado sobre el asunto, inclinándose de manera consistente por la postura expresada en el fallo de contraste, por cuanto la interpretación de la norma en examen, a la luz de los principios que informan el Derecho del Trabajo y de la historia del mensaje de la ley que la introdujo en la legislación y la respectiva discusión parlamentaria, conduce a concluir que el empleador sólo puede invocar la causal de que se trata aludiendo a aspectos de carácter técnicos o económico referidos a la empresa, establecimiento o servicio, y es una de tipo objetiva, por ende, no se relaciona con la conducta desplegada por el trabajador, y excede la mera voluntad del empleador; razón por la que debe probar los supuestos de hecho que den cuenta de la configuración de aquellas situaciones que lo forzaron a adoptar procesos de modernización o racionalización en el funcionamiento de la empresa, o de eventos económicos, como son las bajas en la productividad o cambio en las condiciones de mercado, señalados, a título ejemplar.\n',
        'Séptimo: Que, en el caso al contrastar la correcta interpretación de la norma, según lo previamente concluido, con los antecedentes fácticos establecidos en la causa, se colige que no se verifican tales presupuestos, por cuanto si bien es efectivo que se produjo la fusión invocada como fundamento de la separación de los trabajadores, no se dio por acreditado que haya sido ocasionada por razones de bajas de productividad o por otras circunstancias económicas o de cambios en el mercado que involucren en sí una merma en las condiciones económicas del empleador, lo que determina que el costo de la decisión no puede ser traspasado al dependientes, por cuanto el legislador protege la estabilidad en el empleo y la mantención de las fuentes laborales, siendo de cargo del empleador la indemnización de sus trabajadores con los incrementos que al efecto dispone la ley, siempre que la empresa no se encuentre en la necesidad de prescindir de sus empleados por una situación externa e independiente de ella, sino que la misma ha sido generada por su decisión libre, en pro de la optimización de sus recursos y funcionamiento, decisión legítima que la ley no objeta, pero, cuyas consecuencias deben ser asumidas por su titular”.\n',
        'Asimismo en el mismo orden de ideas se ha pronunciado la Ilustrísima Corte de Apelaciones de Santiago teniendo presente en Sentencia de reemplazo de Recurso de Nulidad Rol 478-2024:\n',
        '“Primero: Que, conforme se concluyó del análisis de la causal de despido invocada por el empleador, debe fundarse en elementos objetivos que, según se desprende de los hechos establecidos, no concurren en el caso, puesto que la decisión se origina en el propósito de la empresa de optimizar su estructura a fin de disminuir sus costos e incrementar sus utilidades, hipótesis que no resulta amparada por el artículo 161, inciso 1° , del Código del Trabajo, por lo que su aplicación debe ser declarada improcedente y, en consecuencia, debe hacerse lugar a la demanda, en cuanto pretende el incremento consagrado en el artículo 168 letra a) del citado cuerpo legal, calculado sobre la indemnización por años de servicios ya percibida por la parte demandante. […]\n',
        'Por estas razones se debe estimar el despido como injustificado o improcedente, pues estando vigente el contrato, debió cumplirse con las formalidades propias de la misma relación laboral y de su conclusión.',
        'Junto con las acciones señaladas, se viene en reclamar el pago de los conceptos correspondientes tenga en estima S.S los valores correspondientes a la época y que deberían ser integrantes del término de la relación laboral en la hipótesis expuesta:\n',
        '• Indemnización sustitutiva del aviso previo: {{demandaFmt.remuneracion_clp}}\n',
        '• Indemnización por años de servicios: {{demandaFmt.indemnizacion_monto_clp}}\n',
        '• Recargo legal conforme a la causal legal invocada (30%): {{demandaFmt.indemnizacion_recargo30_clp}}\n'
      ].join('\n');
      const renderedBlock = renderTpl(clause, ctx);
      return { faltantes: [], clausulas: [renderedBlock], flags };
    }

    // 3.c) Tipo -> Sin Causa
    if (tipo === 'sin causa' || tipo === 'sincausa') {
      flags.isSinCausa = true;

      clauses.push(
        '3) Motivo Término -> Despido',
        'c) Tipo Despido -> Sin Causa',

        // --- TEXTO COMPLETO ---
        'El empleador debe acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del Artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido',
        `Con fecha ${fechaTermino}, el empleador me comunicó que estaba despedido y que la comunicación del despido me sería hecha llegar el mismo día, situación que a la fecha de esta presentación aún no he recepcionado en mi domicilio.`,
        'Conforme mandata el Artículo 454, número uno inciso segundo, “..., en los juicios sobre despido corresponderá en primer lugar al demandado la rendición de la prueba, debiendo acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido”.',
        'Entonces, no habiéndose cumplido con el Artículo 162 del Código del Trabajo, no tiene la contraria elementos de hecho que acreditar en estrados, ni puede agregar nuevos.',
        'En el caso presente el despido carece de fundamento y por lo tanto es in causado.',
        '• Indemnización sustitutiva del aviso previo: {{demandaFmt.remuneracion_clp}}',
        '• Indemnización por años de servicios: {{demandaFmt.indemnizacion_monto_clp}} y es procedente que esta sea incrementada en un 50% siendo esta suma según apreciación de S.S. a si el despido es declarado con aplicación indebida de las causales del Artículo 160 del CT.'
      );

      const rendered = cleanup(clauses).map(s => renderTpl(s, ctx));
      return { faltantes: [], clausulas: rendered, flags };
    }

    // 3.d) Tipo -> Término de Plazo
    if (tipo === 'termino de plazo' || tipo === 'término de plazo') {
      flags.isTerminoPlazo = true;

      clauses.push(
        '3) Motivo Término -> Despido',
        'd) Tipo Despido -> Término de Plazo',

        // --- TEXTO COMPLETO ---
        'El empleador debe acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del Artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido',
        `Con fecha ${fechaTermino}, el empleador me comunicó que estaba despedido y que la comunicación del despido me sería hecha llegar el mismo día, situación que a la fecha de esta presentación aún no he recepcionado en mi domicilio.`,
        'Conforme mandata el Artículo 454, número uno inciso segundo, “..., en los juicios sobre despido corresponderá en primer lugar al demandado la rendición de la prueba, debiendo acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido”.',
        'Entonces, no habiéndose cumplido con el Artículo 162 del Código del Trabajo, no tiene la contraria elementos de hecho que acreditar en estrados, ni puede agregar nuevos.',
        'En el caso presente el contrato no ha vencido pues ha pasado a indefinido por operar los presupuestos del artículo 159 del CT.',
        '• Indemnización sustitutiva del aviso previo: {{demandaFmt.remuneracion_clp}}',
        '• Indemnización por años de servicios: {{demandaFmt.indemnizacion_monto_clp}} y es procedente que esta sea incrementada en un 50% siendo esta suma según apreciación de S.S. a si el despido es declarado con aplicación indebida de las causales del Artículo 160 del CT.'
      );

      const rendered = cleanup(clauses).map(s => renderTpl(s, ctx));
      return { faltantes: [], clausulas: rendered, flags };
    }

    // 3.e) Tipo -> Término de Obra o Faena
    if (tipo === 'termino de obra o faena' || tipo === 'término de obra o faena') {
      flags.isTerminoObra = true;

      clauses.push(
        '3) Motivo Término -> Despido',
        'e) Tipo Despido -> Término de Obra o Faena',

        // --- TEXTO COMPLETO ---
        'El empleador debe acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del Artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido',
        `Con fecha ${fechaTermino}, el empleador me comunicó que estaba despedido y que la comunicación del despido me sería hecha llegar el mismo día, situación que a la fecha de esta presentación aún no he recepcionado en mi domicilio.`,
        'Conforme mandata el Artículo 454, número uno inciso segundo, “..., en los juicios sobre despido corresponderá en primer lugar al demandado la rendición de la prueba, debiendo acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido”.',
        'Entonces, no habiéndose cumplido con el Artículo 162 del Código del Trabajo, no tiene la contraria elementos de hecho que acreditar en estrados, ni puede agregar nuevos.',
        'En el caso presente el contrato no ha vencido pues continúa la obra o faena por la que fui contratado.',
        '• Indemnización sustitutiva del aviso previo: {{demandaFmt.remuneracion_clp}}',
        '• Indemnización por años de servicios: {{demandaFmt.indemnizacion_monto_clp}} y es procedente que esta sea incrementada en un 50% siendo esta suma según apreciación de S.S. a si el despido es declarado con aplicación indebida de las causales del Artículo 160 del CT.'
      );

      const rendered = cleanup(clauses).map(s => renderTpl(s, ctx));
      return { faltantes: [], clausulas: rendered, flags };
    }


    // 4) Motivo -> AutoDespido
    if (
      motivo === 'autodespido' ||
      motivo === 'auto despido' ||
      motivo === 'autodespido (171)'
    ) {
      flags.isAutoDespido = true;

      clauses.push(
        '4) Motivo Término -> AutoDespido',

        // --- TEXTO COMPLETO ---
        'El artículo 171 del Código del Trabajo consagra la institución que doctrinariamente se conoce como despido indirecto o auto despido en los siguientes términos: “Si quien incurriere en las causales de los números 1, 5 ó 7 del artículo 160 fuere el empleador, el trabajador podrá poner término al contrato y recurrir al juzgado respectivo, dentro del plazo de sesenta días hábiles, contado desde la terminación, para que éste ordene el pago de las indemnizaciones establecidas en el inciso cuarto del artículo 162, y en los incisos primero o segundo del artículo 163, según corresponda, aumentada en un cincuenta por ciento en el caso de la causal del número 7º...”',
        `Con fecha ${fechaTermino}, tomé la decisión de poner término al contrato por haberse incumplido por parte del empleador las obligaciones contractuales señaladas.`,
        '2.- Pues bien, en el caso de autos la demandada ha incurrido en la causal de caducidad establecida en el numeral séptimo del artículo 160 del Código del Trabajo, esto es “Incumplimiento grave de las obligaciones que impone el contrato”. Efectivamente, tal como se ha explicado en detalle en la relación circunstanciada de los hechos, el demandado no ha respetado derechos básicos establecidos a favor de los trabajadores que deben entenderse incorporados a todo contrato individual de trabajo, asimismo no ha respetado cláusulas del mismo válidamente acordadas por las partes y no ha dado cumplimiento a obligaciones contenidas en las leyes de seguridad social.',
        'Si bien se pactaron todas las estipulaciones antedichas, como la remuneración, jornada de trabajo, naturaleza del contrato, la demandada no cumplió, como por ejemplo escrituró mi contrato individual de trabajo, no contaba con libro de asistencia y no me entregó liquidaciones de remuneraciones.',
        '• Indemnización sustitutiva del aviso previo: {{demandaFmt.remuneracion_clp}}',
        '• Indemnización por años de servicios: {{demandaFmt.indemnizacion_monto_clp}} y es procedente que esta sea incrementada en un 50% siendo esta suma según apreciación de S.S., de acuerdo al artículo 171 del CT.'
      );

      const rendered = cleanup(clauses).map(s => renderTpl(s, ctx));
      return { faltantes: [], clausulas: rendered, flags };
    }

    // Default: motivo no reconocido
    return {
      faltantes: [],
      clausulas: ['No se configuró causal de término reconocida para generar cláusulas automáticas.'],
      flags: {},
    };
  }
}

/**
 * @param {{ nombre_upper: string, rut_fmt: string }[]} demandadoSolidariosFmt
 */
function solidariosInline(demandadoSolidariosFmt = []) {
  const items = demandadoSolidariosFmt.map(d => `${d.nombre_upper}, RUT: ${d.rut_fmt}`);
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return items.slice(0, -1).join(', ') + ' y ' + items[items.length - 1];
}


function cleanup(list) {
  return list
    .map((s) =>
      typeof s === 'string'
        ? s
            .replace(/[^\S\r\n]+/g, ' ')   // colapsa espacios/tabs, mantiene \r\n
            .replace(/^[ \t]+|[ \t]+$/g, '') // trim espacios/tabs
        : ''
    )
    .filter(Boolean)
    .filter((v, i, arr) => (i === 0 ? true : v !== arr[i - 1]));
}




const getPath = (obj, path) =>
  path.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj);

function renderTpl(str, ctx) {
  return String(str).replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_m, path) => {
    const val = getPath(ctx, path);
    return val == null ? '' : String(val);
  });
}

/* =========================
   1) Schemas y handler
   ========================= */

const demandadoSolidarioSchema = z
  .object({
    id: z.string().trim().optional(),
    nombreRazonSocial: z.string().trim().max(255).optional(),
    rut: z.string().trim().max(30).optional(),
    domicilio: z.string().trim().max(255).optional(),
    representanteLegal: z.string().trim().max(255).optional(),
    runRepresentanteLegal: z.string().trim().max(30).optional(),
  })
  .strip();

const demandaSchema = z
  .object({
    id: z.string().optional(),
    nombres: z.string().trim().optional(),
    apPaterno: z.string().trim().optional(),
    apMaterno: z.string().trim().optional(),
    run: z.string().trim().optional(),
    fechaNacimiento: z.union([z.string(), z.date()]).optional(),
    nacionalidad: z.union([z.string(), z.object({ name: z.string(), code: z.string().optional() })]).optional(),
    correoElectronico: z.string().trim().max(320).optional(),
    estadoCivil: z.union([z.string(), z.object({ name: z.string(), code: z.string().optional() })]).optional(),
    domicilioParticular: z.string().trim().optional(),
    demandadoSols: z.array(demandadoSolidarioSchema).optional(),
    nombreRazonSocial: z.string().trim().optional(),
    rutRazonSocial: z.string().trim().optional(),
    domicilioRazonSocial: z.string().trim().optional(),
    representanteLegal: z.string().trim().optional(),
    runRepresentanteLegal: z.string().trim().optional(),
    fechaInicioRelacionLaboral: z.union([z.string(), z.date()]).optional(),
    naturalezaContrato: z.string().trim().optional(),
    funciones: z.string().trim().optional(),
    lugar: z.string().trim().optional(),
    jornada: z.string().trim().optional(),
    otraJornada: z.string().trim().optional(),
    registroAsistencia: z.boolean().optional(),
    remuneracion: z.union([z.number(), z.string()]).optional(),
    formaPago: z.string().trim().optional(),
    liquidacionSueldo: z.boolean().optional(),
    cotizacionSalud: z.array(z.string().trim()).optional(),
    cotizacionAfp: z.array(z.string().trim()).optional(),
    cotizacionAfc: z.array(z.string().trim()).optional(),
    vacaciones: z.union([z.number(), z.string()]).optional(),
    fuero: z.string().trim().optional(),
    fechaTerminoRelaLaboral: z.union([z.string(), z.date()]).optional(),
    motivoTermino: z.string().trim().optional(),
    tipoDespido: z.string().trim().optional(),
    despidoDisciplinario: z.string().trim().optional(),
    otroDespidoDisciplinario: z.string().trim().optional(),
    anosServicios: z.boolean().optional(),
    mesAviso: z.boolean().optional(),
    finiquito: z.boolean().optional(),
    prestacionesAdeudadas: z.array(z.string().trim()).optional(),
    materias: z.array(z.string().trim()).optional(),
  })
  .passthrough();

const requestSchema = z.object({
  demandaId: z.preprocess((value) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || !/^\d+$/.test(trimmed)) return Number.NaN;
      return Number.parseInt(trimmed, 10);
    }
    return value;
  }, z.number().int().positive()),
  nombreArchivo: z
    .string()
    .trim()
    .min(1, 'nombreArchivo requerido')
    .max(255)
    .regex(SAFE_FILENAME_REGEX, 'nombreArchivo contiene caracteres no permitidos'),
  demandadoSolidarios: z.array(demandadoSolidarioSchema).optional(),
  demanda: demandaSchema.optional(),
});

export async function POST(request) {
  try {
    const session = await requireSession();
    const raw = await request.json();
    const parsed = requestSchema.safeParse(raw);

    if (!parsed.success) {
      const detail = parsed.error.issues.map((issue) => issue.message).join(', ');
      console.debug(parsed.error.issues);
      return NextResponse.json(
        { success: false, error: 'Body inválido', detail },
        { status: 400 }
      );
    }

    const { demandaId, nombreArchivo, demandadoSolidarios: bodyDemandados, demanda } = parsed.data;

    // 1) Buscar en DB
    const demandaDB = await prisma.demanda.findFirst({
      where: {
        id: demandaId,
        usuarioId: session.userId, // ajusta si tu campo se llama distinto
      },
      include: {
        demandadoSolidario: true, // cámbialo al nombre exacto de tu relación
      },
    });

    if (!demandaDB) {
      return NextResponse.json({ success: false, error: 'Demanda no encontrada' }, { status: 404 });
    }

    // 2) Normaliza la fuente desde DB/body
    const demandadoSolidariosDB = Array.isArray(demandaDB.demandadoSolidario) ? demandaDB.demandadoSolidario : [];
    const bodySolidarios = Array.isArray(bodyDemandados) ? bodyDemandados : [];
    const sourceSolidarios = bodySolidarios.length > 0 ? bodySolidarios : demandadoSolidariosDB;

    const baseDemanda = {
      nombres: demandaDB.nombres ?? '',
      apPaterno: demandaDB.apPaterno ?? '',
      apMaterno: demandaDB.apMaterno ?? '',
      run: demandaDB.run ?? '',
      fechaNacimiento: demandaDB.fechaNacimiento ? new Date(demandaDB.fechaNacimiento).toISOString() : '',
      nacionalidad: demandaDB?.nacionalidad ?? '',
      correoElectronico: demandaDB.correoElectronico ?? '',
      estadoCivil: demandaDB?.estadoCivil ?? '',
      domicilioParticular: demandaDB.domicilioParticular ?? '',
      demandadoSols: sourceSolidarios,
      nombreRazonSocial: demandaDB?.nombreRazonSocial ?? '',
      rutRazonSocial: demandaDB?.rutRazonSocial ?? '',
      domicilioRazonSocial: demandaDB?.domicilioRazonSocial ?? '',
      representanteLegal: demandaDB?.representanteLegal ?? '',
      runRepresentanteLegal: demandaDB?.runRepresentanteLegal ?? '',
      fechaInicioRelacionLaboral: demandaDB?.fechaInicioRelacionLaboral
        ? new Date(demandaDB.fechaInicioRelacionLaboral).toISOString()
        : '',
      naturalezaContrato: demandaDB?.naturalezaContrato ?? '',
      funciones: demandaDB?.funciones ?? '',
      lugar: demandaDB?.lugar ?? '',
      jornada: demandaDB?.jornada ?? '',
      otraJornada: demandaDB?.otraJornada ?? '',
      registroAsistencia: !!demandaDB?.registroAsistencia,
      remuneracion: numberOrNull(demandaDB?.remuneracion),
      formaPago: demandaDB?.formaPago ?? '',
      liquidacionSueldo: !!demandaDB?.liquidacionSueldo,
      cotizacionSalud: demandaDB?.cotizacionSalud ?? '',
      cotizacionAfp: demandaDB?.cotizacionAfp ?? '',
      cotizacionAfc: demandaDB?.cotizacionAfc ?? '',
      vacaciones: numberOrNull(demandaDB?.vacaciones),
      fuero: demandaDB?.fuero ?? '',
      fechaTerminoRelaLaboral: demandaDB?.fechaTerminoRelaLaboral
        ? new Date(demandaDB.fechaTerminoRelaLaboral).toISOString()
        : '',
      motivoTermino: demandaDB?.motivoTermino ?? '',
      tipoDespido: demandaDB?.tipoDespido ?? '',
      despidoDisciplinario: demandaDB?.despidoDisciplinario ?? '',
      otroDespidoDisciplinario: demandaDB?.otroDespidoDisciplinario ?? '',
      anosServicios: typeof demandaDB?.anosServicios === 'boolean' ? demandaDB.anosServicios : undefined,
      mesAviso: typeof demandaDB?.mesAviso === 'boolean' ? demandaDB.mesAviso : undefined,
      finiquito: !!demandaDB?.finiquito,
      prestacionesAdeudadas: Array.isArray(demandaDB?.prestacionesAdeudadas) ? demandaDB.prestacionesAdeudadas : [],
      materias: Array.isArray(demandaDB?.materias) ? demandaDB.materias : [],
    };

    const demandaOverride = demanda ? { ...demanda } : undefined;
    const overrideSolidarios = demandaOverride?.demandadoSols;
    const mergedDemandadoSols = Array.isArray(overrideSolidarios) ? overrideSolidarios : sourceSolidarios;

    const cleanedOverride = demandaOverride
      ? Object.fromEntries(
        Object.entries(demandaOverride).filter(([key, value]) => key !== 'demandadoSols' && value !== undefined)
      )
      : undefined;

    const demandaMerged = cleanedOverride
      ? { ...baseDemanda, ...cleanedOverride, demandadoSols: mergedDemandadoSols }
      : { ...baseDemanda, demandadoSols: mergedDemandadoSols };

    // 3) Serializa + valida campos base
    const demandaSerializada = safeSerializeDemanda(demandaMerged);
    const missingBaseFields = ['nombres', 'apPaterno', 'apMaterno', 'run', 'nombreRazonSocial', 'rutRazonSocial'].filter(
      (field) => !demandaSerializada[field]
    );

    if (missingBaseFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan datos obligatorios para generar el documento',
          detail: `Campos requeridos sin valor: ${missingBaseFields.join(', ')}`,
        },
        { status: 422 }
      );
    }

    const demandadosSerializados = safeSerializeDemandados(mergedDemandadoSols);
    debug('demandadosSerializados', {
      count: demandadosSerializados.length,
      overriddenByBody: Array.isArray(bodyDemandados) && bodyDemandados.length > 0,
    });

    // 4) Data formateada para la plantilla
    const demandaFmt = decorateDemandaForDocx(demandaSerializada);
    const demandadoSolidariosFmt = (Array.isArray(demandadosSerializados) ? demandadosSerializados : []).map(
      decorateDemandadoSolidarioForDocx
    );

    const CTX = {
      demanda: demandaSerializada, // crudo
      demandaFmt,                  // formateado (tiene remuneracion_clp, run_fmt, ... )
      flags: {},                   // será sobreescrito por buildClausulas si quieres
    };

    const fechaEmisionLarga = formatFechaLargaDate(new Date());
    const hasDemandadoSolidarios = demandadoSolidariosFmt.length > 0;

    // 5) Cláusulas legales dinámicas (una sola)
    const { faltantes, clausulas, flags } = buildClausulas({
      motivoTermino: demandaSerializada.motivoTermino,
      tipoDespido: demandaSerializada.tipoDespido,
      despidoDisciplinario: demandaSerializada.despidoDisciplinario,
      otroDespidoDisciplinario: demandaSerializada.otroDespidoDisciplinario,
      fechaTerminoRelaLaboral: demandaSerializada.fechaTerminoRelaLaboral,
      // nuevos (para Necesidades de la Empresa)
      anosServicios: demandaSerializada.anosServicios,
      mesAviso: demandaSerializada.mesAviso,
    }, CTX);

    if (faltantes.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan datos obligatorios para las cláusulas legales',
          detail: `Campos faltantes: ${faltantes.join(', ')}`,
          code: 'CLAUSULAS_VALIDATION',
        },
        { status: 422 }
      );
    }

    // 6) Data para DOCX
    const templateData = {
      fechaEmision: fechaEmisionLarga,
      demanda: demandaSerializada,                 // crudo
      demandadoSolidarios: demandadosSerializados, // crudo
      demandaFmt,                                  // formateado
      demandadoSolidariosFmt,                      // formateado
      solidarios_inline: solidariosInline(demandadoSolidariosFmt),
      hasDemandadoSolidarios,
      clausulas,                                   // <<< arreglo de párrafos (una sola cláusula)
      ...flags,                                    // <<< booleanos por si quieres IFs en la plantilla
    };

    // 7) Leer plantilla
    const templatePath = path.resolve(process.cwd(), 'app', 'templates', 'template_demanda.docx');
    const template = await fs.readFile(templatePath);

    // 8) Generar documento
    const buffer = await createReport({
      template,
      data: templateData,
    });

    if (buffer.byteLength > MAX_DOCUMENT_SIZE) {
      return NextResponse.json(
        { success: false, error: 'El documento excede el tamaño máximo permitido' },
        { status: 413 }
      );
    }

    // 9) Guardar documento (único por demanda/usuario)
    const documento = await prisma.$transaction(async (tx) => {
      const existente = await tx.demandaDocumento.findFirst({
        where: { demandaId: demandaDB.id, usuarioId: session.userId },
        select: { id: true },
      });

      if (existente) {
        return tx.demandaDocumento.update({
          where: { id: existente.id },
          data: {
            nombre: nombreArchivo,
            contenido: buffer,
            tamano: buffer.byteLength,
          },
        });
      }

      return tx.demandaDocumento.create({
        data: {
          nombre: nombreArchivo,
          contenido: buffer,
          demandaId: demandaDB.id,
          usuarioId: session.userId,
          tamano: buffer.byteLength,
        },
      });
    });

    return NextResponse.json({
      success: true,
      documentoId: documento.id,
      mensaje: 'Documento generado y guardado correctamente',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }
    console.error('[DOCX_ERROR]', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}