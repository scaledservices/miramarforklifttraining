import { StepDef, QuestionDef } from "./course-content-aerial";

export const CANONICAL_COURSE_ES = {
  title: "Certificación en Línea para Operador de Elevadores Aéreos y de Tijera",
  slug: "certificacion-elevadores-aereos-tijera-en-linea",
  description: "Capacitación integral para operadores de elevadores aéreos y de tijera en cumplimiento con OSHA. Cubre los estándares 29 CFR 1926.453 y ANSI/SAIA A92. Incluye instrucción formal sobre tipos de equipo, inspección pre-operación, protección contra caídas, estabilidad, operación segura, peligros del lugar de trabajo y procedimientos de emergencia. Nota: OSHA también requiere capacitación práctica y evaluación en el equipo específico por parte del empleador.",
  category: "aerial",
  price: "59.00",
};

const img = (name: string) => `/images/training/${name}`;

function lessonHtml(opts: {
  title: string;
  image: string;
  sections: { heading?: string; content: string }[];
  takeaways: string[];
  tip?: string;
  warning?: string;
}): string {
  const tipBlock = opts.tip ? `<div class="callout callout-tip"><strong>💡 Consejo:</strong> ${opts.tip}</div>` : "";
  const warnBlock = opts.warning ? `<div class="callout callout-warning"><strong>⚠️ Advertencia:</strong> ${opts.warning}</div>` : "";
  const sectionHtml = opts.sections.map(s =>
    (s.heading ? `<h3>${s.heading}</h3>` : "") + s.content
  ).join("\n");
  const takeawayItems = opts.takeaways.map(t => `<li>${t}</li>`).join("");

  return `<div class="lesson-content">
<img src="${opts.image}" alt="${opts.title}" class="lesson-hero-image" />
<h2>${opts.title}</h2>
${sectionHtml}
${tipBlock}
${warnBlock}
<div class="key-takeaways">
<h4>📝 Puntos Clave</h4>
<ul>${takeawayItems}</ul>
</div>
</div>`;
}

