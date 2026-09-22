/// lib/documents/demanda/clauses/despido/disciplinario/incumplimientoGrave.js

import { createClauseResult } from '../../../types';
import { getBase162Block } from '../../common/base162';
import { getBase454Block } from '../../common/base454';
import { getIndemnizacion80Block } from '../../common/indemnizaciones';

export function buildIncumplimientoGrave(ctx, caseInfo) {
  const base162 = getBase162Block(ctx);
  const base454 = getBase454Block();

  return createClauseResult({
    caseKey: caseInfo.caseKey,
    subKey: caseInfo.subKey,
    flags: {
      ...caseInfo.flags,
      isIncumplimientoGrave: true,
    },
    meta: {
      motivoTermino: caseInfo.normalized?.motivoTermino ?? '',
      tipoDespido: caseInfo.normalized?.tipoDespido ?? '',
      subtipo: caseInfo.normalized?.despidoDisciplinario ?? '',
    },
    sections: {
      encabezado: [
        '3) Motivo Término -> Despido',
        'a) Tipo Despido -> Disciplinario',
        '1) Disciplinario -> Incumplimiento Grave',
        'Pegar el texto plantilla de Incumplimiento Grave',
      ],
      hechos: [
        base162[0],
        base162[1],
        ...base454,
        base162[2],
      ],
      derecho: [
        '7. Incumplimiento grave de las obligaciones que impone el contrato.',
        'El incumplimiento grave de las obligaciones que impone el contrato es la causal genérica del despido disciplinario e implica un incumplimiento de tal entidad que el empleador puede poner fin al contrato. Como tal, sus requisitos identificados por la doctrina son los siguientes:',
        '● Se trata de un incumplimiento de las obligaciones del contrato. Dentro de lo que no queda comprendida cualquier obligación integrante del contrato de trabajo, siendo este un contrato de adhesión, expresión de la voluntad unilateral del empleador, que por lo mismo se encuentra limitado por ley con normativa de orden público. Por tanto, este incumplimiento grave de obligaciones del contrato sólo puede provenir de obligaciones de la esencia del contrato, lo cual deberá ser estimado casuísticamente por el juez al tenor de la razonabilidad del caso y del principio de protección del trabajador. Es en esta evaluación, en que el juez deberá ponderar que el Código del Trabajo establece un singular sistema de sanciones para el trabajador, otras aplicadas por el empleador, de lo que se deduce que el mismo legislador laboral considera que numerosos incumplimientos contractuales pueden ser sancionados con amonestaciones o multas y no necesariamente con la determinación de un despido. Es decir, conclusivamente, no todo incumplimiento faculta para llegar a la decisión de despedir a un trabajador.',
        '● El incumplimiento debe ser grave. Esto es, de un peso o entidad considerable, de una magnitud tal que afecte la continuidad del contrato.',
        '● Ruptura de la confianza que requiere el trabajo. Circunstancia que, en el caso, no genera una afectación a la confianza y que en la misma comunicación no existe ninguna mención a la voz confianza en ningún sentido posible en la comunicación del término, · Daño efectivamente producido.',
        '● Peligro provocado con la conducta. Para el caso expuesto no existe peligro mencionado con ocasión del despido.',
        '● Habitualidad de la misma o reiterada en el tiempo. Que, la situación que se imputa obedece a un evento único.',
        '● El incumplimiento debe ser injustificado. Circunstancia que como esta parte ya ha referido, no ha habido incumplimiento, y de haber existido estaría del todo justificado atendiendo a las circunstancias.',
        '● La decisión del despido disciplinario debe ser adoptada con proporcionalidad. La consecuencia de despedir en esta forma al trabajador, haciendo que el trabajador pierda las indemnizaciones del caso, deben basarse en una causa razonablemente proporcional; es, por tanto, que la demandada debe explicar el fundamento de su excesivo obrar, donde podría haber ejercido su poder disciplinario a través de cualquier otra sanción conservativa contemplada.',
        '● Es en este entendido que mi despido se encuentra del todo injustificado en cuanto a su fondo, pues el presupuesto que habrían dado lugar a aquel no cumpliría con la totalidad de los requisitos exigidos.',
        'No se cumplen con ninguno de los dos elementos del tipo disciplinario.',
        'No hubo configuración que haga que el presupuesto fáctico satisfaga la causal legal, por tanto, desde luego, no puede haber gravedad en los mismos.',
      ],
      peticiones: [
        ...getIndemnizacion80Block(ctx),
      ],
      otrosi: [],
    },
  });
}