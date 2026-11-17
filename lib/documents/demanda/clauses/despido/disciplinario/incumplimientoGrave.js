/// lib/documents/demanda/clauses/despido/disciplinario/incumplimientoGrave.js

import { createClauseResult } from '../../../types';

export function buildIncumplimientoGrave(ctx, caseInfo) {
  const fechaTermino =
    ctx?.demandaFmt?.fechaTerminoRelaLaboral_larga ||
    ctx?.demanda?.fechaTerminoRelaLaboral ||
    '_________________________';

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
        'Incumplimiento Grave',
      ],
      hechos: [
        'El empleador debe acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del Artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido',
        `Con fecha ${fechaTermino}, el empleador me comunicó verbalmente que estaba despedido y que la comunicación del despido me sería hecha llegar el mismo día, situación que a la fecha de esta presentación aún no he recepcionado en mi domicilio.`,
        'Conforme mandata el Artículo 454, número uno inciso segundo, “..., en los juicios sobre despido corresponderá en primer lugar al demandado la rendición de la prueba, debiendo acreditar la veracidad de los hechos imputados en las comunicaciones a que se refieren los incisos primero y cuarto del artículo 162, sin que pueda alegar en el juicio hechos distintos como justificativos del despido”.',
        'Entonces, no habiéndose cumplido con el Artículo 162 del Código del Trabajo, no tiene la contraria elementos de hecho que acreditar en estrados, ni puede agregar nuevos.',
      ],
      derecho: [
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
      ],
      peticiones: [
        `En consecuencia, procede otorgar la indemnización sustitutiva del aviso previo, que asciende en concreto a la suma de ${ctx?.demandaFmt?.remuneracion_clp ?? '____________________'}.`,
        `También, por tanto, procede otorgar indemnización por años de servicio, correspondiente a: ${ctx?.demandaFmt?.indemnizacion_monto_clp ?? '____________________'} y es procedente que esta sea incrementada en un 80% siendo esta suma según apreciación de S.S. a si el despido es declarado con aplicación indebida de las causales del Artículo 160 del CT.`,
      ],
      otrosi: [],
    },
  });
}