export const COURSE_STEPS_ES: StepDef[] = [
  // ═══ MÓDULO 0: Bienvenida + Cumplimiento OSHA/ANSI ═══
  {
    module: "Bienvenida y Cumplimiento OSHA/ANSI",
    title: "Bienvenido a la Certificación de Elevadores Aéreos y de Tijera",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Bienvenido a la Certificación de Elevadores Aéreos y de Tijera",
        image: img("aerial-lift-hero.svg"),
        sections: [
          { heading: "Acerca de Este Curso", content: "<p>¡Bienvenido! Este curso en línea proporciona la porción de <strong>instrucción formal</strong> de la certificación de operador de elevadores aéreos y de tijera en cumplimiento con OSHA. El curso toma aproximadamente <strong>60-90 minutos</strong> para completar.</p>" },
          { heading: "Qué Incluye", content: "<ul><li>Módulos de capacitación interactivos que cubren todos los temas requeridos por OSHA y ANSI</li><li>Cuestionarios de verificación de conocimiento</li><li>Examen final de certificación (80% para aprobar)</li><li>Certificado digital con credencial verificada por código QR</li><li>Paquete de documentación del empleador para evaluación práctica</li></ul>" },
          { heading: "Qué NO Incluye", content: "<p>OSHA y ANSI requieren <strong>múltiples componentes</strong> para la certificación completa: (1) instrucción formal (este curso), (2) capacitación práctica en el equipo específico, y (3) una evaluación del desempeño del operador. Su empleador debe realizar la parte práctica en su lugar de trabajo.</p>" },
          { heading: "Cómo Navegar", content: "<p>Complete cada paso en orden. Puede seguir su progreso usando la barra lateral. Si necesita detenerse, su progreso se guarda automáticamente. Puede retomar el examen final hasta 3 veces.</p>" },
        ],
        takeaways: [
          "Este curso cubre el requisito de instrucción formal",
          "Su empleador también debe realizar capacitación práctica y evaluación",
          "Complete todos los módulos y apruebe el examen final con 80% o más",
          "Su progreso se guarda automáticamente — reanude en cualquier momento",
        ],
      }),
    },
  },
  {
    module: "Bienvenida y Cumplimiento OSHA/ANSI",
    title: "Cumplimiento OSHA y ANSI: Lo Que Cubre Este Curso",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Cumplimiento OSHA y ANSI: Lo Que Cubre Este Curso",
        image: img("osha-compliance.svg"),
        sections: [
          { heading: "Regulaciones de OSHA", content: "<p>Los elevadores aéreos están regulados bajo <strong>29 CFR 1926.453</strong> (elevadores aéreos en construcción) y <strong>29 CFR 1910.178</strong> (camiones industriales motorizados, que incluye elevadores de tijera bajo la aplicación de OSHA). OSHA requiere que los operadores reciban:</p><ol><li><strong>Instrucción formal</strong> — capacitación en aula o en línea (este curso)</li><li><strong>Capacitación práctica</strong> — experiencia práctica en el equipo específico</li><li><strong>Evaluación</strong> — una persona calificada debe evaluar la competencia del operador</li></ol>" },
          { heading: "Estándares ANSI/SAIA A92", content: "<p>El <strong>Instituto Nacional Estadounidense de Estándares (ANSI)</strong> y la <strong>Asociación de la Industria de Andamios y Acceso (SAIA)</strong> mantienen la serie A92 para Plataformas de Trabajo Móvil Elevadora (MEWPs):</p><ul><li><strong>A92.20</strong> — Diseño, Seguridad y Verificación</li><li><strong>A92.22</strong> — Uso Seguro de MEWPs</li><li><strong>A92.24</strong> — Requisitos de Capacitación</li></ul><p>La revisión de 2020 reestructuró estos estándares y reemplazó el término 'plataforma de trabajo aéreo' con 'MEWP'.</p>" },
          { heading: "Lo Que Proporcionamos", content: "<ul><li>Instrucción formal completa cubriendo todos los temas requeridos por OSHA y ANSI</li><li>Evaluación de conocimiento mediante examen final</li><li>Certificado de finalización para la porción de instrucción formal</li><li>Paquete de documentación del empleador incluyendo listas de evaluación</li></ul>" },
          { heading: "Lo Que Su Empleador Debe Hacer", content: "<p>Después de completar este curso, su empleador debe:</p><ul><li>Proporcionar capacitación práctica específica al equipo</li><li>Evaluar su desempeño en el lugar de trabajo real</li><li>Completar y mantener la documentación requerida</li><li>Asegurar la familiarización con la marca/modelo específico que operará</li><li>Re-evaluar a los operadores al menos cada 3 años</li></ul>" },
        ],
        takeaways: [
          "Los elevadores aéreos están regulados bajo 29 CFR 1926.453 y 1910.178",
          "Los estándares ANSI/SAIA A92 cubren diseño, uso y capacitación de MEWPs",
          "Este curso cubre solo la instrucción formal — también se requiere capacitación práctica",
          "Los operadores deben familiarizarse con el equipo específico que operarán",
        ],
        warning: "No opere un elevador aéreo o de tijera hasta que su empleador haya completado su capacitación práctica y evaluación en el equipo específico.",
      }),
    },
  },
  {
    module: "Bienvenida y Cumplimiento OSHA/ANSI",
    title: "Verificación de Conocimiento: Requisitos OSHA y ANSI",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "¿Qué norma de OSHA cubre específicamente los elevadores aéreos?", type: "mcq_single", options: ["29 CFR 1910.178", "29 CFR 1926.453", "29 CFR 1910.147", "29 CFR 1926.450"], correctAnswers: "29 CFR 1926.453", explanation: "29 CFR 1926.453 es la norma de OSHA para elevadores aéreos. Los elevadores de tijera se aplican bajo 1910.178." },
      { question: "¿Qué cubre el estándar ANSI A92.24?", type: "mcq_single", options: ["Requisitos de diseño del equipo", "Requisitos de capacitación para operadores de MEWP", "Calificaciones de capacidad de carga", "Programas de mantenimiento"], correctAnswers: "Requisitos de capacitación para operadores de MEWP", explanation: "ANSI A92.24 cubre los requisitos de capacitación para operadores de MEWP, ocupantes, supervisores y personal de servicio." },
      { question: "Este curso en línea por sí solo satisface completamente todos los requisitos de capacitación de OSHA para elevadores aéreos.", type: "mcq_single", options: ["Verdadero", "Falso"], correctAnswers: "Falso", explanation: "OSHA requiere instrucción formal (este curso) MÁS capacitación práctica y evaluación en el equipo específico por parte del empleador." },
    ],
  },

  // ═══ MÓDULO 1: Fundamentos de Elevadores Aéreos y Clasificaciones ═══
  {
    module: "Fundamentos de Elevadores Aéreos y Clasificaciones",
    title: "¿Qué es una Plataforma de Trabajo Móvil Elevadora (MEWP)?",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "¿Qué es una Plataforma de Trabajo Móvil Elevadora (MEWP)?",
        image: img("aerial-lift-hero.svg"),
        sections: [
          { heading: "Definición", content: "<p>Una <strong>Plataforma de Trabajo Móvil Elevadora (MEWP)</strong> es una máquina utilizada para posicionar personal, herramientas y materiales en ubicaciones de trabajo elevadas. Los MEWPs incluyen elevadores aéreos, elevadores de tijera, elevadores de pluma y torres verticales. El término MEWP fue adoptado por ANSI en la revisión de 2020 de los estándares A92.</p>" },
          { heading: "Grupos de MEWPs (ANSI A92.20)", content: "<p>ANSI clasifica los MEWPs en dos grupos según cómo se posiciona la plataforma:</p><ul><li><strong>Grupo A:</strong> Plataformas que solo se pueden elevar verticalmente — la plataforma permanece dentro de las líneas de volcadura (ej. elevadores de tijera, elevadores verticales)</li><li><strong>Grupo B:</strong> Plataformas que pueden posicionarse más allá de las líneas de volcadura — la pluma permite que la plataforma se extienda horizontalmente (ej. elevadores de pluma articulados, elevadores de pluma telescópicos)</li></ul>" },
          { heading: "Tipos de MEWPs", content: "<p>Dentro de cada grupo, los MEWPs se clasifican además por tipo:</p><ul><li><strong>Tipo 1:</strong> La conducción solo se permite en posición plegada (no elevada)</li><li><strong>Tipo 2:</strong> La conducción se permite con la plataforma en posición elevada</li><li><strong>Tipo 3:</strong> La conducción se permite con la plataforma elevada, pero se controla desde la plataforma</li></ul>" },
          { heading: "Tipos Comunes de Equipo", content: "<ul><li><strong>Elevadores de tijera</strong> (Grupo A) — solo elevación vertical, gran área de plataforma</li><li><strong>Elevadores de pluma articulados</strong> (Grupo B) — brazo articulado proporciona alcance arriba y sobre</li><li><strong>Elevadores de pluma telescópicos</strong> (Grupo B) — brazo recto para máximo alcance horizontal</li><li><strong>Elevadores verticales de personal</strong> (Grupo A) — plataformas pequeñas para acceso vertical de una persona</li></ul>" },
        ],
        takeaways: [
          "Los MEWPs se clasifican en Grupo A (solo vertical) y Grupo B (puede extenderse más allá de las líneas de volcadura)",
          "Los elevadores de tijera son Grupo A; los elevadores de pluma son Grupo B",
          "Los Tipos 1, 2 y 3 definen cuándo y desde dónde se permite conducir",
          "El término MEWP reemplazó a 'plataforma de trabajo aéreo' en la revisión ANSI de 2020",
        ],
      }),
    },
  },
  {
    module: "Fundamentos de Elevadores Aéreos y Clasificaciones",
    title: "Elevadores de Tijera: Operación y Componentes",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Elevadores de Tijera: Operación y Componentes",
        image: img("scissor-lift-hero.svg"),
        sections: [
          { heading: "¿Qué es un Elevador de Tijera?", content: "<p>Un <strong>elevador de tijera</strong> es un MEWP del Grupo A que utiliza soportes tubulares cruzados (mecanismo de pantógrafo) para subir y bajar la plataforma verticalmente. Los elevadores de tijera proporcionan una plataforma de trabajo grande y estable ideal para tareas que requieren múltiples trabajadores y materiales a alturas moderadas.</p>" },
          { heading: "Componentes Principales", content: "<ul><li><strong>Plataforma:</strong> El área de trabajo con barandillas y puerta de entrada</li><li><strong>Mecanismo de tijera:</strong> Soportes cruzados que se extienden/contraen</li><li><strong>Chasis/base:</strong> La unidad de conducción con ruedas u orugas</li><li><strong>Controles:</strong> Paneles de control superior (plataforma) e inferior (tierra)</li><li><strong>Fuente de energía:</strong> Batería eléctrica o combustión interna (diésel, gasolina, GLP)</li></ul>" },
          { heading: "Controles de Operación", content: "<p>Los elevadores de tijera tienen <strong>controles superiores e inferiores</strong>. Los controles superiores están en la plataforma y son usados por el operador durante la elevación. Los controles inferiores están a nivel del suelo. Según OSHA, los controles inferiores deben poder anular los superiores en una emergencia, pero no deben usarse para operación normal cuando hay un operador en la plataforma.</p>" },
          { heading: "Capacidad de Conducción", content: "<p>La mayoría de los elevadores de tijera modernos son <strong>Tipo 3</strong> — pueden ser conducidos desde los controles de la plataforma mientras están elevados. Sin embargo, conducir mientras está elevado debe hacerse con precaución y solo en superficies adecuadas.</p>" },
        ],
        takeaways: [
          "Los elevadores de tijera son MEWPs del Grupo A con elevación solo vertical",
          "Tienen controles superiores (plataforma) e inferiores (tierra)",
          "Los controles inferiores pueden anular los superiores en emergencias",
          "La mayoría de los elevadores de tijera modernos pueden conducirse desde la plataforma",
        ],
        tip: "Siempre lea el manual de operación del fabricante para la marca y modelo específico antes de operar cualquier MEWP.",
      }),
    },
  },
  {
    module: "Fundamentos de Elevadores Aéreos y Clasificaciones",
    title: "Elevadores de Pluma: Articulados y Telescópicos",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Elevadores de Pluma: Articulados y Telescópicos",
        image: img("aerial-lift-hero.svg"),
        sections: [
          { heading: "Elevadores de Pluma Articulados", content: "<p>Los <strong>elevadores de pluma articulados</strong> (plumas articuladas) tienen múltiples secciones articuladas que permiten que la plataforma alcance por encima y sobre obstáculos. El brazo articulado proporciona excelente maniobrabilidad. Clasificados como <strong>Grupo B</strong> porque la plataforma puede extenderse más allá de las líneas de volcadura.</p>" },
          { heading: "Elevadores de Pluma Telescópicos", content: "<p>Los <strong>elevadores de pluma telescópicos</strong> usan secciones rectas extensibles para máximo alcance horizontal y vertical. Ofrecen las capacidades de alcance más altas pero no pueden alcanzar sobre obstáculos. También clasificados como <strong>Grupo B</strong>.</p>" },
          { heading: "Diferencias Clave de los Elevadores de Tijera", content: "<ul><li>Los elevadores de pluma pueden posicionar la plataforma <strong>más allá de la huella del chasis</strong></li><li>Tienen <strong>mayor alcance</strong> pero típicamente plataformas más pequeñas</li><li>Los MEWPs del Grupo B requieren consideraciones adicionales de <strong>protección contra caídas</strong></li><li>Los estabilizadores generalmente son requeridos para la operación</li></ul>" },
        ],
        takeaways: [
          "Las plumas articuladas tienen brazos articulados para alcance arriba y sobre",
          "Las plumas telescópicas usan extensión recta para máximo alcance",
          "Ambos son MEWPs del Grupo B — la plataforma se extiende más allá de las líneas de volcadura",
          "Los estabilizadores generalmente son requeridos para operación de pluma",
        ],
      }),
    },
  },
  {
    module: "Fundamentos de Elevadores Aéreos y Clasificaciones",
    title: "Verificación de Conocimiento: Fundamentos de MEWP",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "¿Un elevador de tijera está clasificado como qué grupo de MEWP?", type: "mcq_single", options: ["Grupo A", "Grupo B", "Grupo C", "No es un MEWP"], correctAnswers: "Grupo A", explanation: "Los elevadores de tijera son MEWPs del Grupo A porque la plataforma solo se puede elevar verticalmente y permanece dentro de las líneas de volcadura." },
      { question: "¿Qué tipo de elevador de pluma tiene secciones articuladas que permiten alcanzar sobre obstáculos?", type: "mcq_single", options: ["Elevador de pluma telescópico", "Elevador de pluma articulado", "Torre vertical", "Elevador de tijera"], correctAnswers: "Elevador de pluma articulado", explanation: "Los elevadores de pluma articulados tienen múltiples secciones articuladas que permiten que la plataforma alcance por encima y sobre obstáculos." },
      { question: "En un MEWP, los controles inferiores deben poder:", type: "mcq_single", options: ["Solo usarse para conducir", "Anular los controles superiores en una emergencia", "Bloquearse permanentemente", "Solo usarse para reabastecimiento"], correctAnswers: "Anular los controles superiores en una emergencia", explanation: "Según OSHA, los controles inferiores deben poder anular los superiores en una emergencia." },
    ],
  },

  // ═══ MÓDULO 2: Inspección Pre-Operación ═══
  {
    module: "Inspección Pre-Operación",
    title: "Lista de Inspección Pre-Operación",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Lista de Inspección Pre-Operación",
        image: img("pre-shift-checklist.svg"),
        sections: [
          { heading: "Requisito de OSHA", content: "<p>Bajo <strong>29 CFR 1926.453(a)(1)</strong>, los controles del elevador deben ser probados cada día antes de su uso para determinar que están en condiciones seguras de funcionamiento. Este es un requisito diario obligatorio.</p>" },
          { heading: "Inspección Visual", content: "<p>Camine alrededor de todo el MEWP, verificando:</p><ul><li><strong>Plataforma y barandillas:</strong> Revise daños, componentes flojos, barandillas faltantes</li><li><strong>Mangueras y cables:</strong> Busque fugas, abrasión, dobleces o desgaste</li><li><strong>Llantas/ruedas:</strong> Revise daños, inflado apropiado</li><li><strong>Batería/combustible:</strong> Revise nivel de carga, fugas</li><li><strong>Componentes estructurales:</strong> Inspeccione grietas, dobleces, fallas de soldadura</li><li><strong>Estabilizadores:</strong> Revise función apropiada y condición de las almohadillas</li><li><strong>Señales de seguridad:</strong> Asegure que las etiquetas de capacidad y advertencias sean legibles</li></ul>" },
          { heading: "Prueba Funcional", content: "<p>Después de la inspección visual, realice una <strong>prueba funcional</strong> de todos los controles:</p><ul><li>Pruebe <strong>controles superiores</strong>: subir, bajar, conducir, girar</li><li>Pruebe <strong>controles inferiores</strong>: subir, bajar, parada de emergencia</li><li>Pruebe el <strong>sistema de descenso de emergencia</strong></li><li>Pruebe la <strong>bocina</strong> y <strong>sistemas de alarma</strong></li><li>Pruebe los <strong>frenos</strong> y la <strong>dirección</strong></li><li>Pruebe el <strong>botón de parada de emergencia</strong></li></ul>" },
          { heading: "Marcar Equipo Inseguro", content: "<p>Si encuentra algún defecto o problema de seguridad, <strong>no opere el MEWP</strong>. Márquelo fuera de servicio inmediatamente y reporte el problema a su supervisor. El equipo debe ser reparado antes de volver a servicio.</p>" },
        ],
        takeaways: [
          "OSHA requiere probar los controles cada día antes del uso (29 CFR 1926.453)",
          "Realice inspección visual y prueba funcional de todos los controles",
          "Revise plataforma, barandillas, mangueras, llantas, batería/combustible",
          "Marque y reporte cualquier equipo inseguro inmediatamente",
        ],
        warning: "Nunca opere un MEWP que no pase la inspección. Cualquier defecto debe corregirse antes del uso.",
      }),
    },
  },
  {
    module: "Inspección Pre-Operación",
    title: "Mantenimiento de Batería y Combustible",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Mantenimiento de Batería y Combustible",
        image: img("ppe-gloves.svg"),
        sections: [
          { heading: "MEWPs Eléctricos", content: "<p>Los MEWPs eléctricos usan baterías de ciclo profundo. El mantenimiento adecuado extiende la vida de la batería:</p><ul><li>Cargue baterías solo en <strong>áreas designadas y ventiladas</strong></li><li>Apague el cargador antes de conectar/desconectar</li><li>Las baterías producen <strong>gas hidrógeno</strong> durante la carga — asegure ventilación</li><li>Use <strong>guantes resistentes a químicos y protección ocular</strong></li><li>Nunca fume o use llamas abiertas cerca de baterías en carga</li></ul>" },
          { heading: "MEWPs de Combustión Interna", content: "<p>MEWPs de diésel, gasolina o GLP requieren seguridad específica:</p><ul><li>Reabastezca solo en <strong>áreas designadas</strong> con ventilación</li><li>Apague el motor antes de reabastecer</li><li>Prohibido fumar o llamas abiertas dentro de <strong>50 pies</strong></li><li>Use guantes al manejar tanques de GLP</li><li>Revise fugas después de conectar tanques de GLP</li></ul>" },
          { heading: "Mantenimiento Diario", content: "<p>Revise al inicio de cada turno:</p><ul><li>Nivel de carga de batería o combustible suficiente</li><li>Nivel de fluido hidráulico dentro del rango aceptable</li><li>Nivel de aceite del motor (para motores de combustión)</li><li>Sin fugas de ningún tipo</li></ul>" },
        ],
        takeaways: [
          "Cargue baterías solo en áreas designadas y ventiladas",
          "Las baterías producen gas hidrógeno explosivo durante la carga",
          "Prohibido fumar a 50 pies de áreas de carga o reabastecimiento",
          "Revise todos los niveles de fluido al inicio de cada turno",
        ],
        warning: "El gas hidrógeno de las baterías en carga es altamente explosivo. Siempre asegure ventilación adecuada.",
      }),
    },
  },
  {
    module: "Inspección Pre-Operación",
    title: "Verificación de Conocimiento: Inspección Pre-Operación",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "¿Con qué frecuencia deben probarse los controles antes del uso según OSHA?", type: "mcq_single", options: ["Semanalmente", "Mensualmente", "Cada día antes del uso", "Solo después de reparaciones"], correctAnswers: "Cada día antes del uso", explanation: "29 CFR 1926.453(a)(1) requiere que los controles sean probados cada día antes del uso." },
      { question: "Si encuentra una barandilla dañada durante la inspección, debe:", type: "mcq_single", options: ["Continuar y reportar al final del turno", "Marcarlo fuera de servicio y no operar", "Usarlo solo para tareas de poca altura", "Repararlo con cinta"], correctAnswers: "Marcarlo fuera de servicio y no operar", explanation: "Cualquier defecto requiere que el equipo sea marcado fuera de servicio y no operado hasta ser reparado." },
      { question: "Las baterías en carga producen qué gas explosivo?", type: "mcq_single", options: ["Oxígeno", "Nitrógeno", "Hidrógeno", "Dióxido de carbono"], correctAnswers: "Hidrógeno", explanation: "Las baterías eléctricas producen gas hidrógeno durante la carga, que es altamente explosivo." },
    ],
  },

  // ═══ MÓDULO 3: Estabilidad y Manejo de Cargas ═══
  {
    module: "Estabilidad y Manejo de Cargas",
    title: "Principios de Estabilidad del MEWP",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Principios de Estabilidad del MEWP",
        image: img("stability-triangle.svg"),
        sections: [
          { heading: "Líneas de Volcadura", content: "<p>Cada MEWP tiene <strong>líneas de volcadura</strong> — el eje alrededor del cual el MEWP podría volcarse si el centro de gravedad se desplaza demasiado. Para MEWPs del Grupo A (tijera), las líneas son típicamente las ruedas o estabilizadores. Para el Grupo B (pluma), son las almohadillas de los estabilizadores o las posiciones de las ruedas.</p>" },
          { heading: "Centro de Gravedad", content: "<p>El <strong>centro de gravedad combinado</strong> incluye el MEWP mismo, la carga de la plataforma (personal, herramientas, materiales) y la posición de la pluma/plataforma. Si el centro de gravedad combinado se mueve fuera de las líneas de volcadura, el MEWP se volcará.</p>" },
          { heading: "Factores que Afectan la Estabilidad", content: "<ul><li><strong>Altura de plataforma:</strong> Mayor elevación sube el centro de gravedad</li><li><strong>Peso de carga:</strong> Exceder la capacidad desplaza el centro de gravedad</li><li><strong>Extensión de pluma:</strong> La extensión horizontal mueve el centro de gravedad hacia afuera</li><li><strong>Pendiente:</strong> Operar en pendiente desplaza el centro de gravedad cuesta abajo</li><li><strong>Viento:</strong> La fuerza del viento puede desestabilizar el MEWP</li><li><strong>Condiciones de superficie:</strong> Terreno blando, hielo o superficies mojadas</li></ul>" },
          { heading: "Estabilizadores", content: "<p>Muchos MEWPs, especialmente del Grupo B, requieren <strong>estabilizadores</strong> desplegados antes de la elevación. OSHA requiere que los frenos estén puestos y los estabilizadores posicionados sobre almohadillas o superficie sólida.</p>" },
        ],
        takeaways: [
          "Las líneas de volcadura definen el límite de estabilidad",
          "Altura, carga, extensión de pluma, pendiente y viento afectan la estabilidad",
          "Los estabilizadores deben desplegarse sobre almohadillas/superficie sólida",
          "El centro de gravedad combinado debe mantenerse dentro de las líneas de volcadura",
        ],
        warning: "Las volcaduras son una causa principal de fatalidades con MEWPs. Siempre respete los límites de capacidad y estabilidad.",
      }),
    },
  },
  {
    module: "Estabilidad y Manejo de Cargas",
    title: "Capacidad Nominal y Límites de Carga",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Capacidad Nominal y Límites de Carga",
        image: img("load-center.svg"),
        sections: [
          { heading: "Placa de Capacidad del Fabricante", content: "<p>Cada MEWP tiene una placa de <strong>capacidad nominal</strong> que especifica la carga máxima que la plataforma puede soportar. Esto incluye el peso combinado de todo el personal, herramientas y materiales. <strong>Nunca exceda esta clasificación.</strong></p>" },
          { heading: "Consideraciones de Capacidad para Pluma", content: "<p>Para elevadores de pluma del Grupo B, la capacidad puede variar según la posición de la pluma. Algunos tienen <strong>clasificaciones de capacidad variable</strong> que cambian con la extensión y ángulo. Siempre verifique la placa para la configuración específica.</p>" },
          { heading: "Límites de Personal", content: "<p>La placa también especifica el número máximo de ocupantes permitidos en la plataforma. Nunca exceda este límite.</p>" },
          { heading: "Distribución de Carga", content: "<p>Distribuya las cargas uniformemente en la plataforma. Concentrar peso en un lado puede desplazar el centro de gravedad. Asegure todas las herramientas y materiales.</p>" },
        ],
        takeaways: [
          "Nunca exceda la capacidad nominal del fabricante",
          "La capacidad incluye el peso combinado de personal, herramientas y materiales",
          "La capacidad de pluma puede variar con la posición (capacidad variable)",
          "Distribuya las cargas uniformemente y asegure todos los materiales",
        ],
        warning: "Sobrecargar un MEWP es una de las principales causas de accidentes de volcadura. Siempre verifique la carga total.",
      }),
    },
  },
  {
    module: "Estabilidad y Manejo de Cargas",
    title: "Verificación de Conocimiento: Estabilidad y Cargas",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "¿Qué sucede si el centro de gravedad combinado se mueve fuera de las líneas de volcadura?", type: "mcq_single", options: ["Nada", "El MEWP se volcará", "Sonará una alarma", "La plataforma bajará automáticamente"], correctAnswers: "El MEWP se volcará", explanation: "Si el centro de gravedad combinado se mueve fuera de las líneas de volcadura, el MEWP se volcará." },
      { question: "¿Qué factor NO afecta la estabilidad del MEWP?", type: "mcq_single", options: ["Altura de plataforma", "Peso de carga", "Condiciones de viento", "El nombre del operador"], correctAnswers: "El nombre del operador", explanation: "Altura, peso, viento, pendiente y condiciones de superficie afectan la estabilidad. El nombre del operador es irrelevante." },
      { question: "La capacidad nominal en un MEWP incluye el peso de:", type: "mcq_single", options: ["Solo personal", "Solo herramientas", "Personal, herramientas y materiales combinados", "Solo la plataforma"], correctAnswers: "Personal, herramientas y materiales combinados", explanation: "La capacidad nominal incluye el peso combinado de todo el personal, herramientas y materiales." },
    ],
  },

  // ═══ MÓDULO 4: Operación Segura y Protección contra Caídas ═══
  {
    module: "Operación Segura y Protección contra Caídas",
    title: "Requisitos de Protección contra Caídas",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Requisitos de Protección contra Caídas",
        image: img("pedestrian-safety.svg"),
        sections: [
          { heading: "Norma de Protección contra Caídas de OSHA", content: "<p>Bajo <strong>29 CFR 1926.453</strong>, los empleados siempre deben pararse firmemente en el piso de la canasta. Se debe usar un <strong>cinturón corporal</strong> y un <strong>arnés de seguridad</strong> adjunto a la pluma o canasta. Sin embargo, desde el 1 de enero de 1998, los cinturones corporales <strong>NO son aceptables</strong> como parte de un sistema personal de detención de caídas — se debe usar un <strong>arnés de cuerpo completo</strong>.</p>" },
          { heading: "Sistema Personal de Detención de Caídas", content: "<p>Un sistema completo de protección contra caídas consiste en:</p><ul><li><strong>Arnés de cuerpo completo</strong> — distribuye las fuerzas de caída a través del cuerpo</li><li><strong>Línea de seguridad</strong> — conecta el arnés al punto de anclaje</li><li><strong>Punto de anclaje</strong> — el punto de attachment designado en la pluma o canasta (aprobado por el fabricante)</li></ul>" },
          { heading: "Puntos de Anclaje", content: "<p>Siempre attache la línea de seguridad al <strong>punto de anclaje designado por el fabricante</strong>. Nunca attache a estructuras cercanas, líneas eléctricas, u otro equipo fuera del MEWP.</p>" },
          { heading: "Inspección del Arnés", content: "<p>Inspeccione su arnés y línea antes de cada uso: revise cortes, desgarros, costuras dañadas, herrajes (anillos D, hebillas), y etiquetas legibles. Reemplace cualquier equipo dañado inmediatamente.</p>" },
        ],
        takeaways: [
          "Los cinturones corporales NO son aceptables desde 1998 — use arneses de cuerpo completo",
          "Attache la línea solo al punto de anclaje designado por el fabricante",
          "Nunca attache a estructuras o equipo fuera del MEWP",
          "Inspeccione el arnés y la línea antes de cada uso",
        ],
        warning: "Desde el 1 de enero de 1998, los cinturones corporales NO son aceptables. Se requieren arneses de cuerpo completo.",
      }),
    },
  },
  {
    module: "Operación Segura y Protección contra Caídas",
    title: "Procedimientos de Operación Segura",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Procedimientos de Operación Segura",
        image: img("safe-driving.svg"),
        sections: [
          { heading: "Antes de Elevar", content: "<p>Antes de subir la plataforma:</p><ul><li>Verifique que la superficie sea <strong>nivelada y capaz de soportar la carga</strong></li><li>Despliegue estabilizadores si lo requiere el fabricante</li><li>Ponga calzas en las ruedas si está en una pendiente</li><li>Revise <strong>peligros aéreos</strong> (líneas eléctricas, estructuras)</li><li>Asegure que el área esté libre de peatones y obstrucciones</li></ul>" },
          { heading: "Mientras Está Elevado", content: "<p>Cuando la plataforma está elevada:</p><ul><li><strong>Siempre use su arnés y attache la línea</strong></li><li>Mantenga ambos pies firmemente en el piso de la plataforma</li><li>Nunca se pare en barandillas o escaleras</li><li>No exceda la capacidad nominal o el límite de personal</li></ul>" },
          { heading: "Conducir Mientras Está Elevado", content: "<p>Si conducir mientras está elevado es permitido por el fabricante:</p><ul><li>Conduzca a <strong>muy baja velocidad</strong></li><li>Vigile peligros de superficie y obstáculos</li><li>Evite arranques, paradas o giros repentinos</li><li>Nunca conduzca cerca de bordes abiertos</li></ul>" },
          { heading: "Bajar la Plataforma", content: "<p>Antes de bajar: asegure que el área debajo esté libre, verifique que el camino esté libre de obstrucciones, baje lentamente y bajo control.</p>" },
        ],
        takeaways: [
          "Siempre use arnés y attache al punto de anclaje designado",
          "Revise peligros aéreos antes de elevar",
          "Nunca exceda la capacidad o los límites de personal",
          "Baje lentamente y asegure que el área esté libre",
        ],
        tip: "Antes de elevar, siempre mire hacia arriba y alrededor para peligros aéreos como líneas eléctricas y estructuras.",
      }),
    },
  },
  {
    module: "Operación Segura y Protección contra Caídas",
    title: "Verificación de Conocimiento: Operación Segura y Protección contra Caídas",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "Desde el 1 de enero de 1998, qué tipo de protección contra caídas es requerida (no cinturones)?", type: "mcq_single", options: ["Solo cinturón corporal", "Arnés de cuerpo completo", "Sin protección contra caídas", "Una cuerda y nudo"], correctAnswers: "Arnés de cuerpo completo", explanation: "Los cinturones corporales no son aceptables desde 1998. Se requieren arneses de cuerpo completo." },
      { question: "Al conducir un MEWP mientras está elevado, debe:", type: "mcq_single", options: ["Conducir a velocidad normal", "Conducir a muy baja velocidad y vigilar peligros", "Tocar la bocina repetidamente", "Nunca conducir mientras está elevado bajo ninguna circunstancia"], correctAnswers: "Conducir a muy baja velocidad y vigilar peligros", explanation: "Si conducir mientras está elevado es permitido, conduzca a muy baja velocidad y vigile peligros." },
      { question: "La línea de seguridad debe attacherse a:", type: "mcq_single", options: ["Cualquier objeto resistente cercano", "El punto de anclaje designado por el fabricante en el MEWP", "Una viga del edificio", "La protección superior"], correctAnswers: "El punto de anclaje designado por el fabricante en el MEWP", explanation: "Siempre attache la línea solo al punto de anclaje designado por el fabricante." },
    ],
  },

  // ═══ MÓDULO 5: Peligros del Lugar de Trabajo y Seguridad Eléctrica ═══
  {
    module: "Peligros del Lugar de Trabajo y Seguridad Eléctrica",
    title: "Peligros Eléctricos y Líneas de Energía",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Peligros Eléctricos y Líneas de Energía",
        image: img("osha-compliance.svg"),
        sections: [
          { heading: "Distancia Mínima de Líneas de Energía", content: "<p>OSHA requiere distancias mínimas de líneas de energía:</p><ul><li><strong>Hasta 50kV:</strong> Mínimo 10 pies</li><li><strong>50kV a 200kV:</strong> Mínimo 15 pies</li><li><strong>200kV a 350kV:</strong> Mínimo 20 pies</li><li><strong>350kV a 500kV:</strong> Mínimo 25 pies</li></ul>" },
          { heading: "Reglas de Seguridad con Líneas de Energía", content: "<p>Trate siempre las líneas de energía como <strong>energizadas y peligrosas</strong>. No confíe en el aislamiento. Use un <strong>vigilante</strong> si la pluma podría girar hacia las líneas. Tenga en cuenta el <strong>viento</strong>.</p>" },
          { heading: "Si Ocurre Contacto", content: "<p>Si el MEWP contacta una línea de energía:</p><ol><li><strong>Quédese en la plataforma</strong> — no intente saltar</li><li>Advierta a otros que se alejen</li><li>Llame a emergencias (911) y a la compañía eléctrica</li><li>Intente romper el contacto moviendo la pluma</li><li>No salga de la plataforma hasta que la línea sea desenergizada</li></ol>" },
          { heading: "Seguridad del Personal en Tierra", content: "<p>Si el MEWP está en contacto con una línea, el personal en tierra está en riesgo de electrocución por <strong>potencial de paso</strong>. Deben permanecer a al menos <strong>35 pies</strong> de distancia.</p>" },
        ],
        takeaways: [
          "Mínimo 10 pies de distancia de líneas hasta 50kV",
          "Trate siempre las líneas como energizadas y peligrosas",
          "Si ocurre contacto: quédese en la plataforma, llame al 911",
          "El personal en tierra debe permanecer a 35+ pies de distancia",
        ],
        warning: "El contacto con líneas de energía es frecuentemente fatal. Mantenga distancias mínimas en todo momento.",
      }),
    },
  },
  {
    module: "Peligros del Lugar de Trabajo y Seguridad Eléctrica",
    title: "Peligros Ambientales y del Lugar de Trabajo",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Peligros Ambientales y del Lugar de Trabajo",
        image: img("warehouse-aisle.svg"),
        sections: [
          { heading: "Condiciones Climáticas", content: "<ul><li><strong>Viento:</strong> La mayoría de los MEWPs tienen una clasificación máxima de velocidad del viento (típicamente 28 mph). Nunca la exceda.</li><li><strong>Lluvia y hielo:</strong> Hacen las superficies resbalosas.</li><li><strong>Relámpagos:</strong> Nunca opere un MEWP durante una tormenta — la pluma actúa como pararrayos.</li><li><strong>Nieve y hielo:</strong> Añaden peso, reducen tracción.</li></ul>" },
          { heading: "Condiciones de Superficie", content: "<p>Antes de operar, verifique: terreno blando, barro, capacidad del piso, hoyos cubiertos, pendientes, superficies mojadas.</p>" },
          { heading: "Peligros Aéreos", content: "<p>Revise siempre peligros aéreos: líneas eléctricas, estructuras de edificios, puertas aéreas, ramas de árboles, objetos que caen.</p>" },
          { heading: "Tráfico de Peatones", content: "<p>Use <strong>barricadas o cinta de precaución</strong>, publique <strong>señales de advertencia</strong>, use un <strong>vigilante</strong> en áreas de alto tráfico, toque la <strong>bocina</strong> al bajar o mover.</p>" },
        ],
        takeaways: [
          "Nunca exceda la clasificación máxima de velocidad del viento del fabricante",
          "Nunca opere un MEWP durante tormentas eléctricas",
          "Revise condiciones de superficie para terreno blando y pendientes",
          "Use barricadas y vigilantes para proteger peatones",
        ],
        warning: "Relámpagos + MEWP = peligro extremo. La pluma actúa como pararrayos. Nunca opere durante tormentas.",
      }),
    },
  },
  {
    module: "Peligros del Lugar de Trabajo y Seguridad Eléctrica",
    title: "Verificación de Conocimiento: Peligros del Lugar de Trabajo",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "¿Cuál es la distancia mínima de líneas de energía hasta 50kV?", type: "mcq_single", options: ["5 pies", "10 pies", "15 pies", "25 pies"], correctAnswers: "10 pies", explanation: "OSHA requiere una distancia mínima de 10 pies de líneas hasta 50kV." },
      { question: "Si un MEWP contacta una línea de energía, el operador debe:", type: "mcq_single", options: ["Saltar inmediatamente", "Quedarse en la plataforma y llamar al 911", "Empujar la línea", "Bajar por la pluma"], correctAnswers: "Quedarse en la plataforma y llamar al 911", explanation: "Quédese en la plataforma — saltar puede causar electrocución. Llame a emergencias." },
      { question: "Nunca debe operar un MEWP durante qué condición climática?", type: "mcq_single", options: ["Llovizna ligera", "Tormenta/relámpagos", "Cielos nublados", "Temperaturas frescas"], correctAnswers: "Tormenta/relámpagos", explanation: "Nunca opere durante una tormenta — la pluma actúa como pararrayos." },
    ],
  },

  // ═══ MÓDULO 6: Procedimientos de Emergencia y Rescate ═══
  {
    module: "Procedimientos de Emergencia y Rescate",
    title: "Controles de Emergencia y Descenso",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Controles de Emergencia y Descenso",
        image: img("pre-shift-checklist.svg"),
        sections: [
          { heading: "Sistema de Descenso de Emergencia", content: "<p>Todos los MEWPs están equipados con <strong>sistemas de descenso de emergencia</strong> que permiten bajar la plataforma desde el suelo si el operador está incapacitado o los controles superiores fallan. Conozca dónde están estos controles antes de operar.</p>" },
          { heading: "Anulación de Controles Inferiores", content: "<p>Según OSHA 1926.453(b)(2)(iii), los controles inferiores deben poder <strong>anular los controles superiores</strong>. Esto permite que una persona en el suelo baje la plataforma en una emergencia.</p>" },
          { heading: "Parada de Emergencia", content: "<p>Todos los MEWPs tienen <strong>botones de parada de emergencia</strong> en ambas estaciones de control. Presionar el botón detiene inmediatamente todas las funciones. Debe restablecerse manualmente.</p>" },
          { heading: "Falla de Energía", content: "<p>Si se pierde energía mientras la plataforma está elevada: no entre en pánico, use la <strong>válvula manual de descenso</strong>, llame para asistencia si no puede bajar.</p>" },
        ],
        takeaways: [
          "Conozca la ubicación de los controles de descenso de emergencia",
          "Los controles inferiores pueden anular los superiores",
          "Los botones de parada están en ambas estaciones",
          "Si falla la energía, use sistemas de descenso manual",
        ],
        tip: "Antes de operar, localice y pruebe todos los controles de emergencia.",
      }),
    },
  },
  {
    module: "Procedimientos de Emergencia y Rescate",
    title: "Planificación y Procedimientos de Rescate",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Planificación y Procedimientos de Rescate",
        image: img("pedestrian-safety.svg"),
        sections: [
          { heading: "Requisitos de Rescate ANSI A92.22", content: "<p>ANSI A92.22 requiere que se desarrolle un <strong>plan de rescate</strong> antes del uso del MEWP. Debe abordar cómo se recuperará a un operador si no puede operar los controles.</p>" },
          { heading: "Componentes del Plan", content: "<p>Identificación de <strong>personal de rescate capacitado</strong>, ubicación de controles inferiores, acceso a un <strong>MEWP secundario</strong>, números de contacto de emergencia.</p>" },
          { heading: "Si el Operador Está Incapacitado", content: "<p>Use los <strong>controles inferiores</strong> para bajar la plataforma. Si fallan, use la <strong>válvula de descenso de emergencia</strong>. Si no puede bajar, use un <strong>MEWP secundario</strong>. Llame al <strong>911</strong>.</p>" },
          { heading: "Respuesta a Volcadura", content: "<p><strong>Quédese en la plataforma</strong> — no salte. Brácese y sujete las barandillas. Pida ayuda. Busque evaluación médica.</p>" },
        ],
        takeaways: [
          "ANSI A92.22 requiere un plan de rescate antes del uso del MEWP",
          "Identifique personal de rescate capacitado antes de comenzar",
          "Use controles inferiores o descenso de emergencia para rescatar",
          "En una volcadura, quédese en la plataforma y no salte",
        ],
        warning: "Nunca intente escalar la pluma o el mecanismo de tijera para rescatar a alguien.",
      }),
    },
  },
  {
    module: "Procedimientos de Emergencia y Rescate",
    title: "Verificación de Conocimiento: Procedimientos de Emergencia",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "¿Qué requiere ANSI A92.22 antes del uso del MEWP?", type: "mcq_single", options: ["Un plan de rescate", "Un reporte climático", "Un segundo operador", "Una batería de respaldo"], correctAnswers: "Un plan de rescate", explanation: "ANSI A92.22 requiere un plan de rescate antes del uso del MEWP." },
      { question: "Si ocurre una volcadura, el operador debe:", type: "mcq_single", options: ["Saltar inmediatamente", "Quedarse en la plataforma y sujetarse", "Intentar enderezar el MEWP", "Bajar por la pluma"], correctAnswers: "Quedarse en la plataforma y sujetarse", explanation: "Quédese en la plataforma durante una volcadura. No salte." },
      { question: "El botón de parada de emergencia está ubicado en:", type: "mcq_single", options: ["Solo en controles superiores", "Solo en controles inferiores", "Ambas estaciones de control", "Solo en el chasis"], correctAnswers: "Ambas estaciones de control", explanation: "Los botones de parada están en ambas estaciones de control." },
    ],
  },

  // ═══ MÓDULO 7: Examen Final y Finalización ═══
  {
    module: "Examen Final y Finalización",
    title: "Examen Final: Certificación de Elevadores Aéreos y de Tijera",
    type: "exam",
    estimatedMinutes: 15,
    config: { passing_score: 80, max_attempts: 3, randomize_questions: true },
    questions: [
      { question: "¿Qué norma de OSHA cubre específicamente los elevadores aéreos?", type: "mcq_single", options: ["29 CFR 1910.178", "29 CFR 1926.453", "29 CFR 1910.147", "29 CFR 1926.450"], correctAnswers: "29 CFR 1926.453", explanation: "29 CFR 1926.453 es la norma de OSHA para elevadores aéreos." },
      { question: "¿Un elevador de tijera está clasificado como qué grupo de MEWP?", type: "mcq_single", options: ["Grupo A", "Grupo B", "Grupo C", "Grupo D"], correctAnswers: "Grupo A", explanation: "Los elevadores de tijera son MEWPs del Grupo A." },
      { question: "¿Con qué frecuencia deben probarse los controles antes del uso?", type: "mcq_single", options: ["Semanalmente", "Mensualmente", "Cada día antes del uso", "Solo después de reparaciones"], correctAnswers: "Cada día antes del uso", explanation: "29 CFR 1926.453(a)(1) requiere probar los controles cada día antes del uso." },
      { question: "Desde el 1 de enero de 1998, qué tipo de protección contra caídas es requerida?", type: "mcq_single", options: ["Solo cinturón corporal", "Arnés de cuerpo completo", "Sin protección", "Una red de seguridad"], correctAnswers: "Arnés de cuerpo completo", explanation: "Los cinturones corporales no son aceptables desde 1998. Se requieren arneses de cuerpo completo." },
      { question: "¿Cuál es la distancia mínima de líneas de energía hasta 50kV?", type: "mcq_single", options: ["5 pies", "10 pies", "15 pies", "25 pies"], correctAnswers: "10 pies", explanation: "OSHA requiere mínimo 10 pies de líneas hasta 50kV." },
      { question: "Si un MEWP contacta una línea de energía, el operador debe:", type: "mcq_single", options: ["Saltar inmediatamente", "Quedarse en la plataforma y llamar al 911", "Empujar la línea", "Bajar por la pluma"], correctAnswers: "Quedarse en la plataforma y llamar al 911", explanation: "Quédese en la plataforma — saltar puede causar electrocución." },
      { question: "¿Qué debe hacer si encuentra un defecto durante la inspección?", type: "mcq_single", options: ["Continuar y reportar después", "Marcarlo fuera de servicio y no operar", "Usarlo para tareas cortas", "Repararlo con cinta"], correctAnswers: "Marcarlo fuera de servicio y no operar", explanation: "Cualquier defecto requiere marcar el equipo fuera de servicio." },
      { question: "La línea de seguridad debe attacherse a:", type: "mcq_single", options: ["Cualquier objeto cercano", "El punto de anclaje designado por el fabricante", "Una viga del edificio", "La protección superior"], correctAnswers: "El punto de anclaje designado por el fabricante", explanation: "Siempre attache al punto de anclaje designado por el fabricante." },
      { question: "Nunca opere un MEWP durante qué condición?", type: "mcq_single", options: ["Llovizna ligera", "Tormenta/relámpagos", "Cielos nublados", "Clima fresco"], correctAnswers: "Tormenta/relámpagos", explanation: "Nunca opere durante tormentas — la pluma actúa como pararrayos." },
      { question: "Si ocurre una volcadura, el operador debe:", type: "mcq_single", options: ["Saltar inmediatamente", "Quedarse en la plataforma y sujetarse", "Intentar enderezar el MEWP", "Apagar el motor"], correctAnswers: "Quedarse en la plataforma y sujetarse", explanation: "Quédese en la plataforma. No salte. Brácese y pida ayuda." },
      { question: "¿Qué requiere ANSI A92.22 antes del uso del MEWP?", type: "mcq_single", options: ["Un plan de rescate", "Un reporte climático", "Un segundo operador", "Una grabación"], correctAnswers: "Un plan de rescate", explanation: "ANSI A92.22 requiere un plan de rescate." },
      { question: "Los controles inferiores en un MEWP deben poder:", type: "mcq_single", options: ["Solo conducir", "Anular los controles superiores en emergencia", "Bloquearse permanentemente", "Solo reabastecimiento"], correctAnswers: "Anular los controles superiores en emergencia", explanation: "Los controles inferiores deben poder anular los superiores." },
      { question: "Las baterías en carga producen qué gas explosivo?", type: "mcq_single", options: ["Oxígeno", "Nitrógeno", "Hidrógeno", "Dióxido de carbono"], correctAnswers: "Hidrógeno", explanation: "Las baterías producen gas hidrógeno durante la carga." },
      { question: "¿Qué sucede si el centro de gravedad se mueve fuera de las líneas de volcadura?", type: "mcq_single", options: ["Nada", "El MEWP se volcará", "Sonará una alarma", "Bajará automáticamente"], correctAnswers: "El MEWP se volcará", explanation: "Si el centro de gravedad se mueve fuera, el MEWP se volcará." },
      { question: "La capacidad nominal incluye el peso de:", type: "mcq_single", options: ["Solo personal", "Solo herramientas", "Personal, herramientas y materiales", "Solo plataforma"], correctAnswers: "Personal, herramientas y materiales", explanation: "Incluye el peso combinado de todo." },
      { question: "Un camión de elevación no debe moverse con la pluma elevada a menos que:", type: "mcq_single", options: ["El supervisor apruebe", "El equipo esté diseñado para esto", "Sea emergencia", "Los trabajadores usen arnés"], correctAnswers: "El equipo esté diseñado para esto", explanation: "Per OSHA 1926.453(b)(2)(vii), no mover a menos que esté específicamente diseñado." },
      { question: "Prohibido fumar dentro de cuántos pies de baterías en carga?", type: "mcq_single", options: ["10 pies", "25 pies", "50 pies", "100 pies"], correctAnswers: "50 pies", explanation: "Prohibido fumar dentro de 50 pies de áreas de carga." },
      { question: "Este curso en línea satisface completamente todos los requisitos de OSHA.", type: "mcq_single", options: ["Verdadero", "Falso"], correctAnswers: "Falso", explanation: "OSHA requiere instrucción formal MÁS capacitación práctica y evaluación." },
      { question: "El personal en tierra debe permanecer a cuánta distancia de un MEWP en contacto con línea eléctrica?", type: "mcq_single", options: ["10 pies", "25 pies", "35 pies", "50 pies"], correctAnswers: "35 pies", explanation: "Mínimo 35 pies debido al potencial de paso." },
      { question: "Los empleados siempre deben pararse firmemente en el ___ de la canasta.", type: "mcq_single", options: ["Borde", "Piso", "Barandilla", "Barandilla intermedia"], correctAnswers: "Piso", explanation: "OSHA requiere pararse en el piso de la canasta." },
      { question: "Qué debe desplegarse antes de elevar un elevador de pluma que los requiere?", type: "mcq_single", options: ["Estabilizadores", "Cables de extensión", "Redes de seguridad", "Escaleras de cuerda"], correctAnswers: "Estabilizadores", explanation: "Los estabilizadores deben desplegarse antes de elevar." },
      { question: "Nunca opere un MEWP excediendo la máxima:", type: "mcq_single", options: ["Clasificación de color", "Clasificación de velocidad del viento", "Clasificación de decibeles", "Presión de llantas"], correctAnswers: "Clasificación de velocidad del viento", explanation: "Nunca exceda la clasificación máxima de viento (típicamente 28 mph)." },
    ],
  },
  {
    module: "Examen Final y Finalización",
    title: "Felicitaciones: ¿Qué Sigue?",
    type: "lesson",
    estimatedMinutes: 3,
    config: {
      html_content: lessonHtml({
        title: "¡Está Certificado! ¿Qué Sigue?",
        image: img("aerial-lift-hero.svg"),
        sections: [
          { heading: "Su Certificado", content: "<p>¡Felicitaciones por completar la porción de instrucción formal de su certificación de operador de elevadores aéreos y de tijera! Su certificado digital está disponible para descargar con número único y código QR.</p>" },
          { heading: "Siguiente Paso: Evaluación Práctica", content: "<p>Su empleador debe completar la <strong>capacitación práctica y evaluación</strong> en el equipo específico. Comparta el paquete de documentación con su supervisor.</p>" },
          { heading: "Manténgase Seguro", content: "<p>Continúe siguiendo procedimientos de operación segura. Si necesita repaso, puede volver a este curso en cualquier momento.</p>" },
        ],
        takeaways: [
          "Descargue su certificado",
          "Comparta el paquete del empleador para evaluación práctica",
          "Su empleador debe proporcionar capacitación específica al equipo",
          "La re-evaluación es requerida al menos cada 3 años",
        ],
        tip: "Guarde el enlace de su página de verificación para verificación instantánea.",
      }),
    },
  },
];
